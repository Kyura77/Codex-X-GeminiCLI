import { ProviderRegistry } from './providers/registry';
import { MockProvider } from './providers/mock';
import { GeminiCliProvider } from './providers/gemini-cli';
import { JuniorAnalysis, JuniorDiffReview } from '../bridge/schema';

export class JuniorEngine {
  private registry: ProviderRegistry;

  constructor() {
    this.registry = new ProviderRegistry();
    this.registry.register(new MockProvider());
    this.registry.register(new GeminiCliProvider());
  }

  async analyzeTask(task: string, providerName: string = 'mock'): Promise<JuniorAnalysis> {
    const provider = this.registry.getProvider(providerName);
    return await provider.analyzeTask(task);
  }

  async reviewDiff(task: string, diff: string, providerName: string = 'mock'): Promise<JuniorDiffReview> {
    const provider = this.registry.getProvider(providerName);
    return await provider.reviewDiff(task, diff);
  }

  async scaffoldFrontend(description: string, providerName: string = 'mock'): Promise<any> {
    const provider = this.registry.getProvider(providerName);
    return await provider.scaffoldFrontend(description);
  }

  async getHealth() {
    return {
      providers: await this.registry.getAvailableProviders()
    };
  }
}
