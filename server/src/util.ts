// this uses levenhstein distance, returns 0-1 the similarity
export function textSimilarity(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,    // Deletion
        dp[i][j - 1] + 1,    // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  const distance = dp[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// inclusive
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const commonPairs = [
  'th', 'he', 'in', 'er', 'an', 're', 'ed', 'on', 'es', 'st',
  'en', 'at', 'to', 'nt', 'ha', 'nd', 'ou', 'ea', 'ng', 'as',
  'or', 'ti', 'is', 'et', 'it', 'ar', 'te', 'se', 'hi', 'of',
];

// statistically tell if text is english by checking frequence of common pairs
export function isEnglishPairAnalysis(text: string): boolean {
  const lowerText = text.toLowerCase();
  let pairCount = 0;

  for (const pair of commonPairs) {
    const occurrences = (lowerText.match(new RegExp(pair, 'g')) || []).length;
    pairCount += occurrences;
  }

  const ratio = pairCount / text.length;
  return ratio > 0.05; // Threshold for English-like text
}

export function isEnglishAlphabetAnalysis(input: string): boolean {
  const nonEnglishRegex = /[Α-Ωабвгдежзийклмнопрстуфхцчшщъыьэюяא-תابتثجحخدذرزسشصضطظعغفقكلمنهويअ-हㄱ-ㅎあ-んアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンäöüßéàèçôùîâêûïë]/g;
  const nonEnglishMatches = input.match(nonEnglishRegex) || [];
  const alphabetMatches = input.match(/[a-zA-Z]/g) || [];
  const totalLetters = nonEnglishMatches.length + alphabetMatches.length;
  const nonEnglishPercentage = (nonEnglishMatches.length / totalLetters) * 100;

  return nonEnglishPercentage < 5;  // Consider English if less than 5% non-English letters
}