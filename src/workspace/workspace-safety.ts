import path from 'path';

const BLOCKED_PATHS = [
  '.ssh', '.aws', '.gcp', '.azure', '.config', 
  'AppData', 'Library/Application Support',
  '.env', 'credentials', 'secrets', 'wallets', 
  'browser profiles', 'private keys'
];

export function isSafePath(targetPath: string, workspaceRoot?: string): boolean {
  const normalized = path.normalize(targetPath).toLowerCase();
  
  // Check against blocked sensitive paths
  for (const blocked of BLOCKED_PATHS) {
    if (normalized.includes(blocked.toLowerCase())) {
      return false;
    }
  }

  // If workspaceRoot is provided, ensure targetPath is inside it
  if (workspaceRoot) {
    const normalizedRoot = path.normalize(workspaceRoot).toLowerCase();
    if (!normalized.startsWith(normalizedRoot)) {
      return false;
    }
  }

  return true;
}

export function validateProjectRoot(rootPath: string): string {
  const resolved = path.resolve(rootPath);
  if (!isSafePath(resolved)) {
    throw new Error(`Path ${rootPath} contains sensitive patterns and is blocked.`);
  }
  return resolved;
}
