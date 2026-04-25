import { JuniorEngine } from '../junior/engine';
import { createHandoff } from './handoff';
import { buildProjectContextMap } from './context-map';
import { buildContextPack } from './context-pack';
import { gitDiff, isGitRepo, gitDiffStat, gitDiffNameOnly } from '../utils/git';
import { logger } from '../utils/logger';
import { WorkspaceManager } from '../workspace/workspace-manager';

export class BridgeOrchestrator {
  private junior: JuniorEngine;
  private workspaceManager: WorkspaceManager;

  constructor() {
    this.junior = new JuniorEngine();
    this.workspaceManager = new WorkspaceManager();
    this.workspaceManager.load();
  }

  getWorkspaces() { return this.workspaceManager; }

  async runAnalysis(task: string, provider: string, workspaceId?: string) {
    if (workspaceId) await this.workspaceManager.selectWorkspace(workspaceId);
    const ws = this.workspaceManager.getCurrentWorkspace();
    const rootDir = ws ? ws.root_path : process.cwd();

    logger.info(`Starting context mapping for task: ${task} in ${rootDir}`);
    const contextMap = await buildProjectContextMap(task, rootDir);
    const contextPack = buildContextPack(contextMap);
    
    logger.info(`Sending context pack to ${provider}`);
    const analysis = await this.junior.analyzeTask(task, contextPack, provider);
    return { analysis, contextPack };
  }

  async runHandoff(task: string, provider: string, workspaceId?: string) {
    const { analysis, contextPack } = await this.runAnalysis(task, provider, workspaceId);
    const handoff = await createHandoff(task, analysis, provider, contextPack);
    return handoff;
  }

  async runReviewDiff(task: string, provider: string, workspaceId?: string) {
    if (workspaceId) await this.workspaceManager.selectWorkspace(workspaceId);
    const ws = this.workspaceManager.getCurrentWorkspace();
    const rootDir = ws ? ws.root_path : process.cwd();

    if (!await isGitRepo()) {
      throw new Error('Not a git repository. Cannot review diff.');
    }

    const diff = await gitDiff();
    const stat = await gitDiffStat();
    const names = await gitDiffNameOnly();

    if (!diff) {
      return { message: 'No changes detected in git diff.' };
    }

    const fullContext = `
Task: ${task}
Files Changed: ${names.join(', ')}
Stats:
${stat}

Diff Content:
${diff.slice(0, 20000)} // Truncate safely
`;

    logger.info(`Reviewing diff for task: ${task} using ${provider}`);
    const review = await this.junior.reviewDiff(task, fullContext, provider);
    return review;
  }

  async getHealth() {
    const isGit = await isGitRepo();
    const ws = this.workspaceManager.getCurrentWorkspace();
    return {
      status: 'healthy',
      junior: await this.junior.getHealth(),
      cwd: process.cwd(),
      isGit,
      workspace: ws ? { id: ws.id, name: ws.name, path: ws.root_path } : null,
      totalWorkspaces: this.workspaceManager.listWorkspaces().length
    };
  }
}
