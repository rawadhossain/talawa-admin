#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { glob } from 'node:fs/promises';
import { createCoverageMap } from 'istanbul-lib-coverage';
import * as libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const cwd = path.dirname(fileURLToPath(import.meta.url));

const log = (...args) => console.log('[merge-coverage]', ...args);

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

async function mergeJsonCoverage() {
  const jsonFiles = await glob('coverage-shards/**/coverage-final.json', {
    cwd: path.resolve(cwd, '..'),
    absolute: true,
  });

  if (!jsonFiles.length) return false;

  log(`Found ${jsonFiles.length} coverage-final.json files, merging...`);
  const map = createCoverageMap({});

  jsonFiles.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    map.merge(data);
  });

  const outDir = path.resolve(cwd, '../coverage/vitest');
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, 'coverage-final.json'),
    JSON.stringify(map.toJSON()),
  );

  const context = libReport.createContext({ dir: outDir, coverageMap: map });
  const tree = libReport.summarizers.pkg(map);

  tree.visit(reports.create('lcovonly', { file: 'lcov.info' }), context);
  tree.visit(reports.create('text-summary'), context);

  log('Merged coverage written to coverage/vitest/lcov.info');
  return true;
}

async function mergeLcovFallback() {
  const pattern = 'coverage-shards/*/lcov.info';
  const outDir = path.resolve(cwd, '../coverage/vitest');
  ensureDir(outDir);

  log('No JSON found; merging LCOV via lcov-result-merger...');
  const result = spawnSync(
    'npx',
    ['lcov-result-merger', pattern, path.join(outDir, 'lcov.info')],
    { stdio: 'inherit', shell: true },
  );

  if (result.status !== 0) {
    throw new Error('lcov-result-merger failed');
  }
  log('LCOV merged to coverage/vitest/lcov.info');
}

(async () => {
  try {
    const mergedJson = await mergeJsonCoverage();
    if (!mergedJson) {
      await mergeLcovFallback();
    }

    const lcovPath = path.resolve(cwd, '../coverage/vitest/lcov.info');
    if (!fs.existsSync(lcovPath) || !fs.statSync(lcovPath).size) {
      throw new Error('Merged LCOV is missing or empty');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
