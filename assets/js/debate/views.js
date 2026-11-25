import { escapeHtml } from './i18n.js';

export function createHostMarkup(t) {
  return `<section class="space-y-5"><div><p class="text-xs font-bold uppercase tracking-[.2em] text-[#71363C]">${t('host')}</p><h2 class="serif text-3xl">${t('host')}</h2><p class="mt-1 text-sm text-neutral-500">${t('hostIntro')}</p></div><div id="host-setup" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><p class="mb-4 text-sm text-neutral-600">${t('setupHint')}</p><form id="create-session-form" class="space-y-4"><label class="block text-sm font-semibold">${t('statement1')}<textarea id="statement-one" required maxlength="500" rows="2" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label><label class="block text-sm font-semibold">${t('statement2')}<textarea id="statement-two" required maxlength="500" rows="2" class="mt-2 w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3 text-base"></textarea></label><button class="rounded-lg bg-neutral-900 px-5 py-3 font-semibold text-white">${t('create')}</button></form><p id="host-error" class="mt-3 text-sm text-[#71363C]" role="status"></p></div><div id="host-panel" hidden class="space-y-5"><p id="host-live-error" class="text-sm text-[#71363C]" role="status"></p><div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E0D8] bg-white p-5"><div><p class="text-xs uppercase tracking-widest text-neutral-500">${t('currentStatus')}</p><h3 id="host-round" class="serif mt-1 text-xl"></h3></div><a id="display-link" target="_blank" rel="noopener" class="rounded border border-neutral-300 px-4 py-3 text-sm font-semibold">${t('startDisplay')}</a></div><div id="round-controls" class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"><section id="round-one-card" class="rounded-xl border border-[#E2E0D8] bg-white p-5 lg:col-span-2"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-[#71363C]">${t('round1')}</p><p id="statement-one-live" class="mt-2 text-sm text-neutral-600"></p></div><button id="start-round1" data-action="start-round1" class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">${t('start1')}</button></div><div class="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]"><div><h3 class="text-sm font-semibold">${t('pickSpeaker')}</h3><ul id="speaker-list-1" class="mt-3 space-y-2"></ul></div><div class="rounded-lg bg-[#F7F6F2] p-4 text-center"><h3 class="text-xs font-bold uppercase tracking-widest text-neutral-500">${t('timerControl')}</h3><p id="host-timer-1" class="serif mt-3 text-4xl tabular-nums">03:00</p><p id="round-status-1" class="mt-2 text-xs text-neutral-500"></p></div></div></section><section id="round-two-card" class="rounded-xl border border-[#E2E0D8] bg-white p-5 lg:col-span-2"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-[#71363C]">${t('round2')}</p><p id="statement-two-live" class="mt-2 text-sm text-neutral-600"></p></div><button id="start-round2" data-action="start-round2" class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">${t('start2')}</button></div><div class="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]"><div><h3 class="text-sm font-semibold">${t('pickSpeaker')}</h3><ul id="speaker-list-2" class="mt-3 space-y-2"></ul></div><div class="rounded-lg bg-[#F7F6F2] p-4 text-center"><h3 class="text-xs font-bold uppercase tracking-widest text-neutral-500">${t('timerControl')}</h3><p id="host-timer-2" class="serif mt-3 text-4xl tabular-nums">03:00</p><p id="round-status-2" class="mt-2 text-xs text-neutral-500"></p></div></div></section><aside class="rounded-xl border border-[#E2E0D8] bg-white p-5 text-center lg:col-start-3 lg:row-start-1 lg:row-span-2"><h3 class="serif text-lg">${t('qrHint')}</h3><div id="host-qr" class="mx-auto mt-3 flex min-h-40 items-center justify-center"></div><a id="join-link" class="mt-3 block break-all text-sm text-neutral-600 underline"></a><button data-action="copy-link" class="mt-3 rounded-lg border border-neutral-300 px-4 py-2 text-sm">${t('copyLink')}</button><p id="participant-summary" class="mt-4 text-sm text-neutral-500"></p></aside></div><div class="flex flex-wrap gap-2"><button data-action="reflection" class="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold">${t('showReflection')}</button><button data-action="end-workshop" class="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold">${t('endSession')}</button></div></div></section>`;
}

export function createDisplayMarkup(t) {
  return `<section id="projection" class="flex flex-col justify-between gap-6"><div class="flex items-start justify-between gap-5"><div class="max-w-4xl"><p id="display-round" class="text-sm font-bold uppercase tracking-[.2em] text-[#71363C]"></p><h2 id="display-statement" class="serif mt-5 text-4xl leading-tight sm:text-6xl lg:text-7xl"></h2></div><aside class="hidden rounded-xl border border-[#E2E0D8] bg-white p-4 text-center sm:block"><div id="display-qr"></div><p class="mt-2 max-w-32 text-xs text-neutral-500">${t('qrHint')}</p></aside></div><div id="display-reflection" hidden class="grid gap-3 md:grid-cols-3"></div><div id="display-counts" class="grid gap-5 border-t border-neutral-300 pt-5 md:grid-cols-3"><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('true')}</p><p id="display-true" class="serif text-5xl">0</p></div><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('false')}</p><p id="display-false" class="serif text-5xl">0</p></div><div><p class="text-sm uppercase tracking-wider text-neutral-500">${t('speakerLabel')}</p><p id="display-speaker" class="serif text-2xl"></p><p id="display-timer" class="serif mt-1 text-4xl tabular-nums"></p></div></div><p id="display-status" class="text-sm text-neutral-500"></p></section>`;
}

export function createParticipantMarkup(t) {
  return `<section class="mx-auto max-w-xl"><p id="join-error" class="mb-4 text-sm text-neutral-600" role="status"></p><div id="join-form" class="rounded-xl border border-[#E2E0D8] bg-white p-5"><h2 class="serif text-2xl">${t('join')}</h2><form id="join-session-form" class="mt-4 space-y-3"><label for="member-name" class="block text-sm font-semibold">${t('chooseName')}</label><input id="member-name" list="member-roster-options" autocomplete="off" required class="w-full rounded-lg border border-neutral-300 bg-[#F7F6F2] p-3" placeholder="${t('namePlaceholder')}"><datalist id="member-roster-options"></datalist><button class="w-full rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white">${t('joinButton')}</button></form></div><section id="member-panel" hidden class="mt-4 space-y-4"><div class="rounded-xl border border-[#E2E0D8] bg-white p-5"><p id="member-round" class="text-xs font-bold uppercase tracking-widest text-[#71363C]"></p><h2 id="member-statement" class="serif mt-3 text-2xl leading-snug"></h2><p id="member-phase-note" class="mt-2 text-sm text-neutral-500"></p><div id="position-controls" class="mt-5"><p class="mb-3 text-sm font-semibold">${t('position')}</p><div class="grid grid-cols-2 gap-3"><button data-side="true" class="rounded-lg border border-neutral-300 bg-white px-4 py-5 text-lg font-bold">${t('true')}</button><button data-side="false" class="rounded-lg border border-neutral-300 bg-white px-4 py-5 text-lg font-bold">${t('false')}</button></div></div><p id="my-choice" class="mt-4 text-sm font-semibold"></p></div><div class="rounded-xl border border-[#E2E0D8] bg-white p-4"><p id="member-speaker" class="text-sm text-neutral-600"></p><p id="member-timer" class="serif mt-1 text-3xl tabular-nums"></p></div></section></section>`;
}

export function renderHost(root, state, t, makeQr) {
  const {session, sessionRef} = state;
  root.querySelector('#host-setup').hidden = !!session;
  root.querySelector('#host-panel').hidden = !session;
  if (!session) return;
  const round = String(session.round);
  const roundLabel = round === '1' ? t('round1') : round === '2' ? t('round2') : round === 'reflection' ? t('reflection') : round === 'ended' ? t('ended') : t('live');
  root.querySelector('#host-round').textContent = roundLabel;
  root.querySelector('#statement-one-live').textContent = session.statement1;
  root.querySelector('#statement-two-live').textContent = session.statement2;
  const participants = Object.entries(session.participants || {}).sort((a,b)=>String(a[1]?.name||'').localeCompare(String(b[1]?.name||'')));
  const round1Done = participants.length > 0 && participants.every(([id]) => session.turns?.['1']?.[id]);
  const round2Done = participants.length > 0 && participants.every(([id]) => session.turns?.['2']?.[id]);
  const round1Complete = ['2','reflection','ended'].includes(round);
  const round2Complete = ['reflection','ended'].includes(round);
  const activeRound = ['1','2'].includes(round) ? round : '';
  root.querySelector('#round-one-card').classList.toggle('opacity-50',round1Complete);
  root.querySelector('#round-two-card').classList.toggle('opacity-60',round === 'setup' || round === '1' || round2Complete);
  root.querySelector('#start-round1').disabled = round !== 'setup';
  root.querySelector('#start-round2').disabled = round !== '1' || !round1Done;
  root.querySelector('[data-action="reflection"]').disabled = round !== '2' || !round2Done;
  root.querySelector('[data-action="reflection"]').classList.toggle('opacity-40',round !== '2' || !round2Done);
  const displayUrl = new URL(location.href); displayUrl.search = `?mode=display&session=${encodeURIComponent(sessionRef.key)}`;
  root.querySelector('#display-link').href = displayUrl.href;
  const joinUrl = new URL(location.href); joinUrl.search = `?mode=join&session=${encodeURIComponent(sessionRef.key)}`;
  const joinLink = joinUrl.href;
  root.querySelector('#join-link').href = joinLink; root.querySelector('#join-link').textContent = joinLink;
  root.querySelector('#participant-summary').textContent = `${Object.keys(session.participants || {}).length} ${t('joined')}`;
  makeQr(root.querySelector('#host-qr'), joinLink, 150);
  for (const currentRound of ['1','2']) {
    const turns = session.turns?.[currentRound] || {};
    const list = root.querySelector(`#speaker-list-${currentRound}`);
    list.innerHTML = participants.map(([id,person]) => {
      const active = session.timer?.speakerId === id && round === currentRound;
      const done = !!turns[id];
      const enabled = round === currentRound && !done;
      const startDisabled = !enabled || !!session.timer?.speakerId;
      const pauseDisabled = !active || !session.timer?.running;
      const resumeDisabled = !active || !session.timer?.paused;
      const finishDisabled = !active;
      const controls = `<button data-action="start-turn" data-speaker-id="${escapeHtml(id)}" ${startDisabled ? 'disabled' : ''} class="rounded bg-[#71363C] px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">${t('startTurnShort')}</button><button data-action="pause-turn" data-speaker-id="${escapeHtml(id)}" ${pauseDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('pause')}</button><button data-action="resume-turn" data-speaker-id="${escapeHtml(id)}" ${resumeDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('resume')}</button><button data-action="finish-turn" data-speaker-id="${escapeHtml(id)}" ${finishDisabled ? 'disabled' : ''} class="rounded border px-2 py-1 text-xs disabled:opacity-40">${t('finishTurn')}</button>`;
      return `<li class="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2 ${done ? 'opacity-50' : ''}"><span class="min-w-0 text-sm">${escapeHtml(person.name)}${done ? ` · ${t('turnUsed')}` : ''}</span><span class="flex shrink-0 flex-wrap gap-1">${controls}</span></li>`;
    }).join('') || `<li class="text-sm text-neutral-500">${t('notJoined')}</li>`;
    root.querySelector(`#round-status-${currentRound}`).textContent = currentRound === '1' ? (round1Done ? t('roundComplete') : round === '1' ? t('roundInProgress') : t('roundUpcoming')) : (round2Done ? t('roundComplete') : round === '2' ? t('roundInProgress') : t('roundUpcoming'));
    if (activeRound !== currentRound) root.querySelector(`#host-timer-${currentRound}`).textContent = '03:00';
  }
}
export function renderDisplay(root, state, t, prompts, makeQr) {
  const {session, sessionRef} = state;
  const round = String(session.round);
  const statement = round === '1' ? session.statement1 : round === '2' ? session.statement2 : '';
  root.querySelector('#display-round').textContent = round === '1' ? t('round1') : round === '2' ? t('round2') : round === 'reflection' ? t('reflection') : '';
  root.querySelector('#display-statement').hidden = round === 'reflection' || round === 'ended';
  root.querySelector('#display-statement').textContent = statement || t('waiting');
  root.querySelector('#display-counts').hidden = !['1','2'].includes(round);
  const choices = session.choices?.[round] || {};
  root.querySelector('#display-true').textContent = Object.values(choices).filter(choice => choice?.side === 'true').length;
  root.querySelector('#display-false').textContent = Object.values(choices).filter(choice => choice?.side === 'false').length;
  const speakerName = session.timer?.speakerId ? session.participants?.[session.timer.speakerId]?.name : '';
  root.querySelector('#display-speaker').textContent = speakerName || t('noSpeakerDisplay');
  root.querySelector('#display-status').textContent = round === 'ended' ? t('ended') : `${Object.keys(session.participants || {}).length} ${t('participants')}`;
  const reflection = root.querySelector('#display-reflection');
  reflection.hidden = round !== 'reflection';
  if (round === 'reflection') reflection.innerHTML = prompts.map((prompt,index) => `<article class="rounded-xl border border-[#E2E0D8] bg-white p-5"><span class="text-sm text-neutral-400">${index+1}</span><p class="serif mt-2 text-xl">${escapeHtml(prompt)}</p></article>`).join('');
  const joinUrl = new URL(location.href); joinUrl.search = `?mode=join&session=${encodeURIComponent(sessionRef.key)}`;
  makeQr(root.querySelector('#display-qr'), joinUrl.href, 112);
}

export function renderParticipant(root, state, t) {
  const {session, memberId} = state;
  const member = session.participants?.[memberId];
  root.querySelector('#join-form').hidden = !!member;
  root.querySelector('#member-panel').hidden = !member;
  if (!member) return;
  const round = String(session.round);
  const choices = session.choices?.[round] || {};
  const choice = choices[memberId];
  const locked = round === '2' && !!choice;
  root.querySelector('#member-round').textContent = round === '1' ? t('round1') : round === '2' ? t('round2') : round === 'reflection' ? t('reflection') : t('live');
  root.querySelector('#member-statement').textContent = round === '1' ? session.statement1 : round === '2' ? session.statement2 : t('waiting');
  root.querySelector('#member-phase-note').textContent = round === '1' ? t('changeAllowed') : round === '2' ? t('lockedPosition') : t('waitRound');
  root.querySelector('#position-controls').hidden = !['1','2'].includes(round) || locked;
  root.querySelector('#my-choice').textContent = choice ? `${t('yourChoice')}: ${choice.side === 'true' ? t('true') : t('false')}` : '';
  root.querySelectorAll('[data-side]').forEach(button => {
    const selected = choice?.side === button.dataset.side;
    button.className = `rounded-lg border px-4 py-5 text-lg font-bold ${selected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'}`;
    button.disabled = !['1','2'].includes(round) || locked;
  });
  const speakerName = session.timer?.speakerId ? session.participants?.[session.timer.speakerId]?.name : '';
  root.querySelector('#member-speaker').textContent = speakerName ? `${t('speakerLabel')}: ${speakerName}` : t('noSpeakerDisplay');
}

export function renderRulesDialog(root, content, closeLabel) {
  root.querySelector('#rules-content').innerHTML = content;
  root.querySelector('#close-rules').textContent = closeLabel;
}
