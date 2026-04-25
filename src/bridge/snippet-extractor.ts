import fs from 'fs/promises';
import path from 'path';

export interface EvidenceSnippet {
  line_start: number;
  line_end: number;
  content: string;
}

export async function extractSnippets(
  filePath: string, 
  keywords: string[], 
  rootDir: string
): Promise<EvidenceSnippet[]> {
  try {
    const fullPath = path.join(rootDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');
    const snippets: EvidenceSnippet[] = [];

    const matchedLines = new Set<number>();
    lines.forEach((line, index) => {
      if (keywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) {
        matchedLines.add(index);
      }
    });

    // Group close lines into snippets
    const sortedLines = Array.from(matchedLines).sort((a, b) => a - b);
    let currentSnippet: { start: number; end: number } | null = null;

    for (const lineIdx of sortedLines) {
      if (!currentSnippet) {
        currentSnippet = { start: Math.max(0, lineIdx - 2), end: Math.min(lines.length - 1, lineIdx + 2) };
      } else if (lineIdx <= currentSnippet.end + 3) {
        currentSnippet.end = Math.min(lines.length - 1, lineIdx + 2);
      } else {
        snippets.push({
          line_start: currentSnippet.start + 1,
          line_end: currentSnippet.end + 1,
          content: lines.slice(currentSnippet.start, currentSnippet.end + 1).join('\n')
        });
        currentSnippet = { start: Math.max(0, lineIdx - 2), end: Math.min(lines.length - 1, lineIdx + 2) };
      }
    }

    if (currentSnippet) {
      snippets.push({
        line_start: currentSnippet.start + 1,
        line_end: currentSnippet.end + 1,
        content: lines.slice(currentSnippet.start, currentSnippet.end + 1).join('\n')
      });
    }

    return snippets.slice(0, 5); // Limit to top 5 snippets per file
  } catch {
    return [];
  }
}
