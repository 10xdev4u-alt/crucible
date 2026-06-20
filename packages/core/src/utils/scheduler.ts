/** A small task scheduler with cron-like syntax (subset). */
export type Schedule = string;

export interface ScheduledTask {
  id: string;
  schedule: Schedule;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  errors: number;
}

export type ScheduleHandler = () => Promise<void>;

export class Scheduler {
  private readonly tasks = new Map<
    string,
    { task: ScheduledTask; handler: ScheduleHandler; timer?: NodeJS.Timeout }
  >();

  /** Register a recurring task. */
  register(id: string, schedule: Schedule, handler: ScheduleHandler): void {
    const task: ScheduledTask = {
      id,
      schedule,
      runCount: 0,
      errors: 0,
      nextRun: this.nextRun(schedule, Date.now()),
    };
    this.tasks.set(id, { task, handler });
    this.scheduleTimer(id);
  }

  /** Unregister a task. */
  unregister(id: string): boolean {
    const t = this.tasks.get(id);
    if (!t) return false;
    if (t.timer) clearTimeout(t.timer);
    return this.tasks.delete(id);
  }

  /** Get info about all registered tasks. */
  list(): ScheduledTask[] {
    return [...this.tasks.values()].map((t) => ({ ...t.task }));
  }

  /** Stop all tasks. */
  stop(): void {
    for (const { timer } of this.tasks.values()) {
      if (timer) clearTimeout(timer);
    }
  }

  private scheduleTimer(id: string): void {
    const t = this.tasks.get(id);
    if (!t) return;
    const now = Date.now();
    const next = this.nextRun(t.task.schedule, now);
    t.task.nextRun = next;
    const delay = Math.max(0, next - now);
    t.timer = setTimeout(() => {
      void this.execute(id);
    }, delay);
  }

  private async execute(id: string): Promise<void> {
    const t = this.tasks.get(id);
    if (!t) return;
    t.task.lastRun = Date.now();
    t.task.runCount += 1;
    try {
      await t.handler();
    } catch {
      t.task.errors += 1;
    }
    this.scheduleTimer(id);
  }

  /** Compute the next run time after `from` given a simple schedule. */
  nextRun(schedule: Schedule, from: number): number {
    if (schedule === '@hourly') return from + 60 * 60 * 1000;
    if (schedule === '@daily' || schedule === '@midnight') return from + 24 * 60 * 60 * 1000;
    if (schedule === '@weekly') return from + 7 * 24 * 60 * 60 * 1000;
    if (schedule.startsWith('@every ')) {
      const ms = parseDuration(schedule.slice(7));
      if (ms) return from + ms;
    }
    if (/^\d+$/.test(schedule)) {
      return from + Number.parseInt(schedule, 10) * 1000;
    }
    // Best-effort: cron-like 5-field syntax (minute hour dom mon dow)
    const parts = schedule.split(/\s+/);
    if (parts.length === 5) {
      return nextCron(from, parts as [string, string, string, string, string]);
    }
    return from + 60_000;
  }
}

function parseDuration(s: string): number | undefined {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(s.trim());
  if (!m) return undefined;
  const n = Number.parseInt(m[1]!, 10);
  const unit = m[2] ?? 's';
  const ms = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 1000;
  return n * ms;
}

function nextCron(from: number, fields: [string, string, string, string, string]): number {
  // Simplified: only support "* * * * *" (every minute) and fixed minute.
  const [minute] = fields;
  const date = new Date(from);
  if (minute === '*') {
    date.setSeconds(0, 0);
    date.setMinutes(date.getMinutes() + 1);
  } else if (/^\d+$/.test(minute)) {
    const target = Number.parseInt(minute, 10);
    if (date.getMinutes() >= target) {
      date.setHours(date.getHours() + 1);
    }
    date.setMinutes(target, 0, 0);
  }
  return date.getTime();
}
