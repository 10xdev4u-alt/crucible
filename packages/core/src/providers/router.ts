import type {
  Provider,
  ProviderRegistry,
  ProviderRequest,
  ProviderResponse,
} from '../registry/provider-registry.js';

export interface ProviderRouterOptions {
  preferProviderIds?: string[];
  fallbackModel?: string;
}

/** Routes requests to the right provider based on the requested model. */
export class ProviderRouter implements Provider {
  private readonly registry: ProviderRegistry;
  private readonly options: ProviderRouterOptions;

  constructor(registry: ProviderRegistry, options: ProviderRouterOptions = {}) {
    this.registry = registry;
    this.options = options;
  }

  info() {
    return {
      id: 'router',
      name: 'Provider Router',
      models: this.registry.listModels(),
      capabilities: {
        streaming: true,
        tools: true,
        vision: false,
        parallelToolCalls: false,
        systemPrompt: true,
        jsonMode: false,
      },
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const provider = this.selectProvider(request.model);
    if (!provider) {
      if (this.options.fallbackModel) {
        const fb = this.registry.resolveForModel(this.options.fallbackModel);
        if (fb) return fb.complete({ ...request, model: this.options.fallbackModel });
      }
      throw new Error(`No provider found for model: ${request.model}`);
    }
    return provider.complete(request);
  }

  private selectProvider(model: string): Provider | undefined {
    const direct = this.registry.resolveForModel(model);
    if (direct) return direct;
    for (const pid of this.options.preferProviderIds ?? []) {
      const p = this.registry.get(pid);
      if (p) return p;
    }
    const all = this.registry.ids();
    for (const id of all) {
      const p = this.registry.get(id);
      if (p) return p;
    }
    return undefined;
  }
}
