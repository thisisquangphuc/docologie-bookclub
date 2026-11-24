export function createVotingService(database) {
  function observe(path, onValue, onError) {
    const reference = database.ref(path);
    const listener = snapshot => onValue(snapshot.val() || {});
    reference.on('value', listener, onError);
    return () => reference.off('value', listener);
  }

  return {
    observe,
    addMember: member => database.ref('member_roster').push().set(member),
    removeMember: id => database.ref().update({[`member_roster/${id}`]:null,[`current_session_members/${id}`]:null,[`current_ballots/${id}`]:null}),
    addBook: book => database.ref('books_pool').push().set(book),
    setBookActive: (id, active) => database.ref(`books_pool/${id}/active`).set(active),
    removeBook: id => database.ref(`books_pool/${id}`).remove(),
    setMemberAttendance: (id, attending) => attending ? database.ref(`current_session_members/${id}`).set(true) : database.ref().update({[`current_session_members/${id}`]:null,[`current_ballots/${id}`]:null}),
    castBallot: (id, makeBallot) => database.ref(`current_ballots/${id}`).transaction(makeBallot),
    set: (path, value) => database.ref(path).set(value),
    update: values => database.ref().update(values),
    nextHistoryKey: () => database.ref('history').push().key
  };
}
