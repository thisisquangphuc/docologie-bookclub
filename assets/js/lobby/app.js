import { initializeDatabase } from '../shared/firebase.js';
import { createLobbyService } from './service.js';

const service = createLobbyService(initializeDatabase());
const eventList = document.querySelector('#event-list');
const emptyState = document.querySelector('#empty-state');
const loadingState = document.querySelector('#event-loading');
const memberEntry = document.querySelector('#member-entry');
const lobbyContent = document.querySelector('#lobby-content');
const memberSelect = document.querySelector('#member-name');
const enterButton = document.querySelector('#enter-lobby-button');
const continueButton = document.querySelector('#continue-lobby');
const locale = navigator.language || 'en-GB';
const lobbyClientId = crypto.randomUUID();
const events = {voting:null,debate:null};
const eventSources = {voting:{loaded:false,error:false},debate:{loaded:false,error:false}};
let roster = {};
let selectedMemberId = sessionStorage.getItem('member_lobby_id') || '';
let activeMemberId = '';
let pendingMemberId = '';
let checkingMemberId = '';
let stopVoting;
let stopDebate;
let stopRoster;
let stopPresence;

function memberName(value) {
  return typeof value === 'string' ? value : value?.name || '';
}

function formatDate(value) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
}

function populateMemberSelect() {
  const selected = roster[selectedMemberId] ? selectedMemberId : '';
  memberSelect.replaceChildren(new Option('Choose your name…',''));
  Object.entries(roster).sort((a,b)=>memberName(a[1]).localeCompare(memberName(b[1]))).forEach(([id,person]) => {
    const option = new Option(memberName(person),id);
    memberSelect.add(option);
  });
  memberSelect.value = selected;
  memberSelect.disabled = Object.keys(roster).length === 0;
  memberSelect.options[0].textContent = Object.keys(roster).length ? 'Choose your name…' : 'No members found. Ask the host to add the club roster.';
}

function addEventCard({kind,title,description,date,href,label}) {
  const card = document.createElement('a');
  card.href = href;
  card.className = 'block rounded-xl border border-[#E2E0D8] bg-white p-5 transition hover:border-neutral-900 hover:shadow-sm';
  const kicker = document.createElement('p');
  kicker.className = 'text-xs font-semibold uppercase tracking-widest text-[#71363C]';
  kicker.textContent = kind;
  const heading = document.createElement('h3');
  heading.className = 'serif mt-2 text-2xl';
  heading.textContent = title;
  const summary = document.createElement('p');
  summary.className = 'mt-1 text-sm text-neutral-600';
  summary.textContent = description;
  const dateLabel = document.createElement('p');
  dateLabel.className = 'mt-3 text-xs text-neutral-500';
  dateLabel.textContent = date;
  const action = document.createElement('p');
  action.className = 'mt-4 text-sm font-semibold';
  action.textContent = `${label} →`;
  card.append(kicker,heading,summary,dateLabel,action);
  return card;
}

function renderEvents() {
  eventList.replaceChildren();
  const hasEvents = !!events.voting || !!events.debate;
  const allLoaded = eventSources.voting.loaded && eventSources.debate.loaded;
  const hasErrors = eventSources.voting.error || eventSources.debate.error;
  loadingState.hidden = allLoaded && !hasErrors;
  if (hasErrors) loadingState.textContent = 'Could not check whether an event is open. Please refresh or try again later.';
  emptyState.hidden = !allLoaded || hasErrors || hasEvents;
  if (events.voting) eventList.append(addEventCard({kind:'Voting',title:'Book Club Vote',description:'Choose your books for the next club session.',date:formatDate(events.voting.sessionDate),href:'voting.html',label:'Join voting'}));
  if (events.debate) eventList.append(addEventCard({kind:'Debate Workshop',title:'Debate Workshop',description:events.debate.statement || 'Join the ongoing workshop.',date:formatDate(new Date(events.debate.createdAt).toISOString().slice(0,10)),href:`debate.html?mode=join&session=${encodeURIComponent(events.debate.sessionId)}`,label:'Join debate'}));
}

function showError(message='Some live lobby information could not load. Check your connection and try again.') {
  const error = document.querySelector('#lobby-error');
  error.hidden = false;
  error.textContent = message;
}

function enterLobby(memberId) {
  if (!memberId || !roster[memberId]) {
    document.querySelector('#member-entry-status').textContent = 'Choose your name from the club member list.';
    return;
  }
  selectedMemberId = memberId;
  activeMemberId = memberId;
  sessionStorage.setItem('member_lobby_id',memberId);
  document.querySelector('#member-entry-status').textContent = '';
  document.querySelector('#lobby-error').hidden = true;
  document.querySelector('#welcome-member').textContent = `Welcome, ${memberName(roster[memberId])}`;
  document.querySelector('#lobby-date').textContent = formatDate('');
  memberEntry.hidden = true;
  lobbyContent.hidden = false;
  stopPresence = service.observeWaitingCount(memberId,lobbyClientId,count => {document.querySelector('#lobby-count').textContent = String(count);},showError);
}

async function handleMemberEntry(event) {
  event.preventDefault();
  const memberId = memberSelect.value;
  if (!memberId || !roster[memberId] || checkingMemberId) {
    if (!memberId || !roster[memberId]) document.querySelector('#member-entry-status').textContent = 'Choose your name from the club member list.';
    return;
  }
  checkingMemberId = memberId;
  enterButton.disabled = true;
  document.querySelector('#member-entry-status').textContent = 'Checking whether this name is already in the lobby…';
  try {
    const alreadyPresent = await service.isMemberInLobby(memberId,lobbyClientId);
    if (memberSelect.value !== memberId) return;
    if (alreadyPresent) {
      pendingMemberId = memberId;
      document.querySelector('#member-entry-status').textContent = 'This name is already in the lobby from another tab or device. Continue anyway?';
      continueButton.hidden = false;
      return;
    }
    enterLobby(memberId);
  } catch {
    document.querySelector('#member-entry-status').textContent = 'Could not check the lobby right now. Please try again.';
  } finally {
    checkingMemberId = '';
    enterButton.disabled = false;
  }
}

function returnToMemberEntry() {
  stopPresence?.();
  stopPresence = null;
  pendingMemberId = '';
  continueButton.hidden = true;
  activeMemberId = '';
  selectedMemberId = '';
  sessionStorage.removeItem('member_lobby_id');
  document.querySelector('#lobby-count').textContent = '0';
  document.querySelector('#member-entry-status').textContent = '';
  lobbyContent.hidden = true;
  memberEntry.hidden = false;
  populateMemberSelect();
}

function showEventError(kind) {
  eventSources[kind].error = true;
  renderEvents();
  showError();
}

document.querySelector('#member-entry-form').addEventListener('submit',event => {
  void handleMemberEntry(event);
});
continueButton.addEventListener('click',() => {
  if (!pendingMemberId) return;
  const memberId = pendingMemberId;
  pendingMemberId = '';
  continueButton.hidden = true;
  enterLobby(memberId);
});
memberSelect.addEventListener('change',() => {
  pendingMemberId = '';
  continueButton.hidden = true;
  document.querySelector('#member-entry-status').textContent = '';
});
document.querySelector('#change-member').addEventListener('click',returnToMemberEntry);
document.querySelector('#lobby-date').textContent = formatDate('');
populateMemberSelect();
stopRoster = service.observeRoster(value => {
  roster = value || {};
  if (activeMemberId && !roster[activeMemberId]) {
    returnToMemberEntry();
    document.querySelector('#member-entry-status').textContent = 'Your name is no longer in the club member list. Choose another name or ask the host for help.';
  }
  populateMemberSelect();
},error => {document.querySelector('#member-entry-status').textContent = error?.message || 'Could not load the club member list.';});
stopVoting = service.observeVoting(value => {
  events.voting = value;
  eventSources.voting.loaded = true;
  eventSources.voting.error = false;
  renderEvents();
},() => showEventError('voting'));
stopDebate = service.observeDebate(value => {
  events.debate = value;
  eventSources.debate.loaded = true;
  eventSources.debate.error = false;
  renderEvents();
},() => showEventError('debate'));
window.addEventListener('pagehide',() => {stopVoting?.();stopDebate?.();stopRoster?.();stopPresence?.();});
