/**
 * Simple string similarity using Dice coefficient.
 * Returns a value between 0 and 1.
 */
export function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/\s+/g, '')
  const s2 = b.toLowerCase().replace(/\s+/g, '')

  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return 0

  const bigrams1 = new Set<string>()
  const bigrams2 = new Set<string>()

  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2))
  }
  for (let i = 0; i < s2.length - 1; i++) {
    bigrams2.add(s2.substring(i, i + 2))
  }

  let intersection = 0
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) intersection++
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size)
}
