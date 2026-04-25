import express from 'express';
import cors from 'cors';
import { BridgeOrchestrator } from './bridge/orchestrator';
import { logger } from './utils/logger';

export function createServer() {
  const app = express();
  const orchestrator = new BridgeOrchestrator();

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  app.get('/health', async (req, res) => {
    try {
      const health = await orchestrator.getHealth();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workspace Endpoints
  app.get('/api/workspaces', (req, res) => {
    res.json(orchestrator.getWorkspaces().listWorkspaces());
  });

  app.get('/api/workspaces/current', (req, res) => {
    res.json(orchestrator.getWorkspaces().getCurrentWorkspace());
  });

  app.post('/api/workspaces/add', async (req, res) => {
    const { path, name } = req.body;
    try {
      const ws = await orchestrator.getWorkspaces().addWorkspace(path, name);
      res.json(ws);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/workspaces/select', async (req, res) => {
    const { id } = req.body;
    try {
      await orchestrator.getWorkspaces().selectWorkspace(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // Permission Endpoints
  app.get('/api/permissions/pending', (req, res) => {
    res.json(orchestrator.getWorkspaces().getPendingRequests());
  });

  app.post('/api/permissions/:id/approve', (req, res) => {
    orchestrator.getWorkspaces().updateRequestStatus(req.params.id, 'approved');
    res.json({ success: true });
  });

  app.post('/api/analyze', async (req, res) => {
    const { task, provider, workspace_id } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runAnalysis(task, provider || 'mock', workspace_id);
      res.json(result);
    } catch (error: any) {
      logger.error('API /analyze failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/handoff', async (req, res) => {
    const { task, provider, workspace_id } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runHandoff(task, provider || 'mock', workspace_id);
      res.json(result);
    } catch (error: any) {
      logger.error('API /handoff failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/review-diff', async (req, res) => {
    const { task, provider, workspace_id } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runReviewDiff(task, provider || 'mock', workspace_id);
      res.json(result);
    } catch (error: any) {
      logger.error('API /review-diff failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}
