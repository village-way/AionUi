/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useWebuiQrLogin } from '@/renderer/hooks/system/useWebuiQrLogin';
import type { WebuiQrContext } from '@/renderer/hooks/system/useWebuiQuickStatus';
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SiderFooter.module.css';

const QRCodeSVGLazy = React.lazy(async () => {
  const mod = await import('qrcode.react');
  return { default: mod.QRCodeSVG };
});

type WebuiQrHoverCardProps = {
  context: WebuiQrContext;
};

const formatExpiresAt = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const WebuiQrHoverCard: React.FC<WebuiQrHoverCardProps> = ({ context }) => {
  const { t } = useTranslation();
  const { qrUrl, qrExpiresAt, qrLoading } = useWebuiQrLogin(context, true);

  return (
    <div className={styles.qrHoverCard}>
      <div className={styles.qrHoverTitle}>{t('settings.webui.qrLogin')}</div>
      <div className={styles.qrHoverHint}>{t('settings.webui.qrLoginHint')}</div>
      <div className={styles.qrHoverCodeWrap}>
        {qrLoading ? (
          <div className={styles.qrHoverCodePlaceholder}>{t('common.loading')}</div>
        ) : qrUrl ? (
          <div className={styles.qrHoverCodeSurface}>
            <Suspense
              fallback={<div className={styles.qrHoverCodePlaceholder}>{t('common.loading')}</div>}
            >
              <QRCodeSVGLazy value={qrUrl} size={132} level='M' />
            </Suspense>
          </div>
        ) : (
          <div className={styles.qrHoverCodePlaceholder}>{t('settings.webui.qrGenerateFailed')}</div>
        )}
      </div>
      {qrExpiresAt && (
        <div className={styles.qrHoverExpires}>
          {t('settings.webui.qrExpires', { time: formatExpiresAt(qrExpiresAt) })}
        </div>
      )}
    </div>
  );
};

export default WebuiQrHoverCard;
