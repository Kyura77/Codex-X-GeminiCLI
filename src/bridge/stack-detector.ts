import fs from 'fs/promises';
import path from 'path';
import { FileMetadata } from './project-inventory';

export interface ProjectStack {
  runtime: 'node' | 'bun' | 'deno' | 'unknown';
  language: 'typescript' | 'javascript' | 'mixed' | 'unknown';
  frameworks: string[];
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';
  testTools: string[];
  entryPoints: string[];
}

export async function detectProjectStack(files: FileMetadata[], rootDir: string): Promise<ProjectStack> {
  const stack: ProjectStack = {
    runtime: 'unknown',
    language: 'unknown',
    frameworks: [],
    packageManager: 'unknown',
    testTools: [],
    entryPoints: []
  };

  const fileNames = new Set(files.map(f => path.basename(f.path).toLowerCase()));
  const filePaths = new Set(files.map(f => f.path.toLowerCase().replace(/\\/g, '/')));

  // Detect Package Manager
  if (fileNames.has('package-lock.json')) stack.packageManager = 'npm';
  else if (fileNames.has('pnpm-lock.yaml')) stack.packageManager = 'pnpm';
  else if (fileNames.has('yarn.lock')) stack.packageManager = 'yarn';
  else if (fileNames.has('bun.lockb')) stack.packageManager = 'bun';

  // Detect Language
  const hasTS = files.some(f => f.ext === '.ts' || f.ext === '.tsx');
  const hasJS = files.some(f => f.ext === '.js' || f.ext === '.jsx');
  if (hasTS && hasJS) stack.language = 'mixed';
  else if (hasTS) stack.language = 'typescript';
  else if (hasJS) stack.language = 'javascript';

  // Detect Runtime
  if (fileNames.has('package.json')) stack.runtime = 'node';
  else if (fileNames.has('deno.json') || fileNames.has('deno.jsonc')) stack.runtime = 'deno';

  // Detect Frameworks & Tools via package.json
  if (fileNames.has('package.json')) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.express) stack.frameworks.push('express');
      if (deps.next) stack.frameworks.push('next');
      if (deps.react) stack.frameworks.push('react');
      if (deps.vue) stack.frameworks.push('vue');
      if (deps.vite) stack.frameworks.push('vite');
      
      if (deps.jest) stack.testTools.push('jest');
      if (deps.vitest) stack.testTools.push('vitest');
    } catch {
      // Ignore parse errors
    }
  }

  // Detect Entry Points
  const entryCandidates = [
    'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
    'src/server.ts', 'src/server.js', 'src/cli.ts', 'src/cli.js',
    'index.ts', 'index.js'
  ];
  stack.entryPoints = entryCandidates.filter(c => filePaths.has(c.toLowerCase()));

  return stack;
}
