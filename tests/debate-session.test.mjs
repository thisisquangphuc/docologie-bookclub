import assert from 'node:assert/strict';
import test from 'node:test';
import { createDebateService, joinLimit, parseJoinLimit } from '../assets/js/debate/session-service.js';
import { canEndRound, canOpenReflection, canStartRound, isRoundActive } from '../assets/js/debate/round-policy.js';
import { formatTime, parseTurnDurationMinutes, remainingTimeMs, turnDurationMs } from '../assets/js/debate/timer-policy.js';
import { createDisplayMarkup, createHostMarkup, createParticipantMarkup, createWorkshopMetaMarkup, renderDisplay, renderHostHistory, renderJoinLimitWarning, renderParticipant, renderWorkshopMeta } from '../assets/js/debate/views.js';
import { translate } from '../assets/js/debate/i18n.js';

function createDatabase() {
  const data = {};
  const listeners = new Map();
  let nextId = 0;
  const read = path => path.split('/').reduce((value, key) => value?.[key], data) ?? null;
  const write = (path, value) => {
    const keys = path.split('/');
    const parent = keys.slice(0, -1).reduce((value, key) => value[key] ||= {}, data);
    if (value === null) delete parent[keys.at(-1)];
    else parent[keys.at(-1)] = value;
    for (const [watched, callbacks] of listeners) if (path.startsWith(watched) || watched.startsWith(path)) for (const callback of callbacks) callback({val: () => read(watched)});
  };
  const ref = path => ({
    key: path.split('/').at(-1),
    child: key => ref(`${path}/${key}`),
    push: () => ref(`${path}/session-${++nextId}`),
    once: async () => ({val: () => read(path)}),
    on: (_event, callback) => {listeners.set(path, [...(listeners.get(path) || []), callback]); callback({val: () => read(path)});},
    off: (_event, callback) => listeners.set(path, (listeners.get(path) || []).filter(listener => listener !== callback)),
    set: async value => write(path, value),
    remove: async () => write(path, null),
    update: async values => {for (const [key, value] of Object.entries(values)) write(`${path}/${key}`, value);},
    transaction: async update => {
      const next = update(read(path));
      if (next === undefined) return {committed: false, snapshot: {val: () => read(path)}};
      write(path, next);
      return {committed: true, snapshot: {val: () => read(path)}};
    },
    onDisconnect: () => ({remove: async () => {}})
  });
  return {ref};
}

test('one unfinished debate resumes and ending preserves its archive record', async () => {
  const database = createDatabase();
  const service = createDebateService(database);
  const settings = {statement1: 'First', statement2: 'Second', reflectionQuestions: {'1': 'Why?'}, notes: 'Minutes', host: {id: 'm1', name: 'Ada'}, secretary: {id: 'm2', name: 'Ben'}};
  const id = await service.createSession(settings);
  assert.equal(await service.readCurrentSessionId(), id);
  assert.equal((await service.readSession(id)).notes, 'Minutes');
  assert.equal((await service.readSession(id)).settings.turnDurationMs, 180000);
  assert.equal((await service.readSession(id)).settings.maxJoinsPerMember, 3);
  await service.updateSession(database.ref(`debate_sessions/${id}`), {'settings/turnDurationMs': 600000});
  assert.equal((await service.readSession(id)).settings.turnDurationMs, 600000);
  assert.equal(await service.createSession(settings), id);
  assert.equal(await service.readSession('session-2'), null);
  let history = {};
  service.observeHistory(value => {history = value;});
  assert.deepEqual(history, {});
  await service.updateSession(database.ref(`debate_sessions/${id}`), {status: 'ended', endedAt: 12345});
  await service.clearActiveSession(id);
  assert.equal(await service.readCurrentSessionId(), null);
  assert.equal(history[id].statement1, 'First');
  assert.equal(history[id].notes, 'Minutes');
  const nextId = await service.createSession(settings);
  assert.notEqual(nextId, id);
  assert.equal(await service.readCurrentSessionId(), nextId);
});

test('timer duration is bounded and an active turn keeps its remaining time', () => {
  assert.equal(parseTurnDurationMinutes('3'), 3);
  assert.equal(parseTurnDurationMinutes('30'), 30);
  for (const value of ['2', '4', '7', '31', '3.5', '']) assert.equal(parseTurnDurationMinutes(value), null);
  assert.equal(turnDurationMs({}), 180000);
  const session = {settings: {turnDurationMs: 420000}, timer: {speakerId: null}};
  assert.equal(turnDurationMs(session), 420000);
  assert.equal(remainingTimeMs(session, 1000), 420000);
  session.timer = {speakerId: 'm1', running: true, endsAt: 10000};
  assert.equal(remainingTimeMs(session, 1000), 9000);
  session.timer = {speakerId: 'm1', paused: true, remainingMs: 8000};
  assert.equal(remainingTimeMs(session, 1000), 8000);
  assert.equal(formatTime(420000), '07:00');
});

test('round progression requires an explicit end action', () => {
  const session = {status: 'ready', round: 'setup'};
  assert.equal(canStartRound(session, 1), true);
  session.status = 'live'; session.round = '1'; session.phase = 'active';
  assert.equal(canStartRound(session, 1), false);
  assert.equal(canStartRound(session, 2), false);
  assert.equal(canEndRound(session, 1), true);
  session.phase = 'ended';
  assert.equal(isRoundActive(session, 1), false);
  assert.equal(canStartRound(session, 2), true);
  session.round = '2'; session.phase = 'active';
  assert.equal(canStartRound(session, 2), false);
  assert.equal(canOpenReflection(session), false);
  session.phase = 'ended';
  assert.equal(canOpenReflection(session), true);
});

test('presence counts separate tabs and clears only the departing tab', async () => {
  const database = createDatabase();
  const service = createDebateService(database);
  const id = await service.createSession({statement1: 'First', statement2: 'Second'});
  const sessionRef = database.ref(`debate_sessions/${id}`);
  const stopFirst = await service.joinSession(sessionRef, 'member-1', 'Ada', 'tab-1', () => {});
  const stopSecond = await service.joinSession(sessionRef, 'member-1', 'Ada', 'tab-2', () => {});
  await database.ref('.info/connected').set(true);
  assert.equal(Object.keys((await service.readSession(id)).presence['member-1']).length, 2);
  stopFirst();
  await Promise.resolve();
  assert.equal(Object.keys((await service.readSession(id)).presence['member-1']).length, 1);
  stopSecond();
});

test('leaving a workshop removes only that member and their round results', async () => {
  const database = createDatabase();
  const service = createDebateService(database);
  const id = await service.createSession({statement1: 'First', statement2: 'Second'});
  const ref = database.ref(`debate_sessions/${id}`);
  await service.joinSession(ref, 'm1', 'Ada', 'tab-1', () => {});
  await service.joinSession(ref, 'm2', 'Ben', 'tab-2', () => {});
  await database.ref('.info/connected').set(true);
  await service.chooseSide(ref, '1', 'm1', 'true');
  await service.chooseSide(ref, '2', 'm1', 'false');
  await service.updateSession(ref, {'turns/1/m1': true, 'turns/2/m1': true});
  await service.leaveSession(ref, 'm1');
  const session = await service.readSession(id);
  assert.equal(session.participants.m1, undefined);
  assert.equal(session.participants.m2.name, 'Ben');
  assert.equal(session.presence.m1, undefined);
  assert.equal(session.choices['1'].m1, undefined);
  assert.equal(session.choices['2'].m1, undefined);
  assert.equal(session.turns['1'].m1, undefined);
  assert.equal(session.turns['2'].m1, undefined);
});

test('join limit counts re-entry after Leave and admin can unblock a name', async () => {
  const database = createDatabase();
  const service = createDebateService(database);
  const id = await service.createSession({statement1: 'First', statement2: 'Second'});
  const ref = database.ref(`debate_sessions/${id}`);
  assert.equal(joinLimit(await service.readSession(id)), 3);
  for (const value of ['0', '11', '2.5', '']) assert.equal(parseJoinLimit(value), null);
  for (let entry = 1; entry <= 3; entry++) {
    await service.joinSession(ref, 'm1', 'Ada', `tab-${entry}`, () => {}, 3, `admission-${entry}`);
    assert.equal((await service.readSession(id)).joinAccess.m1.count, entry);
    if (entry === 1) {
      await service.joinSession(ref, 'm1', 'Ada', 'refreshed-tab', () => {}, 3, 'admission-1');
      assert.equal((await service.readSession(id)).joinAccess.m1.count, 1);
    }
    await service.leaveSession(ref, 'm1');
  }
  await assert.rejects(service.joinSession(ref, 'm1', 'Ada', 'blocked-tab', () => {}), {code: 'join-limit-reached'});
  await service.joinSession(ref, 'm2', 'Ben', 'other-member', () => {});
  assert.equal((await service.readSession(id)).joinAccess.m2.count, 1);
  await service.updateSession(ref, {'settings/maxJoinsPerMember': 2});
  assert.equal(joinLimit(await service.readSession(id)), 2);
  await service.leaveSession(ref, 'm2');
  await service.joinSession(ref, 'm2', 'Ben', 'second-entry', () => {}, 2);
  await service.leaveSession(ref, 'm2');
  await assert.rejects(service.joinSession(ref, 'm2', 'Ben', 'third-entry', () => {}, 2), {code: 'join-limit-reached'});
  await service.joinSession(ref, 'm3', 'Cara', 'first-tab', () => {}, 2);
  await service.joinSession(ref, 'm3', 'Cara', 'second-tab', () => {}, 2);
  assert.equal((await service.readSession(id)).joinAccess.m3.count, 2);
  await assert.rejects(service.joinSession(ref, 'm3', 'Cara', 'third-tab', () => {}, 2), {code: 'join-limit-reached'});
  await service.resetJoinLimit(ref, 'm1');
  await service.joinSession(ref, 'm1', 'Ada', 'unblocked-tab', () => {}, 2);
  assert.equal((await service.readSession(id)).joinAccess.m1.count, 1);
});

test('admin Settings warns about names at the join limit', () => {
  const nodes = new Map();
  const root = {querySelector: selector => {
    if (!nodes.has(selector)) nodes.set(selector, {hidden: true, innerHTML: ''});
    return nodes.get(selector);
  }};
  const session = {settings: {maxJoinsPerMember: 3}, joinAccess: {m1: {count: 3}, m2: {count: 2}}};
  renderJoinLimitWarning(root, session, {m1: {name: '<Ada>'}, m2: {name: 'Ben'}}, key => translate('en', key));
  assert.equal(root.querySelector('#join-limit-warning').hidden, false);
  assert.match(root.querySelector('#join-limit-list').innerHTML, /&lt;Ada&gt; · 3\/3/);
  assert.doesNotMatch(root.querySelector('#join-limit-list').innerHTML, /Ben/);
  session.joinAccess.m1.count = 0;
  renderJoinLimitWarning(root, session, {}, key => translate('en', key));
  assert.equal(root.querySelector('#join-limit-warning').hidden, true);
});

test('host markup separates Control, Settings, and History', () => {
  const markup = createHostMarkup(key => translate('en', key));
  for (const id of ['setup-host', 'setup-secretary', 'setup-reflection-1', 'edit-notes', 'edit-statement-one', 'edit-reflection-3', 'host-monitor', 'host-internal', 'debate-settings-tab', 'turn-duration-minutes', 'host-join-settings', 'join-limit', 'join-limit-warning', 'debate-history-tab']) {
    assert.match(markup, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(markup, /id="setup-notes"/);
  for (const round of [1, 2]) assert.match(markup, new RegExp(`<div class="ml-auto grid grid-cols-2 gap-2"><button id="start-round${round}"[^>]*min-w-32[^>]*disabled:opacity-40[^>]*>.*?</button><button id="end-round${round}"`));
  assert.ok(markup.indexOf('id="host-panel"') < markup.indexOf('id="host-monitor"'));
  assert.ok(markup.indexOf('id="host-monitor"') < markup.indexOf('id="round-controls"'));
  assert.ok(markup.indexOf('id="session-settings-form"') < markup.indexOf('id="host-internal"'));
  assert.ok(markup.indexOf('id="host-internal"') < markup.indexOf('id="debate-history-tab"'));
  assert.ok(markup.indexOf('id="debate-control-tab"') < markup.indexOf('id="debate-settings-tab"'));
  const settingsTab = markup.split('id="debate-settings-tab"')[1].split('id="debate-history-tab"')[0];
  assert.match(settingsTab, /id="timer-settings-form"/);
  assert.match(settingsTab, /id="session-settings-form"/);
  assert.match(settingsTab, /id="session-internal-form"/);
  assert.match(settingsTab, /<select id="turn-duration-minutes"/);
  assert.match(settingsTab, /<option value="30">30 minutes<\/option>/);
  assert.doesNotMatch(settingsTab, /<option value="35"/);
  const ids = [...markup.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.doesNotMatch(markup.split('id="session-settings-form"')[1].split('</form>')[0], /id="edit-notes"/);
  const list = {innerHTML: ''};
  renderHostHistory({querySelector: () => list}, {'session-123456': {status: 'ended', endedAt: Date.now(), statement1: '<script>alert(1)</script>', statement2: 'Second', settings: {turnDurationMs: 420000}, participants: {m1: {name: 'Ada'}, m2: {name: 'Ben'}}, choices: {'1': {m1: {side: 'true'}}, '2': {m1: {side: 'false'}}}, turns: {'2': {m1: true}}}}, key => translate('en', key));
  assert.match(list.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(list.innerHTML, /<script>/);
  assert.match(list.innerHTML, /7 minutes/);
  assert.equal((list.innerHTML.match(/<table /g) || []).length, 2);
  assert.match(list.innerHTML, /text-center/);
  assert.match(list.innerHTML, /23456/);
  assert.doesNotMatch(list.innerHTML, /session-123456/);
  assert.match(list.innerHTML, /Ada/);
  assert.match(list.innerHTML, />10<\/td><td[^>]*>xF<\/td>/);
  assert.match(list.innerHTML, />––<\/td><td[^>]*>xx<\/td>/);
  assert.doesNotMatch(list.innerHTML, /rowspan="2"/);
});

test('workshop metadata shows ID, time, participants, and open or closed status', () => {
  const markup = createWorkshopMetaMarkup(key => translate('en', key));
  for (const id of ['workshop-status', 'workshop-last-label', 'workshop-id', 'workshop-time-label', 'workshop-time', 'workshop-ended-field', 'workshop-ended-time', 'workshop-participants']) assert.match(markup, new RegExp(`id="${id}"`));
  const nodes = new Map();
  const root = {querySelector: selector => {
    if (!nodes.has(selector)) nodes.set(selector, {textContent: '', className: ''});
    return nodes.get(selector);
  }};
  const session = {status: 'live', createdAt: Date.UTC(2026, 10, 26, 18), participants: {a: {}, b: {}}};
  renderWorkshopMeta(root, session, 'session-123456', key => translate('en', key), 'en');
  assert.equal(root.querySelector('#workshop-id').textContent, '23456');
  assert.equal(root.querySelector('#workshop-participants').textContent, 2);
  assert.equal(root.querySelector('#workshop-status').textContent, 'Workshop open');
  assert.equal(root.querySelector('#workshop-last-label').hidden, true);
  assert.equal(root.querySelector('#workshop-time-label').textContent, 'Created');
  assert.equal(root.querySelector('#workshop-ended-field').hidden, true);
  session.status = 'ended'; session.startedAt = Date.UTC(2026, 10, 26, 19); session.endedAt = Date.UTC(2026, 10, 26, 21);
  renderWorkshopMeta(root, session, 'session-123456', key => translate('en', key), 'en');
  assert.equal(root.querySelector('#workshop-status').textContent, 'Workshop closed');
  assert.equal(root.querySelector('#workshop-last-label').hidden, false);
  assert.equal(root.querySelector('#workshop-time-label').textContent, 'Started');
  assert.match(root.querySelector('#workshop-time').textContent, /20:00/);
  assert.match(root.querySelector('#workshop-ended-time').textContent, /22:00/);
  assert.equal(root.querySelector('#workshop-ended-field').hidden, false);
  delete session.startedAt;
  renderWorkshopMeta(root, session, 'session-123456', key => translate('en', key), 'en');
  assert.equal(root.querySelector('#workshop-time-label').textContent, 'Created');
});

test('member sees reflection questions and an ended debate message, without internal notes', () => {
  const markup = createParticipantMarkup(key => translate('en', key));
  assert.match(markup, /id="member-display-name"/);
  assert.match(markup, /data-action="leave-workshop"/);
  assert.ok(markup.indexOf('id="member-unavailable-title"') < markup.indexOf('id="member-expired"'));
  assert.doesNotMatch(markup, /member-last-statement/);
  const nodes = new Map();
  const root = {
    querySelector: selector => {
      if (!nodes.has(selector)) nodes.set(selector, {hidden: false, textContent: '', innerHTML: ''});
      return nodes.get(selector);
    },
    querySelectorAll: () => []
  };
  const state = {memberId: 'm1', joinId: 'm1', session: {round: 'reflection', participants: {m1: {name: 'Ada'}}, reflectionQuestions: {'1': 'What changed?', '2': 'Why?', '3': 'What next?'}, notes: 'Private minutes'}};
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-display-name').textContent, 'Ada');
  assert.equal(root.querySelector('#member-reflection').hidden, false);
  assert.match(root.querySelector('#member-reflection').innerHTML, /What changed\?/);
  assert.doesNotMatch(root.querySelector('#member-reflection').innerHTML, /Private minutes/);
  state.loggedOut = true;
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-logged-out').hidden, false);
  assert.equal(root.querySelector('#join-form').hidden, true);
  assert.equal(root.querySelector('#member-panel').hidden, true);
  state.loggedOut = false;
  state.session = null;
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-unavailable').hidden, false);
  assert.equal(root.querySelector('#member-panel').hidden, true);
  assert.equal(root.querySelector('#join-form').hidden, true);
  state.endedSession = {statement1: 'Previous statement'};
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-expired').hidden, false);
  assert.equal(root.querySelector('#member-unavailable-title').textContent, 'This workshop has ended');
});

test('projection shows the unavailable message after the debate ends', () => {
  const markup = createDisplayMarkup(key => translate('en', key));
  assert.ok(markup.indexOf('id="display-statement"') < markup.indexOf('id="display-expired"'));
  assert.doesNotMatch(markup, /display-last-statement/);
  assert.ok(markup.indexOf('id="display-reflection"') < markup.indexOf('id="display-qr"'));
  assert.match(markup, /id="display-qr" class="mx-auto flex/);
  const nodes = new Map();
  const root = {querySelector: selector => {
    if (!nodes.has(selector)) nodes.set(selector, {hidden: false, textContent: '', parentElement: {hidden: false}});
    return nodes.get(selector);
  }};
  renderDisplay(root, {session: null}, key => translate('en', key), [], () => {});
  assert.match(root.querySelector('#display-statement').textContent, /No debate is currently active/);
  assert.equal(root.querySelector('#display-counts').hidden, true);
  assert.equal(root.querySelector('#display-qr').parentElement.hidden, true);
  renderDisplay(root, {session: null, endedSession: {statement1: 'Previous statement'}}, key => translate('en', key), [], () => {});
  assert.equal(root.querySelector('#display-expired').hidden, false);
  assert.equal(root.querySelector('#display-qr-expired').hidden, false);
  assert.equal(root.querySelector('#display-qr').hidden, true);
  assert.equal(root.querySelector('#display-status').textContent, '');
  assert.equal(root.querySelector('#display-statement').textContent, 'This workshop has ended');
});
