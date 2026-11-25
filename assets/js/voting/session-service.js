export function createVotingService(database) {
  function observe(path, onValue, onError) {
    const reference = database.ref(path);
    const listener = snapshot => onValue(snapshot.val() || {});
    reference.on('value', listener, onError);
    return () => reference.off('value', listener);
  }

  return {
    observe,
    read: path => database.ref(path).once('value').then(snapshot => snapshot.val() || {}),
    addMember: member => database.ref('member_roster').push().set(member),
    removeMember: id => database.ref().update({[`member_roster/${id}`]:null,[`member_security_questions/${id}`]:null,[`member_security_secrets/${id}`]:null,[`member_security_proofs/${id}`]:null,[`current_session_members/${id}`]:null,[`current_session_presence/${id}`]:null,[`current_ballots/${id}`]:null}),
    setMemberSecurity: (id, questionId, salt, answerHash) => database.ref().update({[`member_security_questions/${id}`]:{questionId,salt},[`member_security_secrets/${id}/answerHash`]:answerHash}),
    addBook: book => database.ref('books_pool').push().set(book),
    setBookActive: (id, active) => database.ref(`books_pool/${id}/active`).set(active),
    removeBook: id => database.ref(`books_pool/${id}`).remove(),
    clearBallot: id => database.ref(`current_ballots/${id}`).remove(),
    setMemberAttendance: (id, attending) => attending ? database.ref(`current_session_members/${id}`).set(true) : database.ref().update({[`current_session_members/${id}`]:null,[`current_session_presence/${id}`]:null,[`current_ballots/${id}`]:null}),
    castBallot: (id, makeBallot) => database.ref(`current_ballots/${id}`).transaction(makeBallot),
    recordMemberEntry: (id, sessionId, clientId) => database.ref(`current_session_presence/${id}`).transaction(old => {
      const previous = old?.sessionId === sessionId ? old : null;
      const now = Date.now();
      return {sessionId,firstEnteredAt:previous?.firstEnteredAt || now,lastEnteredAt:now,clientIds:[...new Set([...(previous?.clientIds || []),clientId])],securityClientId:clientId};
    }),
    set: (path, value) => database.ref(path).set(value),
    update: values => database.ref().update(values),
    claimWildcardDraw: (sessionId, clientId, now) => database.ref('pending_results').transaction(result => {
      if (result?.sessionId !== sessionId || result.drawnAt || (result.drawClaim?.startedAt && now - result.drawClaim.startedAt < 30000)) return;
      return {...result,drawStartedAt:now,drawClaim:{clientId,startedAt:now}};
    },undefined,false),
    commitWildcardDraw: (sessionId, clientId, chosenId, now) => database.ref('pending_results').transaction(result => {
      if (result?.sessionId !== sessionId || result.drawnAt || result.drawClaim?.clientId !== clientId) return;
      const chosen = result.wildcardCandidates?.find(book => book.id === chosenId);
      if (!chosen) return;
      return {...result,winners:[...(result.winners || []),chosen],drawnAt:now,drawnDate:new Date(now).toISOString().slice(0,10),drawClaim:null};
    },undefined,false)
  };
}
