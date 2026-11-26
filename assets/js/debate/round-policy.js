export function canStartRound(session, number) {
  if (!session || session.status === 'ended') return false;
  if (number === 1) return session.round === 'setup';
  if (number === 2) return session.round === '1' && session.phase === 'ended';
  return false;
}

export function canEndRound(session, number) {
  return !!session && session.status !== 'ended' && session.round === String(number) && session.phase !== 'ended';
}

export function canOpenReflection(session) {
  return !!session && session.status !== 'ended' && session.round === '2' && session.phase === 'ended';
}

export function isRoundActive(session, number) {
  return canEndRound(session, number);
}
