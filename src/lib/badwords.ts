import { scanBadWords, addBadWords } from "@sit-sandbox/thai-bad-words";

let isInitialized = false;

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

const SHORT_ENGLISH_REGEX = /\b(ass|dick|cock|tit|tits|crap|twat)\b/i;

function initBadWords() {
  if (isInitialized) return;
  try {
    addBadWords([...ENGLISH_BAD_WORDS, ...EXTRA_THAI_BAD_WORDS]);
  } catch (err) {
    console.error("Failed to add custom bad words:", err);
  }
  isInitialized = true;
}

export interface ProfanityCheckResult {
  hasBadWords: boolean;
  detectedWord?: string;
  message?: string;
}

/**
 * Checks text for inappropriate Thai and English words using @sit-sandbox/thai-bad-words
 * combined with additional English/Thai profanity filters.
 */
export async function checkProfanity(text: string): Promise<ProfanityCheckResult> {
  if (!text || !text.trim()) {
    return { hasBadWords: false };
  }

  initBadWords();

  // 1. Check Thai & primary English bad words via @sit-sandbox/thai-bad-words
  try {
    await scanBadWords(text);
  } catch (err: any) {
    const errorMsg: string = err?.message || "";
    // Library format: "Bad words detected! Found: xxx"
    const match = errorMsg.match(/Found:\s*(.+)$/i);
    const word = match ? match[1].trim() : undefined;
    return {
      hasBadWords: true,
      detectedWord: word,
      message: word
        ? `พบคำไม่เหมาะสมในข้อความ ("${word}") กรุณาใช้ถ้อยคำที่สุภาพ`
        : "พบคำไม่เหมาะสมในข้อความ กรุณาใช้ถ้อยคำที่สุภาพ",
    };
  }

  // 2. Check short English words with word boundary to prevent false positives (e.g. class, classic, glass)
  const shortMatch = text.match(SHORT_ENGLISH_REGEX);
  if (shortMatch) {
    return {
      hasBadWords: true,
      detectedWord: shortMatch[0],
      message: `พบคำไม่เหมาะสมในข้อความ ("${shortMatch[0]}") กรุณาใช้ถ้อยคำที่สุภาพ`,
    };
  }

  return { hasBadWords: false };
}
