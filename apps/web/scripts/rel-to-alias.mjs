// One-off: convert relative imports that resolve under `src/` to the `@/` alias
// for files moved under `src/app/[locale]/`. The move added one path level, so
// relative imports calibrated to the OLD (shallower) location now point into
// `app/[locale]/...` incorrectly. We resolve each spec against the OLD directory
// (current dir with the `[locale]/` segment removed) to find the true target,
// then emit `@/...` (depth-agnostic). Relative imports that stay within the
// app tree (e.g. `./page`, sibling components) are left untouched.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

const ROOT = resolve('src/app/[locale]');
const SRC = resolve('src');
const SEGMENT = sep + '[locale]';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

// Intra-app relative imports (sibling/child pages or co-located modules) resolve
// under src/app and don't reference top-level src folders — keep them relative.
// Only rewrite specs whose OLD resolution lands in a top-level src folder
// (lib, contexts, components, hooks, utils, types, i18n, messages).
const TOP_LEVEL = ['lib', 'contexts', 'components', 'hooks', 'utils', 'types', 'i18n', 'messages'];

const importRe = /(from\s*)(['"])(\.{1,2}\/[^'"]+)(['"])/g;
let changed = 0;
const files = walk(ROOT);

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  let touched = false;
  src = src.replace(importRe, (m, kw, q1, spec, q2) => {
    const newDir = dirname(file);
    // OLD directory before the move: drop the `[locale]` segment.
    const oldDir = newDir.includes(SEGMENT) ? newDir.replace(SEGMENT, '') : newDir;
    const resolved = resolve(oldDir, spec);
    if (!resolved.startsWith(SRC + sep)) return m;
    const rel = relative(SRC, resolved).split(sep).join('/');
    const top = rel.split('/')[0];
    if (!TOP_LEVEL.includes(top)) return m; // keep intra-app relative imports
    touched = true;
    return `${kw}${q1}@/${rel}${q2}`;
  });
  if (touched) {
    writeFileSync(file, src);
    changed++;
  }
}
console.log(`Rewrote relative->@/ imports in ${changed} of ${files.length} files.`);