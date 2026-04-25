import { FileMetadata } from './project-inventory';
import { ProjectStack } from './stack-detector';
import { ImportGraph } from './import-graph';

export interface RankedFile {
  path: string;
  score: number;
  reasons: string[];
  snippets?: import('./snippet-extractor').EvidenceSnippet[];
}

export function rankRelevantFiles(
  task: string, 
  files: FileMetadata[], 
  stack: ProjectStack, 
  graph: ImportGraph
): RankedFile[] {
  const keywords = task.toLowerCase().split(/\W+/).filter(k => k.length > 2);
  const ranked: RankedFile[] = [];

  for (const file of files) {
    if (file.ignored_reason) continue;

    let score = 0;
    const reasons: string[] = [];
    const fileName = file.path.toLowerCase();

    // 1. Filename match (20%)
    const fileNameMatches = keywords.filter(k => fileName.includes(k));
    if (fileNameMatches.length > 0) {
      score += 0.2 * (fileNameMatches.length / keywords.length);
      reasons.push(`Filename matches keywords: ${fileNameMatches.join(', ')}`);
    }

    // 2. Entrypoint distance (20%)
    if (stack.entryPoints.includes(file.path)) {
      score += 0.2;
      reasons.push('Is a project entry point');
    }

    // 3. Stack-based boosts
    if (task.toLowerCase().includes('server') && file.path.includes('server')) {
      score += 0.15;
      reasons.push('Task mentions server and file is server-related');
    }
    if (task.toLowerCase().includes('ui') || task.toLowerCase().includes('frontend')) {
      if (file.kind === 'style' || file.path.includes('public') || file.path.includes('component')) {
        score += 0.15;
        reasons.push('Task mentions UI/Frontend and file is UI-related');
      }
    }

    // 4. Import graph centrality (25%) - simplified
    const dependents = Object.values(graph).filter(deps => deps.includes(file.path)).length;
    if (dependents > 0) {
      score += Math.min(0.25, 0.05 * dependents);
      reasons.push(`Referenced by ${dependents} other files`);
    }

    if (score > 0) {
      ranked.push({ path: file.path, score, reasons });
    }
  }

  return ranked.sort((a, b) => b.score - a.score);
}
