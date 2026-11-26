export const MEMBER_SECURITY_QUESTIONS = [
  { id: 'primarySchool', en: 'What was the name of your primary school?', de: 'Wie hieß deine Grundschule?' },
  { id: 'middleSchool', en: 'What was the name of your middle school?', de: 'Wie hieß deine Mittelschule?' },
  { id: 'highSchool', en: 'What was the name of your high school?', de: 'Wie hieß deine weiterführende Schule?' },
  { id: 'university', en: 'Which university did you attend?', de: 'Welche Universität hast du besucht?' },
  { id: 'favoriteBook', en: 'What is your favorite book?', de: 'Was ist dein Lieblingsbuch?' },
  { id: 'firstBook', en: 'What is the first book you remember reading?', de: 'An welches erste Buch, das du gelesen hast, erinnerst du dich?' },
  { id: 'favoriteAuthor', en: 'Who is your favorite author?', de: 'Wer ist dein Lieblingsautor oder deine Lieblingsautorin?' },
  { id: 'favoriteGenre', en: 'What is your favorite book genre?', de: 'Welches Buchgenre magst du am liebsten?' },
  { id: 'favoriteCharacter', en: 'Who is your favorite character from a book?', de: 'Wer ist deine Lieblingsfigur aus einem Buch?' },
  { id: 'favoriteSeries', en: 'What is your favorite book series?', de: 'Was ist deine Lieblingsbuchreihe?' },
  { id: 'mostReReadBook', en: 'Which book have you reread the most?', de: 'Welches Buch hast du am häufigsten erneut gelesen?' },
  { id: 'favoriteReadingPlace', en: 'Where do you most like to read?', de: 'Wo liest du am liebsten?' }
];

export function normalizeMemberAnswer(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export async function hashMemberAnswer(answer, salt) {
  const normalized = normalizeMemberAnswer(answer);
  const bytes = new TextEncoder().encode(`${salt}:${normalized}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createMemberAnswerSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
