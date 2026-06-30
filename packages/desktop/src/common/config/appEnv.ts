/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';

/**
 * Returns baseName unchanged in release builds, or baseName + '-dev' in dev builds.
 * When ZHANLU_WORK_MULTI_INSTANCE=1, appends '-2' to isolate the second dev instance.
 * Used to isolate symlink and directory names between environments.
 *
 * @example
 * getEnvAwareName('.zhanlu-work')        // release → '.zhanlu-work',        dev → '.zhanlu-work-dev'
 * getEnvAwareName('.zhanlu-work-config') // release → '.zhanlu-work-config', dev → '.zhanlu-work-config-dev'
 * // with ZHANLU_WORK_MULTI_INSTANCE=1:  dev → '.zhanlu-work-dev-2'
 */
export function getEnvAwareName(baseName: string): string {
  if (getPlatformServices().paths.isPackaged() === true) return baseName;
  const suffix =
    process.env.ZHANLU_WORK_MULTI_INSTANCE === '1' || process.env.AIONUI_MULTI_INSTANCE === '1' ? '-dev-2' : '-dev';
  return `${baseName}${suffix}`;
}
