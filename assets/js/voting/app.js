import {getClientId, initializeDatabase, isAdminMode} from './config.js';
import {guardAdminPage} from '../shared/admin-auth.js';
import {getLanguage, setLanguage, translate} from './i18n.js';
import {createVotingService} from './session-service.js';
import {createAdminBallotRuleMarkup, createAdminMarkup, createAdminOptionSettingsMarkup, createAdminSessionInfoMarkup, createAdminVoteVisibilityMarkup, createMemberMarkup, isVotingClosed, isWildcardDrawPending, memberName, renderAdmin, renderBooks, renderHistory, renderIdentity, renderResults, renderWildcardDraw} from './views.js';

const database = initializeDatabase();
const service = createVotingService(database);
const isAdmin = isAdminMode();
const clientId = getClientId();
const appRoot = document.querySelector('#app');
const state = {
  language:getLanguage(),
  settings:{},books:{},roster:{},attendees:{},ballots:{},presence:{},history:{},pendingResults:null,
  memberId:sessionStorage.getItem('member_lobby_id') || sessionStorage.getItem('bookclub_member_id') || '',lobbyMemberId:sessionStorage.getItem('member_lobby_id') || '',draft:[],initialDraftLoaded:false,draftDirty:false,presenceAttemptKey:'',adminTab:'overview',
  subscriptions:[],resultInProgress:false,drawInProgress:false,lockInProgress:false,clearingBallotId:'',drawTicker:null,loaded:{},view:'vote'
};
const t = key => translate(state.language,key);

if (isAdmin) {
  appRoot.hidden = true;
  guardAdminPage(() => {appRoot.hidden = false;mount();bindEvents();subscribe();});
} else {
  mount();
  bindEvents();
  subscribe();
}

function mount() {
  document.documentElement.lang = state.language;
  document.querySelector('#home-link').href = isAdmin ? 'admin.html' : 'index.html';
  document.querySelector('#home-link').textContent = isAdmin ? 'Docologie · Book Club · Admin Dashboard' : 'Docologie · Book Club · Member Lobby';
  document.querySelector('#page-title').textContent = getAppTitle();
  updateDocumentTitle();
  document.querySelector('#counter span').textContent = t('selected');
  document.querySelector('#nav-vote').textContent = t('current');
  document.querySelector('#nav-history').textContent = t('archive');
  document.querySelector('#nav-vote').setAttribute('aria-label',t('current'));
  document.querySelector('#nav-history').setAttribute('aria-label',t('archive'));
  document.querySelector('#language').value = state.language;
  document.querySelector('#admin-mode-root').innerHTML = isAdmin ? `<span class="rounded bg-[#71363C] px-2 py-1 text-[10px] font-bold tracking-widest">${t('adminMode')}</span>` : '';
  document.querySelector('#rules-root').innerHTML = isAdmin ? '' : `<button data-action="open-rules" aria-label="${t('rules')}" title="${t('rules')}" class="rounded-full border border-neutral-600 px-2 py-0.5 text-xs text-neutral-200">?</button>`;
  appRoot.innerHTML = isAdmin ? createAdminMarkup(t,getAppTitle()) : createMemberMarkup(t);
  if (isAdmin) {
    document.querySelector('#admin-overview').insertAdjacentHTML('afterbegin',createAdminSessionInfoMarkup(t));
    document.querySelector('#admin-settings').insertAdjacentHTML('beforeend',createAdminOptionSettingsMarkup(t));
    document.querySelector('#admin-settings').insertAdjacentHTML('beforeend',createAdminBallotRuleMarkup(t));
    document.querySelector('#admin-settings').insertAdjacentHTML('beforeend',createAdminVoteVisibilityMarkup(t));
  }
  bindMemberSelect();
  if (isAdmin) setAdminTab(state.adminTab);
}

function bindEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.querySelector('#language').addEventListener('change', event => {
    state.language = setLanguage(event.target.value);
    mount();
    render();
  });
  document.addEventListener('change',handleChange);
  window.addEventListener('pagehide', () => {state.subscriptions.forEach(stop => stop());if (state.drawTicker !== null) window.clearInterval(state.drawTicker);});
}

function bindMemberSelect() {
  document.querySelector('#member-select')?.addEventListener('change', chooseMember);
  document.querySelector('#member-select')?.addEventListener('input', event => {
    const match = findMemberByName(event.target.value);
    if (match) chooseMemberId(match[0]);
  });
}

function subscribe() {
  const observe = (path, key, callback) => state.subscriptions.push(service.observe(path, value => {
    state[key] = value;
    state.loaded[key] = true;
    callback?.();
    render();
  }, showError));
  observe('settings','settings',() => {
    if (isAdmin && !state.settings.sessionId) {
      const date = new Date().toISOString().slice(0,10);
      service.update({'settings/sessionId':crypto.randomUUID(),'settings/sessionNumber':Object.keys(state.history).length+1,'settings/sessionDate':date,'settings/locked':true,'settings/votingOpen':false}).catch(showError);
    }
  });
  observe('books_pool','books');
  observe('member_roster','roster');
  observe('current_session_members','attendees');
  observe('current_ballots','ballots');
  observe('current_session_presence','presence');
  observe('history','history');
  state.subscriptions.push(service.observe('pending_results',value => {state.pendingResults = Object.keys(value).length ? value : null;render();},showError));
}

function render() {
  const currentSessionId = state.settings.sessionId || 'initial';
  const showingResults = !isAdmin && state.settings.showResults === true && state.pendingResults?.sessionId === currentSessionId && state.pendingResults?.winners?.length > 0;
  const votingClosed = isVotingClosed(state);
  const closed = !isAdmin && votingClosed;
  updateDocumentTitle();
  const status = document.querySelector('#status');
  status.textContent = votingClosed ? t('locked') : t('open');
  status.className = `text-xs font-semibold ${votingClosed ? 'text-[#E7B8BC]' : 'text-neutral-300'}`;
  document.querySelector('#counter').hidden = isAdmin || !state.memberId || closed || showingResults;
  document.querySelector('#main-nav').hidden = closed || showingResults;
  document.querySelector('#language').parentElement.hidden = closed || showingResults;
  document.querySelector('#rules-root').hidden = closed || showingResults;
  document.querySelector('#status').hidden = !isAdmin && showingResults;
  document.querySelector('#nav-history').hidden = !isAdmin && state.settings.membersCanViewHistory !== true;
  const isKnownLobbyMember = state.memberId === state.lobbyMemberId && !!state.roster[state.memberId];
  if (state.memberId && state.loaded.roster && state.loaded.attendees && (!state.roster[state.memberId] || state.attendees[state.memberId] !== true) && !isKnownLobbyMember) clearMember();
  recordMemberEntry();
  if (closed) state.view = 'vote';
  if (state.view === 'history' && !isAdmin && state.settings.membersCanViewHistory !== true) state.view = 'vote';
  document.querySelector('#history-view').hidden = state.view !== 'history';
  document.querySelector('#app').hidden = state.view === 'history';
  document.querySelector('#nav-vote').className = `flex-1 border-b-2 py-3 ${state.view === 'vote' ? 'border-white' : 'border-transparent text-neutral-400'}`;
  document.querySelector('#nav-history').className = `flex-1 border-b-2 py-3 ${state.view === 'history' ? 'border-white' : 'border-transparent text-neutral-400'}`;
  if (state.view === 'history') {
    document.querySelector('#cast-bar').hidden = true;
    renderHistory(state,t,isAdmin || state.settings.memberVoteCountsVisible === true);
    syncWildcardTicker();
    return;
  }
  if (isAdmin) {
    document.querySelector('#identity')?.remove();
    document.querySelector('#note')?.remove();
    document.querySelector('#session-meta')?.remove();
    renderAdmin(state,t);
  } else {
    if (state.memberId && state.loaded.ballots && state.loaded.books && !state.draftDirty) {
      state.draft = [...(currentBallots()[state.memberId]?.books || [])].filter(id => state.books[id]?.active);
      state.initialDraftLoaded = true;
    }
    document.querySelector('#member-vote-view').hidden = showingResults;
    document.querySelector('#session-meta').hidden = closed || showingResults;
    document.querySelector('#slate-heading').hidden = showingResults;
    document.querySelector('#books').hidden = showingResults;
    renderIdentity(state,t);
    renderBooks(state,t);
    document.querySelector('#session-label').textContent = `${t('session')} ${state.settings.sessionNumber || 1}`;
    document.querySelector('#session-date').textContent = formatDate(state.settings.sessionDate || Date.now());
    renderResults(state,t);
    const ballot = state.memberId ? currentBallots()[state.memberId] : null;
    const footerMessages = [];
    if (ballot) footerMessages.push(t('saved'));
    if (closed || showingResults) footerMessages.push(t('votingClosed'));
    else if (state.settings.requireFullBallot === true && state.draft.length < 3) footerMessages.push(t('selectAllThree'));
    else footerMessages.push(state.draft.length ? t('ready') : t('select'));
    document.querySelector('#cast-bar').hidden = !!state.memberId && state.memberId === state.lobbyMemberId && state.attendees[state.memberId] !== true;
    document.querySelector('#cast-hint').textContent = footerMessages.join(' · ');
    document.querySelector('#cast-label').textContent = closed || showingResults ? t('votingClosed') : ballot ? t('edit') : t('cast');
    document.querySelector('#cast-count').textContent = String(state.draft.length);
    document.querySelector('#cast-btn').disabled = closed || showingResults || !state.memberId || !isBallotReady();
  }
  if (isAdmin) document.querySelector('#cast-bar').hidden = true;
  document.querySelector('#selected').textContent = String(state.draft.length);
  renderHistory(state,t,isAdmin || state.settings.memberVoteCountsVisible === true);
  syncWildcardTicker();
}

function syncWildcardTicker() {
  renderWildcardDraw(state,t);
  const shouldTick = isWildcardDrawPending(state) && Number(state.pendingResults?.drawStartedAt) > 0;
  if (shouldTick && state.drawTicker === null) state.drawTicker = window.setInterval(() => renderWildcardDraw(state,t),110);
  else if (!shouldTick && state.drawTicker !== null) {window.clearInterval(state.drawTicker);state.drawTicker = null;}
}

function handleClick(event) {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const {action,bookId,memberId,tab,active} = control.dataset;
  if (action === 'show-vote') showVote();
  else if (action === 'show-history') showHistory();
  else if (action === 'admin-tab') setAdminTab(tab);
  else if (action === 'toggle-book') toggleDraft(bookId);
  else if (action === 'cast') castVote();
  else if (action === 'toggle-lock') toggleLock();
  else if (action === 'clear-ballot') clearBallot(memberId);
  else if (action === 'finalize') finalizeResults();
  else if (action === 'draw-wildcard') playWildcardDraw();
  else if (action === 'start-next') startNextSession();
  else if (action === 'remove-member') removeMember(memberId);
  else if (action === 'add-attendee') toggleAttendance(memberId,true);
  else if (action === 'remove-attendee') toggleAttendance(memberId,false);
  else if (action === 'add-book-to-slate') setBookActive(bookId,true);
  else if (action === 'remove-book-from-slate') setBookActive(bookId,false);
  else if (action === 'remove-book') removeBook(bookId);
  else if (action === 'open-rules') document.querySelector('#rules-dialog')?.showModal();
  else if (action === 'close-rules') document.querySelector('#rules-dialog')?.close();
  else if (action === 'open-admin-flow') document.querySelector('#admin-flow-dialog')?.showModal();
  else if (action === 'close-admin-flow') document.querySelector('#admin-flow-dialog')?.close();
}

function handleChange(event) {
  if (event.target.matches('[data-action="toggle-attendance"]')) toggleAttendance(event.target.dataset.memberId,event.target.checked);
  else if (event.target.matches('[data-action="toggle-history"]')) toggleHistoryAccess();
  else if (event.target.matches('[data-action="toggle-member-deletion"]')) toggleMemberDeletion();
  else if (event.target.matches('[data-action="toggle-book-deletion"]')) toggleBookDeletion();
  else if (event.target.matches('[data-action="toggle-full-ballot"]')) toggleFullBallotRequirement();
  else if (event.target.matches('[data-action="toggle-vote-counts"]')) toggleMemberVoteCounts();
  else if (event.target.matches('#max-top-books')) setMaxTopBooks(event.target.value);
}

function handleSubmit(event) {
  if (event.target.id === 'member-form') {event.preventDefault();addMember();}
  else if (event.target.id === 'book-form') {event.preventDefault();addBook();}
  else if (event.target.id === 'title-form') {event.preventDefault();saveAppTitle();}
}

function chooseMember(event) {
  const match = findMemberByName(event.target.value);
  if (match) chooseMemberId(match[0]);
  else {clearMember();render();showFeedback(t('memberRequired'));}
}

function findMemberByName(value) {
  return Object.entries(state.roster).find(([id]) => state.attendees[id] === true && memberName(state.roster,id) === value);
}

function chooseMemberId(id) {
  if (!state.roster[id] || state.attendees[id] !== true) return;
  if (id !== state.lobbyMemberId) {
    state.lobbyMemberId = '';
    sessionStorage.removeItem('member_lobby_id');
  }
  state.memberId = id;
  state.initialDraftLoaded = true;
  state.draftDirty = false;
  sessionStorage.setItem('bookclub_member_id',id);
  state.draft = [...(currentBallots()[id]?.books || [])].filter(bookId => state.books[bookId]?.active);
  state.draftDirty = false;
  render();
}

function clearMember() {
  if (sessionStorage.getItem('member_lobby_id') === state.memberId) sessionStorage.removeItem('member_lobby_id');
  state.memberId = '';
  state.lobbyMemberId = '';
  state.draft = [];
  sessionStorage.removeItem('bookclub_member_id');
}

function toggleDraft(id) {
  if (!state.memberId || isVotingClosed(state)) return;
  const index = state.draft.indexOf(id);
  if (index >= 0) state.draft.splice(index,1);
  else if (state.draft.length < 3) state.draft.push(id);
  state.draftDirty = true;
  render();
}

function isBallotReady() {
  return state.settings.requireFullBallot === true ? state.draft.length === 3 : state.draft.length >= 1 && state.draft.length <= 3;
}

async function castVote() {
  if (!state.memberId || state.attendees[state.memberId] !== true || isVotingClosed(state) || !isBallotReady()) return;
  const sessionId = state.settings.sessionId || 'initial';
  try {
    await service.castBallot(state.memberId, old => {
      const previous = old?.sessionId === sessionId ? old : null;
      const clientIds = [...new Set([...(previous?.clientIds || []),clientId])];
      return {memberName:memberName(state.roster,state.memberId),books:[...state.draft],sessionId,clientIds,duplicateWarning:clientIds.length > 1,updatedAt:Date.now()};
    });
    state.draftDirty = false;
  } catch (error) {showError(error);}
}

async function addMember() {
  const input = document.querySelector('#member-name'), value = input.value.trim();
  if (!value) return;
  if (Object.values(state.roster).some(member => (typeof member === 'string' ? member : member?.name || '').toLowerCase() === value.toLowerCase())) {showFeedback(value);return;}
  try {await service.addMember({name:value,createdAt:Date.now()});input.value = '';showFeedback(t('savedLabel'));}
  catch (error) {showError(error);}
}

async function removeMember(id) {
  if (state.settings.memberDeletionEnabled !== true || !id || !window.confirm(t('removeMemberConfirm'))) return;
  try {await service.removeMember(id);}
  catch (error) {showError(error);}
}

async function addBook() {
  const titleInput = document.querySelector('#book-title'), proposerId = document.querySelector('#proposer').value, title = titleInput.value.trim();
  if (!title || !state.roster[proposerId]) return;
  try {await service.addBook({title,proposer:memberName(state.roster,proposerId),proposerId,active:false,bonusPoints:0,missedCount:0,createdAt:Date.now()});titleInput.value = '';}
  catch (error) {showError(error);}
}

async function setBookActive(id,active) {
  try {await service.setBookActive(id,active);}
  catch (error) {showError(error);}
}

async function removeBook(id) {
  if (state.settings.bookDeletionEnabled !== true || !id || !window.confirm(t('deleteBookConfirm'))) return;
  try {await service.removeBook(id);}
  catch (error) {showError(error);}
}

async function toggleAttendance(id,attending) {
  try {await service.setMemberAttendance(id,attending);}
  catch (error) {showError(error);}
}

async function toggleLock() {
  if (state.lockInProgress || state.pendingResults?.sessionId === (state.settings.sessionId || 'initial')) return;
  state.lockInProgress = true;
  try {
    if (state.settings.locked === true) {await service.update({'settings/locked':false,'settings/votingOpen':true});return;}
    const sessionId = state.settings.sessionId || 'initial';
    const ballots = await service.read('current_ballots');
    const currentSessionBallots = Object.entries(ballots).filter(([,ballot]) => ballot?.sessionId === sessionId);
    const offenders = currentSessionBallots.filter(([,ballot]) => Array.isArray(ballot.clientIds) && ballot.clientIds.length > 2);
    if (offenders.length) {
      const names = offenders.map(([id]) => memberName(state.roster,id) || t('unknownMember')).join(', ');
      showFeedback(t('tooManyDevicesToClose').replace('{members}',names));
      return;
    }
    const finalBallots = Object.fromEntries(currentSessionBallots);
    await service.update({[`session_ballots/${sessionId}`]:{sessionId,lockedAt:Date.now(),ballots:finalBallots},'settings/locked':true,'settings/votingOpen':false});
  }
  catch (error) {showError(error);}
  finally {state.lockInProgress = false;render();}
}

async function clearBallot(id) {
  const sessionId = state.settings.sessionId || 'initial';
  const ballot = state.ballots[id];
  if (!isAdmin || !id || isVotingClosed(state) || state.pendingResults?.sessionId === sessionId || ballot?.sessionId !== sessionId || state.clearingBallotId) return;
  const name = memberName(state.roster,id) || t('unknownMember');
  if (!window.confirm(t('confirmClearVote').replace('{name}',name))) return;
  state.clearingBallotId = id;
  render();
  try {await service.clearBallot(id);showFeedback(t('voteCleared').replace('{name}',name));}
  catch (error) {showError(error);}
  finally {state.clearingBallotId = '';render();}
}

async function toggleHistoryAccess() {
  try {await service.set('settings/membersCanViewHistory',state.settings.membersCanViewHistory !== true);}
  catch (error) {showError(error);}
}

async function toggleMemberDeletion() {
  try {await service.set('settings/memberDeletionEnabled',state.settings.memberDeletionEnabled !== true);}
  catch (error) {showError(error);}
}

async function toggleBookDeletion() {
  try {await service.set('settings/bookDeletionEnabled',state.settings.bookDeletionEnabled !== true);}
  catch (error) {showError(error);}
}

async function toggleFullBallotRequirement() {
  try {await service.set('settings/requireFullBallot',state.settings.requireFullBallot !== true);}
  catch (error) {showError(error);}
}

async function toggleMemberVoteCounts() {
  try {await service.set('settings/memberVoteCountsVisible',state.settings.memberVoteCountsVisible !== true);}
  catch (error) {showError(error);}
}

async function setMaxTopBooks(value) {
  const maxTopBooks = Number(value);
  if (![3,4,5].includes(maxTopBooks)) return;
  try {await service.set('settings/maxTopBooks',maxTopBooks);}
  catch (error) {showError(error);}
}

async function saveAppTitle() {
  const title = document.querySelector('#app-title-input').value.trim();
  if (!title) {showFeedback(t('titleRequired'));return;}
  try {await service.set('settings/appTitle',title);showFeedback(t('titleSaved'));}
  catch (error) {showError(error);}
}

function getAppTitle() {
  return String(state.settings.appTitle || '').trim() || t('title');
}

function updateDocumentTitle() {
  const title = getAppTitle();
  document.querySelector('#page-title').textContent = title;
  document.title = isAdmin ? `${title} - Admin` : title;
}

function recordMemberEntry() {
  const sessionId = state.settings.sessionId || 'initial';
  if (isAdmin || !state.memberId || state.attendees[state.memberId] !== true || !state.loaded.presence) return;
  const attemptKey = `${sessionId}:${state.memberId}`;
  const existing = state.presence[state.memberId];
  if (existing?.sessionId === sessionId && existing.clientIds?.includes(clientId)) {state.presenceAttemptKey = attemptKey;return;}
  if (state.presenceAttemptKey === attemptKey) return;
  state.presenceAttemptKey = attemptKey;
  service.recordMemberEntry(state.memberId,sessionId,clientId).catch(error => {state.presenceAttemptKey = '';showError(error);});
}

async function finalizeResults() {
  if (state.resultInProgress) return;
  if (state.settings.locked !== true) {showFeedback(t('closeFirst'));return;}
  const sessionId = state.settings.sessionId || 'initial';
  if (state.pendingResults?.sessionId === sessionId) {
    if (isWildcardDrawPending(state)) return;
    if (state.settings.archivedSessionId !== sessionId) {await completeResults(state.pendingResults);return;}
    try {await service.set('settings/showResults',state.settings.showResults !== true);}
    catch (error) {showError(error);}
    return;
  }
  state.resultInProgress = true;
  let frozenBallots;
  try {const snapshot = await service.read(`session_ballots/${sessionId}`);frozenBallots = snapshot.lockedAt ? snapshot.ballots || {} : currentBallots();}
  catch (error) {state.resultInProgress = false;showError(error);return;}
  const scores = scoreMap(frozenBallots);
  const slateBooks = Object.entries(state.books).filter(([,book]) => book.active === true).map(([id,book]) => ({id,...book,voteCount:scores[id] || 0,bonusPoints:Number(book.bonusPoints) || 0,missedCount:Number(book.missedCount) || 0,total:(scores[id] || 0)+(Number(book.bonusPoints) || 0)}));
  const activeBooks = [...slateBooks].sort((a,b) => b.total-a.total || b.missedCount-a.missedCount || String(a.title).localeCompare(String(b.title)));
  const sessionSelections = [...slateBooks].sort((a,b) => String(a.title).localeCompare(String(b.title))).map(makeSessionSelection);
  const maxTopBooks = Number([3,4,5].includes(Number(state.settings.maxTopBooks)) ? state.settings.maxTopBooks : 3);
  if (activeBooks.length < maxTopBooks) {state.resultInProgress = false;showFeedback(t('needTopBooks').replace('{count}',String(maxTopBooks)));return;}
  try {
    const fixedWinners = maxTopBooks - 1;
    const winners = activeBooks.slice(0,fixedWinners).map(book => makeWinner(book,'top'));
    const remaining = activeBooks.slice(fixedWinners);
    const priority = remaining.filter(book => (book.missedCount || 0) >= 2).sort((a,b) => (b.missedCount || 0)-(a.missedCount || 0))[0];
    const result = {sessionId,sessionNumber:state.settings.sessionNumber || 1,sessionDate:state.settings.sessionDate || new Date().toISOString().slice(0,10),maxTopBooks,preparedAt:Date.now(),winners,sessionSelections};
    if (priority) {result.winners.push(makeWinner(priority,'protected'));await completeResults(result);}
    else {result.wildcardCandidates = remaining.map(book => makeWinner(book,'wild'));await service.update({'pending_results':result,'settings/showResults':true});showFeedback(t('drawReady'));}
  } catch (error) {showError(error);}
  finally {state.resultInProgress = false;}
}

async function playWildcardDraw() {
  const pending = state.pendingResults;
  if (!isWildcardDrawPending(state) || state.drawInProgress) return;
  state.drawInProgress = true;
  render();
  const candidates = pending.wildcardCandidates;
  try {
    const claim = await service.claimWildcardDraw(pending.sessionId,clientId,Date.now());
    if (!claim.committed) {showFeedback(t('drawInProgress'));return;}
    const drawStartedAt = claim.snapshot.val().drawStartedAt;
    while (Date.now() - drawStartedAt < 2700) await new Promise(resolve => window.setTimeout(resolve,110));
    const index = uniformRandomIndex(candidates.length), chosen = candidates[index];
    const committed = await service.commitWildcardDraw(pending.sessionId,clientId,chosen.id,Date.now());
    if (committed.committed) await completeResults(committed.snapshot.val());
  } catch (error) {showError(error);}
  finally {state.drawInProgress = false;render();}
}

function uniformRandomIndex(length) {
  const range = 2 ** 32, limit = range - range % length;
  let random;
  do {random = crypto.getRandomValues(new Uint32Array(1))[0];} while (random >= limit);
  return random % length;
}

async function completeResults(result) {
  if (state.settings.archivedSessionId === result.sessionId) return;
  let existingBooks;
  try {existingBooks = await service.read('books_pool');}
  catch (error) {showError(error);return false;}
  const now = Date.now(), winningIds = new Set(result.winners.map(book => book.id));
  const updates = {
    pending_results:{...result,archivedAt:now},
    [`history/${result.sessionId}`]:{...result,archivedAt:now,date:new Date(result.drawnAt || result.preparedAt || now).toISOString().slice(0,10)},
    'settings/showResults':true,'settings/locked':true,'settings/votingOpen':false,'settings/archivedSessionId':result.sessionId
  };
  (result.sessionSelections || []).forEach(book => {
    if (!existingBooks[book.id]) return;
    updates[`books_pool/${book.id}/lastStatus`] = winningIds.has(book.id) ? 'selected' : 'carried';
    updates[`books_pool/${book.id}/lastSessionNumber`] = Number(result.sessionNumber) || 1;
    updates[`books_pool/${book.id}/bonusPoints`] = winningIds.has(book.id) ? 0 : (Number(book.bonusPoints) || 0) + 1;
    updates[`books_pool/${book.id}/missedCount`] = winningIds.has(book.id) ? 0 : (Number(book.missedCount) || 0) + 1;
  });
  try {await service.update(updates);showFeedback(t('archived'));return true;}
  catch (error) {showError(error);return false;}
}

async function startNextSession() {
  if (state.settings.archivedSessionId !== (state.settings.sessionId || 'initial') || state.pendingResults?.sessionId !== state.settings.archivedSessionId) return;
  if (!window.confirm(t('confirm'))) return;
  const nextSettings = {...state.settings,sessionId:crypto.randomUUID(),sessionNumber:(Number(state.settings.sessionNumber) || Object.keys(state.history).length || 1)+1,sessionDate:new Date().toISOString().slice(0,10),locked:true,votingOpen:false,showResults:false,archivedSessionId:null};
  const updates = {settings:nextSettings,current_ballots:null,current_session_members:null,current_session_presence:null,pending_results:null};
  Object.keys(state.books).forEach(id => updates[`books_pool/${id}/active`] = false);
  try {await service.update(updates);state.draft = [];showVote();setAdminTab('overview');}
  catch (error) {showError(error);}
}

function renderHistoryPage() {
  if (!isAdmin && state.settings.membersCanViewHistory !== true) return;
  state.view = 'history';
  render();
}

function showHistory() {
  renderHistoryPage();
  document.querySelector('#cast-bar').hidden = true;
}

function showVote() {
  state.view = 'vote';
  render();
}

function setAdminTab(tab) {
  state.adminTab = ['overview','books','members','settings','audit'].includes(tab) ? tab : 'overview';
  for (const name of ['overview','books','members','settings','audit']) {
    const section = document.querySelector(`#admin-${name}`);
    if (section) section.hidden = state.adminTab !== name;
  }
  document.querySelectorAll('.admin-tab').forEach(button => {
    const active = button.dataset.tab === state.adminTab;
    button.className = `admin-tab shrink-0 rounded px-4 py-2.5 text-sm font-semibold ${active ? 'bg-[#71363C] text-white' : 'border border-neutral-200 text-neutral-600 hover:border-[#71363C]'}`;
  });
}

function currentBallots() {
  return Object.fromEntries(Object.entries(state.ballots).filter(([,ballot]) => ballot?.sessionId === (state.settings.sessionId || 'initial')));
}

function scoreMap(ballots) {
  const scores = {};
  Object.values(ballots).forEach(ballot => (ballot.books || []).forEach(id => scores[id] = (scores[id] || 0) + 1));
  return scores;
}

function makeWinner(book, winReason) {
  return {id:book.id,title:book.title,proposer:book.proposer,voteCount:Number(book.voteCount) || 0,bonusPoints:Number(book.bonusPoints) || 0,totalScore:Number(book.total) || 0,winReason};
}

function makeSessionSelection(book) {
  return {id:book.id,title:book.title,proposer:book.proposer,voteCount:Number(book.voteCount) || 0,bonusPoints:Number(book.bonusPoints) || 0,missedCount:Number(book.missedCount) || 0,totalScore:Number(book.total) || 0};
}

function formatDate(value) {
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(state.language === 'de' ? 'de-DE' : 'en-GB',{dateStyle:'long'}).format(date);
}

function showFeedback(message) {
  const target = document.querySelector('#feedback') || document.querySelector('#member-feedback');
  if (target) {target.textContent = message;target.hidden = !message;}
}

function showError(error) {
  console.error(error);
  showFeedback(t('error'));
}
