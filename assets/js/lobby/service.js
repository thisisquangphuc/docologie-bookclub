export function createLobbyService(database) {
  function observe(path, onValue, onError) {
    const reference = database.ref(path);
    const listener = snapshot => onValue(snapshot.val());
    reference.on('value', listener, onError);
    return () => reference.off('value', listener);
  }

  return {
    observeVoting(onValue, onError) {
      return observe('settings', settings => {
        const sessionId = settings?.sessionId || 'initial';
        const explicitlyOpen = settings?.votingOpen === true;
        const legacyOpen = settings?.votingOpen === undefined && settings?.locked === false;
        const active = (explicitlyOpen || legacyOpen) && settings?.locked !== true && settings?.archivedSessionId !== sessionId;
        onValue(active ? {sessionNumber: settings.sessionNumber || 1, sessionDate: settings.sessionDate || ''} : null);
      }, onError);
    },
    observeDebate(onValue, onError) {
      let stopSession = null;
      const stopActive = observe('active_debate_session', sessionId => {
        stopSession?.();
        stopSession = null;
        if (!sessionId) { onValue(null); return; }
        stopSession = observe(`debate_sessions/${sessionId}`, session => {
          if (!session || !['1','2','reflection'].includes(String(session.round))) { onValue(null); return; }
          const statement = session.round === '1' ? session.statement1 : session.round === '2' ? session.statement2 : '';
          onValue({sessionId, statement, round:session.round, createdAt:session.createdAt || 0});
        }, onError);
      }, onError);
      return () => { stopActive(); stopSession?.(); };
    },
    observeRoster(onValue, onError) {
      return observe('member_roster',onValue,onError);
    },
    observeSettings(onValue, onError) {
      return observe('settings',onValue,onError);
    },
    observeSecurityQuestions(onValue, onError) {
      return observe('member_security_questions',onValue,onError);
    },
    verifyMemberAnswer(memberId, clientId, answerHash) {
      return database.ref(`member_security_proofs/${memberId}/${clientId}`).set(answerHash);
    },
    async isMemberInLobby(memberId, ownClientId) {
      const snapshot = await database.ref(`lobby_presence/${memberId}`).once('value');
      const sessions = snapshot.val() || {};
      return Object.keys(sessions).some(clientId => clientId !== ownClientId);
    },
    observeWaitingCount(memberId, clientId, onValue, onError) {
      const presenceRef = database.ref(`lobby_presence/${memberId}/${clientId}`);
      const connectionRef = database.ref('.info/connected');
      const connectionListener = snapshot => {
        if (snapshot.val() !== true) return;
        presenceRef.onDisconnect().remove().then(() => presenceRef.set({joinedAt:Date.now()})).catch(onError);
      };
      const countRef = database.ref('lobby_presence');
      const countListener = snapshot => {
        const members = snapshot.val() || {};
        onValue(Object.values(members).filter(sessions => sessions && Object.keys(sessions).length > 0).length);
      };
      connectionRef.on('value', connectionListener, onError);
      countRef.on('value', countListener, onError);
      return () => {
        connectionRef.off('value', connectionListener);
        countRef.off('value', countListener);
        presenceRef.remove().catch(() => {});
      };
    }
  };
}
