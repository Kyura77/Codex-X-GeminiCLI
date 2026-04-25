import path from 'path';
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
  const taskLower = task.toLowerCase();
  const keywords = taskLower.split(/\W+/).filter(k => k.length > 2);
  const ranked: RankedFile[] = [];

  for (const file of files) {
    if (file.ignored_reason) continue;

    let score = 0;
    const reasons: string[] = [];
    const filePath = file.path.toLowerCase();
    const fileName = path.basename(file.path).toLowerCase();

    // 1. Filename/Path match (20%)
    const pathMatches = keywords.filter(k => filePath.includes(k));
    if (pathMatches.length > 0) {
      score += 0.2 * (pathMatches.length / keywords.length);
      reasons.push(`Path matches keywords: ${pathMatches.join(', ')}`);
    }

    // 2. Entrypoint distance (20%)
    if (stack.entryPoints.includes(file.path)) {
      score += 0.2;
      reasons.push('Is a project entry point');
    }

    // 3. Category Boosts (Specialized)
    if (file.kind === 'config' && keywords.some(k => ['config', 'env', 'build', 'model', 'provider'].includes(k))) {
      score += 0.15;
      reasons.push('Config file relevant to task');
    }
    if (file.kind === 'style' && keywords.some(k => ['ui', 'frontend', 'css', 'style', 'dashboard'].includes(k))) {
      score += 0.15;
      reasons.push('UI/Style file relevant to task');
    }
    if (filePath.includes('provider') && keywords.some(k => ['gemini', 'ollama', 'model', 'router'].includes(k))) {
      score += 0.2;
      reasons.push('Provider file relevant to model task');
    }
    if (filePath.includes('schema') && keywords.some(k => ['json', 'validation', 'zod', 'handoff'].includes(k))) {
      score += 0.15;
      reasons.push('Schema file relevant to data task');
    }

    // 4. Import graph centrality (25%)
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
