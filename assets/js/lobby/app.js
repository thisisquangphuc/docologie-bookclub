import { initializeDatabase } from '../shared/firebase.js';
import { createLobbyService } from './service.js';

const service = createLobbyService(initializeDatabase());
const eventList = document.querySelector('#event-list');
const emptyState = document.querySelector('#empty-state');
const events = {voting:null,debate:null};
const locale = navigator.language || 'en-GB';
let stopVoting;
let stopDebate;
let stopPresence;

function formatDate(value) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
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

function render() {
  eventList.replaceChildren();
  const hasEvents = !!events.voting || !!events.debate;
  emptyState.hidden = hasEvents;
  if (events.voting) eventList.append(addEventCard({kind:'Voting',title:'Book Club Vote',description:'Choose your books for the next club session.',date:formatDate(events.voting.sessionDate),href:'voting.html',label:'Join voting'}));
  if (events.debate) eventList.append(addEventCard({kind:'Debate Workshop',title:'Debate Workshop',description:events.debate.statement || 'Join the ongoing workshop.',date:formatDate(new Date(events.debate.createdAt).toISOString().slice(0,10)),href:`debate.html?mode=join&session=${encodeURIComponent(events.debate.sessionId)}`,label:'Join debate'}));
}

function showError() {
  const error = document.querySelector('#lobby-error');
  error.hidden = false;
  error.textContent = 'Some live lobby information could not load. Check your connection and try again.';
}

document.querySelector('#lobby-date').textContent = new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
const clientId = crypto.randomUUID();
stopVoting = service.observeVoting(value => {events.voting = value;render();},showError);
stopDebate = service.observeDebate(value => {events.debate = value;render();},showError);
stopPresence = service.observeWaitingCount(clientId,count => {document.querySelector('#lobby-count').textContent = String(count);},showError);
window.addEventListener('pagehide',() => {stopVoting?.();stopDebate?.();stopPresence?.();});
