const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

/** Returns true if the string is a valid semver version. */
export function isValidSemver(v: string): boolean {
  return SEMVER_REGEX.test(v);
}

interface Parsed {
  major: number;
  minor: number;
  patch: number;
  pre?: string;
  build?: string;
}

const parse = (v: string): Parsed | null => {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$/);
  if (!m) return null;
  return {
    major: Number.parseInt(m[1]!, 10),
    minor: Number.parseInt(m[2]!, 10),
    patch: Number.parseInt(m[3]!, 10),
    ...(m[4] ? { pre: m[4] } : {}),
    ...(m[5] ? { build: m[5] } : {}),
  };
};

/** Compare two semver versions. Returns negative if a<b, 0 if equal, positive if a>b. */
export function versionCompare(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) throw new Error(`Invalid semver: ${a} or ${b}`);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  // Pre-release versions are lower than the release
  if (pa.pre && !pb.pre) return -1;
  if (!pa.pre && pb.pre) return 1;
  if (pa.pre && pb.pre) return pa.pre.localeCompare(pb.pre);
  return 0;
}

export type BumpType = 'major' | 'minor' | 'patch';

/** Bump a semver version. */
export function semverBump(v: string, type: BumpType): string {
  const p = parse(v);
  if (!p) throw new Error(`Invalid semver: ${v}`);
  if (type === 'major') return `${p.major + 1}.0.0`;
  if (type === 'minor') return `${p.major}.${p.minor + 1}.0`;
  if (p.pre) return `${p.major}.${p.minor}.${p.patch}`;
  return `${p.major}.${p.minor}.${p.patch + 1}`;
}
