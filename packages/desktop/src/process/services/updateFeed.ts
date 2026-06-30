/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { CdnGenericProvider } from './cdnGenericProvider';
import type { CdnGenericProviderConfiguration } from './cdnGenericProvider';

export const ZHANLU_WORK_UPDATE_BASE_URL_ENV = 'ZHANLU_WORK_UPDATE_BASE_URL';
export const CDN_UPDATE_BASE_URL = process.env[ZHANLU_WORK_UPDATE_BASE_URL_ENV]?.trim() || '';

export type CdnFeedOptions = CdnGenericProviderConfiguration & {
  updateProvider: typeof CdnGenericProvider;
};

export function buildCdnFeedOptions(): CdnFeedOptions | null {
  if (!CDN_UPDATE_BASE_URL) {
    return null;
  }

  return {
    provider: 'custom',
    url: CDN_UPDATE_BASE_URL,
    updateProvider: CdnGenericProvider,
  };
}
