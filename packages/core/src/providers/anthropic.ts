import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const ANTHROPIC_DEFAULT_URL = 'https://api.anthropic.com/v1/messages';

const ANTHROPIC_MODELS = [
  {
    id: 'claude-opus-4-5',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 8_000,
    costPerInputToken: 15 / 1_000_000,
    costPerOutputToken: 75 / 1_000_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'claude-sonnet-4-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 8_000,
    costPerInputToken: 3 / 1_000_000,
    costPerOutputToken: 15 / 1_000_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 8_000,
    costPerInputToken: 0.8 / 1_000_000,
    costPerOutputToken: 4 / 1_000_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
] as const;

const CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  tools: true,
  vision: true,
  parallelToolCalls: false,
  systemPrompt: true,
  jsonMode: false,
};

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
  httpClient?: HttpClient;
  defaultModel?: string;
}

/** The Anthropic provider (Claude). */
export class AnthropicProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;

  constructor(options: AnthropicProviderOptions) {
    if (!options.apiKey) throw new Error('AnthropicProvider requires apiKey');
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? ANTHROPIC_DEFAULT_URL;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured. Pass one via the httpClient option.');
        }
      })();
    this.defaultModel = options.defaultModel ?? 'claude-sonnet-4-5';
  }

  info(): ProviderInfo {
    return {
      id: 'anthropic',
      name: 'Anthropic',
      models: [...ANTHROPIC_MODELS],
      capabilities: CAPABILITIES,
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const systemPrompt = request.systemPrompt ?? extractSystemPrompt(request.messages);
    const messages = filterSystemMessages(request.messages).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      max_tokens: request.maxOutputTokens ?? 1024,
      messages,
    };
    if (systemPrompt) body.system = systemPrompt;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.stopSequences) body.stop_sequences = request.stopSequences;

    const res = await this.httpClient.request<{
      content: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens: number; output_tokens: number };
    }>({
      url: this.baseUrl,
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`Anthropic API error ${res.status}`);
    }
    const text = (res.body.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    return {
      content: text,
      model: request.model || this.defaultModel,
      finishReason: normalizeStopReason(res.body.stop_reason),
      usage: res.body.usage
        ? {
            inputTokens: res.body.usage.input_tokens,
            outputTokens: res.body.usage.output_tokens,
          }
        : undefined,
    };
  }
}

function extractSystemPrompt(messages: ProviderRequest['messages']): string {
  return messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
}

function filterSystemMessages(messages: ProviderRequest['messages']) {
  return messages.filter((m) => m.role !== 'system');
}

function normalizeStopReason(reason: string | undefined): ProviderResponse['finishReason'] {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
      return 'length';
    case 'tool_use':
      return 'tool_calls';
    default:
      return 'stop';
  }
}
