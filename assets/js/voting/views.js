export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

export function memberName(roster, id) {
  const value = roster[id];
  return typeof value === 'string' ? value : value?.name || '';
}

export function createMemberMarkup(t) {
  return `<section class="space-y-5">
    <div id="session-meta" class="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500"><span id="session-label"></span><span id="session-date"></span></div>
    <div id="results" hidden class="rounded-xl bg-neutral-900 p-5 text-white"><p class="text-xs uppercase tracking-widest text-neutral-300">${t('resultsKicker')}</p><h2 id="billboard-title" class="serif text-2xl">${t('winners')}</h2><p id="billboard-member" class="mt-1 text-sm text-neutral-300"></p><div id="winner-list" class="mt-4 grid gap-3 sm:grid-cols-3"></div></div>
    <div id="identity" class="rounded-xl border border-[#E2E0D8] bg-white p-5">
      <label for="member-select" class="mb-2 block font-semibold">${t('identify')}</label>
      <input id="member-select" list="member-options" autocomplete="off" class="w-full rounded border bg-[#F7F6F2] p-3" aria-describedby="identity-note">
      <datalist id="member-options"></datalist><p id="identity-note" class="mt-2 text-sm text-neutral-500"></p>
    </div>
    <p id="voted" hidden class="rounded bg-neutral-900 p-3 text-sm text-white"></p>
    <div id="slate-heading" class="flex items-end justify-between"><h2 class="serif text-2xl">${t('slate')}</h2><span id="book-count" class="text-sm text-neutral-500"></span></div>
    <div id="books" class="space-y-3"></div>
    <p id="member-feedback" hidden class="text-sm text-neutral-700" role="status" aria-live="polite"></p>
    <dialog id="rules-dialog" class="w-[min(92vw,34rem)] rounded-xl border border-[#E2E0D8] bg-[#F7F6F2] p-0 shadow-xl"><div class="p-5"><div class="flex items-start justify-between gap-4"><h2 class="serif text-2xl">${t('rulesTitle')}</h2><button data-action="close-rules" class="rounded border px-3 py-1" aria-label="${t('close')}">×</button></div><ul class="mt-4 space-y-3 text-sm leading-6"><li>${t('ruleIdentify')}</li><li>${t('ruleSelect')}</li><li>${t('ruleSubmit')}</li></ul></div></dialog>
  </section>`;
}

export function createAdminMarkup(t) {
  return `<section id="admin" class="overflow-hidden rounded-xl border border-l-4 border-[#E2E0D8] border-l-[#71363C] bg-white shadow-sm">
    <div class="p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="serif text-2xl">${t('adminDashboard')}</h2><p class="mt-1 text-sm text-neutral-500">${t('adminIntro')}</p></div><span id="admin-status" class="rounded-full border px-3 py-1.5 text-sm"></span></div>
      <nav class="mt-5 flex gap-2 overflow-x-auto" aria-label="Admin dashboard"><button data-action="admin-tab" data-tab="overview" class="admin-tab rounded px-4 py-2.5 text-sm font-semibold">${t('adminOverview')}</button><button data-action="admin-tab" data-tab="books" class="admin-tab rounded px-4 py-2.5 text-sm font-semibold">${t('votingSettings')}</button><button data-action="admin-tab" data-tab="members" class="admin-tab rounded px-4 py-2.5 text-sm font-semibold">${t('adminMembers')}</button><button data-action="admin-tab" data-tab="settings" class="admin-tab rounded px-4 py-2.5 text-sm font-semibold">${t('settings')}</button><button data-action="admin-tab" data-tab="advanced" class="admin-tab rounded px-4 py-2.5 text-sm font-semibold">${t('adminAdvanced')}</button></nav>
    </div><div class="border-t border-neutral-200 p-5">
      <section id="admin-overview" class="space-y-4"><div class="rounded-lg bg-[#F7F6F2] p-4"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${t('ballotSummary')}</p><p id="audit-summary" class="mt-1 text-lg font-semibold"></p></div><div class="grid gap-3 sm:grid-cols-2"><button data-action="toggle-lock" id="lock-btn" class="rounded-lg bg-neutral-900 px-4 py-4 text-left text-sm font-semibold text-white"></button><button data-action="finalize" id="result-btn" class="rounded-lg border border-neutral-300 px-4 py-4 text-left text-sm font-semibold hover:border-[#71363C]"></button></div><button data-action="draw-wildcard" id="draw-btn" hidden class="w-full rounded-lg bg-[#71363C] px-4 py-4 text-left text-sm font-semibold text-white">${t('playDraw')}</button><p id="draw-status" class="text-center text-sm text-neutral-600" aria-live="polite"></p><div id="admin-results" hidden class="rounded-lg bg-neutral-900 p-4 text-white"><p class="text-xs uppercase tracking-widest text-neutral-300">${t('winners')}</p><div id="admin-winner-list" class="mt-3 grid gap-3 sm:grid-cols-3"></div></div><button data-action="start-next" id="next-btn" class="w-full rounded-lg border border-neutral-300 px-4 py-4 text-left text-sm font-semibold hover:border-[#71363C] disabled:cursor-not-allowed disabled:opacity-40">${t('next')}</button></section>
      <section id="admin-books" class="space-y-5" hidden><div><h3 class="serif text-xl">${t('votingSettings')}</h3><p class="mb-4 mt-1 text-sm text-neutral-500">${t('poolHint')}</p><form id="book-form" class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input id="book-title" maxlength="160" required class="min-w-0 rounded-lg border border-neutral-300 px-3 py-3" placeholder="${t('bookTitle')}"><select id="proposer" required class="rounded-lg border border-neutral-300 bg-white px-3 py-3"></select><button class="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white">${t('addPool')}</button></form><div class="grid gap-5 lg:grid-cols-2"><div class="rounded-lg border border-[#E2E0D8] bg-[#F7F6F2] p-4"><h4 class="mb-1 font-semibold">${t('allBooks')}</h4><p class="mb-3 text-xs text-neutral-500">${t('availableBooks')}</p><div id="pool-list" class="space-y-2"></div></div><div class="rounded-lg border border-[#E2E0D8] p-4"><h4 class="mb-1 font-semibold">${t('selectedBooks')}</h4><p class="mb-3 text-xs text-neutral-500">${t('booksThisSession')}</p><div id="active-slate-list" class="space-y-2"></div></div></div></div></section>
      <section id="admin-members" class="space-y-5" hidden><div><h3 class="serif text-xl">${t('roster')}</h3><form id="member-form" class="mt-3 flex gap-2"><input id="member-name" maxlength="60" required class="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-3" placeholder="${t('memberName')}"><button class="rounded-lg bg-neutral-900 px-5 text-white">${t('add')}</button></form></div><div class="grid gap-5 lg:grid-cols-2"><div class="rounded-lg border border-[#E2E0D8] bg-[#F7F6F2] p-4"><h4 class="mb-1 font-semibold">${t('availableMembers')}</h4><p class="mb-3 text-xs text-neutral-500">${t('membersHint')}</p><div id="roster-list" class="space-y-2"></div></div><div class="rounded-lg border border-[#E2E0D8] p-4"><h4 class="mb-1 font-semibold">${t('sessionAttendees')}</h4><p class="mb-3 text-xs text-neutral-500">${t('attendeesHint')}</p><div id="attendee-list" class="space-y-2"></div></div></div></section>
      <section id="admin-settings" class="space-y-4" hidden><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('historySetting')}</h3><p class="mt-1 text-sm text-neutral-500">${t('historySettingHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="history-toggle" type="checkbox" role="switch" aria-label="${t('historySetting')}" data-action="toggle-history" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="history-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div></section>
      <section id="admin-advanced" hidden><h3 class="serif text-xl">${t('audit')}</h3><p class="mb-3 mt-1 text-sm text-neutral-500">${t('auditHint')}</p><div id="audit-list" class="space-y-2"></div></section>
      <p id="feedback" hidden class="mt-4 text-sm text-neutral-600" role="status" aria-live="polite"></p>
    </div>
  </section>`;
}

export function renderIdentity(state, t) {
  const select = document.querySelector('#member-select');
  if (!select) return;
  const entries = Object.entries(state.roster).filter(([id]) => state.attendees[id] === true).sort((a, b) => memberName(state.roster, a[0]).localeCompare(memberName(state.roster, b[0])));
  document.querySelector('#member-options').innerHTML = entries.map(([id]) => `<option value="${escapeHtml(memberName(state.roster, id))}" data-member-id="${escapeHtml(id)}"></option>`).join('');
  select.disabled = entries.length === 0;
  select.placeholder = entries.length ? t('identifyPlaceholder') : t('noAttendees');
  select.value = state.memberId && state.attendees[state.memberId] ? memberName(state.roster, state.memberId) : '';
  document.querySelector('#identity-note').textContent = state.memberId ? memberName(state.roster, state.memberId) : entries.length ? t('memberRequired') : t('noAttendees');
}

export function renderBooks(state, t) {
  const target = document.querySelector('#books');
  if (!target) return;
  const active = Object.entries(state.books).filter(([, book]) => book?.active === true).map(([id, book]) => ({id, ...book})).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  document.querySelector('#book-count').textContent = String(active.length);
  if (!state.memberId || state.attendees[state.memberId] !== true) { target.innerHTML = `<p class="rounded-xl border bg-white p-8 text-center text-sm text-neutral-500">${Object.values(state.attendees).some(Boolean) ? t('chooseHint') : t('noAttendees')}</p>`; return; }
  if (!active.length) { target.innerHTML = `<p class="rounded-xl border bg-white p-8 text-center text-sm text-neutral-500">${t('emptySlate')}</p>`; return; }
  target.innerHTML = active.map(book => {
    const selected = state.draft.includes(book.id), disabled = state.settings.locked || (!selected && state.draft.length >= 3);
    return `<button data-action="toggle-book" data-book-id="${escapeHtml(book.id)}" ${disabled ? 'disabled' : ''} class="w-full rounded-xl border ${selected ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-[#E2E0D8]'} bg-white p-5 text-left ${state.settings.locked ? 'pointer-events-none opacity-50' : ''}"><span class="flex items-start justify-between gap-3"><span class="min-w-0"><b class="serif block line-clamp-2 text-xl">${escapeHtml(book.title)}</b><small class="block pt-1 text-neutral-500">${escapeHtml(book.proposer || '')}</small></span><span class="flex shrink-0 gap-1 text-xs">${book.bonusPoints ? `<span title="${t('bonusRule')}" aria-label="${t('bonusRule')}" class="rounded-full border px-2 py-1">✚ ${book.bonusPoints}</span>` : ''}${book.missedCount ? `<span title="${t('missedRule')}" aria-label="${t('missedRule')}" class="rounded-full border px-2 py-1">↻ ${book.missedCount}</span>` : ''}</span></span></button>`;
  }).join('');
}

export function renderAdmin(state, t) {
  const current = Object.fromEntries(Object.entries(state.ballots).filter(([, ballot]) => ballot?.sessionId === (state.settings.sessionId || 'initial')));
  const participants = Object.entries(state.roster).sort((a, b) => memberName(state.roster, a[0]).localeCompare(memberName(state.roster, b[0])));
  const attendees = participants.filter(([id]) => state.attendees[id] === true);
  const status = document.querySelector('#admin-status');
  if (!status) return;
  status.textContent = state.settings.locked ? t('locked') : t('open');
  status.className = `rounded-full border px-3 py-1.5 text-sm ${state.settings.locked ? 'border-[#71363C] bg-[#71363C] text-white' : 'border-neutral-300 bg-neutral-100 text-neutral-900'}`;
  const lockButton = document.querySelector('#lock-btn');
  lockButton.textContent = state.settings.locked ? t('unlock') : t('lock');
  lockButton.className = `rounded-lg px-4 py-4 text-left text-sm font-semibold text-white ${state.settings.locked ? 'bg-[#71363C]' : 'bg-neutral-900'}`;
  const currentSession = state.settings.sessionId || 'initial';
  const waitingForDraw = state.pendingResults?.sessionId === currentSession && state.pendingResults?.wildcardCandidates?.length && !state.pendingResults?.winners?.length;
  document.querySelector('#result-btn').textContent = waitingForDraw ? t('awaitDraw') : state.pendingResults?.sessionId === currentSession ? t(state.settings.showResults ? 'hide' : 'show') : t('prepareResult');
  document.querySelector('#result-btn').disabled = !!waitingForDraw;
  document.querySelector('#draw-btn').hidden = !waitingForDraw;
  const historyToggle = document.querySelector('#history-toggle');
  historyToggle.checked = state.settings.membersCanViewHistory === true;
  document.querySelector('#history-switch-state').textContent = t(historyToggle.checked ? 'switchOn' : 'switchOff');
  document.querySelector('#next-btn').disabled = !state.pendingResults?.winners?.length || state.pendingResults?.sessionId !== currentSession;
  document.querySelector('#admin-results').hidden = !state.pendingResults?.winners?.length || state.pendingResults?.sessionId !== currentSession;
  if (!document.querySelector('#admin-results').hidden) document.querySelector('#admin-winner-list').innerHTML = state.pendingResults.winners.map(book => `<article class="rounded border border-white/20 bg-white/10 p-3"><p class="text-xs text-neutral-300">${t(book.winReason)}</p><p class="serif mt-1">${escapeHtml(book.title)}</p></article>`).join('');
  document.querySelector('#audit-summary').textContent = `${attendees.filter(([id]) => current[id]).length} / ${attendees.length} ${t('participated')}`;
  const availableMembers = participants.filter(([id]) => state.attendees[id] !== true);
  document.querySelector('#roster-list').innerHTML = availableMembers.map(([id]) => `<div class="flex items-center justify-between gap-3 rounded border bg-white px-3 py-3"><span class="min-w-0">${escapeHtml(memberName(state.roster,id))}</span><span class="flex shrink-0 items-center gap-2"><button data-action="add-attendee" data-member-id="${escapeHtml(id)}" class="rounded bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">${t('addToSession')} →</button><button data-action="remove-member" data-member-id="${escapeHtml(id)}" aria-label="${t('remove')} ${escapeHtml(memberName(state.roster,id))}" class="px-1 text-xs underline">${t('remove')}</button></span></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t(participants.length ? 'emptyAvailableMembers' : 'emptyRoster')}</p>`;
  const proposer = document.querySelector('#proposer'), oldProposer = proposer.value;
  proposer.innerHTML = `<option value="">${t('choose')}</option>` + participants.map(([id]) => `<option value="${escapeHtml(id)}">${escapeHtml(memberName(state.roster, id))}</option>`).join('');
  if (state.roster[oldProposer]) proposer.value = oldProposer;
  const poolBooks = Object.entries(state.books).sort((a,b) => String(a[1]?.title).localeCompare(String(b[1]?.title)));
  const availableBooks = poolBooks.filter(([,book]) => book?.active !== true);
  document.querySelector('#pool-list').innerHTML = availableBooks.map(([id,book]) => `<div class="flex items-center justify-between gap-3 rounded border bg-white px-3 py-3"><span class="min-w-0"><b class="serif block">${escapeHtml(book.title)}</b><small class="text-neutral-500">${escapeHtml(book.proposer || '')}</small></span><span class="flex shrink-0 items-center gap-2"><button data-action="add-book-to-slate" data-book-id="${escapeHtml(id)}" class="rounded bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">${t('addToSlate')} →</button><button data-action="remove-book" data-book-id="${escapeHtml(id)}" class="px-1 text-xs underline">${t('remove')}</button></span></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t(poolBooks.length ? 'emptyAvailableBooks' : 'emptyPool')}</p>`;
  document.querySelector('#active-slate-list').innerHTML = poolBooks.filter(([,book]) => book?.active === true).map(([id,book]) => `<div class="flex items-center justify-between gap-3 rounded border border-neutral-900 bg-white px-3 py-3"><span class="min-w-0"><b class="serif block">${escapeHtml(book.title)}</b><small class="text-neutral-500">${escapeHtml(book.proposer || '')}</small></span><button data-action="remove-book-from-slate" data-book-id="${escapeHtml(id)}" class="shrink-0 rounded border px-3 py-2 text-xs">← ${t('removeFromSlate')}</button></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('emptySlate')}</p>`;
  document.querySelector('#attendee-list').innerHTML = attendees.map(([id]) => `<div class="flex items-center justify-between gap-3 rounded border border-neutral-900 bg-white px-3 py-3"><span class="min-w-0">${escapeHtml(memberName(state.roster,id))}</span><span class="flex shrink-0 items-center gap-2"><button data-action="remove-attendee" data-member-id="${escapeHtml(id)}" class="rounded border px-3 py-2 text-xs">← ${t('removeFromSession')}</button><button data-action="remove-member" data-member-id="${escapeHtml(id)}" aria-label="${t('remove')} ${escapeHtml(memberName(state.roster,id))}" class="px-1 text-xs underline">×</button></span></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('emptyAttendees')}</p>`;
  document.querySelector('#audit-list').innerHTML = attendees.map(([id]) => {
    const ballot = current[id], deviceCount = ballot?.clientIds?.length || 0;
    return `<p class="flex justify-between gap-2 border px-3 py-2 text-sm"><span>${escapeHtml(memberName(state.roster, id))}</span><span>${ballot ? t('voted') : t('notVoted')}${deviceCount > 1 ? ` · <b>${t('dupe')} (${deviceCount} ${t('devices')})</b>` : ''}</span></p>`;
  }).join('');
}

export function renderResults(state, t, closed = false) {
  const target = document.querySelector('#results');
  if (!target) return;
  const visible = closed || (state.settings.showResults === true && state.pendingResults?.winners?.length);
  target.hidden = !visible;
  if (!visible) return;
  const hasWinners = state.settings.showResults === true && state.pendingResults?.winners?.length;
  document.querySelector('#billboard-title').textContent = closed && !hasWinners ? t('closedBoard') : t('winners');
  const date = state.pendingResults?.drawnAt ? `${t('drawn')} ${formatDate(state.pendingResults.drawnAt,state.language)}` : formatDate(state.pendingResults?.sessionDate || state.settings.sessionDate,state.language);
  document.querySelector('#billboard-member').textContent = [state.memberId ? `${t('member')}: ${memberName(state.roster,state.memberId)}` : '',`${t('session')} ${state.pendingResults?.sessionNumber || state.settings.sessionNumber || 1}`,date].filter(Boolean).join(' · ');
  document.querySelector('#winner-list').innerHTML = hasWinners ? state.pendingResults.winners.map(book => `<article class="rounded border border-white/20 bg-white/10 p-4"><p class="text-xs uppercase text-neutral-300">${t(book.winReason)}</p><h3 class="serif mt-2 text-lg">${escapeHtml(book.title)}</h3><p class="text-sm text-neutral-300">${escapeHtml(book.proposer || '')}</p></article>`).join('') : `<p class="rounded border border-white/20 p-4 text-sm text-neutral-200">${t('waitingResults')}</p>`;
}

function formatDate(value, language) {
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB',{dateStyle:'long'}).format(date);
}

export function renderHistory(state, t) {
  const entries = Object.values(state.history).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  document.querySelector('#history-list').innerHTML = entries.length ? entries.map((session, index) => `<article class="rounded-xl border border-[#E2E0D8] bg-white p-5"><div class="mb-4 flex justify-between border-b pb-3"><b>${t('session')} · ${escapeHtml(session.date || '')}</b><span>${entries.length - index}</span></div><div class="grid gap-3 sm:grid-cols-3">${(session.winners || []).map(book => `<div class="rounded bg-[#F7F6F2] p-4"><p class="text-xs uppercase text-neutral-500">${t(book.winReason)}</p><p class="serif mt-2 text-lg">${escapeHtml(book.title)}</p><p class="text-sm text-neutral-500">${escapeHtml(book.proposer || '')}</p></div>`).join('')}</div></article>`).join('') : `<p class="rounded border bg-white p-8 text-center text-neutral-500">${t('noHistory')}</p>`;
}
