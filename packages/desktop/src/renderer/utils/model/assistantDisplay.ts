/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveBuiltinAionrsDisplayName } from '@/renderer/utils/brand/builtinAgentBranding';

type AssistantNameSource = {
  id?: string | null;
  name?: string | null;
  name_i18n?: Record<string, string>;
  agent?: {
    type?: string | null;
    acp_backend?: string | null;
  } | null;
  source?: string | null;
  backend?: string | null;
};

export function resolveAssistantName(
  assistant: AssistantNameSource | null | undefined,
  localeKey: string,
  fallback = 'Assistant'
): string {
  if (!assistant) {
    return fallback;
  }

  const brandedName = resolveBuiltinAionrsDisplayName(assistant);
  if (brandedName) {
    return brandedName;
  }

  const localizedName = assistant.name_i18n?.[localeKey] || assistant.name_i18n?.['en-US'];
  return localizedName?.trim() || assistant.name?.trim() || assistant.id || fallback;
}
