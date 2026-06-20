import { describe, expect, it } from 'vitest';
import { LSPServer } from './server.js';

describe('LSPServer', () => {
  it('responds to initialize with server capabilities', () => {
    const out: string[] = [];
    const server = new LSPServer({ output: (m) => out.push(m) });
    // Simulate initialize request
    void server.handleMessage(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { rootUri: 'file:///x' },
      }),
    );
    // Wait microtask
    return Promise.resolve().then(() => {
      expect(out.length).toBeGreaterThan(0);
      const sent = out[0] ?? '';
      expect(sent).toContain('Content-Length:');
      const jsonStart = sent.indexOf('\r\n\r\n') + 4;
      const response = JSON.parse(sent.slice(jsonStart));
      expect(response.id).toBe(1);
      expect(response.result.capabilities.textDocumentSync).toBe(1);
      expect(response.result.serverInfo.name).toBe('crucible-lsp');
    });
  });

  it('handles textDocument/didOpen and publishes diagnostics', async () => {
    const out: string[] = [];
    const server = new LSPServer({ output: (m) => out.push(m) });
    server.onDiagnostics(async () => [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 5 },
        },
        severity: 2,
        message: 'test',
        source: 'crucible',
      },
    ]);
    await server.handleMessage(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: { textDocument: { uri: 'file:///x.ts', text: 'hello' } },
      }),
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(out.some((m) => m.includes('publishDiagnostics'))).toBe(true);
  });
});
