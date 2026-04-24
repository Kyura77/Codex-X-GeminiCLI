import { JuniorAnalysis, JuniorDiffReview } from '../../bridge/schema';

export interface JuniorProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  analyzeTask(task: string): Promise<JuniorAnalysis>;
  reviewFiles(task: string, files: string[]): Promise<any>; // Simplified for MVP
  scaffoldFrontend(description: string): Promise<any>;
  reviewDiff(task: string, diff: string): Promise<JuniorDiffReview>;
}

export class ProviderRegistry {
  private providers: Map<string, JuniorProvider> = new Map();

  register(provider: JuniorProvider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): JuniorProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }
    return available;
  }
}
