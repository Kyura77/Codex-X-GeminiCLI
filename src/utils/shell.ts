import execa from 'execa';
import { logger } from './logger';

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string } = {}
): Promise<ShellResult> {
  const { timeout = 60000, cwd = process.cwd() } = options;

  try {
    const { stdout, stderr, exitCode } = await execa(command, args, {
      timeout,
      cwd,
      reject: false,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: exitCode || 0,
    };
  } catch (error: any) {
    logger.error(`Shell execution failed: ${error.message}`);
    return {
      stdout: '',
      stderr: error.message,
      exitCode: error.exitCode || 1,
    };
  }
}
