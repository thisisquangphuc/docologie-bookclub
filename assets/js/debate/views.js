import { escapeHtml } from './i18n.js';
import { canEndRound, canOpenReflection, canStartRound, isRoundActive } from './round-policy.js';
import { formatTime, MAX_TURN_DURATION_MINUTES, MIN_TURN_DURATION_MINUTES, turnDurationMs } from './timer-policy.js';

function createMonitorMarkup(t) {
  return `<section id="host-monitor" hidden aria-labelledby="host-monitor-title" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h3 id="host-monitor-title" class="serif text-xl">${t('monitorPreview')}</h3><p class="mt-1 text-sm text-neutral-500">${t('monitorHint')}</p><div class="monitor-preview mt-4"><p id="preview-round" class="text-xs font-bold uppercase tracking-widest text-[#71363C]"></p><h4 id="preview-statement" class="serif mt-3 text-xl leading-snug"></h4><div id="preview-reflection" class="mt-4 space-y-2 text-sm" hidden></div><div id="preview-counts" class="mt-5 grid grid-cols-3 gap-3 border-t border-neutral-300 pt-4 text-sm"><p>${t('true')}<strong id="preview-true" class="serif block text-2xl">0</strong></p><p>${t('false')}<strong id="preview-false" class="serif block text-2xl">0</strong></p><p>${t('speakerLabel')}<strong id="preview-speaker" class="block truncate font-semibold"></strong><span id="preview-timer" class="tabular-nums"></span></p></div><p id="preview-status" class="mt-3 text-xs text-neutral-500"></p></div></section>`;
}

function createHostControlMarkup(t) {
  return `<section class="space-y-5"><div><p class="text-xs font-bold uppercase tracking-[.2em] text-[#71363C]">${t('host')}</p><h2 class="serif text-3xl">${t('host')}</h2><p class="mt-1 text-sm text-neutral-500">${t('hostIntro')}</p></div><div id="host-setup" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><p class="mb-4 text-sm text-neutral-600">${t('setupHint')}</p><form id="create-session-form" class="space-y-4"><div class="grid gap-4 md:grid-cols-2"><label class="block text-sm font-semibold">${t('statement1')}<textarea id="statement-one" required maxlength="500" rows="2" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label><label class="block text-sm font-semibold">${t('statement2')}<textarea id="statement-two" required maxlength="500" rows="2" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label></div>${createSetupFields(t)}<button class="rounded-lg bg-neutral-900 px-5 py-3 font-semibold text-white">${t('create')}</button></form><p id="host-error" class="mt-3 text-sm text-[#71363C]" role="status"></p></div><div id="host-panel" hidden class="space-y-5"><p id="host-live-error" class="text-sm text-[#71363C]" role="status"></p><div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E0D8] bg-white p-5"><div><p class="text-xs uppercase tracking-widest text-neutral-500">${t('currentStatus')}</p><h3 id="host-round" class="serif mt-1 text-xl"></h3></div><a id="display-link" target="_blank" rel="noopener" class="rounded border border-neutral-300 px-4 py-3 text-sm font-semibold">${t('startDisplay')}</a></div>${createMonitorMarkup(t)}<div id="round-controls" class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"><section id="round-one-card" class="rounded-xl border border-[#E2E0D8] bg-white p-5 lg:col-span-2"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-[#71363C]">${t('round1')}</p><p id="statement-one-live" class="mt-2 text-sm text-neutral-600"></p></div><button id="start-round1" data-action="start-round1" class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">${t('start1')}</button><button id="end-round1" data-action="end-round1" class="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold disabled:opacity-40">${t('endRound1')}</button></div><div class="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]"><div><h3 class="text-sm font-semibold">${t('pickSpeaker')}</h3><ul id="speaker-list-1" class="mt-3 space-y-2"></ul></div><div class="rounded-lg bg-[#F7F6F2] p-4 text-center"><h3 class="text-xs font-bold uppercase tracking-widest text-neutral-500">${t('timerControl')}</h3><p id="host-timer-1" class="serif mt-3 text-4xl tabular-nums">03:00</p><p id="round-status-1" class="mt-2 text-xs text-neutral-500"></p></div></div></section><section id="round-two-card" class="rounded-xl border border-[#E2E0D8] bg-white p-5 lg:col-span-2"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-[#71363C]">${t('round2')}</p><p id="statement-two-live" class="mt-2 text-sm text-neutral-600"></p></div><button id="start-round2" data-action="start-round2" class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">${t('start2')}</button><button id="end-round2" data-action="end-round2" class="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold disabled:opacity-40">${t('endRound2')}</button></div><div class="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]"><div><h3 class="text-sm font-semibold">${t('pickSpeaker')}</h3><ul id="speaker-list-2" class="mt-3 space-y-2"></ul></div><div class="rounded-lg bg-[#F7F6F2] p-4 text-center"><h3 class="text-xs font-bold uppercase tracking-widest text-neutral-500">${t('timerControl')}</h3><p id="host-timer-2" class="serif mt-3 text-4xl tabular-nums">03:00</p><p id="round-status-2" class="mt-2 text-xs text-neutral-500"></p></div></div></section><aside class="rounded-xl border border-[#E2E0D8] bg-white p-5 text-center lg:col-start-3 lg:row-start-1 lg:row-span-2"><h3 class="serif text-lg">${t('qrHint')}</h3><div id="host-qr" class="mx-auto mt-3 flex min-h-40 items-center justify-center"></div><a id="join-link" class="mt-3 block break-all text-sm text-neutral-600 underline"></a><button data-action="copy-link" class="mt-3 rounded-lg border border-neutral-300 px-4 py-2 text-sm">${t('copyLink')}</button><p id="participant-summary" class="mt-4 text-sm text-neutral-500"></p></aside></div><div class="flex flex-wrap gap-2"><button data-action="reflection" class="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold">${t('showReflection')}</button><button data-action="end-workshop" class="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold">${t('endSession')}</button></div></div></section>`;
}

function reflectionFields(t, prefix, showHeading = true) {
  const questions = [1, 2, 3].map(index => `<label class="block text-sm font-semibold" for="${prefix}-reflection-${index}">${t('reflectionQuestion')} ${index}<textarea id="${prefix}-reflection-${index}" maxlength="500" rows="2" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label>`).join('');
  return `<div class="space-y-3">${showHeading ? `<h4 class="text-sm font-semibold">${t('reflectionQuestions')}</h4>` : ''}${questions}</div>`;
}

function internalFields(t, prefix) {
  return `<div class="space-y-4"><label class="block text-sm font-semibold" for="${prefix}-host">${t('hostName')}<select id="${prefix}-host" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3"><option value="">${t('chooseMember')}</option></select></label><label class="block text-sm font-semibold" for="${prefix}-secretary">${t('secretaryName')}<select id="${prefix}-secretary" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3"><option value="">${t('chooseMember')}</option></select></label><label class="block text-sm font-semibold" for="${prefix}-notes">${t('sessionNotes')}<textarea id="${prefix}-notes" maxlength="5000" rows="5" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label></div>`;
}

function createSetupFields(t) {
  return `<div class="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><section aria-labelledby="setup-reflection-title" class="rounded-lg border border-neutral-200 p-4"><h3 id="setup-reflection-title" class="serif mb-3 text-lg">${t('reflectionQuestions')}</h3>${reflectionFields(t, 'setup', false)}</section><section aria-labelledby="setup-internal-title" class="rounded-lg border border-neutral-200 p-4"><h3 id="setup-internal-title" class="serif mb-1 text-lg">${t('internalDetails')}</h3><p class="mb-3 text-xs text-neutral-500">${t('internalHint')}</p>${internalFields(t, 'setup')}</section></div>`;
}

export function createHostMarkup(t) {
  const tabs = `<nav class="mb-5 flex gap-2 border-b border-neutral-300" role="tablist" aria-label="${t('debateSections')}"><button id="debate-control-tab-button" type="button" role="tab" aria-controls="debate-control-tab" data-action="show-control" class="border-b-2 px-4 py-3 text-sm font-semibold">${t('controlTab')}</button><button id="debate-settings-tab-button" type="button" role="tab" aria-controls="debate-settings-tab" data-action="show-settings" class="border-b-2 px-4 py-3 text-sm font-semibold">${t('settingsTab')}</button><button id="debate-history-tab-button" type="button" role="tab" aria-controls="debate-history-tab" data-action="show-history" class="border-b-2 px-4 py-3 text-sm font-semibold">${t('debateHistory')}</button></nav>`;
  const timerSettings = `<section id="host-timer-settings" hidden aria-labelledby="host-timer-settings-title" class="mb-5 rounded-xl border border-[#E2E0D8] bg-white p-5"><h2 id="host-timer-settings-title" class="serif text-xl">${t('turnDurationTitle')}</h2><p id="turn-duration-hint" class="mt-1 text-sm text-neutral-500">${t('turnDurationHint')}</p><form id="timer-settings-form" class="mt-4 flex flex-wrap items-end gap-3"><label for="turn-duration-minutes" class="text-sm font-semibold">${t('turnDurationLabel')}<input id="turn-duration-minutes" type="number" min="${MIN_TURN_DURATION_MINUTES}" max="${MAX_TURN_DURATION_MINUTES}" step="1" required aria-describedby="turn-duration-hint" class="mt-2 block w-32 rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></label><button class="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">${t('saveTimer')}</button><p id="timer-settings-status" class="w-full text-sm text-neutral-600" role="status"></p></form></section>`;
  const settings = `<section id="host-settings" hidden aria-labelledby="host-settings-title" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h3 id="host-settings-title" class="serif text-xl">${t('sessionSettings')}</h3><p class="mt-1 text-sm text-neutral-500">${t('settingsHint')}</p><form id="session-settings-form" class="mt-4 space-y-4"><div class="grid gap-4 md:grid-cols-2"><label class="block text-sm font-semibold" for="edit-statement-one">${t('statement1')}<textarea id="edit-statement-one" required maxlength="500" rows="3" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label><label class="block text-sm font-semibold" for="edit-statement-two">${t('statement2')}<textarea id="edit-statement-two" required maxlength="500" rows="3" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label></div>${reflectionFields(t, 'edit')}<button class="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">${t('saveSettings')}</button><p id="settings-status" class="text-sm text-neutral-600" role="status"></p></form></section>`;
  const internal = `<section id="host-internal" hidden aria-labelledby="host-internal-title" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h3 id="host-internal-title" class="serif text-xl">${t('internalDetails')}</h3><p class="mt-1 text-sm text-neutral-500">${t('internalHint')}</p><form id="session-internal-form" class="mt-4 space-y-4">${internalFields(t, 'edit')}<button class="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">${t('saveInternal')}</button><p id="internal-status" class="text-sm text-neutral-600" role="status"></p></form></section>`;
  const settingsTab = `<section id="debate-settings-tab" hidden role="tabpanel" aria-labelledby="debate-settings-tab-button"><p id="settings-empty" hidden class="rounded-xl border border-[#E2E0D8] bg-white p-5 text-sm text-neutral-500">${t('createBeforeSettings')}</p>${timerSettings}<div class="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">${settings}${internal}</div></section>`;
  const history = `<section id="debate-history-tab" hidden role="tabpanel" aria-labelledby="debate-history-tab-button"><div id="host-history" aria-labelledby="host-history-title" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h2 id="host-history-title" class="serif text-xl">${t('debateHistory')}</h2><div id="host-history-list" class="mt-4 space-y-3"></div></div></section>`;
  return `${tabs}<div id="debate-control-tab" role="tabpanel" aria-labelledby="debate-control-tab-button">${createHostControlMarkup(t)}</div>${settingsTab}${history}`;
}

export function createDisplayMarkup(t) {
  return `<section id="projection" class="flex flex-col justify-between gap-6"><div class="flex items-start justify-between gap-5"><div class="max-w-4xl"><p id="display-round" class="text-sm font-bold uppercase tracking-[.2em] text-[#71363C]"></p><h2 id="display-statement" class="serif mt-5 text-4xl leading-tight sm:text-6xl lg:text-7xl"></h2></div><aside class="hidden rounded-xl border border-[#E2E0D8] bg-white p-4 text-center sm:block"><div id="display-qr"></div><p class="mt-2 max-w-32 text-xs text-neutral-500">${t('qrHint')}</p></aside></div><div id="display-reflection" hidden class="grid gap-3 md:grid-cols-3"></div><div id="display-counts" class="grid gap-5 border-t border-neutral-300 pt-5 md:grid-cols-3"><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('true')}</p><p id="display-true" class="serif text-5xl">0</p></div><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('false')}</p><p id="display-false" class="serif text-5xl">0</p></div><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('speakerLabel')}</p><p id="display-speaker" class="serif text-2xl"></p><p id="display-timer" class="serif mt-1 text-4xl tabular-nums"></p></div></div><p id="display-status" class="text-sm text-neutral-500"></p></section>`;
}

export function createParticipantMarkup(t) {
  return `<section class="mx-auto max-w-xl"><p id="member-unavailable" hidden class="rounded-xl border border-[#E2E0D8] bg-white p-5 text-center text-neutral-600">${t('noActiveDebate')}</p><p id="join-error" class="mb-4 text-sm text-neutral-600" role="status"></p><div id="join-form" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h2 class="serif text-2xl">${t('join')}</h2><form id="join-session-form" class="mt-4 space-y-3"><label for="member-name" class="block text-sm font-semibold">${t('chooseName')}</label><input id="member-name" list="member-roster-options" autocomplete="off" required class="w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3" placeholder="${t('namePlaceholder')}"><datalist id="member-roster-options"></datalist><button class="w-full rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white">${t('joinButton')}</button></form></div><section id="member-panel" hidden class="mt-4 space-y-4"><div class="rounded-xl border border-[#E2E0D8] bg-white p-5"><p id="member-round" class="text-xs font-bold uppercase tracking-widest text-[#71363C]"></p><h2 id="member-statement" class="serif mt-3 text-2xl leading-snug"></h2><p id="member-phase-note" class="mt-2 text-sm text-neutral-500"></p><div id="member-reflection" hidden class="mt-5 space-y-3"></div><div id="position-controls" class="mt-5"><p class="mb-3 text-sm font-semibold">${t('position')}</p><div class="grid grid-cols-2 gap-3"><button data-side="true" class="rounded-lg border border-neutral-300 bg-white px-4 py-5 text-lg font-bold">${t('true')}</button><button data-side="false" class="rounded-lg border border-neutral-300 bg-white px-4 py-5 text-lg font-bold">${t('false')}</button></div></div><p id="my-choice" class="mt-4 text-sm font-semibold"></p></div><div class="rounded-xl border border-[#E2E0D8] bg-white p-4"><p id="member-speaker" class="text-sm text-neutral-600"></p><p id="member-timer" class="serif mt-1 text-3xl tabular-nums"></p></div></section></section>`;
}

export function renderHost(root, state, t, makeQr) {
  const {session, sessionRef} = state;
  for (const name of ['control', 'settings', 'history']) {
    const selected = state.activeTab === name;
    root.querySelector(`#debate-${name}-tab`).hidden = !selected;
    const button = root.querySelector(`#debate-${name}-tab-button`);
    button.setAttribute('aria-selected', String(selected));
    button.classList.toggle('border-neutral-900', selected);
    button.classList.toggle('text-neutral-500', !selected);
  }
  const active = !!session && session.status !== 'ended';
  root.querySelector('#host-setup').hidden = active;
  root.querySelector('#host-panel').hidden = !active;
  root.querySelector('#host-settings').hidden = !active;
  root.querySelector('#host-internal').hidden = !active;
  root.querySelector('#host-timer-settings').hidden = !active;
  root.querySelector('#settings-empty').hidden = active;
  root.querySelector('#host-monitor').hidden = !active;
  if (!active) return;
  const round = String(session.round);
  const phaseEnded = session.phase === 'ended';
  const roundLabel = round === '1' ? t(phaseEnded ? 'round1Ended' : 'round1') : round === '2' ? t(phaseEnded ? 'round2Ended' : 'round2') : round === 'reflection' ? t('reflection') : t('live');
  root.querySelector('#host-round').textContent = roundLabel;
  root.querySelector('#statement-one-live').textContent = session.statement1;
  root.querySelector('#statement-two-live').textContent = session.statement2;
  const participants = Object.entries(session.participants || {}).sort((a,b)=>String(a[1]?.name||'').localeCompare(String(b[1]?.name||'')));
  const round1Done = participants.length > 0 && participants.every(([id]) => session.turns?.['1']?.[id]);
  const round2Done = participants.length > 0 && participants.every(([id]) => session.turns?.['2']?.[id]);
  const round1Complete = (round === '1' && phaseEnded) || ['2','reflection'].includes(round);
  const round2Complete = (round === '2' && phaseEnded) || round === 'reflection';
  const activeRound = ['1','2'].includes(round) && !phaseEnded ? round : '';
  root.querySelector('#round-one-card').classList.toggle('opacity-50',round1Complete);
  root.querySelector('#round-two-card').classList.toggle('opacity-60',round === 'setup' || round === '1' || round2Complete);
  root.querySelector('#start-round1').disabled = !canStartRound(session, 1);
  root.querySelector('#end-round1').disabled = !canEndRound(session, 1);
  root.querySelector('#start-round2').disabled = !canStartRound(session, 2);
  root.querySelector('#end-round2').disabled = !canEndRound(session, 2);
  root.querySelector('[data-action="reflection"]').disabled = !canOpenReflection(session);
  root.querySelector('[data-action="reflection"]').classList.toggle('opacity-40',!canOpenReflection(session));
  const displayUrl = new URL(location.href); displayUrl.search = `?mode=display&session=${encodeURIComponent(sessionRef.key)}`;
  root.querySelector('#display-link').href = displayUrl.href;
  const joinUrl = new URL(location.href); joinUrl.search = `?mode=join&session=${encodeURIComponent(sessionRef.key)}`;
  const joinLink = joinUrl.href;
  root.querySelector('#join-link').href = joinLink; root.querySelector('#join-link').textContent = joinLink;
  const onlineIds = new Set(Object.entries(session.presence || {}).filter(([, connections]) => Object.keys(connections || {}).length > 0).map(([id]) => id));
  root.querySelector('#participant-summary').textContent = `${participants.length} ${t('joined')} · ${onlineIds.size} ${t('onlineNow')}`;
  makeQr(root.querySelector('#host-qr'), joinLink, 150);
  renderMonitorPreview(root, session, t);
  if (!state.editingSettings) {
    for (const [id, value] of [['edit-statement-one', session.statement1], ['edit-statement-two', session.statement2], ...[1, 2, 3].map(index => [`edit-reflection-${index}`, session.reflectionQuestions?.[index] || t(`reflection${index}`)])]) {
      root.querySelector(`#${id}`).value = value || '';
    }
  }
  if (!state.editingInternal) for (const [id, value] of [['edit-host', session.host?.id || ''], ['edit-secretary', session.secretary?.id || ''], ['edit-notes', session.notes || '']]) root.querySelector(`#${id}`).value = value || '';
  if (!state.editingTimer) root.querySelector('#turn-duration-minutes').value = turnDurationMs(session) / 60000;
  for (const currentRound of ['1','2']) {
    const turns = session.turns?.[currentRound] || {};
    const list = root.querySelector(`#speaker-list-${currentRound}`);
    list.innerHTML = participants.map(([id,person]) => {
      const active = session.timer?.speakerId === id && round === currentRound;
      const done = !!turns[id];
      const enabled = isRoundActive(session, Number(currentRound)) && !done;
      const startDisabled = !enabled || !!session.timer?.speakerId;
      const pauseDisabled = !active || !session.timer?.running;
      const resumeDisabled = !active || !session.timer?.paused;
      const finishDisabled = !active;
      const controls = `<button data-action="start-turn" data-speaker-id="${escapeHtml(id)}" ${startDisabled ? 'disabled' : ''} class="rounded bg-[#71363C] px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">${t('startTurnShort')}</button><button data-action="pause-turn" data-speaker-id="${escapeHtml(id)}" ${pauseDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('pause')}</button><button data-action="resume-turn" data-speaker-id="${escapeHtml(id)}" ${resumeDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('resume')}</button><button data-action="finish-turn" data-speaker-id="${escapeHtml(id)}" ${finishDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('finishTurn')}</button>`;
      return `<li class="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2 ${done ? 'opacity-50' : ''}"><span class="min-w-0 text-sm">${escapeHtml(person.name)} · ${t(onlineIds.has(id) ? 'onlineNow' : 'offlineNow')}${done ? ` · ${t('turnUsed')}` : ''}</span><span class="flex shrink-0 flex-wrap gap-1">${controls}</span></li>`;
    }).join('') || `<li class="text-sm text-neutral-500">${t('notJoined')}</li>`;
    root.querySelector(`#round-status-${currentRound}`).textContent = round === currentRound && phaseEnded ? t('roundEnded') : (currentRound === '1' ? round1Done : round2Done) ? t('roundReadyToEnd') : round === currentRound ? t('roundInProgress') : t('roundUpcoming');
    if (activeRound !== currentRound) root.querySelector(`#host-timer-${currentRound}`).textContent = formatTime(turnDurationMs(session));
  }
}

function renderMonitorPreview(root, session, t) {
  const round = String(session.round);
  const ended = session.phase === 'ended';
  root.querySelector('#preview-round').textContent = round === '1' ? t(ended ? 'round1Ended' : 'round1') : round === '2' ? t(ended ? 'round2Ended' : 'round2') : round === 'reflection' ? t('reflection') : t('waiting');
  root.querySelector('#preview-statement').textContent = round === '1' ? session.statement1 : round === '2' ? session.statement2 : t('waiting');
  root.querySelector('#preview-statement').hidden = round === 'reflection';
  const reflection = root.querySelector('#preview-reflection');
  reflection.hidden = round !== 'reflection';
  if (round === 'reflection') reflection.innerHTML = [1, 2, 3].map(index => `<p><span class="text-neutral-400">${index}.</span> ${escapeHtml(session.reflectionQuestions?.[index] || t(`reflection${index}`))}</p>`).join('');
  root.querySelector('#preview-counts').hidden = !['1', '2'].includes(round);
  const choices = Object.values(session.choices?.[round] || {});
  root.querySelector('#preview-true').textContent = choices.filter(choice => choice?.side === 'true').length;
  root.querySelector('#preview-false').textContent = choices.filter(choice => choice?.side === 'false').length;
  root.querySelector('#preview-speaker').textContent = session.timer?.speakerId ? session.participants?.[session.timer.speakerId]?.name || t('noSpeakerDisplay') : t('noSpeakerDisplay');
  root.querySelector('#preview-status').textContent = ended ? t('roundEnded') : `${Object.keys(session.participants || {}).length} ${t('participants')}`;
}
export function renderDisplay(root, state, t, prompts, makeQr) {
  const {session, sessionRef} = state;
  if (!session) {
    root.querySelector('#display-round').textContent = '';
    root.querySelector('#display-statement').hidden = false;
    root.querySelector('#display-statement').textContent = t('noActiveDebate');
    root.querySelector('#display-counts').hidden = true;
    root.querySelector('#display-reflection').hidden = true;
    root.querySelector('#display-qr').parentElement.hidden = true;
    root.querySelector('#display-status').textContent = '';
    return;
  }
  root.querySelector('#display-qr').parentElement.hidden = false;
  const round = String(session.round);
  const statement = round === '1' ? session.statement1 : round === '2' ? session.statement2 : '';
  root.querySelector('#display-round').textContent = round === '1' ? t(session.phase === 'ended' ? 'round1Ended' : 'round1') : round === '2' ? t(session.phase === 'ended' ? 'round2Ended' : 'round2') : round === 'reflection' ? t('reflection') : '';
  root.querySelector('#display-statement').hidden = round === 'reflection' || round === 'ended';
  root.querySelector('#display-statement').textContent = statement || t('waiting');
  root.querySelector('#display-counts').hidden = !['1','2'].includes(round);
  const choices = session.choices?.[round] || {};
  root.querySelector('#display-true').textContent = Object.values(choices).filter(choice => choice?.side === 'true').length;
  root.querySelector('#display-false').textContent = Object.values(choices).filter(choice => choice?.side === 'false').length;
  const speakerName = session.timer?.speakerId ? session.participants?.[session.timer.speakerId]?.name : '';
  root.querySelector('#display-speaker').textContent = speakerName || t('noSpeakerDisplay');
  root.querySelector('#display-status').textContent = session.phase === 'ended' ? t('roundEnded') : `${Object.keys(session.participants || {}).length} ${t('participants')}`;
  const reflection = root.querySelector('#display-reflection');
  reflection.hidden = round !== 'reflection';
  if (round === 'reflection') reflection.innerHTML = prompts.map((prompt,index) => `<article class="rounded-xl border border-[#E2E0D8] bg-white p-5"><span class="text-sm text-neutral-400">${index+1}</span><p class="serif mt-2 text-xl">${escapeHtml(session.reflectionQuestions?.[index+1] || prompt)}</p></article>`).join('');
  const joinUrl = new URL(location.href); joinUrl.search = `?mode=join&session=${encodeURIComponent(sessionRef.key)}`;
  makeQr(root.querySelector('#display-qr'), joinUrl.href, 112);
}

export function renderHostRoster(root, roster) {
  const entries = Object.entries(roster).sort((a, b) => String(a[1]?.name || a[1] || '').localeCompare(String(b[1]?.name || b[1] || '')));
  for (const prefix of ['setup', 'edit']) {
    for (const role of ['host', 'secretary']) {
      const select = root.querySelector(`#${prefix}-${role}`);
      const selected = select.value;
      select.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());
      for (const [id, member] of entries) select.add(new Option(typeof member === 'string' ? member : member.name || '', id));
      select.value = entries.some(([id]) => id === selected) ? selected : '';
    }
  }
}

export function renderHostHistory(root, history, t) {
  const entries = Object.entries(history).filter(([, session]) => session?.status === 'ended').sort((a, b) => (b[1].endedAt || 0) - (a[1].endedAt || 0));
  root.querySelector('#host-history-list').innerHTML = entries.length ? entries.map(([, session]) => {
    const date = new Date(session.endedAt || session.createdAt || 0).toLocaleDateString();
    const participants = Object.values(session.participants || {}).map(person => person?.name).filter(Boolean).join(', ');
    const questions = [1, 2, 3].map(index => session.reflectionQuestions?.[index] || t(`reflection${index}`));
    const rounds = ['1', '2'].map(round => {
      const rows = Object.entries(session.participants || {}).map(([id, person]) => {
        const side = session.choices?.[round]?.[id]?.side;
        return `<li>${escapeHtml(person.name)}: ${side ? t(side) : '—'} · ${session.turns?.[round]?.[id] ? t('turnUsed') : '—'}</li>`;
      }).join('');
      return `<div><strong>${t(`round${round}`)}:</strong><ul class="mt-1 space-y-1 pl-3">${rows || '<li>—</li>'}</ul></div>`;
    }).join('');
    return `<details class="rounded-lg border border-neutral-200 p-4"><summary class="cursor-pointer font-semibold">${escapeHtml(date)} · ${escapeHtml(session.statement1 || t('debateHistory'))}</summary><div class="mt-4 space-y-3 text-sm"><p><strong>${t('hostName')}:</strong> ${escapeHtml(session.host?.name || '—')} · <strong>${t('secretaryName')}:</strong> ${escapeHtml(session.secretary?.name || '—')}</p><p><strong>${t('statement1')}:</strong> ${escapeHtml(session.statement1)}</p><p><strong>${t('statement2')}:</strong> ${escapeHtml(session.statement2)}</p><p><strong>${t('turnDurationTitle')}:</strong> ${turnDurationMs(session) / 60000} ${t('minutesUnit')}</p><p><strong>${t('people')}:</strong> ${escapeHtml(participants || '—')}</p>${rounds}<div><strong>${t('reflectionQuestions')}:</strong><ol class="mt-1 list-decimal space-y-1 pl-5">${questions.map(question => `<li>${escapeHtml(question)}</li>`).join('')}</ol></div><p class="whitespace-pre-wrap"><strong>${t('sessionNotes')}:</strong> ${escapeHtml(session.notes || '—')}</p></div></details>`;
  }).join('') : `<p class="text-sm text-neutral-500">${t('noDebateHistory')}</p>`;
}

export function renderParticipant(root, state, t) {
  const {session, memberId} = state;
  root.querySelector('#member-unavailable').hidden = !!session;
  if (!session) {
    root.querySelector('#join-form').hidden = true;
    root.querySelector('#member-panel').hidden = true;
    root.querySelector('#join-error').textContent = '';
    return;
  }
  const member = session.participants?.[memberId];
  root.querySelector('#join-form').hidden = !!member;
  root.querySelector('#member-panel').hidden = !member;
  if (!member) return;
  const round = String(session.round);
  const choices = session.choices?.[round] || {};
  const choice = choices[memberId];
  const phaseEnded = session.phase === 'ended';
  const locked = round === '2' && !!choice;
  root.querySelector('#member-round').textContent = round === '1' ? t(phaseEnded ? 'round1Ended' : 'round1') : round === '2' ? t(phaseEnded ? 'round2Ended' : 'round2') : round === 'reflection' ? t('reflection') : t('live');
  root.querySelector('#member-statement').textContent = round === '1' ? session.statement1 : round === '2' ? session.statement2 : t('waiting');
  root.querySelector('#member-statement').hidden = round === 'reflection';
  root.querySelector('#member-phase-note').textContent = round === 'reflection' ? t('reflectionHint') : phaseEnded ? t('roundEnded') : round === '1' ? t('changeAllowed') : round === '2' ? t('lockedPosition') : t('waitRound');
  const reflection = root.querySelector('#member-reflection');
  reflection.hidden = round !== 'reflection';
  if (round === 'reflection') reflection.innerHTML = [1, 2, 3].map(index => `<p class="rounded-lg border border-neutral-200 bg-white p-4"><span class="mr-2 text-neutral-400">${index}.</span>${escapeHtml(session.reflectionQuestions?.[index] || t(`reflection${index}`))}</p>`).join('');
  root.querySelector('#position-controls').hidden = !['1','2'].includes(round) || phaseEnded || locked;
  root.querySelector('#my-choice').textContent = choice ? `${t('yourChoice')}: ${choice.side === 'true' ? t('true') : t('false')}` : '';
  root.querySelectorAll('[data-side]').forEach(button => {
    const selected = choice?.side === button.dataset.side;
    button.className = `rounded-lg border px-4 py-5 text-lg font-bold ${selected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'}`;
    button.disabled = !['1','2'].includes(round) || phaseEnded || locked;
  });
  const speakerName = session.timer?.speakerId ? session.participants?.[session.timer.speakerId]?.name : '';
  root.querySelector('#member-speaker').textContent = speakerName ? `${t('speakerLabel')}: ${speakerName}` : t('noSpeakerDisplay');
}

export function renderRulesDialog(root, content, closeLabel) {
  root.querySelector('#rules-content').innerHTML = content;
  root.querySelector('#close-rules').textContent = closeLabel;
}
