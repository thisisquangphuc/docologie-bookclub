import { ADMIN_QUERY_CODE, ROUND_DURATION_MS, initializeDatabase } from './config.js';
import { createDebateService } from './session-service.js';
import { createRulesMarkup, escapeHtml, getLanguage, translate } from './i18n.js';
import { createDisplayMarkup, createHostMarkup, createParticipantMarkup, renderDisplay, renderHost, renderParticipant, renderRulesDialog } from './views.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'join';
const sessionId = params.get('session') || '';
const canHost = mode === 'host' && params.get('admin') === ADMIN_QUERY_CODE;
const language = getLanguage();
const database = initializeDatabase();
const service = createDebateService(database);
const app = document.querySelector('#app');
const state = {roster:{},session:null,sessionRef:null,memberId:sessionStorage.getItem(`debate_member_${sessionId}`)||'',joinId:'',stopSession:null};
const t = key => translate(language,key);

function mountView() {
  document.querySelector('#home-link').href = canHost ? 'admin.html' : 'index.html';
  document.querySelector('#language').value = language;
  document.querySelector('#page-title').textContent = t('title');
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
  document.querySelector('#rules-button').setAttribute('aria-label',t('rules'));
  if (canHost) app.innerHTML = createHostMarkup(t);
  else if (mode === 'display') app.innerHTML = createDisplayMarkup(t);
  else if (mode === 'join') app.innerHTML = createParticipantMarkup(t);
  else app.innerHTML = `<p class="rounded-xl border border-[#E2E0D8] bg-white p-5">${t('noSession')}</p>`;
  if (mode === 'join' && !sessionId) showError(t('noSession'));
}

function showError(message=t('error')) {
  const target = mode === 'host' ? (document.querySelector('#host-live-error')||document.querySelector('#host-error')) : mode === 'display' ? document.querySelector('#display-status') : document.querySelector('#join-error');
  if (target) target.textContent = message;
}

function watchSession(id) {
  state.stopSession?.();
  state.stopSession = service.observeSession(id,(value,ref)=>{
    if (!value) { state.session = null; showError(t('noSession')); return; }
    state.session = value;
    state.sessionRef = ref;
    render();
    resumeParticipantIfKnown();
  },()=>showError());
}

function render() {
  if (canHost) renderHost(app,state,t,makeQr);
  if (mode === 'display' && state.session) renderDisplay(app,state,t,[t('reflection1'),t('reflection2'),t('reflection3')],makeQr);
  if (mode === 'join' && state.session) renderParticipant(app,state,t);
}

function renderRosterOptions() {
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
  if (mode === 'join' && state.session && state.memberId && state.roster[state.memberId] && state.joinId !== state.memberId) joinParticipant(state.memberId);
}

async function joinParticipant(id) {
  if (!state.sessionRef || !state.roster[id] || state.joinId === id) return;
  state.memberId = id;
  state.joinId = id;
  sessionStorage.setItem(`debate_member_${state.sessionRef.key}`,id);
  try { await service.joinSession(state.sessionRef,id,memberName(state.roster[id])); render(); }
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
  const statement1 = app.querySelector('#statement-one').value.trim();
  const statement2 = app.querySelector('#statement-two').value.trim();
  if (!statement1 || !statement2) return;
  try {
    const id = await service.createSession(statement1,statement2);
    const url = new URL(location.href); url.search = `?mode=host&admin=${ADMIN_QUERY_CODE}&session=${encodeURIComponent(id)}`;
    history.replaceState({},'',url.href);
    watchSession(id);
  } catch { showError(); }
}

async function saveSession(update) {
  if (!state.sessionRef) return false;
  try { await service.updateSession(state.sessionRef,update); return true; }
  catch { showError(); return false; }
}
async function startRound(number) {
  if (!canHost || !state.sessionRef) return;
  if (number === 1 && state.session.round !== 'setup') return;
  if (number === 2 && (state.session.round !== '1' || !roundComplete('1'))) return;
  const saved = await saveSession({round:String(number),status:'live',timer:{speakerId:null,endsAt:null,remainingMs:ROUND_DURATION_MS,running:false,paused:false}});
  if (saved && number === 1) {
    try { await service.activateSession(state.sessionRef.key); }
    catch { showError(); }
  }
}
function openReflection() {
  if (!canHost || !state.sessionRef || state.session.round !== '2' || !roundComplete('2')) return;
  void saveSession({round:'reflection',status:'reflection',timer:{speakerId:null,endsAt:null,remainingMs:ROUND_DURATION_MS,running:false,paused:false}});
}
async function endWorkshop() {
  if (!canHost || !state.sessionRef || !confirm(`${t('endSession')}?`)) return;
  const sessionId = state.sessionRef.key;
  const saved = await saveSession({round:'ended',status:'ended',timer:{speakerId:null,endsAt:null,remainingMs:ROUND_DURATION_MS,running:false,paused:false}});
  if (saved) {
    try { await service.clearActiveSession(sessionId); }
    catch { showError(); }
  }
}
function roundComplete(round) {
  const participants = Object.keys(state.session?.participants || {});
  return participants.length > 0 && participants.every(id => state.session?.turns?.[round]?.[id]);
}
async function startTurn(speakerId) {
  if (!canHost || !speakerId || state.session.timer?.speakerId) return;
  const round = String(state.session.round);
  if (!['1','2'].includes(round) || state.session.turns?.[round]?.[speakerId]) return;
  try { await service.writeTimer(state.sessionRef,{speakerId,startedAt:Date.now(),endsAt:Date.now()+ROUND_DURATION_MS,remainingMs:ROUND_DURATION_MS,running:true,paused:false}); }
  catch { showError(); }
}
async function pauseTurn(speakerId) {
  if (state.session.timer?.speakerId !== speakerId || !state.session.timer?.running) return;
  const remainingMs = Math.max(0,state.session.timer.endsAt-Date.now());
  try { await service.writeTimer(state.sessionRef,{remainingMs,endsAt:null,running:false,paused:true},true); }
  catch { showError(); }
}
async function resumeTurn(speakerId) {
  if (state.session.timer?.speakerId !== speakerId || !state.session.timer?.paused) return;
  const remainingMs = Math.max(0,state.session.timer.remainingMs||0);
  try { await service.writeTimer(state.sessionRef,{endsAt:Date.now()+remainingMs,running:true,paused:false},true); }
  catch { showError(); }
}
async function finishTurn(speakerId) {
  if (!canHost || !speakerId || state.session.timer?.speakerId !== speakerId) return;
  const round = String(state.session.round);
  await saveSession({[`turns/${round}/${speakerId}`]:true,timer:{speakerId:null,endsAt:null,remainingMs:ROUND_DURATION_MS,running:false,paused:false}});
}
async function chooseSide(side) {
  if (!state.memberId || !['true','false'].includes(side)) return;
  const round = String(state.session?.round);
  if (!['1','2'].includes(round)) return;
  try { await service.chooseSide(state.sessionRef,round,state.memberId,side); }
  catch { showError(); }
}
function formatTime(milliseconds) {
  const seconds = Math.max(0,Math.ceil(milliseconds/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
function updateTimer() {
  const timer = state.session?.timer || {};
  const remainingMs = timer.running ? Math.max(0,(timer.endsAt||0)-Date.now()) : timer.paused ? Math.max(0,timer.remainingMs||0) : ROUND_DURATION_MS;
  const value = formatTime(remainingMs);
  for (const round of ['1','2']) {
    const hostTimer=app.querySelector(`#host-timer-${round}`);
    if(hostTimer)hostTimer.textContent=String(state.session?.round)===round?value:'03:00';
  }
  const displayTimer=app.querySelector('#display-timer'); if(displayTimer)displayTimer.textContent=timer.speakerId?value:'';
  const memberTimer=app.querySelector('#member-timer'); if(memberTimer)memberTimer.textContent=timer.speakerId?value:'';
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

app.addEventListener('submit',event=>{
  if(event.target.id==='create-session-form')void handleCreateSession(event);
  if(event.target.id==='join-session-form')void handleJoin(event);
});
app.addEventListener('click',event=>{
  const side=event.target.closest('[data-side]');
  if(side){void chooseSide(side.dataset.side);return;}
  const control=event.target.closest('[data-action]');
  const action=control?.dataset.action;
  const speakerId=control?.dataset.speakerId;
  if(action==='start-round1')void startRound(1);
  else if(action==='start-round2')void startRound(2);
  else if(action==='reflection')openReflection();
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

mountView();
service.observeRoster(roster=>{state.roster=roster;renderRosterOptions();resumeParticipantIfKnown();},()=>showError());
if (sessionId && (mode !== 'host' || canHost)) watchSession(sessionId);
else if (mode==='display'||mode==='join') { showError(t('noSession')); if(mode==='join')app.querySelector('#join-session-form').hidden=true; }
window.setInterval(updateTimer,1000);
