import { getBoolean, getList } from '../argv.js';

const BUILT_IN_AGENTS = [
  {
    id: 'security',
    name: 'Security Reviewer',
    categories: ['security', 'dependency', 'error-handling'],
  },
  { id: 'performance', name: 'Performance Reviewer', categories: ['performance', 'concurrency'] },
  { id: 'style', name: 'Style Reviewer', categories: ['style', 'maintainability'] },
  { id: 'architecture', name: 'Architecture Reviewer', categories: ['architecture'] },
  { id: 'accessibility', name: 'Accessibility Reviewer', categories: ['accessibility'] },
  { id: 'dependency', name: 'Dependency Reviewer', categories: ['dependency', 'compatibility'] },
  { id: 'test-coverage', name: 'Test Coverage Reviewer', categories: ['testing'] },
  {
    id: 'api-contract',
    name: 'API Contract Reviewer',
    categories: ['api-contract', 'compatibility'],
  },
  { id: 'documentation', name: 'Documentation Reviewer', categories: ['documentation'] },
];

export function cmdAgents(flags: Record<string, string | boolean | string[]>): number {
  const filter = new Set(getList(flags, 'category'));
  const verbose = getBoolean(flags, 'verbose');
  for (const a of BUILT_IN_AGENTS) {
    if (filter.size > 0 && !a.categories.some((c) => filter.has(c))) continue;
    if (verbose) {
      console.log(`${a.id}\t${a.name}\t${a.categories.join(', ')}`);
    } else {
      console.log(`${a.id}\t${a.name}`);
    }
  }
  return 0;
}
