import { JuniorEngine } from '../junior/engine';
import { createHandoff } from './handoff';
import { gitDiff, isGitRepo } from '../utils/git';
import { logger } from '../utils/logger';

export class BridgeOrchestrator {
  private junior: JuniorEngine;

  constructor() {
    this.junior = new JuniorEngine();
  }

  async runAnalysis(task: string, provider: string) {
    logger.info(`Starting analysis for task: ${task} using ${provider}`);
    const analysis = await this.junior.analyzeTask(task, provider);
    return analysis;
  }

  async runHandoff(task: string, provider: string) {
    const analysis = await this.runAnalysis(task, provider);
    const handoff = await createHandoff(task, analysis, provider);
    return handoff;
  }

  async runReviewDiff(task: string, provider: string) {
    if (!await isGitRepo()) {
      throw new Error('Not a git repository. Cannot review diff.');
    }

    const diff = await gitDiff();
    if (!diff) {
      return { message: 'No changes detected in git diff.' };
    }

    logger.info(`Reviewing diff for task: ${task} using ${provider}`);
    const review = await this.junior.reviewDiff(task, diff, provider);
    return review;
  }

  async getHealth() {
    return {
      status: 'healthy',
      junior: await this.junior.getHealth(),
      cwd: process.cwd(),
      isGit: await isGitRepo()
    };
  }
}
