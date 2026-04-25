import fs from 'fs/promises';
import path from 'path';
import { Workspace, WorkspaceSchema, PermissionRequest } from './workspace-schema';
import { validateProjectRoot } from './workspace-safety';
import { isGitRepo } from '../utils/git';
import { logger } from '../utils/logger';

const WORKSPACES_FILE = '.bridge/workspaces.json';

export class WorkspaceManager {
  private workspaces: Workspace[] = [];
  private currentWorkspaceId: string | null = null;
  private permissionRequests: PermissionRequest[] = [];

  constructor() {
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    const dir = path.dirname(WORKSPACES_FILE);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
  }

  async load() {
    try {
      const data = await fs.readFile(WORKSPACES_FILE, 'utf-8');
      this.workspaces = JSON.parse(data).map((w: any) => WorkspaceSchema.parse(w));
      const latest = this.workspaces.sort((a, b) => 
        new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
      )[0];
      if (latest) this.currentWorkspaceId = latest.id;
    } catch {
      this.workspaces = [];
    }
  }

  async save() {
    await fs.writeFile(WORKSPACES_FILE, JSON.stringify(this.workspaces, null, 2));
  }

  async addWorkspace(rootPath: string, name?: string): Promise<Workspace> {
    const resolvedPath = validateProjectRoot(rootPath);
    
    // Check if already exists
    const existing = this.workspaces.find(w => w.root_path === resolvedPath);
    if (existing) return existing;

    const id = path.basename(resolvedPath).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isGit = await this.checkIsGit(resolvedPath);

    const workspace: Workspace = {
      id,
      name: name || path.basename(resolvedPath),
      root_path: resolvedPath,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      is_git_repo: isGit,
      trusted: false,
      permissions: {
        read_project_files: true,
        write_project_files: false,
        read_outside_workspace: false,
        run_commands: false,
        install_dependencies: false,
        network_access: false
      }
    };

    this.workspaces.push(workspace);
    await this.save();
    return workspace;
  }

  async selectWorkspace(id: string) {
    const ws = this.workspaces.find(w => w.id === id);
    if (!ws) throw new Error(`Workspace ${id} not found`);
    
    ws.last_used_at = new Date().toISOString();
    this.currentWorkspaceId = id;
    await this.save();
  }

  getCurrentWorkspace(): Workspace | null {
    if (!this.currentWorkspaceId) return null;
    return this.workspaces.find(w => w.id === this.currentWorkspaceId) || null;
  }

  listWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  private async checkIsGit(dir: string): Promise<boolean> {
    // Basic check without runCommand to avoid circular dep if needed, 
    // but utils/git is safe here.
    try {
      await fs.access(path.join(dir, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  // Permission Requests
  addPermissionRequest(req: Omit<PermissionRequest, 'id' | 'status' | 'created_at'>): PermissionRequest {
    const request: PermissionRequest = {
      ...req,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.permissionRequests.push(request);
    return request;
  }

  getPendingRequests(): PermissionRequest[] {
    return this.permissionRequests.filter(r => r.status === 'pending');
  }

  updateRequestStatus(id: string, status: 'approved' | 'denied') {
    const req = this.permissionRequests.find(r => r.id === id);
    if (req) req.status = status;
  }
}
