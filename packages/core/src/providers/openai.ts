import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1/chat/completions';

const OPENAI_MODELS = [
  {
    id: 'gpt-5',
    provider: 'openai',
    displayName: 'GPT-5',
    contextWindow: 400_000,
    maxOutputTokens: 16_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'gpt-5-mini',
    provider: 'openai',
    displayName: 'GPT-5 mini',
    contextWindow: 400_000,
    maxOutputTokens: 16_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'o3',
    provider: 'openai',
    displayName: 'o3',
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
] as const;

const CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  tools: true,
  vision: true,
  parallelToolCalls: true,
  systemPrompt: true,
  jsonMode: true,
};

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
  httpClient?: HttpClient;
  defaultModel?: string;
  organization?: string;
}

/** The OpenAI provider. */
export class OpenAIProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;
  private readonly organization?: string;

  constructor(options: OpenAIProviderOptions) {
    if (!options.apiKey) throw new Error('OpenAIProvider requires apiKey');
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? OPENAI_DEFAULT_URL;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured. Pass one via the httpClient option.');
        }
      })();
    this.defaultModel = options.defaultModel ?? 'gpt-5';
    this.organization = options.organization;
  }

  info(): ProviderInfo {
    return {
      id: 'openai',
      name: 'OpenAI',
      models: [...OPENAI_MODELS],
      capabilities: CAPABILITIES,
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
    };
    if (request.maxOutputTokens) body.max_tokens = request.maxOutputTokens;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.stopSequences) body.stop = request.stopSequences;
    if (request.tools) body.tools = request.tools;

    const headers: Record<string, string> = {
      authorization: `Bearer ${this.apiKey}`,
      'content-type': 'application/json',
    };
    if (this.organization) headers['OpenAI-Organization'] = this.organization;

    const res = await this.httpClient.request<{
      choices: Array<{
        message: { content: string; role: string };
        finish_reason: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    }>({
      url: this.baseUrl,
      method: 'POST',
      headers,
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`OpenAI API error ${res.status}`);
    }
    const choice = res.body.choices?.[0];
    if (!choice) {
      throw new Error('OpenAI API returned no choices');
    }
    return {
      content: choice.message.content,
      model: request.model || this.defaultModel,
      finishReason: normalizeStopReason(choice.finish_reason),
      usage: res.body.usage
        ? {
            inputTokens: res.body.usage.prompt_tokens,
            outputTokens: res.body.usage.completion_tokens,
          }
        : undefined,
    };
  }
}

function normalizeStopReason(reason: string | undefined): ProviderResponse['finishReason'] {
  switch (reason) {
    case 'stop':
    case 'stop_sequence':
      return 'stop';
    case 'length':
      return 'length';
    case 'tool_calls':
    case 'function_call':
      return 'tool_calls';
    default:
      return 'stop';
  }
}
