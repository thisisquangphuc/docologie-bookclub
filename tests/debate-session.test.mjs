import assert from 'node:assert/strict';
import test from 'node:test';
import { createDebateService } from '../assets/js/debate/session-service.js';
import { createHostMarkup, renderHostHistory } from '../assets/js/debate/views.js';
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
    }
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

test('host markup contains setup, settings, monitor preview, and archive', () => {
  const markup = createHostMarkup(key => translate('en', key));
  for (const id of ['setup-host', 'setup-secretary', 'setup-reflection-1', 'setup-notes', 'edit-statement-one', 'edit-reflection-3', 'host-monitor', 'host-history']) {
    assert.match(markup, new RegExp(`id="${id}"`));
  }
  assert.ok(markup.indexOf('id="host-panel"') < markup.indexOf('id="host-monitor"'));
  assert.ok(markup.indexOf('id="host-monitor"') < markup.indexOf('id="round-controls"'));
  const list = {innerHTML: ''};
  renderHostHistory({querySelector: () => list}, {old: {status: 'ended', endedAt: Date.now(), statement1: '<script>alert(1)</script>', statement2: 'Second'}}, key => translate('en', key));
  assert.match(list.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(list.innerHTML, /<script>/);
});
