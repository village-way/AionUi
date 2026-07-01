/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { webui, type IWebUIStatus } from '@/common/adapter/ipcBridge';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type WebuiQuickStatus = 'checking' | 'running' | 'stopped' | 'error';

export type WebuiQrContext = Pick<IWebUIStatus, 'allowRemote' | 'networkUrl' | 'localUrl' | 'port'>;

const WEBUI_STATUS_CACHE_TTL_MS = 3000;
let webuiStatusCache: {
  quickStatus: WebuiQuickStatus;
  allowRemote: boolean;
  qrContext: WebuiQrContext | null;
  at: number;
} | null = null;

const buildQrContext = (result: IWebUIStatus): WebuiQrContext => ({
  allowRemote: result.allowRemote,
  networkUrl: result.networkUrl,
  localUrl: result.localUrl,
  port: result.port,
});

export const useWebuiQuickStatus = (): {
  iconColor: string;
  status: WebuiQuickStatus;
  statusLabel: string;
  tooltip: string;
  showQrHover: boolean;
  qrContext: WebuiQrContext | null;
} => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<WebuiQuickStatus>('checking');
  const [allowRemote, setAllowRemote] = useState(false);
  const [qrContext, setQrContext] = useState<WebuiQrContext | null>(null);

  useEffect(() => {
    let alive = true;
    const applyStatus = (quickStatus: WebuiQuickStatus, context: WebuiQrContext | null, remote: boolean) => {
      setStatus(quickStatus);
      setAllowRemote(remote);
      setQrContext(context);
    };

    const loadStatus = async () => {
      const now = Date.now();
      if (webuiStatusCache && now - webuiStatusCache.at < WEBUI_STATUS_CACHE_TTL_MS) {
        applyStatus(webuiStatusCache.quickStatus, webuiStatusCache.qrContext, webuiStatusCache.allowRemote);
        return;
      }

      try {
        const result = await webui.getStatus.invoke();
        if (!alive) return;
        if (result) {
          const quickStatus: WebuiQuickStatus = result.running ? 'running' : 'stopped';
          const context = result.running ? buildQrContext(result) : null;
          applyStatus(quickStatus, context, result.allowRemote);
          webuiStatusCache = {
            quickStatus,
            allowRemote: result.allowRemote,
            qrContext: context,
            at: Date.now(),
          };
          return;
        }
        applyStatus('error', null, false);
        webuiStatusCache = { quickStatus: 'error', allowRemote: false, qrContext: null, at: Date.now() };
      } catch {
        if (!alive) return;
        applyStatus('error', null, false);
        webuiStatusCache = { quickStatus: 'error', allowRemote: false, qrContext: null, at: Date.now() };
      }
    };

    void loadStatus();

    const unsubscribe = webui.statusChanged.on((payload) => {
      const nextQuickStatus: WebuiQuickStatus = payload.running ? 'running' : 'stopped';
      const context = payload.running
        ? {
            allowRemote: webuiStatusCache?.allowRemote ?? false,
            networkUrl: payload.networkUrl,
            localUrl: payload.localUrl,
            port: payload.port,
          }
        : null;
      applyStatus(nextQuickStatus, context, webuiStatusCache?.allowRemote ?? false);
      webuiStatusCache = {
        quickStatus: nextQuickStatus,
        allowRemote: webuiStatusCache?.allowRemote ?? false,
        qrContext: context,
        at: Date.now(),
      };
      if (payload.running) {
        void webui.getStatus.invoke().then((result) => {
          if (!alive || !result?.running) return;
          const nextContext = buildQrContext(result);
          applyStatus('running', nextContext, result.allowRemote);
          webuiStatusCache = {
            quickStatus: 'running',
            allowRemote: result.allowRemote,
            qrContext: nextContext,
            at: Date.now(),
          };
        });
      }
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const statusLabel =
    status === 'running'
      ? t('settings.webui.running', { defaultValue: 'Running' })
      : status === 'checking'
        ? t('settings.webui.starting', { defaultValue: 'Checking' })
        : status === 'error'
          ? t('settings.webui.operationFailed', { defaultValue: 'Unavailable' })
          : t('settings.webui.enable', { defaultValue: 'Start' });

  const iconColor =
    status === 'running'
      ? 'rgb(var(--success-6))'
      : status === 'checking'
        ? 'rgb(var(--primary-6))'
        : status === 'error'
          ? 'var(--color-text-3)'
          : 'var(--color-text-4)';

  const webuiLabel = t('settings.webui', { defaultValue: 'WebUI' });
  const showQrHover = status === 'running' && allowRemote;

  return {
    iconColor,
    status,
    statusLabel,
    tooltip: `${webuiLabel} · ${statusLabel}`,
    showQrHover,
    qrContext: showQrHover ? qrContext : null,
  };
};
