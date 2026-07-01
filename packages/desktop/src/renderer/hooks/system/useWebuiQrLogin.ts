/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { webui } from '@/common/adapter/ipcBridge';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebuiQrContext } from './useWebuiQuickStatus';

const QR_REFRESH_MS = 4 * 60 * 1000;

export const useWebuiQrLogin = (
  context: WebuiQrContext | null,
  active: boolean
): {
  qrUrl: string | null;
  qrExpiresAt: number | null;
  qrLoading: boolean;
} => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (qrRefreshTimerRef.current) {
      clearTimeout(qrRefreshTimerRef.current);
      qrRefreshTimerRef.current = null;
    }
  }, []);

  const generateQRCode = useCallback(async () => {
    if (!context) return;

    setQrLoading(true);
    try {
      const qrData = await webui.generateQRToken.invoke();
      if (qrData) {
        const baseUrl =
          context.allowRemote && context.networkUrl
            ? context.networkUrl
            : (context.localUrl ?? `http://localhost:${context.port}`);
        setQrUrl(`${baseUrl}/qr-login?token=${qrData.token}`);
        setQrExpiresAt(qrData.expires_at_ms);

        clearTimer();
        qrRefreshTimerRef.current = setTimeout(() => {
          void generateQRCode();
        }, QR_REFRESH_MS);
        return;
      }
      setQrUrl(null);
      setQrExpiresAt(null);
    } catch (error) {
      console.error('Generate QR code error:', error);
      setQrUrl(null);
      setQrExpiresAt(null);
    } finally {
      setQrLoading(false);
    }
  }, [clearTimer, context]);

  useEffect(() => {
    if (active && context) {
      void generateQRCode();
    } else {
      setQrUrl(null);
      setQrExpiresAt(null);
      clearTimer();
    }

    return clearTimer;
  }, [active, clearTimer, context, generateQRCode]);

  return { qrUrl, qrExpiresAt, qrLoading };
};
