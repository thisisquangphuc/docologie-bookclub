import { ROUND_DURATION_MS } from './config.js';

export function createDebateService(database) {
  return {
    observeRoster(onValue, onError) {
      const ref = database.ref('member_roster');
      ref.on('value', snapshot => onValue(snapshot.val() || {}), onError);
      return () => ref.off('value');
    },
    observeSession(sessionId, onValue, onError) {
      const ref = database.ref(`debate_sessions/${sessionId}`);
      ref.on('value', snapshot => onValue(snapshot.val(), ref), onError);
      return () => ref.off('value');
    },
    async createSession(statement1, statement2) {
      const ref = database.ref('debate_sessions').push();
      await ref.set({
        createdAt: Date.now(),
        status: 'ready',
        round: 'setup',
        statement1,
        statement2,
        participants: {},
        choices: {'1': {}, '2': {}},
        turns: {'1': {}, '2': {}},
        timer: {speakerId: null, endsAt: null, remainingMs: ROUND_DURATION_MS, running: false, paused: false}
      });
      return ref.key;
    },
    async joinSession(sessionRef, memberId, memberName) {
      const participantRef = sessionRef.child(`participants/${memberId}`);
      await participantRef.update({name: memberName, online: true, joinedAt: Date.now()});
      await participantRef.child('online').onDisconnect().set(false);
    },
    async chooseSide(sessionRef, round, memberId, side) {
      const choiceRef = sessionRef.child(`choices/${round}/${memberId}`);
      if (round === '1') return choiceRef.set({side, updatedAt: Date.now()});
      if (round === '2') return choiceRef.transaction(current => current || {side, updatedAt: Date.now()});
      return undefined;
    },
    async updateSession(sessionRef, values) {
      return sessionRef.update(values);
    },
    async writeTimer(sessionRef, value, merge = false) {
      const timerRef = sessionRef.child('timer');
      return merge ? timerRef.update(value) : timerRef.set(value);
    }
  };
}
