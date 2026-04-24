export function estimateTokens(text: string): number {
  // Simple heuristic: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export function calculateReduction(original: number, reduced: number): number {
  if (original === 0) return 0;
  return 1 - (reduced / original);
}
