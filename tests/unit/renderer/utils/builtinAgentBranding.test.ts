/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  BUILTIN_AIONRS_DISPLAY_NAME,
  BUILTIN_AIONRS_LOGO,
  isBuiltinAionrsAssistant,
  resolveBuiltinAionrsBackendLogo,
  resolveBuiltinAionrsDisplayName,
  resolveBuiltinAionrsLogoUrl,
  resolveBuiltinAionrsManagedAgentName,
} from '@/renderer/utils/brand/builtinAgentBranding';

describe('builtinAgentBranding', () => {
  it('brands the generated aionrs assistant by runtime type', () => {
    const assistant = {
      id: 'bare:632f31d2',
      source: 'generated' as const,
      agent: { type: 'aionrs', source: 'internal' as const },
    };

    expect(isBuiltinAionrsAssistant(assistant)).toBe(true);
    expect(resolveBuiltinAionrsDisplayName(assistant)).toBe(BUILTIN_AIONRS_DISPLAY_NAME);
    expect(resolveBuiltinAionrsLogoUrl(assistant)).toBe(BUILTIN_AIONRS_LOGO);
  });

  it('brands legacy generated assistant ids without agent projection', () => {
    const assistant = {
      id: 'bare-aionrs',
      source: 'generated' as const,
    };

    expect(isBuiltinAionrsAssistant(assistant)).toBe(true);
    expect(resolveBuiltinAionrsDisplayName(assistant)).toBe(BUILTIN_AIONRS_DISPLAY_NAME);
  });

  it('does not brand user-authored aionrs assistants', () => {
    const assistant = {
      id: 'user-aionrs',
      source: 'user' as const,
      agent: { type: 'aionrs', source: 'internal' as const },
      name: 'Custom Aion',
    };

    expect(isBuiltinAionrsAssistant(assistant)).toBe(false);
    expect(resolveBuiltinAionrsDisplayName(assistant)).toBeNull();
  });

  it('brands aionrs backend logos and managed agent names', () => {
    expect(resolveBuiltinAionrsBackendLogo('aionrs')).toBe(BUILTIN_AIONRS_LOGO);
    expect(resolveBuiltinAionrsManagedAgentName({ agent_type: 'aionrs', name: 'Aion CLI' })).toBe(
      BUILTIN_AIONRS_DISPLAY_NAME
    );
  });
});
