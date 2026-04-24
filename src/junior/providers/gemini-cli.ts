import { JuniorProvider } from './registry';
import { JuniorAnalysis, JuniorDiffReview, JuniorAnalysisSchema, JuniorDiffReviewSchema } from '../../bridge/schema';
import { runCommand } from '../../utils/shell';
import { logger } from '../../utils/logger';

export class GeminiCliProvider implements JuniorProvider {
  name = 'gemini';

  async isAvailable(): Promise<boolean> {
    const result = await runCommand('gemini', ['--version']);
    return result.exitCode === 0;
  }

  private async callGemini(prompt: string, modelPolicy?: string): Promise<any> {
    const args = ['--prompt', prompt, '--output-format', 'json'];
    
    // In a real implementation, we would map modelPolicy to --model
    // For MVP, we'll let the CLI handle defaults or use a simple mapping
    
    const result = await runCommand('gemini', args, { timeout: 120000 });
    
    if (result.exitCode !== 0) {
      throw new Error(`Gemini CLI failed: ${result.stderr}`);
    }

    try {
      // The CLI might output some noise before the JSON, or the JSON might be inside a block
      let content = result.stdout;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse Gemini JSON output', result.stdout);
      throw new Error('Invalid JSON from Gemini CLI. Please try again.');
    }
  }

  async analyzeTask(task: string): Promise<JuniorAnalysis> {
    const prompt = `
Analyze the following task and provide a detailed context map in JSON format.
Task: ${task}

The JSON MUST follow this schema:
${JSON.stringify(JuniorAnalysisSchema.shape, null, 2)}

Strictly return ONLY the JSON.
`;
    const response = await this.callGemini(prompt, 'auto-smart');
    return JuniorAnalysisSchema.parse(response);
  }

  async reviewFiles(task: string, files: string[]): Promise<any> {
    const prompt = `Review these files for the task: ${task}\nFiles: ${files.join(', ')}`;
    return await this.callGemini(prompt, 'balanced');
  }

  async scaffoldFrontend(description: string): Promise<any> {
    const prompt = `Scaffold a frontend proposal for: ${description}. Return JSON with "html" and "css" fields.`;
    return await this.callGemini(prompt, 'balanced');
  }

  async reviewDiff(task: string, diff: string): Promise<JuniorDiffReview> {
    const prompt = `
Review the following git diff against the task: ${task}
Diff:
${diff}

Provide a review in JSON format matching this schema:
${JSON.stringify(JuniorDiffReviewSchema.shape, null, 2)}

Strictly return ONLY the JSON.
`;
    const response = await this.callGemini(prompt, 'balanced');
    return JuniorDiffReviewSchema.parse(response);
  }
}
