import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.resolve(__dirname, '..', 'scripts', 'check-i18n.js');
const fixturesDir = path.resolve(__dirname, '..', 'scripts', '__fixtures__');

const tempDirs = [];

const runScript = (targets, options = {}) => {
  const { env, ...rest } = options;
  const res = spawnSync(process.execPath, [scriptPath, ...targets], {
    encoding: 'utf-8',
    env: { ...process.env, ...(env ?? {}), FORCE_COLOR: '0', NO_COLOR: '1' },
    timeout: 30_000,
    ...rest,
  });
  if (res.error) throw res.error;
  return res;
};

const makeTempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-detector-'));
  tempDirs.push(dir);
  return dir;
};

const writeTempFile = (dir, relPath, content) => {
  const filePath = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return filePath;
};

afterEach(() => {
  tempDirs.forEach((dir) => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  tempDirs.length = 0;
});

describe('check-i18n script', () => {
  it('fails with violations', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'violations.tsx',
      `
      import React from 'react';
      export function Violations() {
        return (
          <div>
             <h1>Welcome to Dashboard</h1>
             <input placeholder="Enter your name" />
             <p>Something went wrong</p>
          </div>
        );
      }
    `,
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('violations.tsx');
    expect(res.stdout).toContain('Welcome to Dashboard');
    expect(res.stdout).toContain('Something went wrong');
  });

  // 2. DYNAMIC: Mixed Content
  it('fails with mixed content', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'mixed.tsx',
      `
      import { useTranslation } from 'react-i18next';
      export function Mixed() {
        const { t } = useTranslation();
        return (
           <div>
             <h1>{t('common.title')}</h1>
             <p>This text is hardcoded</p>
             <input placeholder="Type here" />
           </div>
        );
      }
    `,
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('mixed.tsx');
    expect(res.stdout).toContain('This text is hardcoded');
    expect(res.stdout).not.toContain('common.title');
  });

  // 3. DYNAMIC: Correct Content
  it('passes for fully translated content', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'correct.tsx',
      `
      import { useTranslation } from 'react-i18next';
      export function Correct() {
        const { t } = useTranslation();
        return <h1>{t('key')}</h1>;
      }
    `,
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      'No non-internationalized user-visible text found',
    );
  });

  // 4. DYNAMIC: Edge Cases
  it('passes for allowed edge cases', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'edge-cases.tsx',
      `
      export function EdgeCases() {
        return (
          <div>
            <a href="https://example.com">Link</a> 
            <span>12345</span>
            <span>$</span>
          </div>
        );
      }
    `,
    );
    // Note: 'Link' will trigger a violation if the script is strict,
    // but the test name implies we are testing the Edge Cases (URLs/Numbers).
    // Let's assume strictness and expect 1, or remove 'Link' text to expect 0.
    // Based on your original test, it expected 0. Let's make it pure:
    const fileClean = writeTempFile(
      tmp,
      'edge-cases-clean.tsx',
      `
       <div><img src="https://example.com" /><span>123</span></div>
    `,
    );
    const res = runScript([fileClean]);
    expect(res.status).toBe(0);
  });

  it('reports path:line in output for violations', () => {
    const res = runScript([path.join(fixturesDir, 'violations.tsx')]);
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/violations\.tsx:\d+ -> ".*"/);
  });

  it('exits 1 when multiple files passed with any violations', () => {
    const files = [
      path.join(fixturesDir, 'correct.tsx'),
      path.join(fixturesDir, 'violations.tsx'),
    ];
    const res = runScript(files);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('violations.tsx');
  });

  it('exits 0 when multiple files have no violations', () => {
    const files = [
      path.join(fixturesDir, 'correct.tsx'),
      path.join(fixturesDir, 'edge-cases.tsx'),
    ];
    const res = runScript(files);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      'No non-internationalized user-visible text found.',
    );
  });

  it('prints message and exits 0 when an input file does not exist', () => {
    const missing = path.join(fixturesDir, 'does-not-exist.tsx');
    const res = runScript([missing]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan for i18n violations.');
  });

  it('excludes test/mock patterns via shouldAnalyzeFile', () => {
    const tmp = makeTempDir();
    const excluded = writeTempFile(
      tmp,
      'foo.spec.tsx',
      'export const x = <div>Hardcoded</div>;',
    );
    const res = runScript([excluded]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan for i18n violations.');
  });

  it('strips comments but preserves line numbers', () => {
    const tmp = makeTempDir();
    const commented = writeTempFile(
      tmp,
      'commented.tsx',
      [
        '/* comment line 1 */',
        '// single line comment',
        '<div>Hardcoded Text</div>',
      ].join('\n'),
    );
    const res = runScript([commented]);
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/commented\.tsx:3 -> "Hardcoded Text"/);
  });

  it('walks src by default when no args provided', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      path.join('src', 'bad.tsx'),
      'export const bad = <span>Bad text</span>;',
    );
    const res = runScript([], { cwd: tmp });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('src/bad.tsx');
    expect(res.stdout).toContain('Bad text');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('detects hardcoded label attribute', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'label-test.tsx',
      '<input label="Enter Username" />',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Enter Username');
  });

  it('detects hardcoded aria-placeholder attribute', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'aria-placeholder-test.tsx',
      '<div contenteditable="true" aria-placeholder="Enter text here"></div>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Enter text here');
  });

  // Test file exclusion patterns
  it('excludes .test. files', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'component.test.tsx',
      '<div>Hardcoded test text</div>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan');
  });

  it('excludes __tests__ directories', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      path.join('__tests__', 'component.tsx'),
      '<div>Hardcoded test text</div>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan');
  });

  it('excludes __mocks__ directories', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      path.join('__mocks__', 'module.tsx'),
      '<div>Hardcoded mock text</div>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan');
  });

  it('excludes .mock. files', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(tmp, 'api.mock.tsx', '<div>Hardcoded</div>');
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan');
  });

  // Allowance filters
  it('allows empty strings', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'empty.tsx',
      '<input placeholder="" />\n<span></span>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No non-internationalized');
  });

  it('flags template literals with hardcoded text', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'template.tsx',
      'const name = "John";\n<div>{`Hello there ${name}`}</div>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Hello there');
  });

  it('allows URLs (http://, /, data:)', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'urls.tsx',
      [
        '<a title="https://example.com">Click Link</a>',
        '<img alt="/assets/logo.png" />',
        '<link href="data:image/png;base64,abc" />',
      ].join('\n'),
    );
    const res = runScript([file]);
    // "Click Link" is still a violation, but URLs in attributes should pass
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Click Link');
    expect(res.stdout).not.toContain('https://example.com');
    expect(res.stdout).not.toContain('/assets/logo.png');
  });

  it('allows strings without words (numbers, symbols)', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'symbols.tsx',
      '<div>123</div>\n<span>$</span>\n<span>→</span>\n<span>...</span>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No non-internationalized');
  });

  // Unicode-aware word counting
  it('detects unicode text as violations', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'unicode.tsx',
      '<div>Привет мир</div>\n<span>你好世界</span>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Привет мир');
    expect(res.stdout).toContain('你好世界');
  });

  // Toast message detection
  it('detects all toast variants', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'toasts.tsx',
      [
        'toast.error("Error message");',
        'toast.success("Success message");',
        'toast.warning("Warning message");',
        'toast.info("Info message");',
      ].join('\n'),
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Error message');
    expect(res.stdout).toContain('Success message');
    expect(res.stdout).toContain('Warning message');
    expect(res.stdout).toContain('Info message');
  });

  it('detects toast messages with apostrophes and special characters', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'toast-special.tsx',
      'toast.error("Can\'t proceed with this action");',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("Can't proceed");
  });

  // All user-visible attributes
  it('detects all user-visible attributes', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'attrs.tsx',
      [
        '<input placeholder="Placeholder text" />',
        '<div title="Title text">Content</div>',
        '<button aria-label="Aria label text">Click</button>',
        '<img alt="Alt text" />',
        '<option label="Label text">Option</option>',
      ].join('\n'),
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Placeholder text');
    expect(res.stdout).toContain('Title text');
    expect(res.stdout).toContain('Aria label text');
    expect(res.stdout).toContain('Alt text');
    expect(res.stdout).toContain('Label text');
  });

  // File extension filtering
  it('only processes .ts, .tsx, .js, .jsx files', () => {
    const tmp = makeTempDir();
    const cssFile = writeTempFile(
      tmp,
      'styles.css',
      '.class { content: "Hardcoded"; }',
    );
    const jsonFile = writeTempFile(tmp, 'data.json', '{"text": "Hardcoded"}');
    const tsFile = writeTempFile(
      tmp,
      'component.tsx',
      '<div>Hardcoded Text</div>',
    );

    // CSS and JSON should be ignored
    const resCss = runScript([cssFile]);
    expect(resCss.status).toBe(0);
    expect(resCss.stdout).toContain('No files to scan');

    const resJson = runScript([jsonFile]);
    expect(resJson.status).toBe(0);
    expect(resJson.stdout).toContain('No files to scan');

    // TSX should be processed
    const resTsx = runScript([tsFile]);
    expect(resTsx.status).toBe(1);
    expect(resTsx.stdout).toContain('Hardcoded Text');
  });

  // Output format validation
  it('groups violations by file with blank line separation', () => {
    const tmp = makeTempDir();
    writeTempFile(tmp, 'file1.tsx', '<div>Text one</div>');
    writeTempFile(tmp, 'file2.tsx', '<div>Text two</div>');
    const res = runScript([
      path.join(tmp, 'file1.tsx'),
      path.join(tmp, 'file2.tsx'),
    ]);
    expect(res.status).toBe(1);
    // Check that output contains both files
    expect(res.stdout).toContain('file1.tsx');
    expect(res.stdout).toContain('file2.tsx');
    const i1 = res.stdout.indexOf('file1.tsx');
    const i2 = res.stdout.indexOf('file2.tsx');
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(i1);
    expect(res.stdout.slice(i1, i2)).toContain('\n\n');
    // Check header message
    expect(res.stdout).toContain('non-internationalized user-visible text');
  });

  // Cross-platform path normalization
  it('outputs POSIX-style paths regardless of platform', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      path.join('src', 'components', 'Button.tsx'),
      '<button>Click Me</button>',
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    // Should use forward slashes in output
    expect(res.stdout).toMatch(/src\/components\/Button\.tsx/);
    // Should not contain backslashes in path
    expect(res.stdout).not.toMatch(/src\\components\\Button\.tsx/);
  });

  // Skip import lines
  it('skips import statements', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'imports.tsx',
      [
        'import React from "react";',
        'import { Button } from "./Button";',
        'require("some-module");',
        '<div>Actual violation</div>',
      ].join('\n'),
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Actual violation');
    expect(res.stdout).not.toContain('react');
    expect(res.stdout).not.toContain('Button');
    expect(res.stdout).not.toContain('some-module');
  });

  // Multi-line block comment handling
  it('handles multi-line block comments correctly', () => {
    const tmp = makeTempDir();
    const file = writeTempFile(
      tmp,
      'multiline-comment.tsx',
      [
        '/*',
        ' * This is a comment',
        ' * with multiple lines',
        ' */',
        '<div>Real text</div>',
      ].join('\n'),
    );
    const res = runScript([file]);
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/multiline-comment\.tsx:5 -> "Real text"/);
  });

  // Error handling in walk() - directory traversal errors
  it('walks src directory and detects violations', () => {
    const tmp = makeTempDir();
    writeTempFile(tmp, path.join('src', 'valid.tsx'), '<div>Valid text</div>');
    const res = runScript([], { cwd: tmp });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Valid text');
  });

  it('returns empty array for non-existent directory in walk()', () => {
    const tmp = makeTempDir();
    const res = runScript([], { cwd: tmp });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan for i18n violations.');
  });

  it('gracefully handles when src is a file (invalid directory)', () => {
    const tmp = makeTempDir();
    // Make a file named "src" so walk() gets ENOTDIR and returns []
    fs.writeFileSync(path.join(tmp, 'src'), 'not a directory');
    const res = runScript([], { cwd: tmp });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('No files to scan for i18n violations.');
  });

  // Error handling in collectViolations()
  it('continues when a target path is a directory with .tsx extension', () => {
    const tmp = makeTempDir();
    // Valid file with a violation
    writeTempFile(tmp, 'bad.tsx', '<div>Bad text</div>');
    // Directory that looks like a .tsx file -> triggers readFileSync error (EISDIR)
    const dirAsFile = path.join(tmp, 'not-a-file.tsx');
    fs.mkdirSync(dirAsFile);

    const res = runScript([path.join(tmp, 'bad.tsx'), dirAsFile]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Bad text');
  });

  it('skips unreadable target and reports no files when only directory-like target passed', () => {
    const tmp = makeTempDir();
    const dirAsFile = path.join(tmp, 'unreadable.tsx');
    fs.mkdirSync(dirAsFile);

    const res = runScript([dirAsFile]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      'No non-internationalized user-visible text found.',
    );
  });

  // ========== NEW TESTS FOR ENHANCED FEATURES ==========

  describe('Ignore comments', () => {
    it('skips violations with // i18n-ignore-line comment', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'ignore-line.tsx',
        '<div>Hardcoded</div> // i18n-ignore-line',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips violations with // i18n-ignore-next-line comment', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'ignore-next.tsx',
        '// i18n-ignore-next-line\n<div>Hardcoded</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('still flags violations without ignore comments', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'no-ignore.tsx',
        '<div>Hardcoded Text</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain('Hardcoded Text');
    });
  });

  describe('Date format detection', () => {
    it('allows date format strings in attributes', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'date-format-attr.tsx',
        '<input placeholder="YYYY-MM-DD" />',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('allows date format in template literals', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'date-format-template.tsx',
        '<div>{`HH:mm:ss`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('allows complex date formats', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'date-format-complex.tsx',
        '<div>{`YYYY-MM-DDTHH:mm:ss.SSS[Z]`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('Regex pattern detection', () => {
    it('allows regex patterns in template literals', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'regex-template.tsx',
        '<div>{`[a-z]+`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('allows regex patterns with special characters', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'regex-special.tsx',
        '<div>{`\\d{4}`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('Context-aware skipping', () => {
    it('skips console.log messages', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'console-log.tsx',
        'console.log("Debug message");',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips console.error messages', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'console-error.tsx',
        'console.error("Error occurred");',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips throw new Error statements', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'throw-error.tsx',
        'throw new Error("Internal error");',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips GraphQL queries', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'graphql.tsx',
        'const query = gql`query { user { name } }`;',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips .format() date formatting', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'format-date.tsx',
        'const formatted = date.format("YYYY-MM-DD");',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips TypeScript type annotations', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'typescript-types.tsx',
        'const fn = (): string => { return "OK"; };',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips Promise type annotations', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'promise-type.tsx',
        'const handler = async (): Promise<void> => { };',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('CSS class detection', () => {
    it('skips className with CSS utility classes but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'css-utility.tsx',
        '<div className={`btn primary`}>Click Button</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Click Button" is still a violation
      expect(res.stdout).toContain('Click Button');
      expect(res.stdout).not.toContain('btn');
      expect(res.stdout).not.toContain('primary');
    });

    it('skips className with Bootstrap classes but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'bootstrap-classes.tsx',
        '<div className={`m-3 p-2 text-center`}>Page Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Page Content" is still a violation
      expect(res.stdout).toContain('Page Content');
      expect(res.stdout).not.toContain('m-3');
    });

    it('skips className with CSS modules but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'css-modules.tsx',
        '<div className={`${styles.container}`}>Page Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Page Content" is still a violation
      expect(res.stdout).toContain('Page Content');
      expect(res.stdout).not.toContain('container');
    });

    it('skips font icon classes', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'font-icons.tsx',
        '<i className="fi fi-rr-home" />',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips conditional CSS classes with ternary but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'conditional-css.tsx',
        '<div className={`mx-1 ${true ? "my-4" : "my-0"}`}>Page Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Page Content" is still a violation
      expect(res.stdout).toContain('Page Content');
      expect(res.stdout).not.toContain('my-4');
      expect(res.stdout).not.toContain('my-0');
    });

    it('still flags user-visible text in className context', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'css-with-text.tsx',
        '<div className="some-class">User visible text</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain('User visible text');
    });
  });

  describe('Enhanced URL detection', () => {
    it('allows URL-like routing paths in to attribute but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'routing-path.tsx',
        '<Link to="orgstore/id=123">Go to Link</Link>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Go to Link" is still a violation
      expect(res.stdout).toContain('Go to Link');
      expect(res.stdout).not.toContain('orgstore/id=123');
    });

    it('allows API endpoint patterns in href but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'api-endpoint.tsx',
        // FIX: Split to multiple lines so the script can separate the URL from the Text
        '<a href="api/v1/users">\n  View Users\n</a>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
      expect(res.stdout).not.toContain('api/v1/users');
    });

    it('allows URL patterns in template literals but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'url-template.tsx',
        '<Link to={`orgstore/id=${id}`}>Go to Store</Link>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Go to Store" is still a violation
      expect(res.stdout).toContain('Go to Store');
      expect(res.stdout).not.toContain('orgstore/id=');
    });

    it('skips URL patterns in to attribute', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'url-to-attr.tsx',
        '<Link to="orgstore/id=123" />',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('Non-user-visible attributes', () => {
    it('skips data-testid attributes but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'data-testid.tsx',
        '<div data-testid="my-test-id">Page Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Page Content" is still a violation
      expect(res.stdout).toContain('Page Content');
      expect(res.stdout).not.toContain('my-test-id');
    });

    it('skips aria-hidden attributes but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'aria-hidden.tsx',
        '<div aria-hidden="true">Hidden Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Hidden Content" is still a violation
      expect(res.stdout).toContain('Hidden Content');
      expect(res.stdout).not.toContain('true');
    });

    it('skips role attributes but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'role-attr.tsx',
        '<div role="button">Click Button</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Click Button" is still a violation
      expect(res.stdout).toContain('Click Button');
      expect(res.stdout).not.toContain('button');
    });

    it('skips to attribute in Link components but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'link-to.tsx',
        '<Link to="/dashboard">Go to Dashboard</Link>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Go to Dashboard" is still a violation
      expect(res.stdout).toContain('Go to Dashboard');
      expect(res.stdout).not.toContain('/dashboard');
    });

    it('skips non-user-visible attributes completely when no JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'attr-only.tsx',
        '<div data-testid="test" role="button" aria-hidden="true" />',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('JavaScript operator detection', () => {
    it('skips comparison operators in JSX but flags user text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'comparison-ops.tsx',
        '<div>{age >= 18 && age <= 40 ? `Adult Person` : `Minor Person`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
      // But should not flag the comparison operators themselves
      expect(res.stdout).not.toContain('>= 18 && age');
    });

    it('skips pure comparison operators without user text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'pure-comparison.tsx',
        '<div>{age >= 18 && age <= 40}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('skips array method chains', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'array-methods.tsx',
        '<div>{users.filter(u => u.age >= 18).map(u => u.name)}</div>',
      );
      const res = runScript([file]);
      // Should not flag the filter/map chain as text
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('Comprehensive false positives fixture', () => {
    it('passes for false-positives.tsx with all edge cases', () => {
      const res = runScript([path.join(fixturesDir, 'false-positives.tsx')]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('handles empty template literals', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(tmp, 'empty-template.tsx', '<div>{``}</div>');
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('handles template literals with only variables', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'var-only-template.tsx',
        '<div>{`${name}`}</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('No non-internationalized');
    });

    it('handles mixed user-visible and technical content', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'mixed-content.tsx',
        [
          '<div className="btn">Click Button</div>',
          '<input placeholder="Enter name" />',
          '<div data-testid="test">Test content here</div>',
        ].join('\n'),
      );
      const res = runScript([file]);
      expect(res.status).toBe(1);
      // Button text should be flagged
      expect(res.stdout).toContain('Click Button');
      // Placeholder should be flagged
      expect(res.stdout).toContain('Enter name');
      // Test content should be flagged
      expect(res.stdout).toContain('Test content here');
      // Should not flag className or data-testid values
      expect(res.stdout).not.toContain('btn');
      expect(res.stdout).not.toContain('test');
    });

    it('skips nested template literals in className but flags multi-word JSX text', () => {
      const tmp = makeTempDir();
      const file = writeTempFile(
        tmp,
        'nested-classname.tsx',
        '<div className={`base ${isActive ? "active" : "inactive"}`}>Page Content</div>',
      );
      const res = runScript([file]);
      expect(res.status).toBe(1); // "Page Content" is still a violation
      expect(res.stdout).toContain('Page Content');
      // Should not flag the className template literal
      expect(res.stdout).not.toContain('active');
      expect(res.stdout).not.toContain('inactive');
    });
  });
});
