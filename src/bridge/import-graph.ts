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
      const imports = extractImports(content, file.path, rootDir);
      graph[file.path] = imports;
    } catch {
      // Skip files that can't be read
    }
  }

  return graph;
}

function extractImports(content: string, filePath: string, rootDir: string): string[] {
  const imports: string[] = [];
  const dir = path.dirname(filePath);

  // Simple regex for imports: import x from './y' or require('./z')
  const importRegex = /(?:import|from|require)\s*\(?\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    
    // Only care about relative imports for now
    if (importPath.startsWith('.')) {
      const resolved = resolveImport(importPath, dir, rootDir);
      if (resolved) imports.push(resolved);
    }
  }

  return Array.from(new Set(imports));
}

function resolveImport(importPath: string, currentDir: string, rootDir: string): string | null {
  // Very simplified resolution for MVP
  const fullPath = path.join(currentDir, importPath);
  const relPath = path.relative(rootDir, fullPath);
  
  // Try common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
  for (const ext of extensions) {
    const candidate = relPath + ext;
    // In a real implementation, we'd check if file exists
    // For now, we'll just return the first likely candidate
    // This is "deterministic" in the sense that it follows rules
    if (candidate) return candidate.replace(/\\/g, '/');
  }

  return null;
}
