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