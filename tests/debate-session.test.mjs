import assert from 'node:assert/strict';
import test from 'node:test';
import { createDebateService } from '../assets/js/debate/session-service.js';
import { canEndRound, canOpenReflection, canStartRound, isRoundActive } from '../assets/js/debate/round-policy.js';
import { formatTime, parseTurnDurationMinutes, remainingTimeMs, turnDurationMs } from '../assets/js/debate/timer-policy.js';
import { createHostMarkup, renderDisplay, renderHostHistory, renderParticipant } from '../assets/js/debate/views.js';
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
  for (const value of ['2', '31', '3.5', '']) assert.equal(parseTurnDurationMinutes(value), null);
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
  assert.equal(canStartRound(session, 2), false);
  assert.equal(canEndRound(session, 1), true);
  session.phase = 'ended';
  assert.equal(isRoundActive(session, 1), false);
  assert.equal(canStartRound(session, 2), true);
  session.round = '2'; session.phase = 'active';
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

test('host markup separates Control, Settings, and History', () => {
  const markup = createHostMarkup(key => translate('en', key));
  for (const id of ['setup-host', 'setup-secretary', 'setup-reflection-1', 'setup-notes', 'edit-statement-one', 'edit-reflection-3', 'host-monitor', 'host-internal', 'debate-settings-tab', 'turn-duration-minutes', 'debate-history-tab']) {
    assert.match(markup, new RegExp(`id="${id}"`));
  }
  assert.ok(markup.indexOf('id="host-panel"') < markup.indexOf('id="host-monitor"'));
  assert.ok(markup.indexOf('id="host-monitor"') < markup.indexOf('id="round-controls"'));
  assert.ok(markup.indexOf('id="session-settings-form"') < markup.indexOf('id="host-internal"'));
  assert.ok(markup.indexOf('id="host-internal"') < markup.indexOf('id="debate-history-tab"'));
  assert.ok(markup.indexOf('id="debate-control-tab"') < markup.indexOf('id="debate-settings-tab"'));
  const settingsTab = markup.split('id="debate-settings-tab"')[1].split('id="debate-history-tab"')[0];
  assert.match(settingsTab, /id="timer-settings-form"/);
  assert.match(settingsTab, /id="session-settings-form"/);
  assert.match(settingsTab, /id="session-internal-form"/);
  const ids = [...markup.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.doesNotMatch(markup.split('id="session-settings-form"')[1].split('</form>')[0], /id="edit-notes"/);
  const list = {innerHTML: ''};
  renderHostHistory({querySelector: () => list}, {old: {status: 'ended', endedAt: Date.now(), statement1: '<script>alert(1)</script>', statement2: 'Second', settings: {turnDurationMs: 420000}}}, key => translate('en', key));
  assert.match(list.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(list.innerHTML, /<script>/);
  assert.match(list.innerHTML, /7 minutes/);
});

test('member sees reflection questions and an ended debate message, without internal notes', () => {
  const nodes = new Map();
  const root = {
    querySelector: selector => {
      if (!nodes.has(selector)) nodes.set(selector, {hidden: false, textContent: '', innerHTML: ''});
      return nodes.get(selector);
    },
    querySelectorAll: () => []
  };
  const state = {memberId: 'm1', session: {round: 'reflection', participants: {m1: {name: 'Ada'}}, reflectionQuestions: {'1': 'What changed?', '2': 'Why?', '3': 'What next?'}, notes: 'Private minutes'}};
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-reflection').hidden, false);
  assert.match(root.querySelector('#member-reflection').innerHTML, /What changed\?/);
  assert.doesNotMatch(root.querySelector('#member-reflection').innerHTML, /Private minutes/);
  state.session = null;
  renderParticipant(root, state, key => translate('en', key));
  assert.equal(root.querySelector('#member-unavailable').hidden, false);
  assert.equal(root.querySelector('#member-panel').hidden, true);
  assert.equal(root.querySelector('#join-form').hidden, true);
});

test('projection shows the unavailable message after the debate ends', () => {
  const nodes = new Map();
  const root = {querySelector: selector => {
    if (!nodes.has(selector)) nodes.set(selector, {hidden: false, textContent: '', parentElement: {hidden: false}});
    return nodes.get(selector);
  }};
  renderDisplay(root, {session: null}, key => translate('en', key), [], () => {});
  assert.match(root.querySelector('#display-statement').textContent, /No debate is currently active/);
  assert.equal(root.querySelector('#display-counts').hidden, true);
  assert.equal(root.querySelector('#display-qr').parentElement.hidden, true);
});
