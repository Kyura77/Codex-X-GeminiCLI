import { WorkspaceManager } from './workspace-manager';
import { PermissionRequest } from './workspace-schema';
import { logger } from '../utils/logger';

export class PermissionBroker {
  constructor(private workspaceManager: WorkspaceManager) {}

  async requestInstall(command: string, reason: string): Promise<PermissionRequest> {
    const ws = this.workspaceManager.getCurrentWorkspace();
    if (!ws) throw new Error('No active workspace');

    logger.warn(`Permission requested for install command: ${command}`);
    
    return this.workspaceManager.addPermissionRequest({
      workspace_id: ws.id,
      type: 'install_dependency',
      command,
      reason,
      risk: 'medium'
    });
  }

  async checkFileWrite(filePath: string, reason: string): Promise<boolean> {
    const ws = this.workspaceManager.getCurrentWorkspace();
    if (!ws) return false;
    
    if (ws.permissions.write_project_files) return true;

    this.workspaceManager.addPermissionRequest({
      workspace_id: ws.id,
      type: 'write_files',
      path: filePath,
      reason,
      risk: 'low'
    });
    
    return false;
  }

  isCommandSafe(command: string): boolean {
    const safeAllowlist = [
      'git status', 'git diff', 'npm run build', 'npm test', 'ls', 'dir'
    ];
    return safeAllowlist.some(safe => command.startsWith(safe));
  }
}
