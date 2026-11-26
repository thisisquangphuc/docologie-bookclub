import { ROUND_DURATION_MS } from './config.js';

export const MIN_TURN_DURATION_MINUTES = 3;
export const MAX_TURN_DURATION_MINUTES = 30;
export const TURN_DURATION_OPTIONS_MINUTES = [3, 5, 10, 15, 20, 25, 30];

export function parseTurnDurationMinutes(value) {
  const minutes = Number(value);
  return TURN_DURATION_OPTIONS_MINUTES.includes(minutes) ? minutes : null;
}

export function turnDurationMs(session) {
  const milliseconds = session?.settings?.turnDurationMs;
  const minutes = milliseconds / 60000;
  return Number.isInteger(minutes) && minutes >= MIN_TURN_DURATION_MINUTES && minutes <= MAX_TURN_DURATION_MINUTES ? minutes * 60000 : ROUND_DURATION_MS;
}

export function remainingTimeMs(session, now = Date.now()) {
  const timer = session?.timer || {};
  if (timer.speakerId && timer.running) return Math.max(0, (timer.endsAt || 0) - now);
  if (timer.speakerId && timer.paused) return Math.max(0, timer.remainingMs || 0);
  return turnDurationMs(session);
}

export function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
