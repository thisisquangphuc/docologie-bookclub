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
    async readCurrentSessionId() {
      const snapshot = await database.ref('active_debate_session').once('value');
      return snapshot.val();
    },
    async readSession(sessionId) {
      const snapshot = await database.ref(`debate_sessions/${sessionId}`).once('value');
      return snapshot.val();
    },
    observeHistory(onValue, onError) {
      const ref = database.ref('debate_sessions');
      let previous = '';
      const listener = snapshot => {
        const ended = Object.fromEntries(Object.entries(snapshot.val() || {}).filter(([, session]) => session?.status === 'ended'));
        const next = JSON.stringify(ended);
        if (next === previous) return;
        previous = next;
        onValue(ended);
      };
      ref.on('value', listener, onError);
      return () => ref.off('value', listener);
    },
    async createSession(settings) {
      const ref = database.ref('debate_sessions').push();
      const activeRef = database.ref('active_debate_session');
      await ref.set({
        createdAt: Date.now(),
        status: 'ready',
        round: 'setup',
        ...settings,
        participants: {},
        choices: {'1': {}, '2': {}},
        turns: {'1': {}, '2': {}},
        timer: {speakerId: null, endsAt: null, remainingMs: ROUND_DURATION_MS, running: false, paused: false}
      });
      try {
        const claim = await activeRef.transaction(current => current ? undefined : ref.key);
        if (claim.committed) return ref.key;
        await ref.remove();
        return claim.snapshot.val();
      } catch (error) {
        await ref.remove();
        throw error;
      }
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
    async activateSession(sessionId) {
      const result = await database.ref('active_debate_session').transaction(current => current ? undefined : sessionId);
      return result.snapshot.val();
    },
    async clearActiveSession(sessionId) {
      return database.ref('active_debate_session').transaction(current => current === sessionId ? null : current);
    },
    async writeTimer(sessionRef, value, merge = false) {
      const timerRef = sessionRef.child('timer');
      return merge ? timerRef.update(value) : timerRef.set(value);
    }
  };
}
