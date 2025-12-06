#!/usr/bin/env node

/**
 * Detect non-internationalized user-visible text in the src/ tree.
 * Exits with code 1 when violations are found.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const TEST_PATTERNS = [/\.spec\./i, /\.test\./i, /__tests__/i, /mock/i];

const USER_VISIBLE_ATTRS = [
  'placeholder',
  'title',
  'aria-label',
  'alt',
  'label',
  'aria-placeholder',
];

const POSIX_SEP = path.posix.sep;

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(resolved));
    } else {
      files.push(resolved);
    }
  }
  return files;
};

const shouldAnalyzeFile = (filePath) => {
  const ext = path.extname(filePath);
  if (!FILE_EXTENSIONS.includes(ext)) return false;
  return !TEST_PATTERNS.some((pattern) => pattern.test(filePath));
};

const stripComments = (content) =>
  content
    // block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // line comments
    .replace(/(^|\s)\/\/.*$/gm, '');

const countWords = (text) => {
  const words = text.match(/[A-Za-z]+/g);
  return words ? words.length : 0;
};

const looksLikeUrl = (text) => /^(https?:\/\/|\/|data:)/i.test(text.trim());

const isAllowedString = (text) => {
  const value = text.trim();
  if (!value) return true;
  if (value.includes('${')) return true; // skip template literals with vars
  if (!/[A-Za-z]/.test(value)) return true; // symbols / numbers only
  if (looksLikeUrl(value)) return true;
  return countWords(value) < 2; // smart detection: require 2+ words
};

const isTranslationCall = (linePrefix) =>
  /\b(t|tCommon|tErrors)\s*\($/i.test(linePrefix);

const toPosixPath = (filePath) => filePath.split(path.sep).join(POSIX_SEP);

const collectViolations = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = stripComments(content).split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;
    const importLike = /^\s*(import|require)\b/.test(line);
    if (importLike) return;

    // JSX text between tags
    const jsxRegex = />\s*([^<>{}\n]+?)\s*</g;
    let jsxMatch;
    while ((jsxMatch = jsxRegex.exec(line)) !== null) {
      const text = jsxMatch[1].trim();
      if (!isAllowedString(text)) {
        violations.push({ line: lineNumber, text });
      }
    }

    // Attribute values likely user-visible
    const attrRegex = new RegExp(
      `\\b(${USER_VISIBLE_ATTRS.join('|')})\\s*=\\s*(['"\`])([^'"\\\`]+)\\2`,
      'gi',
    );
    let attrMatch;
    while ((attrMatch = attrRegex.exec(line)) !== null) {
      const text = attrMatch[3];
      if (!isAllowedString(text)) {
        violations.push({ line: lineNumber, text });
      }
    }

    // Toast messages
    const toastRegex =
      /toast\.(error|success|warning|info)\s*\(\s*(['"`])([^'"`]+)\2/gi;
    let toastMatch;
    while ((toastMatch = toastRegex.exec(line)) !== null) {
      const text = toastMatch[3].trim();
      if (!isAllowedString(text)) {
        violations.push({ line: lineNumber, text });
      }
    }

    // Note: We intentionally skip generic string literal checks to reduce
    // false positives on class names, test IDs, inline styles, and
    // non-UI/internal strings. Detection focuses on:
    // - JSX text nodes
    // - User-visible attributes (placeholder, title, aria-label, alt, label)
    // - Toast messages
  });

  return violations;
};

const main = () => {
  const allFiles = walk(SRC_DIR);
  const targets = allFiles.filter(shouldAnalyzeFile);

  const results = {};

  for (const file of targets) {
    const violations = collectViolations(file);
    if (violations.length) {
      results[file] = violations;
    }
  }

  const filesWithIssues = Object.keys(results);
  if (!filesWithIssues.length) {
    console.log('No non-internationalized user-visible text found.');
    process.exit(0);
  }

  console.log(
    'The following files contain non-internationalized user-visible text:\n',
  );
  filesWithIssues.forEach((file) => {
    const relativePath = toPosixPath(path.relative(process.cwd(), file));
    results[file].forEach((violation) => {
      console.log(`${relativePath}:${violation.line} -> "${violation.text}"`);
    });
    console.log();
  });

  process.exit(1);
};

main();
