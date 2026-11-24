import {getClientId, initializeDatabase, isAdminMode} from './config.js';
import {getLanguage, setLanguage, translate} from './i18n.js';
import {createVotingService} from './session-service.js';
import {createAdminMarkup, createMemberMarkup, memberName, renderAdmin, renderBooks, renderHistory, renderIdentity, renderResults} from './views.js';

const database = initializeDatabase();
const service = createVotingService(database);
const isAdmin = isAdminMode();
const clientId = getClientId();
const appRoot = document.querySelector('#app');
const state = {
  language:getLanguage(),
  settings:{},books:{},roster:{},attendees:{},ballots:{},history:{},pendingResults:null,
  memberId:sessionStorage.getItem('bookclub_member_id') || '',draft:[],initialDraftLoaded:false,adminTab:'overview',
  subscriptions:[],resultInProgress:false,loaded:{},view:'vote'
};
const t = key => translate(state.language,key);

mount();
bindEvents();
subscribe();

function mount() {
  document.documentElement.lang = state.language;
  document.querySelector('#page-title').textContent = t('title');
  document.title = t('title');
  document.querySelector('#counter span').textContent = t('selected');
  document.querySelector('#nav-vote').textContent = t('current');
  document.querySelector('#nav-history').textContent = t('archive');
  document.querySelector('#nav-vote').setAttribute('aria-label',t('current'));
  document.querySelector('#nav-history').setAttribute('aria-label',t('archive'));
  document.querySelector('#language').value = state.language;
  document.querySelector('#admin-mode-root').innerHTML = isAdmin ? `<span class="rounded bg-[#71363C] px-2 py-1 text-[10px] font-bold tracking-widest">${t('adminMode')}</span>` : '';
  document.querySelector('#rules-root').innerHTML = isAdmin ? '' : `<button data-action="open-rules" aria-label="${t('rules')}" title="${t('rules')}" class="rounded-full border border-neutral-600 px-2 py-0.5 text-xs text-neutral-200">?</button>`;
  appRoot.innerHTML = isAdmin ? createAdminMarkup(t) : createMemberMarkup(t);
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
  window.addEventListener('pagehide', () => state.subscriptions.forEach(stop => stop()));
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
      service.update({'settings/sessionId':crypto.randomUUID(),'settings/sessionNumber':Object.keys(state.history).length+1,'settings/sessionDate':date}).catch(showError);
    }
  });
  observe('books_pool','books');
  observe('member_roster','roster');
  observe('current_session_members','attendees');
  observe('current_ballots','ballots');
  observe('history','history');
  state.subscriptions.push(service.observe('pending_results',value => {state.pendingResults = Object.keys(value).length ? value : null;render();},showError));
}

function render() {
  const closed = !isAdmin && state.settings.locked === true;
  const status = document.querySelector('#status');
  status.textContent = state.settings.locked ? t('locked') : t('open');
  status.className = `text-xs ${state.settings.locked ? 'text-[#C98D93]' : 'text-neutral-300'}`;
  document.querySelector('#counter').hidden = isAdmin || !state.memberId || closed;
  document.querySelector('#main-nav').hidden = closed;
  document.querySelector('#language').parentElement.hidden = closed;
  document.querySelector('#rules-root').hidden = closed;
  document.querySelector('#status').hidden = closed;
  document.querySelector('#nav-history').hidden = !isAdmin && state.settings.membersCanViewHistory !== true;
  if (state.memberId && state.loaded.roster && state.loaded.attendees && (!state.roster[state.memberId] || state.attendees[state.memberId] !== true)) clearMember();
  if (closed) state.view = 'vote';
  if (state.view === 'history' && !isAdmin && state.settings.membersCanViewHistory !== true) state.view = 'vote';
  document.querySelector('#history-view').hidden = state.view !== 'history';
  document.querySelector('#app').hidden = state.view === 'history';
  document.querySelector('#nav-vote').className = `flex-1 border-b-2 py-3 ${state.view === 'vote' ? 'border-white' : 'border-transparent text-neutral-400'}`;
  document.querySelector('#nav-history').className = `flex-1 border-b-2 py-3 ${state.view === 'history' ? 'border-white' : 'border-transparent text-neutral-400'}`;
  if (state.view === 'history') {
    document.querySelector('#cast-bar').hidden = true;
    renderHistory(state,t);
    return;
  }
  if (isAdmin) {
    document.querySelector('#identity')?.remove();
    document.querySelector('#note')?.remove();
    document.querySelector('#session-meta')?.remove();
    renderAdmin(state,t);
  } else {
    if (state.memberId && !state.initialDraftLoaded && state.loaded.ballots && state.loaded.books) {
      state.draft = [...(currentBallots()[state.memberId]?.books || [])].filter(id => state.books[id]?.active);
      state.initialDraftLoaded = true;
    }
    const identity = document.querySelector('#identity');
    if (identity) identity.hidden = closed;
    document.querySelector('#note').hidden = closed;
    document.querySelector('#session-meta').hidden = closed;
    document.querySelector('#slate-heading').hidden = closed;
    document.querySelector('#books').hidden = closed;
    document.querySelector('#voted').hidden = closed || !currentBallots()[state.memberId];
    document.querySelector('#voted').textContent = t('saved');
    renderIdentity(state,t);
    renderBooks(state,t);
    document.querySelector('#session-label').textContent = `${t('session')} ${state.settings.sessionNumber || 1}`;
    document.querySelector('#session-date').textContent = formatDate(state.settings.sessionDate || Date.now());
    renderResults(state,t,closed);
  }
  document.querySelector('#cast-bar').hidden = isAdmin || closed || !state.memberId || state.settings.locked === true;
  document.querySelector('#cast-label').textContent = currentBallots()[state.memberId] ? t('edit') : t('cast');
  document.querySelector('#cast-hint').textContent = state.draft.length ? t('ready') : t('select');
  document.querySelector('#cast-count').textContent = String(state.draft.length);
  document.querySelector('#cast-btn').disabled = state.draft.length < 1;
  document.querySelector('#selected').textContent = String(state.draft.length);
  renderHistory(state,t);
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
  else if (action === 'finalize') finalizeResults();
  else if (action === 'draw-wildcard') playWildcardDraw();
  else if (action === 'toggle-history') toggleHistoryAccess();
  else if (action === 'start-next') startNextSession();
  else if (action === 'remove-member') removeMember(memberId);
  else if (action === 'toggle-active') setBookActive(bookId,active === 'true');
  else if (action === 'remove-book') removeBook(bookId);
  else if (action === 'open-rules') document.querySelector('#rules-dialog')?.showModal();
  else if (action === 'close-rules') document.querySelector('#rules-dialog')?.close();
}

function handleChange(event) {
  if (event.target.matches('[data-action="toggle-attendance"]')) toggleAttendance(event.target.dataset.memberId,event.target.checked);
}

function handleSubmit(event) {
  if (event.target.id === 'member-form') {event.preventDefault();addMember();}
  else if (event.target.id === 'book-form') {event.preventDefault();addBook();}
}

function chooseMember(event) {
  const match = findMemberByName(event.target.value);
  if (match) chooseMemberId(match[0]);
  else {clearMember();render();document.querySelector('#identity-note').textContent = t('memberRequired');}
}

function findMemberByName(value) {
  return Object.entries(state.roster).find(([id]) => state.attendees[id] === true && memberName(state.roster,id) === value);
}

function chooseMemberId(id) {
  if (!state.roster[id] || state.attendees[id] !== true) return;
  state.memberId = id;
  state.initialDraftLoaded = true;
  sessionStorage.setItem('bookclub_member_id',id);
  state.draft = [...(currentBallots()[id]?.books || [])].filter(bookId => state.books[bookId]?.active);
  render();
}

function clearMember() {
  state.memberId = '';
  state.draft = [];
  sessionStorage.removeItem('bookclub_member_id');
}

function toggleDraft(id) {
  if (!state.memberId || state.settings.locked) return;
  const index = state.draft.indexOf(id);
  if (index >= 0) state.draft.splice(index,1);
  else if (state.draft.length < 3) state.draft.push(id);
  render();
}

async function castVote() {
  if (!state.memberId || state.attendees[state.memberId] !== true || state.settings.locked || state.draft.length < 1 || state.draft.length > 3) return;
  const sessionId = state.settings.sessionId || 'initial';
  try {
    await service.castBallot(state.memberId, old => {
      const previous = old?.sessionId === sessionId ? old : null;
      const clientIds = [...new Set([...(previous?.clientIds || []),clientId])];
      return {memberName:memberName(state.roster,state.memberId),books:[...state.draft],sessionId,clientIds,duplicateWarning:clientIds.length > 1,updatedAt:Date.now()};
    });
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
  if (!id || !window.confirm(t('removeMemberConfirm'))) return;
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
  if (!id || !window.confirm(t('removeConfirm'))) return;
  try {await service.removeBook(id);}
  catch (error) {showError(error);}
}

async function toggleAttendance(id,attending) {
  try {await service.setMemberAttendance(id,attending);}
  catch (error) {showError(error);}
}

async function toggleLock() {
  try {await service.set('settings/locked',!state.settings.locked);}
  catch (error) {showError(error);}
}

async function toggleHistoryAccess() {
  try {await service.set('settings/membersCanViewHistory',state.settings.membersCanViewHistory !== true);}
  catch (error) {showError(error);}
}

async function finalizeResults() {
  if (state.resultInProgress) return;
  if (!state.settings.locked) {showFeedback(t('closeFirst'));return;}
  const sessionId = state.settings.sessionId || 'initial';
  if (state.pendingResults?.sessionId === sessionId) {
    if (state.pendingResults.wildcardCandidates?.length && !state.pendingResults.winners?.length) return;
    try {await service.set('settings/showResults',state.settings.showResults !== true);}
    catch (error) {showError(error);}
    return;
  }
  const scores = scoreMap();
  const activeBooks = Object.entries(state.books).filter(([,book]) => book.active === true).map(([id,book]) => ({id,...book,total:(scores[id] || 0)+(Number(book.bonusPoints) || 0)})).sort((a,b) => b.total-a.total || (b.missedCount || 0)-(a.missedCount || 0));
  if (activeBooks.length < 3) {showFeedback(t('needBooks'));return;}
  state.resultInProgress = true;
  try {
    const winners = activeBooks.slice(0,2).map(book => makeWinner(book,'top'));
    const remaining = activeBooks.slice(2);
    const priority = remaining.filter(book => (book.missedCount || 0) >= 2).sort((a,b) => (b.missedCount || 0)-(a.missedCount || 0))[0];
    const result = {sessionId,sessionNumber:state.settings.sessionNumber || 1,sessionDate:state.settings.sessionDate || new Date().toISOString().slice(0,10),preparedAt:Date.now(),winners};
    if (priority) {result.winners.push(makeWinner(priority,'protected'));await completeResults(result);}
    else {result.wildcardCandidates = remaining.map(book => makeWinner(book,'wild'));await service.set('pending_results',result);showFeedback(t('drawReady'));}
  } catch (error) {showError(error);}
  finally {state.resultInProgress = false;}
}

async function playWildcardDraw() {
  const pending = state.pendingResults;
  if (!pending?.wildcardCandidates?.length || pending.winners?.length) return;
  const button = document.querySelector('#draw-btn');
  button.disabled = true;
  const candidates = pending.wildcardCandidates;
  try {
    for (let step = 0; step < 20; step++) {
      document.querySelector('#draw-status').textContent = candidates[step % candidates.length].title;
      await new Promise(resolve => window.setTimeout(resolve,90 + step * 7));
    }
    const index = uniformRandomIndex(candidates.length), chosen = candidates[index];
    const {wildcardCandidates,...storedResult} = pending;
    const result = {...storedResult,winners:[...pending.winners,chosen],drawnAt:Date.now(),drawnDate:new Date().toISOString().slice(0,10)};
    if (await completeResults(result)) document.querySelector('#draw-status').textContent = `${t('drawn')}: ${chosen.title} · ${formatDate(result.drawnAt)}`;
  } catch (error) {showError(error);}
  finally {button.disabled = false;}
}

function uniformRandomIndex(length) {
  const range = 2 ** 32, limit = range - range % length;
  let random;
  do {random = crypto.getRandomValues(new Uint32Array(1))[0];} while (random >= limit);
  return random % length;
}

async function completeResults(result) {
  if (state.settings.archivedSessionId === result.sessionId) return;
  const now = Date.now(), key = service.nextHistoryKey(), winningIds = new Set(result.winners.map(book => book.id));
  const updates = {
    pending_results:{...result,archivedAt:now},
    [`history/${key}`]:{...result,archivedAt:now,date:new Date(result.drawnAt || result.preparedAt || now).toISOString().slice(0,10)},
    'settings/showResults':true,'settings/locked':true,'settings/archivedSessionId':result.sessionId
  };
  Object.entries(state.books).forEach(([id,book]) => {
    const wasOnSlate = book.active === true;
    if (wasOnSlate) updates[`books_pool/${id}/lastStatus`] = winningIds.has(id) ? 'selected' : 'carried';
    updates[`books_pool/${id}/bonusPoints`] = winningIds.has(id) ? 0 : (Number(book.bonusPoints) || 0) + (wasOnSlate ? 1 : 0);
    updates[`books_pool/${id}/missedCount`] = winningIds.has(id) ? 0 : (Number(book.missedCount) || 0) + (wasOnSlate ? 1 : 0);
  });
  try {await service.update(updates);showFeedback(t('archived'));return true;}
  catch (error) {showError(error);return false;}
}

async function startNextSession() {
  if (!state.pendingResults?.winners?.length || state.pendingResults.sessionId !== (state.settings.sessionId || 'initial')) return;
  if (!window.confirm(t('confirm'))) return;
  const nextSettings = {...state.settings,sessionId:crypto.randomUUID(),sessionNumber:(Number(state.settings.sessionNumber) || Object.keys(state.history).length || 1)+1,sessionDate:new Date().toISOString().slice(0,10),locked:false,showResults:false,archivedSessionId:null};
  const updates = {settings:nextSettings,current_ballots:null,current_session_members:null,pending_results:null};
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
  state.adminTab = ['overview','books','members','advanced'].includes(tab) ? tab : 'overview';
  for (const name of ['overview','books','members','advanced']) {
    const section = document.querySelector(`#admin-${name}`);
    if (section) section.hidden = state.adminTab !== name;
  }
  document.querySelectorAll('.admin-tab').forEach(button => {
    const active = button.dataset.tab === state.adminTab;
    button.className = `admin-tab rounded px-4 py-2.5 text-sm font-semibold ${active ? 'bg-[#71363C] text-white' : 'border border-neutral-200 text-neutral-600 hover:border-[#71363C]'}`;
  });
}

function currentBallots() {
  return Object.fromEntries(Object.entries(state.ballots).filter(([,ballot]) => ballot?.sessionId === (state.settings.sessionId || 'initial')));
}

function scoreMap() {
  const scores = {};
  Object.values(currentBallots()).forEach(ballot => (ballot.books || []).forEach(id => scores[id] = (scores[id] || 0) + 1));
  return scores;
}

function makeWinner(book, winReason) {
  return {id:book.id,title:book.title,proposer:book.proposer,totalScore:book.total,winReason};
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
