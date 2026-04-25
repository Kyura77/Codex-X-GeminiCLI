import fs from 'fs/promises';
import path from 'path';
import { FileMetadata } from './project-inventory';

export type ImportGraph = Record<string, string[]>;

export async function buildImportGraph(files: FileMetadata[], rootDir: string): Promise<ImportGraph> {
  const graph: ImportGraph = {};
  const sourceFiles = files.filter(f => f.kind === 'source' && !f.ignored_reason);

  for (const file of sourceFiles) {
    try {
      const fullPath = path.join(rootDir, file.path);
      const content = await fs.readFile(fullPath, 'utf-8');
      const imports = await extractImports(content, file.path, rootDir);
      graph[file.path] = imports;
    } catch {
      // Skip files that can't be read
    }
  }

  return graph;
}

async function extractImports(content: string, filePath: string, rootDir: string): Promise<string[]> {
  const imports: string[] = [];
  const dir = path.dirname(path.join(rootDir, filePath));

  // Simple regex for imports: import x from './y' or require('./z')
  const importRegex = /(?:import|from|require)\s*\(?\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    
    // Only care about relative imports for now
    if (importPath.startsWith('.')) {
      const resolved = await resolveImport(importPath, dir, rootDir);
      if (resolved) imports.push(resolved);
    }
  }

  return Array.from(new Set(imports));
}

async function resolveImport(importPath: string, currentDir: string, rootDir: string): Promise<string | null> {
  const fullPathBase = path.resolve(currentDir, importPath);
  
  // Try common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
  for (const ext of extensions) {
    const candidate = fullPathBase + ext;
    try {
      await fs.access(candidate);
      return path.relative(rootDir, candidate).replace(/\\/g, '/');
    } catch {
      continue;
    }
  }

  return null;
}
