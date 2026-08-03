#!/usr/bin/env node
/**
 * check-i18n-keys.mjs — CI guard for translation catalog parity.
 *
 * English (`messages/en/`) is the source of truth. For every other locale
 * directory under `messages/`, this script fails the build if the locale is
 * MISSING a key that English has. Extra keys (present in a non-EN locale but
 * not in EN) are reported as warnings — they're usually metadata like
 * `_reviewNote` or a not-yet-removed stale key.
 *
 * Scaling: adding a language is just `messages/<locale>/*.json` + registering
 * it in `i18n/routing.ts`. This guard then automatically enforces parity for
 * the new locale — no edits to this script needed.
 *
 * Usage: node scripts/check-i18n-keys.mjs   (exit 1 on missing keys)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, '..', 'src', 'messages');

// Metadata keys that exist only in some locales (e.g. Dutch review notes) —
// not translatable content, so they're exempt from parity enforcement.
const METADATA_KEYS = new Set(['_reviewNote']);

function listLocaleDirs() {
  return readdirSync(messagesDir)
    .filter((entry) => {
      const abs = join(messagesDir, entry);
      return statSync(abs).isDirectory() && entry !== 'en';
    });
}

function loadLocale(locale) {
  const dir = join(messagesDir, locale);
  const merged = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue; // skip index.ts etc.
    const ns = basename(file, '.json');
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    merged[ns] = raw;
  }
  return merged;
}

/** Flatten a nested object into dot-paths, skipping metadata + non-object leaves. */
function flatten(obj, prefix = '', out = new Set()) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out.add(prefix);
    return out;
  }
  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) {
    out.add(prefix);
    return out;
  }
  for (const key of keys) {
    if (METADATA_KEYS.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

/** Flatten a merged locale object across namespaces: `ns.path.to.key`. */
function flattenLocale(merged) {
  const paths = new Set();
  for (const ns of Object.keys(merged)) {
    const sub = flatten(merged[ns]);
    for (const p of sub) paths.add(`${ns}.${p}`);
  }
  return paths;
}

function main() {
  const enMerged = loadLocale('en');
  const enKeys = flattenLocale(enMerged);

  if (enKeys.size === 0) {
    console.error('✖ No English message keys found — is messages/en/ populated?');
    process.exit(1);
  }

  const locales = listLocaleDirs();
  if (locales.length === 0) {
    console.log('ℹ No non-English locale directories found — nothing to check.');
    process.exit(0);
  }

  let failed = false;

  for (const locale of locales) {
    const merged = loadLocale(locale);
    const keys = flattenLocale(merged);
    const missing = [...enKeys].filter((k) => !keys.has(k)).sort();
    const extra = [...keys].filter((k) => !enKeys.has(k)).sort();

    console.log(`\nLocale: ${locale}  (EN keys: ${enKeys.size}, ${locale} keys: ${keys.size})`);

    if (missing.length > 0) {
      failed = true;
      console.error(`  ✖ MISSING ${missing.length} key(s) present in English:`);
      for (const k of missing) console.error(`     - ${k}`);
    } else {
      console.log('  ✓ All English keys present.');
    }

    if (extra.length > 0) {
      console.warn(`  ⚠ Extra ${extra.length} key(s) not in English (warning only):`);
      for (const k of extra.slice(0, 20)) console.warn(`     - ${k}`);
      if (extra.length > 20) console.warn(`     ... and ${extra.length - 20} more`);
    }
  }

  if (failed) {
    console.error('\n✖ i18n key parity check FAILED — add the missing keys to the locale catalogs.');
    process.exit(1);
  }
  console.log('\n✓ i18n key parity check passed.');
  process.exit(0);
}

main();