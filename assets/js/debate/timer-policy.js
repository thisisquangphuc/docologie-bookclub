import { ROUND_DURATION_MS } from './config.js';

export const MIN_TURN_DURATION_MINUTES = 3;
export const MAX_TURN_DURATION_MINUTES = 30;

export function parseTurnDurationMinutes(value) {
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= MIN_TURN_DURATION_MINUTES && minutes <= MAX_TURN_DURATION_MINUTES ? minutes : null;
}

export function turnDurationMs(session) {
  const milliseconds = session?.settings?.turnDurationMs;
  const minutes = parseTurnDurationMinutes(milliseconds / 60000);
  return minutes === null ? ROUND_DURATION_MS : minutes * 60000;
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
