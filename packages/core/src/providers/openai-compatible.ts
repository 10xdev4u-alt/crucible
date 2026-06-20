import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const COMPATIBLE_DEFAULT_URL = 'https://api.openai.com/v1/chat/completions';

const CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  tools: true,
  vision: false,
  parallelToolCalls: false,
  systemPrompt: true,
  jsonMode: true,
};

export interface OpenAICompatibleModel {
  id: string;
  displayName?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface OpenAICompatibleProviderOptions {
  id: string;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  models: readonly OpenAICompatibleModel[];
  httpClient?: HttpClient;
  defaultModel?: string;
  headers?: Record<string, string>;
}

/** A provider for any OpenAI-compatible endpoint. */
export class OpenAICompatibleProvider implements Provider {
  private readonly id: string;
  private readonly name: string;
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;
  private readonly models: readonly OpenAICompatibleModel[];
  private readonly extraHeaders: Record<string, string>;

  constructor(options: OpenAICompatibleProviderOptions) {
    if (!options.id) throw new Error('OpenAICompatibleProvider requires an id');
    if (!options.models || options.models.length === 0) {
      throw new Error('OpenAICompatibleProvider requires at least one model');
    }
    this.id = options.id;
    this.name = options.name;
    this.baseUrl = options.baseUrl ?? COMPATIBLE_DEFAULT_URL;
    this.apiKey = options.apiKey;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured.');
        }
      })();
    this.defaultModel = options.defaultModel ?? options.models[0]?.id ?? '';
    this.models = options.models;
    this.extraHeaders = options.headers ?? {};
  }

  info(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      capabilities: CAPABILITIES,
      models: this.models.map((m) => ({
        id: m.id,
        provider: this.id,
        displayName: m.displayName ?? m.id,
        contextWindow: m.contextWindow ?? 32_000,
        maxOutputTokens: m.maxOutputTokens ?? 4_000,
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: false,
      })),
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...this.extraHeaders,
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      messages: request.messages,
    };
    if (request.maxOutputTokens) body.max_tokens = request.maxOutputTokens;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.stopSequences) body.stop = request.stopSequences;

    const res = await this.httpClient.request<{
      choices: Array<{ message: { content: string }; finish_reason?: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    }>({
      url: this.baseUrl,
      method: 'POST',
      headers,
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`Provider ${this.id} returned ${res.status}`);
    }
    const choice = res.body.choices?.[0];
    if (!choice) throw new Error(`Provider ${this.id} returned no choices`);
    return {
      content: choice.message.content,
      model: request.model || this.defaultModel,
      finishReason:
        choice.finish_reason === 'length'
          ? 'length'
          : choice.finish_reason === 'tool_calls'
            ? 'tool_calls'
            : 'stop',
      usage: res.body.usage
        ? {
            inputTokens: res.body.usage.prompt_tokens,
            outputTokens: res.body.usage.completion_tokens,
          }
        : undefined,
    };
  }
}
