import { runCommand } from './shell';

export async function isGitRepo(): Promise<boolean> {
  const result = await runCommand('git', ['rev-parse', '--is-inside-work-tree']);
  return result.exitCode === 0;
}

export async function gitStatus(): Promise<string> {
  const result = await runCommand('git', ['status', '--short']);
  return result.stdout;
}

export async function gitDiff(): Promise<string> {
  const result = await runCommand('git', ['diff']);
  return result.stdout;
}

export async function gitDiffNameOnly(): Promise<string[]> {
  const result = await runCommand('git', ['diff', '--name-only']);
  return result.stdout ? result.stdout.split('\n') : [];
}

export async function gitDiffStat(): Promise<string> {
  const result = await runCommand('git', ['diff', '--stat']);
  return result.stdout;
}

export async function gitDiffCached(): Promise<string> {
  const result = await runCommand('git', ['diff', '--cached']);
  return result.stdout;
}
