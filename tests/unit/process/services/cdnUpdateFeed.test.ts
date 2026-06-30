/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UpdateInfo } from 'electron-updater';
import type { AppUpdater } from 'electron-updater/out/AppUpdater';
import type { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider';
import { CdnGenericProvider } from '@/process/services/cdnGenericProvider';

const UPDATE_BASE_URL = 'https://updates.zhanlu.work/releases';

const makeRuntimeOptions = (): ProviderRuntimeOptions => ({
  isUseMultipleRangeRequest: true,
  platform: 'darwin',
  executor: {
    request: vi.fn(),
  } as unknown as ProviderRuntimeOptions['executor'],
});

describe('CDN update feed options', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds a custom electron-updater provider pointed at the release CDN', () => {
    vi.resetModules();
    vi.stubEnv('ZHANLU_WORK_UPDATE_BASE_URL', UPDATE_BASE_URL);
    return import('@/process/services/updateFeed').then(({ buildCdnFeedOptions, CDN_UPDATE_BASE_URL }) => {
      const options = buildCdnFeedOptions();

      expect(options?.provider).toBe('custom');
      expect(options?.url).toBe(CDN_UPDATE_BASE_URL);
      expect(options?.url).toBe(UPDATE_BASE_URL);
      expect(options?.updateProvider.name).toBe('CdnGenericProvider');
    });
  });

  it('returns no feed options until Zhanlu Work update source is configured', async () => {
    vi.resetModules();
    const { buildCdnFeedOptions } = await import('@/process/services/updateFeed');
    const options = buildCdnFeedOptions();

    expect(options).toBeNull();
  });
});

describe('CdnGenericProvider', () => {
  it('resolves relative update files under the version directory', () => {
    const provider = new CdnGenericProvider(
      {
        provider: 'custom',
        url: UPDATE_BASE_URL,
      },
      {} as AppUpdater,
      makeRuntimeOptions()
    );

    const files = provider.resolveFiles({
      version: '2.1.14',
      files: [
        {
          url: 'ZhanluWork-2.1.14-mac-arm64.dmg',
          sha512: 'sha512-value',
        },
      ],
      path: 'ZhanluWork-2.1.14-mac-arm64.dmg',
      sha512: 'sha512-value',
      releaseDate: '2026-06-08T00:00:00.000Z',
    } satisfies UpdateInfo);

    expect(files[0]?.url.href).toBe(`${UPDATE_BASE_URL}/2.1.14/ZhanluWork-2.1.14-mac-arm64.dmg`);
  });
});
