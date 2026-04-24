import { JuniorProvider } from './registry';
import { JuniorAnalysis, JuniorDiffReview } from '../../bridge/schema';

export class MockProvider implements JuniorProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async analyzeTask(task: string): Promise<JuniorAnalysis> {
    return {
      task_summary: `Mock analysis for: ${task}`,
      bridge_needed: true,
      risk_level: 'low',
      confidence: 0.9,
      must_read_files: [{ path: 'src/index.ts', reason: 'Entry point' }],
      should_read_files: [],
      maybe_relevant_files: [],
      files_to_avoid: [],
      implementation_strategy: ['Step 1: Mocking', 'Step 2: Success'],
      acceptance_criteria: ['It works'],
      known_unknowns: ['Nothing'],
      assumptions: ['User is happy'],
      senior_notes: ['This is a mock']
    };
  }

  async reviewFiles(task: string, files: string[]): Promise<any> {
    return { status: 'reviewed', files };
  }

  async scaffoldFrontend(description: string): Promise<any> {
    return { html: '<div>Mock Scaffold</div>', css: 'body { color: blue; }' };
  }

  async reviewDiff(task: string, diff: string): Promise<JuniorDiffReview> {
    return {
      approved: true,
      risk_level: 'low',
      blocking_issues: [],
      non_blocking_suggestions: ['Looks good from here'],
      test_recommendations: ['Run npm test'],
      files_reviewed: ['src/index.ts'],
      summary: 'Mock diff review success'
    };
  }
}
