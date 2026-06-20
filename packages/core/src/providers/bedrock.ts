import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const BEDROPI_DEFAULT_URL = 'https://bedrock-runtime.us-east-1.amazonaws.com';

const BEDROCK_MODELS = [
  {
    id: 'anthropic.claude-opus-4-5-20251115-v1:0',
    provider: 'bedrock',
    displayName: 'Claude Opus 4.5 (Bedrock)',
    contextWindow: 200_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'anthropic.claude-sonnet-4-5-20251022-v1:0',
    provider: 'bedrock',
    displayName: 'Claude Sonnet 4.5 (Bedrock)',
    contextWindow: 200_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'amazon.nova-pro-v1:0',
    provider: 'bedrock',
    displayName: 'Amazon Nova Pro',
    contextWindow: 300_000,
    maxOutputTokens: 5_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'meta.llama3-3-70b-instruct-v1:0',
    provider: 'bedrock',
    displayName: 'Llama 3.3 70B (Bedrock)',
    contextWindow: 128_000,
    maxOutputTokens: 8_000,
    supportsTools: false,
    supportsStreaming: true,
    supportsVision: false,
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

export interface BedrockProviderOptions {
  apiKey: string;
  region?: string;
  baseUrl?: string;
  httpClient?: HttpClient;
  defaultModel?: string;
}

/** Provider for AWS Bedrock (Anthropic Claude, Amazon Nova, Llama, etc.). */
export class BedrockProvider implements Provider {
  private readonly apiKey: string;
  private readonly region: string;
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;

  constructor(options: BedrockProviderOptions) {
    if (!options.apiKey) throw new Error('BedrockProvider requires apiKey');
    this.apiKey = options.apiKey;
    this.region = options.region ?? 'us-east-1';
    this.baseUrl = options.baseUrl ?? BEDROPI_DEFAULT_URL;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured.');
        }
      })();
    this.defaultModel = options.defaultModel ?? 'anthropic.claude-sonnet-4-5-20251022-v1:0';
  }

  info(): ProviderInfo {
    return {
      id: 'bedrock',
      name: 'AWS Bedrock',
      models: [...BEDROCK_MODELS],
      capabilities: CAPABILITIES,
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const model = request.model || this.defaultModel;
    const isAnthropic = model.startsWith('anthropic.');
    const isAmazon = model.startsWith('amazon.');
    const isMeta = model.startsWith('meta.');

    let body: Record<string, unknown>;
    if (isAnthropic) {
      const systemPrompt = request.systemPrompt ?? extractSystemPrompt(request.messages);
      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));
      body = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: request.maxOutputTokens ?? 1024,
        messages,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      };
    } else if (isAmazon) {
      const lastUser = [...request.messages].reverse().find((m) => m.role === 'user');
      body = {
        inputText: lastUser?.content ?? '',
        textGenerationConfig: {
          maxTokenCount: request.maxOutputTokens ?? 1024,
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        },
      };
    } else if (isMeta) {
      body = {
        prompt: request.messages.map((m) => m.content).join('\n'),
        max_gen_len: request.maxOutputTokens ?? 1024,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      };
    } else {
      throw new Error(`Unsupported Bedrock model: ${model}`);
    }

    const url = `${this.baseUrl}/model/${encodeURIComponent(model)}/invoke`;
    const res = await this.httpClient.request<{
      content?: Array<{ text?: string; type?: string }>;
      outputText?: string;
      generation?: string;
      stopReason?: string;
      usage?: { inputTokens?: number; outputTokens?: number };
    }>({
      url,
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
        'x-amzn-region': this.region,
      },
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`Bedrock API error ${res.status}`);
    }
    const text = res.body.content?.[0]?.text ?? res.body.outputText ?? res.body.generation ?? '';
    return {
      content: text,
      model,
      finishReason: res.body.stopReason === 'max_tokens' ? 'length' : 'stop',
      usage: res.body.usage
        ? {
            inputTokens: res.body.usage.inputTokens ?? 0,
            outputTokens: res.body.usage.outputTokens ?? 0,
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
