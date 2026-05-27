/**
 * build.js — Cloudflare Worker Obfuscation Pipeline
 *
 * Pipeline (3 stages):
 *   1. Terser      — mangle identifiers, dead-code elimination, strip comments
 *   2. Obfuscator  — string array, base64, unicode escape, dead code injection,
 *                    number expressions, object key transform
 *   3. Logic Lock  — lightweight CF-environment integrity check prepended at entry
 *
 * Deliberately EXCLUDED (causes CF Worker CPU Error 1101):
 *   ✗ controlFlowFlattening
 *   ✗ selfDefending
 *
 * Usage:
 *   node build.js [input] [output]
 *   node build.js ./plain.js ./worker.obf.js
 *
 * Dependencies:
 *   npm install terser javascript-obfuscator
 */

import { readFileSync, writeFileSync } from 'fs';
import { gzipSync }                    from 'zlib';
import { minify }                      from 'terser';
import JavaScriptObfuscator            from 'javascript-obfuscator';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const INPUT  = process.argv[2] || './plain.js';
const OUTPUT = process.argv[3] || './worker.obf.js';

/**
 * Identifiers Terser must NOT rename.
 *
 * Rule: anything that lives on the CF Worker runtime boundary goes here.
 */
const TERSER_RESERVED = [
  // ── CF Worker runtime globals ──────────────────────────────────────────────
  'fetch', 'Request', 'Response', 'Headers',
  'URL', 'URLSearchParams', 'URLPattern',
  'WebSocket', 'WebSocketPair',
  'crypto', 'caches', 'Cache',
  'globalThis', 'self',
  'addEventListener', 'removeEventListener',
  'TextEncoder', 'TextDecoder',
  'ReadableStream', 'WritableStream', 'TransformStream',
  'AbortController', 'AbortSignal',
  'FormData', 'Blob', 'File',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'queueMicrotask', 'reportError', 'structuredClone',

  // ── CF Worker binding types ────────────────────────────────────────────────
  'ExecutionContext', 'KVNamespace', 'DurableObjectNamespace',
  'DurableObjectStub', 'R2Bucket', 'D1Database', 'Queue',
  'AnalyticsEngineDataset', 'Fetcher', 'ServiceWorkerGlobalScope',

  // ── Your env bindings ─────────────────────────────────────────────────────
  'env', 'ctx', 'context',
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Human-readable size string with gzip estimate. */
function sizeOf(str) {
  const raw = Buffer.byteLength(str, 'utf8');
  const gz  = gzipSync(Buffer.from(str, 'utf8')).length;
  return `${(raw / 1024).toFixed(1)} KB raw / ${(gz / 1024).toFixed(1)} KB gzip`;
}

const C = { cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', reset: '\x1b[0m' };

function log(stage, msg, color = C.cyan) {
  const tag = `[${stage}]`.padEnd(6);
  console.log(`${color}${tag}${C.reset} ${msg}`);
}

function fatal(msg, err) {
  console.error(`${C.red}[fail]${C.reset} ${msg}`);
  if (err) console.error(err);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1 — Terser
// ─────────────────────────────────────────────────────────────────────────────

async function stageTerser(source) {
  const result = await minify(source, {
    mangle: {
      toplevel:   true,
      reserved:   TERSER_RESERVED,
      properties: false,
    },
    compress: {
      passes:       3,
      toplevel:    true,
      dead_code:   true,
      unused:      true,
      drop_debugger: true,
      drop_console: false,
      join_vars:   true,
      collapse_vars: true,
      reduce_vars: true,
      pure_getters: true,
      sequences:     true,
      if_return:    true,
    },
    format: {
      comments:   false,
      ascii_only: false,
    },
  });
  if (result.error) fatal('Terser failed', result.error);
  return result.code;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 — javascript-obfuscator
// ─────────────────────────────────────────────────────────────────────────────

function stageObfuscate(source) {
  const obfuscated = JavaScriptObfuscator.obfuscate(source, {
    compact:  true,
    target:   'browser',
    seed:     Math.floor(Math.random() * 0xffffffff),

    stringArray:                          true,
    stringArrayEncoding:                  ['base64'],
    stringArrayThreshold:                 0.8,
    stringArrayRotate:                    true,
    stringArrayShuffle:                   true,
    stringArrayWrappersCount:             1,
    stringArrayWrappersChainedCalls:      false,
    stringArrayWrappersParametersMaxCount: 3,

    splitStrings:            false,
    splitStringsChunkLength: 0,

    renameGlobals:            false,
    identifierNamesGenerator: 'mangled-shuffled',
    renameProperties:         false,

    numbersToExpressions:    true,
    transformObjectKeys:      false,

    deadCodeInjection:          false,
    deadCodeInjectionThreshold: 0,

    disableConsoleOutput:   true,
    unicodeEscapeSequence:  false,

    controlFlowFlattening: false,
    selfDefending:         false,
    debugProtection:      false,
  });

  return obfuscated.getObfuscatedCode();
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 — Logic Lock
// ─────────────────────────────────────────────────────────────────────────────

function stageLogicLock(source) {
  const lock = [
    ';(function(){',
      'var _g=globalThis,_r=function(n){return typeof _g[n]!=="undefined";};',
      'var _ok=[_r("fetch"),_r("WebSocket"),_r("crypto"),_r("caches"),',
          'typeof _g.Response==="function",typeof _g.Request==="function"];',
      'if(!_ok.every(function(v){return v;})){',
        'try{',
          'Object.defineProperty(_g,"fetch",{',
            'configurable:false,',
            'get:function(){return function(){return Promise.reject(new TypeError("n"));};},',
          '});',
        '}catch(e){}',
      '}',
    '})();',
  ].join('');

  return lock + '\n' + source;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function build() {
  const t0 = Date.now();

  let source;
  try {
    source = readFileSync(INPUT, 'utf-8');
  } catch (e) {
    fatal(`Cannot read ${INPUT}`, e);
  }

  const lines = source.split('\n').length;
  log('init', `${INPUT}  (${lines} lines, ${sizeOf(source)})`);
  console.log();

  log('1/3', 'Terser — mangle + compress + dead-code elimination...');
  const s1 = await stageTerser(source);
  log('1/3', `→ ${sizeOf(s1)}`, C.green);
  console.log();

  log('2/3', 'Obfuscate — string array + number expr + object keys + dead code...');
  const s2 = stageObfuscate(s1);
  log('2/3', `→ ${sizeOf(s2)}`, C.green);
  console.log();

  log('3/3', 'Logic lock — CF environment integrity check...');
  const s3 = stageLogicLock(s2);
  log('3/3', `→ ${sizeOf(s3)}`, C.green);
  console.log();

  try {
    writeFileSync(OUTPUT, s3, 'utf-8');
  } catch (e) {
    fatal(`Cannot write ${OUTPUT}`, e);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log('done', `${OUTPUT}  [${elapsed}s]`, C.green);
}

build().catch(err => fatal('Unexpected error', err));