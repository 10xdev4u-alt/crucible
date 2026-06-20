import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const GEMINI_DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    displayName: 'Gemini 2.5 Pro',
    contextWindow: 2_000_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    displayName: 'Gemini 2.5 Flash',
    contextWindow: 1_000_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    provider: 'gemini',
    displayName: 'Gemini 2.5 Flash Lite',
    contextWindow: 1_000_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
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

export interface GeminiProviderOptions {
  apiKey: string;
  baseUrl?: string;
  httpClient?: HttpClient;
  defaultModel?: string;
}

/** Provider for Google Gemini (using the official generateContent API). */
export class GeminiProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) throw new Error('GeminiProvider requires apiKey');
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? GEMINI_DEFAULT_URL;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured.');
        }
      })();
    this.defaultModel = options.defaultModel ?? 'gemini-2.5-flash';
  }

  info(): ProviderInfo {
    return {
      id: 'gemini',
      name: 'Google Gemini',
      models: [...GEMINI_MODELS],
      capabilities: CAPABILITIES,
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const systemPrompt = request.systemPrompt ?? extractSystemPrompt(request.messages);
    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        ...(request.maxOutputTokens ? { maxOutputTokens: request.maxOutputTokens } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.stopSequences ? { stopSequences: request.stopSequences } : {}),
      },
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }
    if (request.tools) body.tools = request.tools;

    const model = request.model || this.defaultModel;
    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;
    const res = await this.httpClient.request<{
      candidates: Array<{
        content: { parts: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
    }>({
      url,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`Gemini API error ${res.status}`);
    }
    const candidate = res.body.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned no candidates');
    const text = (candidate.content.parts ?? []).map((p) => p.text ?? '').join('');
    return {
      content: text,
      model,
      finishReason: normalizeStopReason(candidate.finishReason),
      usage: res.body.usageMetadata
        ? {
            inputTokens: res.body.usageMetadata.promptTokenCount,
            outputTokens: res.body.usageMetadata.candidatesTokenCount,
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

function normalizeStopReason(reason: string | undefined): ProviderResponse['finishReason'] {
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'TOOL_USE':
    case 'FUNCTION_CALL':
      return 'tool_calls';
    default:
      return 'stop';
  }
}
