import { createServer } from './server';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createServer();

app.listen(port, () => {
  logger.info(`Codex-Gemini Bridge MVP v0.1 started on http://localhost:${port}`);
  logger.info(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
