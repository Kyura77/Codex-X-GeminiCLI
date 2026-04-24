import { BridgeOrchestrator } from './bridge/orchestrator';
import { logger } from './utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const task = args[1];
  const provider = args[2] || 'mock';

  const orchestrator = new BridgeOrchestrator();

  try {
    switch (command) {
      case 'health':
        const health = await orchestrator.getHealth();
        console.log(JSON.stringify(health, null, 2));
        break;

      case 'analyze':
        if (!task) throw new Error('Task required');
        const analysis = await orchestrator.runAnalysis(task, provider);
        console.log(JSON.stringify(analysis, null, 2));
        break;

      case 'handoff':
        if (!task) throw new Error('Task required');
        const handoff = await orchestrator.runHandoff(task, provider);
        logger.info('Handoff created at .bridge/handoff.json and .bridge/senior-prompt.md');
        console.log(JSON.stringify(handoff, null, 2));
        break;

      case 'review-diff':
        if (!task) throw new Error('Task required');
        const review = await orchestrator.runReviewDiff(task, provider);
        console.log(JSON.stringify(review, null, 2));
        break;

      default:
        console.log(`
Usage: npm run [command] -- "task" [provider]

Commands:
  health         Check system status
  analyze        Analyze task and map context
  handoff        Create senior handoff files
  review-diff    Review current git diff against task
        `);
    }
  } catch (error: any) {
    logger.error(`CLI failed: ${error.message}`);
    process.exit(1);
  }
}

main();
