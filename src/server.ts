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

  app.post('/api/analyze', async (req, res) => {
    const { task, provider } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runAnalysis(task, provider || 'mock');
      res.json(result);
    } catch (error: any) {
      logger.error('API /analyze failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/handoff', async (req, res) => {
    const { task, provider } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runHandoff(task, provider || 'mock');
      res.json(result);
    } catch (error: any) {
      logger.error('API /handoff failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/review-diff', async (req, res) => {
    const { task, provider } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });
    try {
      const result = await orchestrator.runReviewDiff(task, provider || 'mock');
      res.json(result);
    } catch (error: any) {
      logger.error('API /review-diff failed', error);
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}
