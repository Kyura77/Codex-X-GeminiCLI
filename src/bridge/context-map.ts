import { buildProjectInventory, ProjectInventory } from './project-inventory';
import { detectProjectStack, ProjectStack } from './stack-detector';
import { buildImportGraph, ImportGraph } from './import-graph';
import { rankRelevantFiles, RankedFile } from './relevance-ranker';
import { extractSnippets } from './snippet-extractor';

export interface ProjectContextMap {
  inventory: ProjectInventory;
  stack: ProjectStack;
  importGraph: ImportGraph;
  rankedFiles: RankedFile[];
  timestamp: string;
  task?: string;
}

export async function buildProjectContextMap(task?: string): Promise<ProjectContextMap> {
  const inventory = await buildProjectInventory();
  const rootDir = process.cwd();
  const stack = await detectProjectStack(inventory.files, rootDir);
  const importGraph = await buildImportGraph(inventory.files, rootDir);
  const rankedFiles = task ? rankRelevantFiles(task, inventory.files, stack, importGraph) : [];
  
  // Extract snippets for top 10 files
  const keywords = task ? task.toLowerCase().split(/\W+/).filter(k => k.length > 2) : [];
  for (const file of rankedFiles.slice(0, 10)) {
    file.snippets = await extractSnippets(file.path, keywords, rootDir);
  }
  
  return {
    inventory,
    stack,
    importGraph,
    rankedFiles,
    timestamp: new Date().toISOString(),
    task
  };
}
