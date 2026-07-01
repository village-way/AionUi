import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');

function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf-8');
}

describe('Sentry release CI configuration', () => {
  it('does not require Sentry credentials in CI by default', () => {
    const workflow = readRepoFile('.github/workflows/_build-reusable.yml');

    expect(workflow).not.toContain('Validate Sentry source map upload configuration');
    expect(workflow).not.toContain('Configure Sentry source map upload owner');
    expect(workflow).not.toContain('SENTRY_UPLOAD_SOURCE_MAPS=true');
  });

  it('uploads source maps only when explicitly opted in', () => {
    const viteConfig = readRepoFile('packages/desktop/electron.vite.config.ts');

    expect(viteConfig).toContain("process.env.SENTRY_UPLOAD_SOURCE_MAPS === 'true'");
    expect(viteConfig).toContain('!!process.env.SENTRY_AUTH_TOKEN');
  });

  it('uses an explicit Sentry release name instead of plugin defaults', () => {
    const viteConfig = readRepoFile('packages/desktop/electron.vite.config.ts');

    expect(viteConfig).toContain('const sentryReleaseName');
    expect(viteConfig).toContain('release:');
    expect(viteConfig).toContain('name: sentryReleaseName');
    expect(viteConfig).toContain('errorHandler:');
    expect(viteConfig).toContain('throw error');
  });
});
