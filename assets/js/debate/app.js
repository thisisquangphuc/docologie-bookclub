import { initializeDatabase } from './config.js';
import { guardAdminPage } from '../shared/admin-auth.js';
import { createDebateService } from './session-service.js';
import { canEndRound, canOpenReflection, canStartRound, isRoundActive } from './round-policy.js';
import { formatTime, parseTurnDurationMinutes, remainingTimeMs, turnDurationMs } from './timer-policy.js';
import { createRulesMarkup, escapeHtml, getLanguage, translate } from './i18n.js';
import { createDisplayMarkup, createHostMarkup, createParticipantMarkup, renderDisplay, renderHost, renderHostHistory, renderHostRoster, renderParticipant, renderRulesDialog } from './views.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'join';
const sessionId = params.get('session') || '';
const canHost = mode === 'host' && params.get('admin') === '1';
const language = getLanguage();
const database = initializeDatabase();
const service = createDebateService(database);
const app = document.querySelector('#app');
const state = {roster:{},session:null,sessionRef:null,history:{},editingSettings:false,editingInternal:false,editingTimer:false,activeTab:'control',hostReady:false,memberId:sessionStorage.getItem('member_lobby_id')||sessionStorage.getItem(`debate_member_${sessionId}`)||'',joinId:'',presenceId:crypto.randomUUID(),stopPresence:null,stopSession:null,stopHistory:null};
const t = key => translate(language,key);

function mountView() {
  document.querySelector('#home-link').href = canHost ? 'admin.html' : 'index.html';
  document.querySelector('#language').value = language;
  document.querySelector('#page-title').textContent = t('title');
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
  document.querySelector('#rules-button').setAttribute('aria-label',t('rules'));
  if (canHost) {
    app.innerHTML = createHostMarkup(t);
    app.querySelector('#create-session-form button').disabled = true;
    for (const prefix of ['setup', 'edit']) for (const index of [1, 2, 3]) app.querySelector(`#${prefix}-reflection-${index}`).value = t(`reflection${index}`);
  }
  else if (mode === 'display') app.innerHTML = createDisplayMarkup(t);
  else if (mode === 'join') app.innerHTML = createParticipantMarkup(t);
  else app.innerHTML = `<p class="rounded-xl border border-[#E2E0D8] bg-white p-5">${t('noSession')}</p>`;
  if (mode === 'join' && !sessionId) showError(t('noSession'));
}

function showError(message=t('error')) {
  const target = mode === 'host' ? document.querySelector(state.session ? '#host-live-error' : '#host-error') : mode === 'display' ? document.querySelector('#display-status') : document.querySelector('#join-error');
  if (target) target.textContent = message;
}

function watchSession(id) {
  state.stopSession?.();
  state.stopSession = service.observeSession(id,(value,ref)=>{
    if (!value || value.status === 'ended') {
      state.stopPresence?.();
      state.stopPresence = null;
      state.session = null;
      state.sessionRef = null;
      if (mode === 'join') renderParticipant(app,state,t);
      else if (mode === 'display') renderDisplay(app,state,t,[t('reflection1'),t('reflection2'),t('reflection3')],makeQr);
      else render();
      if (canHost && state.hostReady) void resumeHostSession();
      return;
    }
    state.session = value;
    state.sessionRef = ref;
    render();
    resumeParticipantIfKnown();
  },()=>showError());
}

function render() {
  if (canHost) renderHost(app,state,t,makeQr);
  if (mode === 'display') renderDisplay(app,state,t,[t('reflection1'),t('reflection2'),t('reflection3')],makeQr);
  if (mode === 'join') renderParticipant(app,state,t);
  updateTimer();
}

function renderRosterOptions() {
  if (canHost) { renderHostRoster(app,state.roster); if (state.session && !state.editingSettings) renderHost(app,state,t,makeQr); return; }
  const input = app.querySelector('#member-name');
  const list = app.querySelector('#member-roster-options');
  if (!input || !list) return;
  const entries = Object.entries(state.roster).sort((a,b)=>memberName(a[1]).localeCompare(memberName(b[1])));
  list.innerHTML = entries.map(([id,item])=>`<option value="${escapeHtml(memberName(item))}" data-id="${escapeHtml(id)}"></option>`).join('');
  if (!entries.length) showError(t('noRoster'));
  if (state.memberId && state.roster[state.memberId]) input.value = memberName(state.roster[state.memberId]);
}

function memberName(value) { return typeof value === 'string' ? value : value?.name || ''; }
function resumeParticipantIfKnown() {
  if (mode === 'join' && state.session && state.memberId && state.roster[state.memberId] && state.joinId !== state.memberId) void joinParticipant(state.memberId);
}

async function joinParticipant(id) {
  if (!state.sessionRef || !state.session || !state.roster[id] || state.joinId === id) return;
  state.memberId = id;
  state.joinId = id;
  sessionStorage.setItem(`debate_member_${state.sessionRef.key}`,id);
  try { state.stopPresence = await service.joinSession(state.sessionRef,id,memberName(state.roster[id]),state.presenceId,()=>showError()); render(); }
  catch { state.joinId=''; showError(); }
}

async function handleJoin(event) {
  event.preventDefault();
  const value = app.querySelector('#member-name').value.trim();
  const match = Object.entries(state.roster).find(([,item])=>memberName(item)===value);
  if (!match) { showError(t('invalidName')); return; }
  await joinParticipant(match[0]);
}

async function handleCreateSession(event) {
  event.preventDefault();
  if (!state.hostReady) return;
  const content = collectContent('setup');
  const internal = collectInternal('setup');
  const settings = content && internal ? {...content,...internal} : null;
  if (!settings) return;
  try {
    app.querySelector('#create-session-form button').disabled = true;
    const id = await service.createSession(settings);
    const url = new URL(location.href); url.search = `?mode=host&admin=1&session=${encodeURIComponent(id)}`;
    history.replaceState({},'',url.href);
    watchSession(id);
  } catch { showError(); }
  finally { app.querySelector('#create-session-form button').disabled = false; }
}

function collectContent(prefix) {
  const statement1 = app.querySelector(prefix === 'setup' ? '#statement-one' : '#edit-statement-one').value.trim();
  const statement2 = app.querySelector(prefix === 'setup' ? '#statement-two' : '#edit-statement-two').value.trim();
  if (!statement1 || !statement2) {
    if (prefix === 'edit') app.querySelector('#settings-status').textContent = t('completeSettings');
    else showError(t('completeSettings'));
    return null;
  }
  return {statement1, statement2, reflectionQuestions:Object.fromEntries([1, 2, 3].map(index => [index, app.querySelector(`#${prefix}-reflection-${index}`).value.trim() || t(`reflection${index}`)]))};
}

function collectInternal(prefix) {
  const hostId = app.querySelector(`#${prefix}-host`).value;
  const secretaryId = app.querySelector(`#${prefix}-secretary`).value;
  if ((hostId && !state.roster[hostId]) || (secretaryId && !state.roster[secretaryId]) || (hostId && hostId === secretaryId)) {
    const message = t(hostId && hostId === secretaryId ? 'differentRoles' : 'completeSettings');
    if (prefix === 'edit') app.querySelector('#internal-status').textContent = message;
    else showError(message);
    return null;
  }
  const role = id => id ? {id, name:memberName(state.roster[id])} : null;
  return {host:role(hostId), secretary:role(secretaryId), notes:app.querySelector(`#${prefix}-notes`).value.trim()};
}

async function handleSaveSettings(event) {
  event.preventDefault();
  if (!canHost || !state.sessionRef || state.session?.status === 'ended') return;
  await savePendingSettings(true);
}

async function handleSaveInternal(event) {
  event.preventDefault();
  if (!canHost || !state.sessionRef || state.session?.status === 'ended') return;
  await savePendingInternal(true);
}

async function handleSaveTimer(event) {
  event.preventDefault();
  if (!canHost || !state.sessionRef || state.session?.status === 'ended') return;
  await savePendingTimer(true);
}

async function savePendingSettings(force = false) {
  if (!force && !state.editingSettings) return true;
  const settings = collectContent('edit');
  if (!settings) return false;
  const status = app.querySelector('#settings-status');
  const saved = await saveSession(settings);
  if (saved) {
    state.editingSettings = false;
    status.textContent = t('settingsSaved');
  } else status.textContent = t('error');
  return saved;
}

async function savePendingInternal(force = false) {
  if (!force && !state.editingInternal) return true;
  const internal = collectInternal('edit');
  if (!internal) return false;
  const saved = await saveSession(internal);
  if (saved) {
    state.editingInternal = false;
    app.querySelector('#internal-status').textContent = t('settingsSaved');
  } else app.querySelector('#internal-status').textContent = t('error');
  return saved;
}

async function savePendingTimer(force = false) {
  if (!force && !state.editingTimer) return true;
  const minutes = parseTurnDurationMinutes(app.querySelector('#turn-duration-minutes').value);
  const status = app.querySelector('#timer-settings-status');
  if (minutes === null) {status.textContent = t('invalidTurnDuration'); return false;}
  const saved = await saveSession({'settings/turnDurationMs': minutes * 60000});
  if (saved) {
    if (state.session) state.session = {...state.session, settings: {...state.session.settings, turnDurationMs: minutes * 60000}};
    state.editingTimer = false;
    status.textContent = t('timerSettingsSaved');
    updateTimer();
  } else status.textContent = t('error');
  return saved;
}

async function savePendingChanges() {
  return await savePendingSettings() && await savePendingInternal() && await savePendingTimer();
}

async function saveSession(update) {
  if (!state.sessionRef) return false;
  try { await service.updateSession(state.sessionRef,update); return true; }
  catch { showError(); return false; }
}
async function startRound(number) {
  if (!canHost || !state.sessionRef || !canStartRound(state.session, number)) return;
  if (!await savePendingChanges()) return;
  if (!canStartRound(state.session, number)) return;
  await saveSession({round:String(number),phase:'active',status:'live',timer:{speakerId:null,endsAt:null,remainingMs:turnDurationMs(state.session),running:false,paused:false}});
}
async function endRound(number) {
  if (!canHost || !state.sessionRef || !canEndRound(state.session, number)) return;
  if (!roundComplete(String(number)) && !confirm(t('endRoundEarly'))) return;
  if (!await savePendingChanges()) return;
  if (!canEndRound(state.session, number)) return;
  await saveSession({phase:'ended',[`roundEndedAt/${number}`]:Date.now(),timer:{speakerId:null,endsAt:null,remainingMs:turnDurationMs(state.session),running:false,paused:false}});
}
async function openReflection() {
  if (!canHost || !state.sessionRef || !canOpenReflection(state.session)) return;
  if (!await savePendingChanges()) return;
  if (!canOpenReflection(state.session)) return;
  await saveSession({round:'reflection',phase:'active',status:'reflection',timer:{speakerId:null,endsAt:null,remainingMs:turnDurationMs(state.session),running:false,paused:false}});
}
async function endWorkshop() {
  if (!canHost || !state.sessionRef || !confirm(`${t('endSession')}?`)) return;
  if (!await savePendingChanges()) return;
  if (!state.sessionRef || state.session?.status === 'ended') return;
  const sessionId = state.sessionRef.key;
  state.hostReady = false;
  app.querySelector('#create-session-form button').disabled = true;
  const saved = await saveSession({round:'ended',status:'ended',endedAt:Date.now(),timer:{speakerId:null,endsAt:null,remainingMs:turnDurationMs(state.session),running:false,paused:false}});
  if (saved) {
    try {
      await service.clearActiveSession(sessionId);
      state.stopSession?.();
      state.session = null;
      state.sessionRef = null;
      const url = new URL(location.href); url.search = '?mode=host&admin=1';
      history.replaceState({},'',url.href);
      state.hostReady = true;
      app.querySelector('#create-session-form button').disabled = false;
      app.querySelector('#create-session-form').reset();
      for (const index of [1, 2, 3]) app.querySelector(`#setup-reflection-${index}`).value = t(`reflection${index}`);
      render();
    }
    catch { showError(); }
  } else { state.hostReady = true; app.querySelector('#create-session-form button').disabled = false; }
}
function roundComplete(round) {
  const participants = Object.keys(state.session?.participants || {});
  return participants.length > 0 && participants.every(id => state.session?.turns?.[round]?.[id]);
}
async function startTurn(speakerId) {
  if (!canHost || !speakerId || state.session.timer?.speakerId) return;
  const round = String(state.session.round);
  if (!isRoundActive(state.session, Number(round)) || state.session.turns?.[round]?.[speakerId]) return;
  if (!await savePendingChanges()) return;
  if (!isRoundActive(state.session, Number(round)) || state.session.timer?.speakerId || state.session.turns?.[round]?.[speakerId]) return;
  const durationMs = turnDurationMs(state.session);
  const now = Date.now();
  try { await service.writeTimer(state.sessionRef,{speakerId,startedAt:now,endsAt:now+durationMs,remainingMs:durationMs,running:true,paused:false}); }
  catch { showError(); }
}
async function pauseTurn(speakerId) {
  if (state.session.phase === 'ended' || state.session.timer?.speakerId !== speakerId || !state.session.timer?.running) return;
  const remainingMs = Math.max(0,state.session.timer.endsAt-Date.now());
  try { await service.writeTimer(state.sessionRef,{remainingMs,endsAt:null,running:false,paused:true},true); }
  catch { showError(); }
}
async function resumeTurn(speakerId) {
  if (state.session.phase === 'ended' || state.session.timer?.speakerId !== speakerId || !state.session.timer?.paused) return;
  const remainingMs = Math.max(0,state.session.timer.remainingMs||0);
  try { await service.writeTimer(state.sessionRef,{endsAt:Date.now()+remainingMs,running:true,paused:false},true); }
  catch { showError(); }
}
async function finishTurn(speakerId) {
  if (!canHost || !speakerId || state.session.phase === 'ended' || state.session.timer?.speakerId !== speakerId) return;
  const round = String(state.session.round);
  await saveSession({[`turns/${round}/${speakerId}`]:true,timer:{speakerId:null,endsAt:null,remainingMs:turnDurationMs(state.session),running:false,paused:false}});
}
async function chooseSide(side) {
  if (!state.memberId || !['true','false'].includes(side)) return;
  const round = String(state.session?.round);
  if (!isRoundActive(state.session, Number(round))) return;
  try { await service.chooseSide(state.sessionRef,round,state.memberId,side); }
  catch { showError(); }
}
function updateTimer() {
  const timer = state.session?.timer || {};
  const remainingMs = remainingTimeMs(state.session);
  const value = formatTime(remainingMs);
  for (const round of ['1','2']) {
    const hostTimer=app.querySelector(`#host-timer-${round}`);
    if(hostTimer)hostTimer.textContent=String(state.session?.round)===round?value:formatTime(turnDurationMs(state.session));
  }
  const displayTimer=app.querySelector('#display-timer'); if(displayTimer)displayTimer.textContent=timer.speakerId?value:'';
  const memberTimer=app.querySelector('#member-timer'); if(memberTimer)memberTimer.textContent=timer.speakerId?value:'';
  const previewTimer=app.querySelector('#preview-timer'); if(previewTimer)previewTimer.textContent=timer.speakerId?value:'';
}
function makeQr(element,url,size) {
  if (!element || element.dataset.qr === url) return;
  element.dataset.qr=url; element.innerHTML='';
  if (typeof QRCode === 'undefined') { element.textContent=''; return; }
  new QRCode(element,{text:url,width:size,height:size,colorDark:'#111111',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}
async function copyJoinLink() {
  const link=app.querySelector('#join-link');
  if (!link) return;
  try { await navigator.clipboard.writeText(link.href); link.textContent=t('copied'); }
  catch { link.focus(); }
}

async function showHostTab(name) {
  if (!canHost) return;
  if (state.activeTab === 'settings' && name !== 'settings' && state.session && !await savePendingChanges()) return;
  state.activeTab = name;
  render();
}

app.addEventListener('submit',event=>{
  if(event.target.id==='create-session-form')void handleCreateSession(event);
  if(event.target.id==='session-settings-form')void handleSaveSettings(event);
  if(event.target.id==='session-internal-form')void handleSaveInternal(event);
  if(event.target.id==='timer-settings-form')void handleSaveTimer(event);
  if(event.target.id==='join-session-form')void handleJoin(event);
});
app.addEventListener('input',event=>{if (event.target.closest('#session-settings-form')) {state.editingSettings = true; app.querySelector('#settings-status').textContent = '';}});
app.addEventListener('change',event=>{if (event.target.closest('#session-settings-form')) {state.editingSettings = true; app.querySelector('#settings-status').textContent = '';}});
app.addEventListener('input',event=>{if (event.target.closest('#session-internal-form')) {state.editingInternal = true; app.querySelector('#internal-status').textContent = '';}});
app.addEventListener('change',event=>{if (event.target.closest('#session-internal-form')) {state.editingInternal = true; app.querySelector('#internal-status').textContent = '';}});
app.addEventListener('input',event=>{if (event.target.closest('#timer-settings-form')) {state.editingTimer = true; app.querySelector('#timer-settings-status').textContent = '';}});
app.addEventListener('click',event=>{
  const side=event.target.closest('[data-side]');
  if(side){void chooseSide(side.dataset.side);return;}
  const control=event.target.closest('[data-action]');
  const action=control?.dataset.action;
  const speakerId=control?.dataset.speakerId;
  if(action==='show-control'||action==='show-settings'||action==='show-history')void showHostTab(action.slice(5));
  else if(action==='start-round1')void startRound(1);
  else if(action==='end-round1')void endRound(1);
  else if(action==='start-round2')void startRound(2);
  else if(action==='end-round2')void endRound(2);
  else if(action==='reflection')void openReflection();
  else if(action==='end-workshop')void endWorkshop();
  else if(action==='start-turn')void startTurn(speakerId);
  else if(action==='pause-turn')void pauseTurn(speakerId);
  else if(action==='resume-turn')void resumeTurn(speakerId);
  else if(action==='finish-turn')void finishTurn(speakerId);
  else if(action==='copy-link')void copyJoinLink();
});
document.querySelector('#language').addEventListener('change',event=>{localStorage.setItem('debate_language',event.target.value);location.reload();});
document.querySelector('#rules-button').addEventListener('click',()=>{
  renderRulesDialog(document,createRulesMarkup(language),t('close'));
  document.querySelector('#rules-modal').hidden=false;
  document.querySelector('#close-rules').focus();
});
document.querySelector('#close-rules').addEventListener('click',()=>{document.querySelector('#rules-modal').hidden=true;document.querySelector('#rules-button').focus();});
document.querySelector('#rules-modal').addEventListener('click',event=>{if(event.target.id==='rules-modal')document.querySelector('#rules-modal').hidden=true;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('#rules-modal').hidden=true;});

async function resumeHostSession() {
  try {
    let currentId = await service.readCurrentSessionId();
    let current = currentId ? await service.readSession(currentId) : null;
    if (current?.status === 'ended') {
      await service.clearActiveSession(currentId);
      currentId = null;
      current = null;
      state.stopSession?.();
      state.session = null;
      state.sessionRef = null;
    }
    if (!currentId && sessionId) {
      const linked = await service.readSession(sessionId);
      if (linked && linked.status !== 'ended') {
        currentId = await service.activateSession(sessionId);
      }
    }
    if (currentId && !current) current = await service.readSession(currentId);
    if (currentId && !current) { showError(t('resumeError')); return; }
    state.hostReady = true;
    app.querySelector('#create-session-form button').disabled = false;
    if (currentId) {
      const url = new URL(location.href); url.search = `?mode=host&admin=1&session=${encodeURIComponent(currentId)}`;
      history.replaceState({},'',url.href);
      watchSession(currentId);
    } else render();
  } catch { showError(t('resumeError')); }
}

function startApp() {
  mountView();
  if (canHost) render();
  service.observeRoster(roster=>{state.roster=roster;renderRosterOptions();resumeParticipantIfKnown();},()=>showError());
  if (canHost) {
    state.stopHistory = service.observeHistory(value=>{state.history=value;renderHostHistory(app,value,t);},()=>{app.querySelector('#host-history-list').textContent=t('error');});
    void resumeHostSession();
  } else if (sessionId) watchSession(sessionId);
  else if (mode==='display'||mode==='join') render();
  window.setInterval(updateTimer,1000);
}

window.addEventListener('pagehide',()=>{state.stopPresence?.();state.stopSession?.();state.stopHistory?.();});

if (canHost) {
  app.hidden = true;
  guardAdminPage(() => {app.hidden = false;startApp();});
} else startApp();
