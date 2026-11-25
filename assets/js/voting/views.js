import { MEMBER_SECURITY_QUESTIONS } from '../shared/member-security.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

export function memberName(roster, id) {
  const value = roster[id];
  return typeof value === 'string' ? value : value?.name || '';
}

export function isVotingClosed(state) {
  const sessionId = state.settings.sessionId || 'initial';
  return state.settings.locked === true || state.settings.votingOpen === false || state.pendingResults?.sessionId === sessionId;
}

export function isWildcardDrawPending(state) {
  const pending = state.pendingResults;
  const sessionId = state.settings.sessionId || 'initial';
  const winnerTarget = Number(pending?.maxTopBooks || state.settings.maxTopBooks || 3);
  return pending?.sessionId === sessionId && pending?.wildcardCandidates?.length > 0 && (pending.winners?.length || 0) < winnerTarget;
}

function isDrawClaimActive(pending) {
  const startedAt = Number(pending?.drawClaim?.startedAt);
  return startedAt > 0 && Date.now() - startedAt < 30000;
}

export function createMemberMarkup(t) {
  return `<section id="member-vote-view" class="space-y-5">
    <div id="session-meta" class="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500"><span id="session-label"></span><span id="session-date"></span></div>
    <div class="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-4">
      <div id="identity" class="min-w-0 rounded-xl border border-[#E2E0D8] bg-white p-3 sm:p-4"><label id="member-select-label" for="member-select" class="mb-2 block text-sm font-semibold">${t('identify')}</label><input id="member-select" list="member-options" autocomplete="off" class="w-full min-w-0 rounded border bg-[#F7F6F2] px-2.5 py-2.5 text-sm sm:px-3" placeholder="${t('identifyPlaceholder')}"><datalist id="member-options"></datalist><p id="member-welcome" hidden class="mt-3 rounded-lg bg-[#F7F6F2] px-3 py-2 text-sm text-neutral-700"></p></div>
      <aside class="min-w-0 rounded-xl border border-[#E2E0D8] bg-white p-3 sm:p-4"><div class="flex items-center justify-between gap-2"><h2 class="serif text-base sm:text-lg">${t('memberBallot')}</h2><span id="member-selection-count" class="shrink-0 rounded-full border px-2 py-1 text-xs tabular-nums">0 / 3</span></div><ul id="member-selection-list" class="mt-2 grid gap-2 text-sm text-neutral-700"></ul><p id="member-selection-empty" class="mt-2 text-xs text-neutral-500">${t('selectNameForSummary')}</p></aside>
    </div>
    <div id="slate-heading" class="flex items-end justify-between"><h2 class="serif text-2xl">${t('slate')}</h2><span id="book-count" class="text-sm text-neutral-500"></span></div>
    <div id="books" class="space-y-3"></div>
    <p id="member-feedback" hidden class="text-sm text-neutral-700" role="status" aria-live="polite"></p>
    <dialog id="rules-dialog" class="w-[min(92vw,34rem)] rounded-xl border border-[#E2E0D8] bg-[#F7F6F2] p-0 shadow-xl"><div class="p-5"><div class="flex items-start justify-between gap-4"><h2 class="serif text-2xl">${t('rulesTitle')}</h2><button data-action="close-rules" class="rounded border px-3 py-1" aria-label="${t('close')}">×</button></div><ul class="mt-4 space-y-3 text-sm leading-6"><li>${t('ruleIdentify')}</li><li>${t('ruleSelect')}</li><li>${t('ruleSubmit')}</li><li>${t('ruleBonus')}</li><li>${t('rulePriority')}</li></ul></div></dialog>
  </section>
  <section id="results" hidden class="rounded-xl bg-neutral-900 p-5 text-white"><p class="text-xs uppercase tracking-widest text-neutral-300">${t('resultsKicker')}</p><h2 id="billboard-title" class="serif text-2xl">${t('winners')}</h2><p id="billboard-member" class="mt-1 text-sm text-neutral-300"></p><div class="mt-4 grid grid-cols-3 auto-rows-[11rem] gap-3"><div id="winner-list" class="contents"></div><section id="member-wildcard" hidden class="flex min-h-0 flex-col rounded border border-white/20 bg-white/10 p-3"><p class="text-xs uppercase text-neutral-300">${t('wildcardDraw')}</p><p id="member-draw-status" class="mt-1 text-xs text-neutral-300" aria-live="polite"></p><h3 id="member-draw-current" class="serif min-h-0 flex-1 overflow-y-auto break-words text-left text-lg" aria-live="polite"></h3><p id="member-draw-meta" class="mt-2 text-right text-xs text-neutral-300"></p></section></div><div id="other-options-section" class="mt-5 border-t border-white/20 pt-4"><h3 class="text-sm font-semibold">${t('otherOptions')}</h3><ul id="other-options-list" class="mt-2 space-y-2 text-sm text-neutral-200"></ul></div></section>`;
}

export function createAdminMarkup(t, appTitle = t('title')) {
  return `<section id="admin" class="overflow-hidden rounded-xl border border-l-4 border-[#E2E0D8] border-l-[#71363C] bg-white shadow-sm">
    <div class="p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="serif text-2xl">${t('adminDashboard')}</h2><p class="mt-1 text-sm text-neutral-500">${t('adminIntro')}</p></div><div class="flex items-center gap-2"><button data-action="open-admin-flow" aria-label="${t('adminFlowTitle')}" title="${t('adminFlowTitle')}" class="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 text-sm font-semibold text-neutral-700" type="button">i</button><span id="admin-status" class="rounded-full border px-3 py-1.5 text-sm"></span></div></div>
      <nav class="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Admin dashboard"><button data-action="admin-tab" data-tab="overview" class="admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold">${t('adminOverview')}</button><button data-action="admin-tab" data-tab="books" class="admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold"><span class="mr-2 inline-grid h-5 w-5 place-items-center rounded-full border border-current text-[10px]">1</span>${t('votingSettings')}</button><button data-action="admin-tab" data-tab="members" class="admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold">${t('manageUsers')}</button><button data-action="admin-tab" data-tab="settings" class="admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold">${t('settings')}</button><button data-action="admin-tab" data-tab="audit" class="admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold">${t('auditTab')}</button></nav>
    </div><div class="border-t border-neutral-200 p-5">
      <section id="admin-overview" class="space-y-4"><div class="rounded-lg bg-[#F7F6F2] p-4"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${t('ballotSummary')}</p><p id="audit-summary" class="mt-1 text-lg font-semibold"></p></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="mb-2 flex items-center justify-between gap-3"><p class="text-sm font-semibold">${t('voteProgress')}</p><p id="vote-progress-label" class="text-sm tabular-nums text-neutral-600"></p></div><div id="vote-progress" role="progressbar" aria-label="${t('voteProgress')}" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" class="h-2.5 overflow-hidden rounded-full bg-neutral-200"><div id="vote-progress-bar" class="h-full rounded-full bg-[#71363C] transition-[width] duration-300" style="width:0%"></div></div></div><div class="grid gap-3 sm:grid-cols-3"><button data-action="toggle-lock" id="lock-btn" class="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-4 text-left text-sm font-semibold text-white"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/50">4</span><span id="lock-label"></span></button><button data-action="finalize" id="result-btn" class="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-4 text-left text-sm font-semibold hover:border-[#71363C] disabled:cursor-not-allowed disabled:opacity-40"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-neutral-400">5</span><span id="result-label"></span></button><button data-action="start-next" id="next-btn" class="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-4 text-left text-sm font-semibold hover:border-[#71363C] disabled:cursor-not-allowed disabled:opacity-40"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-neutral-400">7</span>${t('next')}</button></div><section id="admin-live-score" hidden class="rounded-lg border border-[#E2E0D8] bg-[#F7F6F2] p-4"><h3 class="text-sm font-semibold">${t('liveScoreTitle')}</h3><div id="admin-live-score-list" class="mt-3 space-y-2" aria-live="polite"></div></section><div id="admin-results" hidden class="rounded-lg bg-neutral-900 p-4 text-white"><p class="text-xs uppercase tracking-widest text-neutral-300">${t('winners')}</p><div class="mt-3 grid grid-cols-3 auto-rows-[11rem] gap-3"><div id="admin-winner-list" class="contents"></div><section id="wildcard-card" class="flex h-full min-h-0 flex-col rounded border border-white/20 bg-white/10 p-3"><div class="min-h-0 flex-1 overflow-hidden"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-300">${t('wildcardDraw')}</p><p id="draw-status" class="mt-1 text-sm text-neutral-300" aria-live="polite">${t('drawWaiting')}</p><p id="draw-current" class="serif mt-2 max-h-12 overflow-y-auto break-words text-lg" aria-live="polite"></p><p id="draw-meta" class="mt-1 text-right text-xs text-neutral-300"></p></div><button data-action="draw-wildcard" id="draw-btn" disabled class="mt-2 flex w-full items-center justify-center gap-2 rounded bg-[#71363C] px-2 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><span class="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/60">6</span><span>${t('playDraw')}</span></button></section></div><div id="admin-other-options-section" class="mt-5 border-t border-white/20 pt-4"><h3 class="text-sm font-semibold">${t('otherOptions')}</h3><ul id="admin-other-options-list" class="mt-2 space-y-2 text-sm text-neutral-200"></ul></div></div></section>
      <section id="admin-books" class="space-y-5" hidden><div><h3 class="serif text-xl">${t('votingSettings')}</h3><p class="mb-4 mt-1 text-sm text-neutral-500">${t('poolHint')}</p><form id="book-form" class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input id="book-title" maxlength="160" required class="min-w-0 rounded-lg border border-neutral-300 px-3 py-3" placeholder="${t('bookTitle')}"><select id="proposer" required class="rounded-lg border border-neutral-300 bg-white px-3 py-3"></select><button class="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white">${t('addPool')}</button></form><section class="space-y-4 rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-neutral-900 text-sm font-semibold">2</span><div><h4 class="font-semibold">${t('poolAndSlate')}</h4><p class="mt-1 text-xs text-neutral-500">${t('booksThisSession')}</p></div></div><div class="grid gap-5 lg:grid-cols-2"><div class="rounded-lg border border-[#E2E0D8] bg-[#F7F6F2] p-4"><h4 class="mb-1 font-semibold">${t('allBooks')}</h4><p class="mb-3 text-xs text-neutral-500">${t('availableBooks')}</p><div id="pool-list" class="space-y-2"></div></div><div class="rounded-lg border border-[#E2E0D8] p-4"><h4 class="mb-1 font-semibold">${t('selectedBooks')}</h4><p class="mb-3 text-xs text-neutral-500">${t('booksThisSession')}</p><div id="active-slate-list" class="space-y-2"></div></div></div></section><section class="space-y-3 border-t border-neutral-200 pt-5"><div class="flex items-center gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-neutral-900 text-sm font-semibold">3</span><div><h3 class="serif text-xl">${t('roster')}</h3><p class="mt-1 text-sm text-neutral-500">${t('membersHint')}</p></div></div><div class="grid gap-5 lg:grid-cols-2"><div class="rounded-lg border border-[#E2E0D8] bg-[#F7F6F2] p-4"><h4 class="mb-1 font-semibold">${t('availableMembers')}</h4><div id="roster-list" class="space-y-2"></div></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><h4 class="mb-1 font-semibold">${t('sessionAttendees')}</h4><p class="mb-3 mt-1 text-xs text-neutral-500">${t('attendeesHint')}</p><div id="attendee-list" class="space-y-2"></div></div></div></section></div></section>
      <section id="admin-members" class="space-y-5" hidden><div><h3 class="serif text-xl">${t('manageUsers')}</h3><form id="member-form" class="space-y-3 rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex flex-col gap-2 sm:flex-row"><input id="member-name" aria-label="${t('memberName')}" maxlength="60" required class="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-3" placeholder="${t('memberName')}"><button class="rounded-lg bg-neutral-900 px-5 py-3 text-white">${t('add')}</button></div><label class="flex items-center gap-2 text-sm"><input id="member-add-security-toggle" type="checkbox" data-action="toggle-add-member-security" class="h-4 w-4 accent-[#71363C]"><span>${t('memberAddSecurityOption')}</span></label><div id="member-add-security-fields" hidden class="grid gap-2 sm:grid-cols-2"><select id="member-add-security-question" aria-label="${t('memberSecurityQuestionLabel')}" class="rounded-lg border border-neutral-300 bg-white px-3 py-3"><option value="">${t('memberSecurityChooseQuestion')}</option></select><input id="member-add-security-answer" aria-label="${t('memberSecurityAnswerLabel')}" type="password" autocomplete="off" class="rounded-lg border border-neutral-300 px-3 py-3" placeholder="${t('memberSecurityAnswerPlaceholder')}"></div></form></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><h4 class="mb-3 font-semibold">${t('memberList')}</h4><div id="user-roster-list" class="space-y-2"></div></div></section>
      <section id="admin-settings" class="space-y-4" hidden><form id="title-form" class="rounded-lg border border-[#E2E0D8] bg-white p-4"><label for="app-title-input" class="block font-semibold">${t('appTitleLabel')}</label><p class="mb-3 mt-1 text-sm text-neutral-500">${t('appTitleHint')}</p><div class="flex flex-col gap-2 sm:flex-row"><input id="app-title-input" maxlength="60" required class="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-3" value="${escapeHtml(appTitle)}" aria-label="${t('appTitleLabel')}"><button class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">${t('saveTitle')}</button></div></form><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('historySetting')}</h3><p class="mt-1 text-sm text-neutral-500">${t('historySettingHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="history-toggle" type="checkbox" role="switch" aria-label="${t('historySetting')}" data-action="toggle-history" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="history-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('memberDeletion')}</h3><p class="mt-1 text-sm text-neutral-500">${t('memberDeletionHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="member-deletion-toggle" type="checkbox" role="switch" aria-label="${t('memberDeletion')}" data-action="toggle-member-deletion" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="member-deletion-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('memberSecuritySetting')}</h3><p class="mt-1 text-sm text-neutral-500">${t('memberSecuritySettingHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="member-security-toggle" type="checkbox" role="switch" aria-label="${t('memberSecuritySetting')}" data-action="toggle-member-security" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="member-security-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div></section>
      <section id="admin-audit" hidden><h3 class="serif text-xl">${t('audit')}</h3><p class="mb-3 mt-1 text-sm text-neutral-500">${t('auditHint')}</p><div id="audit-list" class="space-y-2"></div></section>
      <dialog id="admin-flow-dialog" class="w-[min(92vw,32rem)] rounded-xl border border-[#E2E0D8] bg-[#F7F6F2] p-0 shadow-xl"><div class="p-5"><div class="flex items-start justify-between gap-3"><h3 class="serif text-2xl">${t('adminFlowTitle')}</h3><button data-action="close-admin-flow" type="button" class="rounded border px-3 py-1" aria-label="${t('close')}">×</button></div><ol class="mt-4 list-inside list-decimal space-y-2 text-sm leading-6"><li>${t('adminFlowBooks')}</li><li>${t('adminFlowSelectBooks')}</li><li>${t('adminFlowMembers')}</li><li>${t('adminFlowClose')}</li><li>${t('adminFlowPrepare')}</li><li>${t('adminFlowDraw')}</li><li>${t('adminFlowNext')}</li></ol></div></dialog><p id="feedback" hidden class="mt-4 text-sm text-neutral-600" role="status" aria-live="polite"></p>
    </div>
  </section>`;
}

export function createAdminSessionInfoMarkup(t) {
  return `<div class="grid gap-3 rounded-lg border border-[#E2E0D8] bg-white p-4 sm:grid-cols-3"><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${t('currentSession')}</p><p id="admin-session-name" class="mt-1 break-words font-semibold"></p></div><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${t('sessionId')}</p><p id="admin-session-id" class="mt-1 break-all font-mono text-xs text-neutral-700"></p></div><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${t('sessionCreated')}</p><p id="admin-session-date" class="mt-1 text-sm font-semibold"></p></div></div>`;
}

export function createAdminOptionSettingsMarkup(t) {
  return `<div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><label for="max-top-books" class="block font-semibold">${t('maxTopBooks')}</label><p class="mt-1 text-sm text-neutral-500">${t('maxTopBooksHint')}</p><select id="max-top-books" class="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 sm:max-w-xs"><option value="3">${t('topCount').replace('{count}','3')}</option><option value="4">${t('topCount').replace('{count}','4')}</option><option value="5">${t('topCount').replace('{count}','5')}</option></select></div><div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('bookDeletion')}</h3><p class="mt-1 text-sm text-neutral-500">${t('bookDeletionHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="book-deletion-toggle" type="checkbox" role="switch" aria-label="${t('bookDeletion')}" data-action="toggle-book-deletion" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="book-deletion-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div>`;
}

export function createAdminBallotRuleMarkup(t) {
  return `<div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('requireFullBallot')}</h3><p class="mt-1 text-sm text-neutral-500">${t('requireFullBallotHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="full-ballot-toggle" type="checkbox" role="switch" aria-label="${t('requireFullBallot')}" data-action="toggle-full-ballot" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="full-ballot-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div>`;
}

export function createAdminVoteVisibilityMarkup(t) {
  return `<div class="rounded-lg border border-[#E2E0D8] bg-white p-4"><div class="flex items-center justify-between gap-4"><div><h3 class="font-semibold">${t('memberVoteCounts')}</h3><p class="mt-1 text-sm text-neutral-500">${t('memberVoteCountsHint')}</p></div><div class="flex items-center gap-2"><label class="relative inline-flex cursor-pointer items-center"><input id="vote-counts-toggle" type="checkbox" role="switch" aria-label="${t('memberVoteCounts')}" data-action="toggle-vote-counts" class="peer sr-only"><span class="h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#71363C] peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2"></span><span class="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span></label><span id="vote-counts-switch-state" class="min-w-7 text-xs font-semibold text-neutral-600"></span></div></div></div>`;
}

export function renderIdentity(state, t) {
  const select = document.querySelector('#member-select');
  if (!select) return;
  const entries = Object.entries(state.roster).filter(([id]) => state.attendees[id] === true).sort((a, b) => memberName(state.roster, a[0]).localeCompare(memberName(state.roster, b[0])));
  document.querySelector('#member-options').innerHTML = entries.map(([id]) => `<option value="${escapeHtml(memberName(state.roster, id))}" data-member-id="${escapeHtml(id)}"></option>`).join('');
  const isLobbyMember = !!state.memberId && state.memberId === state.lobbyMemberId && !!state.roster[state.memberId];
  const isAttending = state.attendees[state.memberId] === true;
  select.hidden = isLobbyMember;
  document.querySelector('#member-select-label').hidden = isLobbyMember;
  select.disabled = entries.length === 0 || isLobbyMember;
  select.placeholder = entries.length ? t('identifyPlaceholder') : t('noAttendees');
  select.value = state.memberId && isAttending ? memberName(state.roster, state.memberId) : '';
  const welcome = document.querySelector('#member-welcome');
  welcome.hidden = !state.memberId || (!isAttending && !isLobbyMember);
  welcome.textContent = welcome.hidden ? '' : isLobbyMember && !isAttending ? t('notAddedToVoting').replace('{name}',memberName(state.roster,state.memberId)) : t('welcomeMember').replace('{name}',memberName(state.roster,state.memberId));
  const sessionId = state.settings.sessionId || 'initial';
  const savedBooks = state.memberId && state.ballots[state.memberId]?.sessionId === sessionId ? state.ballots[state.memberId].books || [] : [];
  const chosenBooks = savedBooks.map(id => state.books[id]).filter(Boolean);
  document.querySelector('#member-selection-count').textContent = `${chosenBooks.length} / 3`;
  document.querySelector('#member-selection-list').innerHTML = chosenBooks.map(book => `<li class="min-w-0 rounded-lg border border-neutral-900 bg-white px-3 py-2 text-neutral-900"><span class="block break-words font-medium">${escapeHtml(book.title)}</span></li>`).join('');
  document.querySelector('#member-selection-empty').hidden = chosenBooks.length > 0;
  document.querySelector('#member-selection-empty').textContent = state.memberId ? t('noBooksSelected') : entries.length ? t('selectNameForSummary') : t('noAttendees');
}

export function renderBooks(state, t) {
  const target = document.querySelector('#books');
  if (!target) return;
  const active = Object.entries(state.books).filter(([, book]) => book?.active === true).map(([id, book]) => ({id, ...book})).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  document.querySelector('#book-count').textContent = String(active.length);
  if (!state.memberId || state.attendees[state.memberId] !== true) { const message = state.memberId === state.lobbyMemberId && state.roster[state.memberId] ? t('notAddedToVoting').replace('{name}',memberName(state.roster,state.memberId)) : Object.values(state.attendees).some(Boolean) ? t('chooseHint') : t('noAttendees'); target.innerHTML = `<p class="rounded-xl border bg-white p-8 text-center text-sm text-neutral-500">${escapeHtml(message)}</p>`; return; }
  if (!active.length) { target.innerHTML = `<p class="rounded-xl border bg-white p-8 text-center text-sm text-neutral-500">${t('emptySlate')}</p>`; return; }
  const closed = isVotingClosed(state);
  const selectionLimitReached = state.draft.length >= 3;
  target.className = 'grid grid-cols-2 auto-rows-[11rem] gap-3';
  target.innerHTML = active.map(book => {
    const selected = state.draft.includes(book.id), limitDisabled = !selected && selectionLimitReached, disabled = closed || limitDisabled;
    const priority = Number(book.missedCount) >= 2;
    const notSelectedLastSession = book.lastStatus === 'carried' && Number(book.lastSessionNumber) === Number(state.settings.sessionNumber || 1) - 1;
    const bonusPoints = Math.max(0, Number(book.bonusPoints) || 0);
    const missedCount = Math.max(0, Number(book.missedCount) || 0);
    const badges = `<span title="${t('bonusRule')}" aria-label="${t('bonusRule')}: +${bonusPoints}" class="inline-flex items-center gap-1 rounded-full border border-[#E2E0D8] bg-[#F7F6F2] px-1 py-0.5"><span aria-hidden="true" class="font-bold">＋</span><span>${bonusPoints}</span></span><span title="${t(priority ? 'priorityRule' : 'missedRule')}" aria-label="${t(priority ? 'priorityRule' : 'missedRule')}: ${missedCount}" class="inline-flex items-center gap-1 rounded-full border border-[#E2E0D8] bg-[#F7F6F2] px-1 py-0.5 ${priority ? 'font-semibold text-neutral-950' : 'text-neutral-600'}"><span aria-hidden="true">↻</span><span>${missedCount}</span></span>${notSelectedLastSession ? `<span title="${t('notSelectedLastSession')}" aria-label="${t('notSelectedLastSession')}" class="rounded-full border border-[#E2E0D8] bg-[#F7F6F2] px-1 py-0.5">↪</span>` : ''}`;
    return `<button data-action="toggle-book" data-book-id="${escapeHtml(book.id)}" ${disabled ? 'disabled' : ''} class="h-full min-w-0 rounded-xl border ${selected ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-[#E2E0D8]'} bg-white p-3 text-left ${closed ? 'pointer-events-none opacity-50' : limitDisabled ? 'cursor-not-allowed opacity-40' : ''}"><span class="flex h-full min-w-0 flex-col"><b class="serif min-h-0 flex-1 overflow-y-auto break-words text-left text-base leading-5 sm:text-lg">${escapeHtml(book.title)}</b><span class="mt-2 flex min-w-0 shrink-0 items-center justify-between gap-1"><span class="flex shrink-0 items-center gap-1 text-[11px]">${badges}</span><small class="min-w-0 max-w-[35%] truncate text-right text-xs text-neutral-500">${escapeHtml(book.proposer || '')}</small></span></span></button>`;
  }).join('');
}

export function renderAdmin(state, t) {
  const current = Object.fromEntries(Object.entries(state.ballots).filter(([, ballot]) => ballot?.sessionId === (state.settings.sessionId || 'initial')));
  const participants = Object.entries(state.roster).sort((a, b) => memberName(state.roster, a[0]).localeCompare(memberName(state.roster, b[0])));
  const attendees = participants.filter(([id]) => state.attendees[id] === true);
  const currentSession = state.settings.sessionId || 'initial';
  const sessionHasPendingResults = state.pendingResults?.sessionId === currentSession;
  const ballotsOverDeviceLimit = Object.entries(current).filter(([,ballot]) => Array.isArray(ballot?.clientIds) && ballot.clientIds.length > 2);
  const status = document.querySelector('#admin-status');
  if (!status) return;
  const closed = isVotingClosed(state);
  const maxTopBooks = Number([3,4,5].includes(Number(state.settings.maxTopBooks)) ? state.settings.maxTopBooks : 3);
  status.textContent = closed ? t('locked') : t('open');
  status.className = `rounded-full border px-3 py-1.5 text-sm ${closed ? 'border-[#71363C] bg-[#71363C] text-white' : 'border-neutral-300 bg-neutral-100 text-neutral-900'}`;
  const lockButton = document.querySelector('#lock-btn');
  document.querySelector('#lock-label').textContent = sessionHasPendingResults ? t('locked') : state.settings.locked === true ? t('unlock') : ballotsOverDeviceLimit.length ? t('clearDuplicatesFirst') : t('lock');
  lockButton.disabled = sessionHasPendingResults || state.lockInProgress === true || (state.settings.locked !== true && ballotsOverDeviceLimit.length > 0);
  lockButton.className = `flex items-center gap-2 rounded-lg px-4 py-4 text-left text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${closed ? 'bg-[#71363C]' : 'bg-neutral-900'}`;
  const waitingForDraw = isWildcardDrawPending(state);
  document.querySelector('#result-label').textContent = waitingForDraw ? t('awaitDraw') : sessionHasPendingResults && state.settings.archivedSessionId !== currentSession ? t('finishResults') : sessionHasPendingResults ? t(state.settings.showResults ? 'hide' : 'show') : t('prepareResult');
  document.querySelector('#result-btn').disabled = !!waitingForDraw || state.settings.locked !== true;
  document.querySelector('#draw-btn').disabled = !waitingForDraw || state.drawInProgress === true || isDrawClaimActive(state.pendingResults);
  const historyToggle = document.querySelector('#history-toggle');
  historyToggle.checked = state.settings.membersCanViewHistory === true;
  document.querySelector('#history-switch-state').textContent = t(historyToggle.checked ? 'switchOn' : 'switchOff');
  const deletionToggle = document.querySelector('#member-deletion-toggle');
  deletionToggle.checked = state.settings.memberDeletionEnabled === true;
  document.querySelector('#member-deletion-switch-state').textContent = t(deletionToggle.checked ? 'switchOn' : 'switchOff');
  const securityToggle = document.querySelector('#member-security-toggle');
  securityToggle.checked = state.settings.requireMemberSecurityQuestion === true;
  document.querySelector('#member-security-switch-state').textContent = t(securityToggle.checked ? 'switchOn' : 'switchOff');
  const titleInput = document.querySelector('#app-title-input');
  if (document.activeElement !== titleInput) titleInput.value = String(state.settings.appTitle || '').trim() || t('title');
  const maxTopSelect = document.querySelector('#max-top-books');
  if (document.activeElement !== maxTopSelect) maxTopSelect.value = String([3,4,5].includes(Number(state.settings.maxTopBooks)) ? Number(state.settings.maxTopBooks) : 3);
  const bookDeletionToggle = document.querySelector('#book-deletion-toggle');
  bookDeletionToggle.checked = state.settings.bookDeletionEnabled === true;
  document.querySelector('#book-deletion-switch-state').textContent = t(bookDeletionToggle.checked ? 'switchOn' : 'switchOff');
  const fullBallotToggle = document.querySelector('#full-ballot-toggle');
  fullBallotToggle.checked = state.settings.requireFullBallot === true;
  document.querySelector('#full-ballot-switch-state').textContent = t(fullBallotToggle.checked ? 'switchOn' : 'switchOff');
  const voteCountsToggle = document.querySelector('#vote-counts-toggle');
  voteCountsToggle.checked = state.settings.memberVoteCountsVisible === true;
  document.querySelector('#vote-counts-switch-state').textContent = t(voteCountsToggle.checked ? 'switchOn' : 'switchOff');
  document.querySelector('#admin-session-name').textContent = String(state.settings.sessionName || `${t('session')} ${state.settings.sessionNumber || 1}`);
  document.querySelector('#admin-session-id').textContent = String(state.settings.sessionId || '—');
  document.querySelector('#admin-session-date').textContent = formatDate(state.settings.sessionDate || Date.now(),state.language);
  document.querySelector('#next-btn').disabled = state.settings.archivedSessionId !== currentSession;
  document.querySelector('#admin-results').hidden = !state.pendingResults?.winners?.length || state.pendingResults?.sessionId !== currentSession;
  if (!document.querySelector('#admin-results').hidden) {
    document.querySelector('#admin-winner-list').innerHTML = state.pendingResults.winners.filter(book => book.winReason !== 'wild').map(book => winnerCard(book,t)).join('');
    renderOtherOptions('admin-other-options-section','admin-other-options-list',state.pendingResults.sessionSelections || [],state.pendingResults.winners,t);
  }
  const entered = attendees.filter(([id]) => state.presence[id]?.sessionId === currentSession).length;
  const voted = attendees.filter(([id]) => current[id]).length;
  const progress = document.querySelector('#vote-progress');
  document.querySelector('#audit-summary').textContent = `${entered} / ${attendees.length}`;
  document.querySelector('#vote-progress-label').textContent = `${voted} / ${attendees.length}`;
  progress.setAttribute('aria-valuemax',String(attendees.length));
  progress.setAttribute('aria-valuenow',String(voted));
  progress.setAttribute('aria-valuetext',`${voted} / ${attendees.length}`);
  document.querySelector('#vote-progress-bar').style.width = `${attendees.length ? Math.round(voted / attendees.length * 100) : 0}%`;
  const liveScoreSection = document.querySelector('#admin-live-score');
  liveScoreSection.hidden = closed;
  const liveScores = {};
  Object.values(current).forEach(ballot => (ballot.books || []).forEach(bookId => liveScores[bookId] = (liveScores[bookId] || 0) + 1));
  const liveOptions = Object.entries(state.books).filter(([,book]) => book?.active === true).map(([id,book]) => ({title:book.title, points:liveScores[id] || 0})).sort((a,b) => b.points - a.points || String(a.title).localeCompare(String(b.title)));
  document.querySelector('#admin-live-score-list').innerHTML = liveOptions.map(book => `<div class="flex items-center justify-between gap-3 rounded border border-[#E2E0D8] bg-white px-3 py-2"><span class="min-w-0 break-words">${escapeHtml(book.title)}</span><b class="shrink-0 tabular-nums">${book.points} ${t('points')}</b></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('noLiveScoreOptions')}</p>`;
  ['roster-list','attendee-list','pool-list','active-slate-list'].forEach(id => {
    const list = document.querySelector(`#${id}`);
    list.className = 'h-80 space-y-2 overflow-y-auto overscroll-contain pr-1';
  });
  const availableMembers = participants.filter(([id]) => state.attendees[id] !== true);
  document.querySelector('#roster-list').innerHTML = availableMembers.map(([id]) => `<div class="flex items-center justify-between gap-3 rounded border bg-white px-3 py-3"><span class="min-w-0 break-words">${escapeHtml(memberName(state.roster,id))}</span><button data-action="add-attendee" data-member-id="${escapeHtml(id)}" class="shrink-0 rounded bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">${t('addToSession')}</button></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t(participants.length ? 'emptyAvailableMembers' : 'emptyRoster')}</p>`;
  document.querySelector('#attendee-list').innerHTML = attendees.map(([id]) => `<div class="flex items-center justify-between gap-3 rounded border border-neutral-900 bg-white px-3 py-3"><span class="min-w-0 break-words">${escapeHtml(memberName(state.roster,id))}</span><button data-action="remove-attendee" data-member-id="${escapeHtml(id)}" class="shrink-0 rounded border px-3 py-2 text-xs">${t('remove')}</button></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('emptyAttendees')}</p>`;
  const securityLanguage = state.language === 'de' ? 'de' : 'en';
  const questionOptions = MEMBER_SECURITY_QUESTIONS.map(question => `<option value="${question.id}">${escapeHtml(question[securityLanguage])}</option>`).join('');
  const addQuestion = document.querySelector('#member-add-security-question');
  if (addQuestion.dataset.language !== securityLanguage) {
    const addQuestionValue = addQuestion.value;
    addQuestion.innerHTML = `<option value="">${t('memberSecurityChooseQuestion')}</option>${questionOptions}`;
    addQuestion.value = addQuestionValue;
    addQuestion.dataset.language = securityLanguage;
  }
  const addSecurityToggle = document.querySelector('#member-add-security-toggle');
  const addSecurityForced = state.settings.requireMemberSecurityQuestion === true;
  if (addSecurityForced) addSecurityToggle.checked = true;
  addSecurityToggle.disabled = addSecurityForced;
  const addSecurityRequired = addSecurityForced || addSecurityToggle.checked;
  document.querySelector('#member-add-security-fields').hidden = !addSecurityRequired;
  addQuestion.required = addSecurityRequired;
  document.querySelector('#member-add-security-answer').required = addSecurityRequired;
  document.querySelector('#user-roster-list').innerHTML = participants.map(([id]) => {
    const saved = state.securityQuestions?.[id];
    const securityDataReady = state.loaded.securityQuestions === true;
    const savedQuestion = MEMBER_SECURITY_QUESTIONS.find(question => question.id === saved?.questionId);
    const draft = state.userEditDrafts?.[id];
    const isExpanded = state.expandedUserId === id;
    const changingSecurity = draft?.updateSecurity === true;
    const editQuestionOptions = MEMBER_SECURITY_QUESTIONS.map(question => `<option value="${question.id}" ${draft?.questionId === question.id ? 'selected' : ''}>${escapeHtml(question[securityLanguage])}</option>`).join('');
    const deleteButton = state.settings.memberDeletionEnabled === true ? `<button type="button" data-action="remove-member" data-member-id="${escapeHtml(id)}" class="rounded border border-[#71363C] px-3 py-2 text-xs font-semibold text-[#71363C]">${t('deleteMember')}</button>` : '';
    const questionStatus = securityDataReady ? savedQuestion?.[securityLanguage] || t('memberSecurityNotConfigured') : t('loading');
    return `<article class="overflow-hidden rounded-lg border border-[#E2E0D8] bg-white"><button type="button" data-action="toggle-user" data-member-id="${escapeHtml(id)}" aria-expanded="${isExpanded}" class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F7F6F2]"><span class="min-w-0"><b class="block break-words">${escapeHtml(memberName(state.roster,id))}</b><small class="mt-1 block text-neutral-500">${escapeHtml(questionStatus)}</small></span><span class="shrink-0 text-xs font-semibold text-[#71363C]">${t('editMember')} ${isExpanded ? '−' : '+'}</span></button><div ${isExpanded ? '' : 'hidden'} class="border-t border-[#E2E0D8] p-4"><form data-user-edit-form data-member-id="${escapeHtml(id)}" class="space-y-3"><label class="block text-sm font-semibold" for="user-name-${escapeHtml(id)}">${t('memberName')}</label><input id="user-name-${escapeHtml(id)}" name="memberName" data-user-edit-input data-member-id="${escapeHtml(id)}" maxlength="60" required value="${escapeHtml(draft?.name ?? memberName(state.roster,id))}" class="w-full rounded border border-neutral-300 px-3 py-2"><label class="flex items-center gap-2 text-sm"><input name="updateSecurity" data-user-edit-input data-member-id="${escapeHtml(id)}" type="checkbox" ${changingSecurity ? 'checked' : ''} class="h-4 w-4 accent-[#71363C]"><span>${t('memberSecurityChangeOption')}</span></label><div ${changingSecurity ? '' : 'hidden'} class="space-y-2"><label class="block text-xs font-medium" for="user-question-${escapeHtml(id)}">${t('memberSecurityQuestionLabel')}</label><select id="user-question-${escapeHtml(id)}" name="questionId" data-user-edit-input data-member-id="${escapeHtml(id)}" ${changingSecurity ? 'required' : ''} class="w-full rounded border border-neutral-300 bg-white p-2 text-sm"><option value="">${t('memberSecurityChooseQuestion')}</option>${editQuestionOptions}</select><label class="block text-xs font-medium" for="user-answer-${escapeHtml(id)}">${t('memberSecurityAnswerLabel')}</label><input id="user-answer-${escapeHtml(id)}" name="answer" data-user-edit-input data-member-id="${escapeHtml(id)}" type="password" autocomplete="off" ${changingSecurity ? 'required' : ''} value="${escapeHtml(draft?.answer || '')}" class="w-full rounded border border-neutral-300 p-2 text-sm" placeholder="${t('memberSecurityAnswerPlaceholder')}"></div><button class="rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">${t('saveChanges')}</button></form><div class="mt-3 flex flex-wrap gap-2"><button type="button" data-action="clear-member-security" data-member-id="${escapeHtml(id)}" ${securityDataReady && saved?.questionId ? '' : 'disabled'} class="rounded border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">${t('memberSecurityClear')}</button>${deleteButton}</div></div></article>`;
  }).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('emptyRoster')}</p>`;
  const proposer = document.querySelector('#proposer'), oldProposer = proposer.value;
  proposer.innerHTML = `<option value="">${t('choose')}</option>` + participants.map(([id]) => `<option value="${escapeHtml(id)}">${escapeHtml(memberName(state.roster, id))}</option>`).join('');
  if (state.roster[oldProposer]) proposer.value = oldProposer;
  const poolBooks = Object.entries(state.books).sort((a,b) => String(a[1]?.title).localeCompare(String(b[1]?.title)));
  const availableBooks = poolBooks.filter(([,book]) => book?.active !== true);
  document.querySelector('#pool-list').innerHTML = availableBooks.map(([id,book]) => `<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded border bg-white px-3 py-3"><span class="min-w-0 break-words"><b class="serif block break-words">${escapeHtml(book.title)}</b><small class="text-neutral-500">${escapeHtml(book.proposer || '')}</small></span><span class="flex shrink-0 flex-col items-stretch gap-2"><button data-action="add-book-to-slate" data-book-id="${escapeHtml(id)}" class="rounded bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">${t('addToSlate')}</button>${state.settings.bookDeletionEnabled === true ? `<button data-action="remove-book" data-book-id="${escapeHtml(id)}" class="px-1 text-xs font-semibold text-[#71363C] underline">${t('deleteBook')}</button>` : ''}</span></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t(poolBooks.length ? 'emptyAvailableBooks' : 'emptyPool')}</p>`;
  document.querySelector('#active-slate-list').innerHTML = poolBooks.filter(([,book]) => book?.active === true).map(([id,book]) => `<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded border border-neutral-900 bg-white px-3 py-3"><span class="min-w-0 break-words"><b class="serif block break-words">${escapeHtml(book.title)}</b><small class="text-neutral-500">${escapeHtml(book.proposer || '')}</small></span><button data-action="remove-book-from-slate" data-book-id="${escapeHtml(id)}" class="shrink-0 rounded border px-3 py-2 text-xs">${t('removeFromSlate')}</button></div>`).join('') || `<p class="rounded border border-dashed px-3 py-4 text-sm text-neutral-500">${t('emptySlate')}</p>`;
  const auditMemberIds = [...new Set([...attendees.map(([id]) => id),...Object.keys(current)])];
  document.querySelector('#audit-list').innerHTML = auditMemberIds.map(id => {
    const ballot = current[id], deviceCount = ballot?.clientIds?.length || 0;
    const name = escapeHtml(memberName(state.roster,id) || t('unknownMember'));
    const canClearBallot = !!ballot && ballot.sessionId === currentSession && !closed && !sessionHasPendingResults;
    const clearButton = canClearBallot ? `<button data-action="clear-ballot" data-member-id="${escapeHtml(id)}" aria-label="${t('clearVote')} ${name}" ${state.clearingBallotId === id ? 'disabled' : ''} class="shrink-0 rounded border border-[#71363C] px-3 py-2 text-xs font-semibold text-[#71363C] disabled:opacity-40">${t('clearVote')}</button>` : '';
    return `<div class="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-sm"><span class="min-w-0">${name}<span class="ml-2">${ballot ? t('voted') : t('notVoted')}${deviceCount > 1 ? ` · <b>${t('dupe')} (${deviceCount} ${t('devices')})</b>` : ''}</span></span>${clearButton}</div>`;
  }).join('');
}

export function renderResults(state, t) {
  const target = document.querySelector('#results');
  if (!target) return;
  const visible = state.settings.showResults === true && state.pendingResults?.sessionId === (state.settings.sessionId || 'initial') && state.pendingResults?.winners?.length;
  target.hidden = !visible;
  if (!visible) return;
  document.querySelector('#billboard-title').textContent = t('winners');
  const date = state.pendingResults?.drawnAt ? `${t('drawn')} ${formatDate(state.pendingResults.drawnAt,state.language)}` : formatDate(state.pendingResults?.sessionDate || state.settings.sessionDate,state.language);
  document.querySelector('#billboard-member').textContent = [state.memberId ? `${t('member')}: ${memberName(state.roster,state.memberId)}` : '',`${t('session')} ${state.pendingResults?.sessionNumber || state.settings.sessionNumber || 1}`,date].filter(Boolean).join(' · ');
  const showVoteCounts = state.settings.memberVoteCountsVisible === true;
  document.querySelector('#winner-list').innerHTML = state.pendingResults.winners.filter(book => book.winReason !== 'wild').map(book => winnerCard(book,t,showVoteCounts)).join('');
  renderOtherOptions('other-options-section','other-options-list',state.pendingResults.sessionSelections || [],state.pendingResults.winners,t,showVoteCounts);
}

function winnerCard(book, t, showVoteCounts = true) {
  return `<article class="flex h-full min-h-0 flex-col rounded border border-white/20 bg-white/10 p-3"><p class="shrink-0 text-left text-xs uppercase text-neutral-300">${t(book.winReason)}</p><h3 class="serif min-h-0 flex-1 overflow-y-auto break-words text-left text-lg leading-5">${escapeHtml(book.title)}</h3><div class="mt-2 shrink-0 text-right"><p class="truncate text-xs text-neutral-300">${escapeHtml(book.proposer || '')}</p>${showVoteCounts ? `<p class="mt-1 text-xs tabular-nums text-neutral-300">${t('voteCount').replace('{count}',String(Number(book.voteCount) || 0))}</p>` : ''}</div></article>`;
}

export function renderWildcardDraw(state, t) {
  const pending = state.pendingResults;
  const sameSession = pending?.sessionId === (state.settings.sessionId || 'initial');
  const candidates = sameSession ? pending.wildcardCandidates || [] : [];
  const winner = sameSession ? (pending.winners || []).find(book => book.winReason === 'wild') : null;
  const drawing = !winner && candidates.length > 0 && Number(pending.drawStartedAt) > 0;
  const now = Date.now();
  const current = winner || (drawing ? candidates[Math.floor(Math.max(0,now - Number(pending.drawStartedAt)) / 110) % candidates.length] : null);
  const completedText = winner ? `${t('drawn')}: ${formatDate(pending.drawnAt,state.language)}` : '';
  const status = winner ? completedText : drawing ? t('drawInProgress') : candidates.length ? t('drawReady') : t('drawWaiting');
  const currentTitle = current?.title || '';
  const memberMeta = current ? [current.proposer || '',state.settings.memberVoteCountsVisible === true ? t('voteCount').replace('{count}',String(Number(current.voteCount) || 0)) : ''].filter(Boolean).join(' · ') : '';
  const adminMetaText = current ? [current.proposer || '',t('voteCount').replace('{count}',String(Number(current.voteCount) || 0))].filter(Boolean).join(' · ') : '';
  const memberCard = document.querySelector('#member-wildcard');
  if (memberCard) {
    memberCard.hidden = !sameSession || (!candidates.length && !winner) || (!!winner && state.settings.showResults !== true);
    document.querySelector('#member-draw-status').textContent = status;
    document.querySelector('#member-draw-current').textContent = currentTitle;
    document.querySelector('#member-draw-meta').textContent = memberMeta;
  }
  const adminStatus = document.querySelector('#draw-status');
  const adminCard = document.querySelector('#wildcard-card');
  if (adminCard) adminCard.hidden = !sameSession || (!candidates.length && !winner);
  if (adminStatus) adminStatus.textContent = status;
  const adminCurrent = document.querySelector('#draw-current');
  if (adminCurrent) adminCurrent.textContent = currentTitle;
  const adminMeta = document.querySelector('#draw-meta');
  if (adminMeta) adminMeta.textContent = adminMetaText;
  const adminButton = document.querySelector('#draw-btn');
  if (adminButton) {adminButton.hidden = !!winner;adminButton.disabled = !isWildcardDrawPending(state) || state.drawInProgress === true || isDrawClaimActive(pending);}
}

function renderOtherOptions(sectionId, listId, selections, winners, t, showVoteCounts = true) {
  const section = document.querySelector(`#${sectionId}`);
  const list = document.querySelector(`#${listId}`);
  if (!section || !list) return;
  const winnerIds = new Set((winners || []).map(book => book.id));
  const remaining = selections.filter(book => !winnerIds.has(book.id));
  section.hidden = remaining.length === 0;
  list.innerHTML = remaining.map(book => `<li class="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2"><span class="min-w-0 break-words">${escapeHtml(book.title)}</span>${showVoteCounts ? `<span class="shrink-0 tabular-nums text-neutral-300">${t('voteCount').replace('{count}',String(Number(book.voteCount) || 0))}</span>` : ''}</li>`).join('');
}

function formatDate(value, language) {
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB',{dateStyle:'long'}).format(date);
}

export function renderHistory(state, t, showVoteCounts = false) {
  const entries = Object.values(state.history).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  document.querySelector('#history-list').innerHTML = entries.length ? entries.map((session, index) => {
    const winnerIds = new Set((session.winners || []).map(book => book.id));
    const otherBooks = (session.sessionSelections || []).filter(book => !winnerIds.has(book.id));
    return `<article class="rounded-xl border border-[#E2E0D8] bg-white p-5"><div class="mb-4 flex justify-between border-b pb-3"><b>${t('session')} · ${escapeHtml(session.date || '')}</b><span>${entries.length - index}</span></div><div class="grid gap-3 sm:grid-cols-3">${(session.winners || []).map(book => `<div class="rounded bg-[#F7F6F2] p-4"><p class="text-xs uppercase text-neutral-500">${t(book.winReason)}</p><p class="serif mt-2 text-lg">${escapeHtml(book.title)}</p><p class="text-sm text-neutral-500">${escapeHtml(book.proposer || '')}</p>${showVoteCounts ? `<p class="mt-2 text-xs text-neutral-500">${t('voteCount').replace('{count}',String(Number(book.voteCount) || 0))}</p>` : ''}</div>`).join('')}</div>${otherBooks.length ? `<div class="mt-4 border-t pt-3"><h3 class="text-sm font-semibold">${t('otherOptions')}</h3><ul class="mt-2 space-y-2 text-sm">${otherBooks.map(book => `<li class="flex justify-between gap-3 border-b pb-2"><span class="min-w-0 break-words">${escapeHtml(book.title)}</span>${showVoteCounts ? `<span class="shrink-0 tabular-nums text-neutral-500">${t('voteCount').replace('{count}',String(Number(book.voteCount) || 0))}</span>` : ''}</li>`).join('')}</ul></div>` : ''}</article>`;
  }).join('') : `<p class="rounded border bg-white p-8 text-center text-neutral-500">${t('noHistory')}</p>`;
}
