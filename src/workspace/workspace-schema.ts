import { z } from 'zod';

export const WorkspacePermissionsSchema = z.object({
  read_project_files: z.boolean().default(true),
  write_project_files: z.boolean().default(false),
  read_outside_workspace: z.boolean().default(false),
  run_commands: z.boolean().default(false),
  install_dependencies: z.boolean().default(false),
  network_access: z.boolean().default(false)
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  root_path: z.string(),
  created_at: z.string().datetime(),
  last_used_at: z.string().datetime(),
  is_git_repo: z.boolean(),
  trusted: z.boolean().default(false),
  permissions: WorkspacePermissionsSchema
});

export const PermissionRequestSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  type: z.enum(['read_outside_workspace', 'write_files', 'run_command', 'install_dependency', 'network_access']),
  command: z.string().optional(),
  path: z.string().optional(),
  reason: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'approved', 'denied']),
  created_at: z.string().datetime()
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspacePermissions = z.infer<typeof WorkspacePermissionsSchema>;
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>;
