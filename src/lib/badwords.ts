import { getBadWords, addBadWords } from "@sit-sandbox/thai-bad-words";

let isInitialized = false;
let badWordsRegex: RegExp | null = null;

const ENGLISH_BAD_WORDS = [
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "motherfucker",
  "motherfucking",
  "shit",
  "bullshit",
  "shitty",
  "bitch",
  "bitches",
  "bitching",
  "asshole",
  "bastard",
  "cunt",
  "dickhead",
  "dumbass",
  "jackass",
  "pussy",
  "slut",
  "whore",
  "wanker",
  "nigger",
  "nigga",
  "faggot",
  "retard",
];

const EXTRA_THAI_BAD_WORDS = [
  "เสือก",
  "ส้นตรีน",
  "หน้าหี",
  "หน้าควย",
  "เย็ดแหม",
  "เย็ดเป็ด",
  "หมาไม่แดก",
  "กวนส้นตีน",
];

const IGNORE_WORDS = [
  "หีบ",
  "สัสดี",
  "หน้าหีบ",
  "ตด",
  "กะหรี่ปั๊บ",
  "บ้าน",
];

const SHORT_ENGLISH_REGEX = /\b(ass|dick|cock|tit|tits|crap|twat)\b/gi;

function initBadWords() {
  if (isInitialized && badWordsRegex) return;

  try {
    addBadWords([...ENGLISH_BAD_WORDS, ...EXTRA_THAI_BAD_WORDS]);
  } catch (err) {
    console.error("Failed to add custom bad words:", err);
  }

  const allWords = Array.from(new Set(getBadWords())).filter((w) => w && w.length > 0);
  allWords.sort((a, b) => b.length - a.length);

  badWordsRegex = new RegExp(
    allWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "gi"
  );

  isInitialized = true;
}

/**
 * Censors bad words in Thai and English by replacing each character with '*'.
 * Preserves safe words from the ignore list (e.g. กะหรี่ปั๊บ, หีบ).
 */
export function censorBadWords(text: string): string {
  if (!text) return text;

  initBadWords();

  // 1. Protect words in the ignore list
  const placeholders: { token: string; word: string }[] = [];
  let protectedText = text;

  IGNORE_WORDS.forEach((word, idx) => {
    if (protectedText.includes(word)) {
      const token = `___IGNORE_TOKEN_${idx}___`;
      placeholders.push({ token, word });
      protectedText = protectedText.split(word).join(token);
    }
  });

  // 2. Replace matched bad words with '*' for each character
  let result = protectedText;
  if (badWordsRegex) {
    result = result.replace(badWordsRegex, (match) => "*".repeat(match.length));
  }
  result = result.replace(SHORT_ENGLISH_REGEX, (match) => "*".repeat(match.length));

  // 3. Restore protected words
  placeholders.forEach(({ token, word }) => {
    result = result.split(token).join(word);
  });

  return result;
}
