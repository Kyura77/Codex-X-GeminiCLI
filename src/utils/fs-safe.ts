import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';

const PROJECT_ROOT = process.cwd();

export function safeJoin(...parts: string[]): string {
  const resolved = path.join(PROJECT_ROOT, ...parts);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Unsafe path detected: ${resolved} is outside project root.`);
  }
  return resolved;
}

export async function ensureDir(dirPath: string) {
  const fullPath = safeJoin(dirPath);
  await fs.mkdir(fullPath, { recursive: true });
}

export async function writeSafeFile(filePath: string, content: string) {
  const fullPath = safeJoin(filePath);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(fullPath, content, 'utf-8');
}

export async function readSafeFile(filePath: string): Promise<string> {
  const fullPath = safeJoin(filePath);
  return await fs.readFile(fullPath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = safeJoin(filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}
