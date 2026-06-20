import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Agent, AgentInfo } from '../types/agent.js';

export interface LoadedPlugin {
  id: string;
  path: string;
  agents: Agent[];
}

/** Discover and load plugins from a directory. */
export async function discoverPlugins(
  dir: string,
  options: { recursive?: boolean } = {},
): Promise<LoadedPlugin[]> {
  if (!existsSync(dir)) return [];
  const out: LoadedPlugin[] = [];
  await walk(dir, options.recursive ?? true, out);
  return out;
}

async function walk(dir: string, recursive: boolean, out: LoadedPlugin[]): Promise<void> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      await walk(full, recursive, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isPluginFile(entry.name)) continue;
    try {
      const mod = (await import(pathToFileURL(full).href)) as PluginModule;
      if (Array.isArray(mod.agents)) {
        out.push({
          id: entry.name.replace(/\.[mc]?[jt]s$/, ''),
          path: full,
          agents: mod.agents,
        });
      } else if (mod.agent) {
        out.push({
          id: entry.name.replace(/\.[mc]?[jt]s$/, ''),
          path: full,
          agents: [mod.agent],
        });
      }
    } catch (err) {
      console.error(`[crucible] failed to load plugin ${full}:`, err);
    }
  }
}

const isPluginFile = (name: string): boolean => /\.(cjs|mjs|js|ts)$/.test(name);

interface PluginModule {
  agent?: Agent;
  agents?: Agent[];
}

/** A helper to define a plugin. */
export function definePlugin(definition: { agents: Agent[] }): { agents: Agent[] } {
  return { agents: definition.agents };
}

/** A helper to define a single-agent plugin. */
export function defineAgentPlugin(agent: Agent): { agent: Agent } {
  return { agent };
}

/** Get info about all agents in a loaded plugin. */
export function pluginInfo(plugin: LoadedPlugin): AgentInfo[] {
  return plugin.agents.map((a) => a.info());
}
