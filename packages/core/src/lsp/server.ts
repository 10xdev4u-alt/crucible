/**
 * Minimal Language Server Protocol (LSP) scaffolding for Crucible.
 *
 * This is intentionally minimal — it implements the parts of LSP that
 * matter for inline diagnostics. The actual diagnostics are produced
 * by the orchestrator running against the buffer contents.
 *
 * Wire format: LSP uses JSON-RPC 2.0 over stdin/stdout.
 */
import { createInterface } from 'node:readline';

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPDiagnostic {
  range: LSPRange;
  severity?: 1 | 2 | 3 | 4; // 1=error, 2=warning, 3=info, 4=hint
  code?: string;
  source?: string;
  message: string;
}

export interface LSPDiagnosticPublisher {
  publish(uri: string, diagnostics: LSPDiagnostic[]): void;
}

interface IncomingMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const CONTENT_LENGTH = 'Content-Length:';

export class LSPServer {
  private handlers = new Map<string, (params: unknown) => Promise<unknown> | unknown>();
  private diagnosticHandler?: (uri: string, content: string) => Promise<LSPDiagnostic[]>;
  private rootUri?: string;
  private bufferContent = new Map<string, string>();
  private output: (msg: string) => void;

  constructor(options: { output?: (msg: string) => void } = {}) {
    this.output = options.output ?? ((msg) => process.stdout.write(msg));
  }

  on(method: string, handler: (params: unknown) => Promise<unknown> | unknown): void {
    this.handlers.set(method, handler);
  }

  onDiagnostics(handler: (uri: string, content: string) => Promise<LSPDiagnostic[]>): void {
    this.diagnosticHandler = handler;
  }

  /** Start the server. Reads from stdin, writes to stdout. */
  start(): void {
    const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
    let _buffer = '';
    rl.on('line', (line) => {
      if (line.startsWith(CONTENT_LENGTH)) {
        const len = Number.parseInt(line.slice(CONTENT_LENGTH.length).trim(), 10);
        _buffer = '';
        // Read the empty line that follows
        rl.once('line', () => {
          let data = '';
          rl.once('line', (chunk) => {
            data += chunk;
            if (data.length >= len) {
              this.handleMessage(data);
            } else {
              // Buffer until we have the full payload
              const onMore = (more: string) => {
                data += more;
                if (data.length >= len) {
                  rl.off('line', onMore);
                  this.handleMessage(data.slice(0, len));
                }
              };
              rl.on('line', onMore);
            }
          });
        });
      }
    });
  }

  private async handleMessage(data: string): Promise<void> {
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(data) as IncomingMessage;
    } catch {
      return;
    }
    if (!msg.method) {
      // Response — ignore for now
      return;
    }
    if (msg.method === 'initialize') {
      const params = (msg.params ?? {}) as { rootUri?: string; rootPath?: string };
      this.rootUri = params.rootUri ?? params.rootPath;
      this.send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          capabilities: {
            textDocumentSync: 1, // Full text sync
            hoverProvider: true,
            codeActionProvider: true,
          },
          serverInfo: { name: 'crucible-lsp', version: '0.1.0' },
        },
      });
      return;
    }
    if (msg.method === 'initialized' || msg.method === 'exit') {
      return;
    }
    if (msg.method === 'textDocument/didOpen') {
      const params = msg.params as { textDocument: { uri: string; text: string } };
      this.bufferContent.set(params.textDocument.uri, params.textDocument.text);
      await this.runDiagnostics(params.textDocument.uri, params.textDocument.text);
      return;
    }
    if (msg.method === 'textDocument/didChange') {
      const params = msg.params as {
        textDocument: { uri: string; version: number };
        contentChanges: Array<{ text: string }>;
      };
      const newText = params.contentChanges.at(-1)?.text;
      if (newText !== undefined) {
        this.bufferContent.set(params.textDocument.uri, newText);
        await this.runDiagnostics(params.textDocument.uri, newText);
      }
      return;
    }
    if (msg.method === 'textDocument/didClose') {
      const params = msg.params as { textDocument: { uri: string } };
      this.bufferContent.delete(params.textDocument.uri);
      return;
    }
    const handler = this.handlers.get(msg.method);
    if (handler) {
      try {
        const result = await handler(msg.params);
        this.send({ jsonrpc: '2.0', id: msg.id, result });
      } catch (err) {
        this.send({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
        });
      }
    }
  }

  private async runDiagnostics(uri: string, content: string): Promise<void> {
    if (!this.diagnosticHandler) return;
    const diags = await this.diagnosticHandler(uri, content);
    this.send({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: diags },
    });
  }

  private send(msg: object): void {
    const data = JSON.stringify(msg);
    this.output(`${CONTENT_LENGTH} ${data.length}\r\n\r\n${data}`);
  }
}
