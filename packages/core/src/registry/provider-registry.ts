import type {
  Message,
  ModelDescriptor,
  ProviderCapabilities,
  ProviderInfo,
} from '../types/provider.js';

export interface ProviderRequest {
  model: string;
  messages: Message[];
  maxOutputTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  tools?: unknown[];
  signal?: AbortSignal;
}

export interface ProviderResponse {
  content: string;
  model: string;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface Provider {
  info(): ProviderInfo;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, Provider>();
  private readonly modelToProvider = new Map<string, string>();

  register(provider: Provider): void {
    const info = provider.info();
    this.providers.set(info.id, provider);
    for (const m of info.models) {
      this.modelToProvider.set(m.id, info.id);
    }
  }

  get(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }

  resolveForModel(modelId: string): Provider | undefined {
    const pid = this.modelToProvider.get(modelId);
    if (!pid) return undefined;
    return this.providers.get(pid);
  }

  findModel(modelId: string): ModelDescriptor | undefined {
    const p = this.resolveForModel(modelId);
    if (!p) return undefined;
    return p.info().models.find((m) => m.id === modelId);
  }

  listModels(): ModelDescriptor[] {
    const out: ModelDescriptor[] = [];
    for (const p of this.providers.values()) {
      out.push(...p.info().models);
    }
    return out;
  }

  capabilitiesFor(modelId: string): ProviderCapabilities | undefined {
    return this.resolveForModel(modelId)?.info().capabilities;
  }

  ids(): string[] {
    return [...this.providers.keys()];
  }

  size(): number {
    return this.providers.size;
  }

  clear(): void {
    this.providers.clear();
    this.modelToProvider.clear();
  }
}
