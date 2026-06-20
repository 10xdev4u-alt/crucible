import { describe, expect, it } from 'vitest';
import { Logger, NoopLogger } from './logger.js';

describe('Logger', () => {
  it('respects the configured level', () => {
    const lines: string[] = [];
    const log = new Logger({ level: 'warn', destination: (l) => lines.push(l), timestamps: false });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');
    expect(lines).toEqual(['[WARN] c', '[ERROR] d']);
  });

  it('prefixes messages with the child prefix', () => {
    const lines: string[] = [];
    const root = new Logger({
      level: 'info',
      destination: (l) => lines.push(l),
      timestamps: false,
    });
    const child = root.child('orchestrator');
    child.info('hello');
    expect(lines[0]).toContain('[orchestrator]');
    expect(lines[0]).toContain('hello');
  });

  it('serializes non-string args as JSON', () => {
    const lines: string[] = [];
    const log = new Logger({ level: 'info', destination: (l) => lines.push(l), timestamps: false });
    log.info('payload', { foo: 1 });
    expect(lines[0]).toContain('{"foo":1}');
  });

  it('does nothing at silent level', () => {
    const log = new NoopLogger();
    expect(() => log.error('x')).not.toThrow();
  });

  it('emits a timestamp by default', () => {
    const lines: string[] = [];
    const log = new Logger({ destination: (l) => lines.push(l) });
    log.info('hi');
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
