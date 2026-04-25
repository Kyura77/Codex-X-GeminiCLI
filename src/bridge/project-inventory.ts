import path from 'path';
import fs from 'fs/promises';
import { runCommand } from '../utils/shell';
import { isGitRepo } from '../utils/git';

export interface FileMetadata {
  path: string;
  ext: string;
  size_bytes: number;
  depth: number;
  kind: FileKind;
  is_binary: boolean;
  ignored_reason?: string;
}

export type FileKind = 
  | 'source' | 'test' | 'config' | 'manifest' 
  | 'style' | 'doc' | 'asset' | 'lockfile' 
  | 'generated' | 'unknown';

export interface ProjectInventory {
  files: FileMetadata[];
  total_scanned: number;
  included_count: number;
  ignored_count: number;
  ignored_patterns: string[];
  warnings: string[];
}

const DEFAULT_IGNORES = [
  '.env', '.env.*', 'node_modules', 'dist', 'build', '.git', 
  '*.pem', '*.key', '*.sqlite', '*.db', 'coverage', '.next', '.vite',
  '*.zip', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.mp4', '*.mp3', '*.pdf',
  '*.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'
];

const MAX_FILE_SIZE = 1024 * 500; // 500KB
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.zip', '.gz', '.tar', '.exe', '.dll', '.so', '.dylib', '.pyc', '.o', '.a']);
const LOCKFILE_NAMES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'Gemfile.lock', 'Cargo.lock', 'mix.lock']);

export function getFileKind(filePath: string): FileKind {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath).toLowerCase();

  if (LOCKFILE_NAMES.has(name)) return 'lockfile';
  if (['package.json', 'tsconfig.json', 'composer.json', 'pyproject.toml'].includes(name)) return 'manifest';
  if (['.env', '.gitignore', '.bridgeignore', 'dockerfile'].includes(name) || name.includes('config')) return 'config';
  if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.php', '.rb', '.java', '.cpp', '.c', '.cs', '.kt'].includes(ext)) {
    if (name.includes('test') || name.includes('spec')) return 'test';
    return 'source';
  }
  if (['.css', '.scss', '.sass', '.less', '.html'].includes(ext)) return 'style';
  if (['.md', '.txt', '.rst', '.adoc'].includes(ext)) return 'doc';
  if (['.json', '.yaml', '.yml', '.xml', '.toml'].includes(ext)) return 'config';
  if (BINARY_EXTENSIONS.has(ext)) return 'asset';
  
  return 'unknown';
}

export async function parseBridgeIgnore(rootDir: string): Promise<string[]> {
  const ignorePath = path.join(rootDir, '.bridgeignore');
  try {
    const content = await fs.readFile(ignorePath, 'utf-8');
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}

export function isPatternMatch(filePath: string, patterns: string[]): boolean {
  // Very simple glob-to-regex for MVP
  // In a real scenario, we'd use 'minimatch' or 'ignore' package
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  return patterns.some(pattern => {
    if (!pattern) return false;
    const regexSource = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`(^|/)${regexSource}($|/)`, 'i');
    return regex.test(normalizedPath);
  });
}

export async function buildProjectInventory(rootDir: string = process.cwd()): Promise<ProjectInventory> {
  const customIgnores = await parseBridgeIgnore(rootDir);
  const allIgnorePatterns = Array.from(new Set([...DEFAULT_IGNORES, ...customIgnores]));

  let fileList: string[] = [];
  const inGit = await isGitRepo();

  if (inGit) {
    const result = await runCommand('git', ['ls-files', '--cached', '--others', '--exclude-standard']);
    if (result.exitCode === 0) {
      fileList = result.stdout.split('\n').filter(f => f.trim() !== '');
    }
  }

  // Fallback or addition (if git failed or returned nothing)
  if (fileList.length === 0) {
    // Basic recursion for fallback
    async function walk(dir: string): Promise<string[]> {
      const files: string[] = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(rootDir, fullPath);
        
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
          files.push(...(await walk(fullPath)));
        } else {
          files.push(relPath);
        }
      }
      return files;
    }
    fileList = await walk(rootDir);
  }

  const inventory: ProjectInventory = {
    files: [],
    total_scanned: fileList.length,
    included_count: 0,
    ignored_count: 0,
    ignored_patterns: allIgnorePatterns,
    warnings: []
  };

  for (const relPath of fileList) {
    try {
      const fullPath = path.join(rootDir, relPath);
      const stats = await fs.stat(fullPath);
      const ext = path.extname(relPath).toLowerCase();
      const isBinary = BINARY_EXTENSIONS.has(ext);
      
      let ignoredReason: string | undefined;
      
      if (isPatternMatch(relPath, allIgnorePatterns)) {
        ignoredReason = 'pattern_match';
      } else if (stats.size > MAX_FILE_SIZE) {
        ignoredReason = 'too_large';
      } else if (isBinary) {
        ignoredReason = 'binary';
      }

      const metadata: FileMetadata = {
        path: relPath,
        ext,
        size_bytes: stats.size,
        depth: relPath.split(path.sep).length,
        kind: getFileKind(relPath),
        is_binary: isBinary,
        ignored_reason: ignoredReason
      };

      if (ignoredReason) {
        inventory.ignored_count++;
      } else {
        inventory.included_count++;
      }

      inventory.files.push(metadata);
    } catch (error: any) {
      inventory.warnings.push(`Failed to stat ${relPath}: ${error.message}`);
    }
  }

  return inventory;
}
