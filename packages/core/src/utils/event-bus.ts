/** A simple in-memory pub/sub for events. */
export type EventHandler<T> = (payload: T) => void | Promise<void>;

export class EventBus<TEvents extends Record<string, unknown>> {
  private handlers = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as EventHandler<unknown>);
    return () => set?.delete(handler as EventHandler<unknown>);
  }

  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    const off = this.on(event, async (payload) => {
      off();
      await handler(payload);
    });
    return off;
  }

  async emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void> {
    const set = this.handlers.get(event);
    if (!set) return;
    const errors: unknown[] = [];
    for (const h of set) {
      try {
        await h(payload);
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, `Errors emitting ${String(event)}`);
    }
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  removeAll<K extends keyof TEvents>(event?: K): void {
    if (event === undefined) this.handlers.clear();
    else this.handlers.delete(event);
  }
}
