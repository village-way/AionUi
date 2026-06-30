/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import zhanluLogo from '@renderer/assets/brand/zhanlu-logo.svg';
import { isAionrsAssistant, type Assistant } from '@/common/types/agent/assistantTypes';

export const BUILTIN_AIONRS_DISPLAY_NAME = 'Zhanlu CLI';
export const BUILTIN_AIONRS_LOGO = zhanluLogo;

type BuiltinAionrsAssistantSource = Pick<Assistant, 'agent' | 'source' | 'id'> | null | undefined;

/** True for the shipped generated aionrs assistant (not user-authored clones). */
export function isBuiltinAionrsAssistant(assistant: BuiltinAionrsAssistantSource): boolean {
  if (!assistant || assistant.source !== 'generated') {
    return false;
  }

  if (isAionrsAssistant(assistant)) {
    return true;
  }

  const id = assistant.id.toLowerCase();
  return id === 'bare-aionrs' || id === 'bare:aionrs' || id.endsWith(':aionrs');
}

export function resolveBuiltinAionrsDisplayName(assistant: BuiltinAionrsAssistantSource): string | null {
  return isBuiltinAionrsAssistant(assistant) ? BUILTIN_AIONRS_DISPLAY_NAME : null;
}

export function resolveBuiltinAionrsLogoUrl(
  assistant: Pick<Assistant, 'agent' | 'source' | 'id'> | null | undefined
): string | null {
  return isBuiltinAionrsAssistant(assistant) ? BUILTIN_AIONRS_LOGO : null;
}

export function resolveBuiltinAionrsBackendLogo(backend: string | null | undefined): string | null {
  if (!backend || backend.toLowerCase() !== 'aionrs') {
    return null;
  }
  return BUILTIN_AIONRS_LOGO;
}

export function resolveBuiltinAionrsManagedAgentName(
  agent: { agent_type?: string; backend?: string; name?: string } | null | undefined
): string | null {
  if (!agent) {
    return null;
  }

  const runtimeKey = (agent.backend || agent.agent_type || '').toLowerCase();
  if (runtimeKey !== 'aionrs') {
    return null;
  }

  return BUILTIN_AIONRS_DISPLAY_NAME;
}
