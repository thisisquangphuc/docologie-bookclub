export const MEMBER_SECURITY_QUESTIONS = [
  {id:'clubBook',en:'What book did we discuss at your first club meeting?',de:'Welches Buch haben wir bei deinem ersten Clubtreffen besprochen?'},
  {id:'clubSnack',en:'What snack do you usually bring to the club?',de:'Welchen Snack bringst du normalerweise zum Club mit?'},
  {id:'clubPlace',en:'Where do we usually meet?',de:'Wo treffen wir uns normalerweise?'},
  {id:'clubPhrase',en:'What phrase or joke is often heard at our meetings?',de:'Welchen Spruch oder Witz hört man oft bei unseren Treffen?'}
];

export function normalizeMemberAnswer(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim();
}

export async function hashMemberAnswer(answer, salt) {
  const normalized = normalizeMemberAnswer(answer);
  const bytes = new TextEncoder().encode(`${salt}:${normalized}`);
  const digest = await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,'0')).join('');
}

export function createMemberAnswerSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(byte => byte.toString(16).padStart(2,'0')).join('');
}
