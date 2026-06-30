/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import zhanluLogo from '@renderer/assets/brand/zhanlu-logo.svg';
import styles from './BrandMark.module.css';

export type BrandMarkSize = 'sm' | 'md' | 'lg';

type BrandMarkProps = {
  size?: BrandMarkSize;
  showTitle?: boolean;
  titleAs?: 'div' | 'h1';
  titleClassName?: string;
  className?: string;
  onLogoClick?: () => void;
  titleInteractive?: boolean;
  onTitleClick?: () => void;
  titleTooltip?: string;
};

const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  showTitle = false,
  titleAs = 'div',
  titleClassName,
  className,
  onLogoClick,
  titleInteractive = false,
  onTitleClick,
  titleTooltip,
}) => {
  const { t } = useTranslation();
  const brandName = t('common.appBrand');

  const handleTitleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!titleInteractive || !onTitleClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onTitleClick();
      }
    },
    [onTitleClick, titleInteractive]
  );

  const titleClass = classNames(styles.title, titleInteractive && styles['title--interactive'], titleClassName);

  const titleContent =
    showTitle &&
    (titleInteractive && onTitleClick ? (
      <Tooltip content={titleTooltip} position='bottom'>
        {titleAs === 'h1' ? (
          <h1
            className={titleClass}
            role='button'
            tabIndex={0}
            aria-label={titleTooltip ?? brandName}
            onClick={onTitleClick}
            onKeyDown={handleTitleKeyDown}
          >
            {brandName}
          </h1>
        ) : (
          <div
            className={titleClass}
            role='button'
            tabIndex={0}
            aria-label={titleTooltip ?? brandName}
            onClick={onTitleClick}
            onKeyDown={handleTitleKeyDown}
          >
            {brandName}
          </div>
        )}
      </Tooltip>
    ) : titleAs === 'h1' ? (
      <h1 className={titleClass}>{brandName}</h1>
    ) : (
      <div className={titleClass}>{brandName}</div>
    ));

  return (
    <div className={classNames(styles.root, className)}>
      <div
        className={classNames(
          'brand-mark',
          styles.mark,
          styles[`mark--${size}`],
          onLogoClick && styles['mark--clickable']
        )}
        onClick={onLogoClick}
      >
        <img src={zhanluLogo} alt='' aria-hidden='true' className={styles.logo} />
      </div>
      {titleContent}
    </div>
  );
};

export default BrandMark;
