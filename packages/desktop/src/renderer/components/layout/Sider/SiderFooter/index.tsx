/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ThemeAppearance } from '@/common/theme/types';
import { changeLanguage, normalizeLanguageCode } from '@/renderer/services/i18n';
import { Button, Popover, Tooltip } from '@arco-design/web-react';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';
import { ArrowCircleLeft, CheckOne, Contrast, Earth, Logout, Right, SettingTwo } from '@icon-park/react';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SiderFooter.module.css';

type LanguageOption = {
  value: string;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
];

const APPEARANCE_OPTIONS: Array<{ value: ThemeAppearance; labelKey: string }> = [
  { value: 'light', labelKey: 'settings.lightMode' },
  { value: 'dark', labelKey: 'settings.darkMode' },
];

type FlyoutKey = 'language' | 'appearance';

interface SiderFooterProps {
  isMobile: boolean;
  isSettings: boolean;
  collapsed?: boolean;
  theme: ThemeAppearance;
  userName?: string | null;
  siderTooltipProps: SiderTooltipProps;
  onSettingsClick: () => void;
  onThemeChange: (theme: ThemeAppearance) => void;
  showLogout?: boolean;
  onLogoutClick?: () => void;
}

const getInitial = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return 'A';
  return trimmed.slice(0, 1).toLocaleUpperCase();
};

const SiderFooter: React.FC<SiderFooterProps> = ({
  isMobile,
  isSettings,
  collapsed = false,
  theme,
  userName,
  siderTooltipProps,
  onSettingsClick,
  onThemeChange,
  showLogout = false,
  onLogoutClick,
}) => {
  const { t, i18n } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<FlyoutKey | null>(null);

  const displayName = userName?.trim() || t('common.appBrand');
  const currentLanguage = normalizeLanguageCode(i18n.language);
  const settingsLabel = isSettings ? t('common.back') : t('common.settings');

  const selectedLanguageLabel = useMemo(() => {
    return LANGUAGE_OPTIONS.find((item) => item.value === currentLanguage)?.label ?? currentLanguage;
  }, [currentLanguage]);
  const selectedAppearanceLabel = t(
    APPEARANCE_OPTIONS.find((item) => item.value === theme)?.labelKey ?? 'settings.lightMode'
  );

  const closeMenu = () => {
    setActiveFlyout(null);
    setMenuVisible(false);
  };

  const handleSettingsClick = () => {
    closeMenu();
    onSettingsClick();
  };

  const handleThemeChange = (value: ThemeAppearance) => {
    closeMenu();
    onThemeChange(value);
  };

  const handleLanguageChange = (value: string) => {
    closeMenu();
    changeLanguage(value).catch((error: Error) => {
      console.error('Failed to change language:', error);
    });
  };

  const handleLogoutClick = () => {
    closeMenu();
    onLogoutClick?.();
  };

  const menuContent = (
    <div className={styles.menuPanel} onMouseLeave={() => setActiveFlyout(null)}>
      <Button type='text' className={styles.menuButton} onClick={handleSettingsClick}>
        <span className='flex w-full min-w-0 items-center gap-10px'>
          <span className={styles.menuIcon}>
            {isSettings ? (
              <ArrowCircleLeft theme='outline' size='19' fill='currentColor' />
            ) : (
              <SettingTwo theme='outline' size='19' fill='currentColor' />
            )}
          </span>
          <span className='min-w-0 flex-1 text-left text-15px font-[500] leading-22px'>{settingsLabel}</span>
        </span>
      </Button>

      <div className='relative' onMouseEnter={() => setActiveFlyout('language')}>
        <Button
          type='text'
          className={classNames(styles.menuButton, activeFlyout === 'language' && styles.menuButtonActive)}
          onClick={() => setActiveFlyout((current) => (current === 'language' ? null : 'language'))}
        >
          <span className='flex w-full min-w-0 items-center gap-10px'>
            <span className={styles.menuIcon}>
              <Earth theme='outline' size='20' fill='currentColor' />
            </span>
            <span className='min-w-0 flex-1 text-left text-15px font-[500] leading-22px'>{t('settings.language')}</span>
            <span className={styles.menuValue}>{selectedLanguageLabel}</span>
            <Right theme='outline' size='17' fill='currentColor' className='shrink-0 text-t-secondary' />
          </span>
        </Button>
        {activeFlyout === 'language' && (
          <div className={styles.menuFlyout}>
            {LANGUAGE_OPTIONS.map((item) => {
              const selected = item.value === currentLanguage;
              return (
                <Button
                  key={item.value}
                  type='text'
                  className={classNames(styles.flyoutOption, selected && styles.flyoutOptionActive)}
                  onClick={() => handleLanguageChange(item.value)}
                >
                  <span className='flex w-full min-w-0 items-center justify-between gap-10px'>
                    <span className='truncate text-left text-15px font-[500] leading-22px'>{item.label}</span>
                    {selected && <CheckOne theme='outline' size='18' fill='currentColor' className='shrink-0' />}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className='relative' onMouseEnter={() => setActiveFlyout('appearance')}>
        <Button
          type='text'
          className={classNames(styles.menuButton, activeFlyout === 'appearance' && styles.menuButtonActive)}
          onClick={() => setActiveFlyout((current) => (current === 'appearance' ? null : 'appearance'))}
        >
          <span className='flex w-full min-w-0 items-center gap-10px'>
            <span className={styles.menuIcon}>
              <Contrast theme='outline' size='20' fill='currentColor' />
            </span>
            <span className='min-w-0 flex-1 text-left text-15px font-[500] leading-22px'>
              {t('settings.appearancePanel')}
            </span>
            <span className={styles.menuValue}>{selectedAppearanceLabel}</span>
            <Right theme='outline' size='17' fill='currentColor' className='shrink-0 text-t-secondary' />
          </span>
        </Button>
        {activeFlyout === 'appearance' && (
          <div className={styles.menuFlyout}>
            {APPEARANCE_OPTIONS.map((item) => {
              const selected = item.value === theme;
              return (
                <Button
                  key={item.value}
                  type='text'
                  className={classNames(styles.flyoutOption, selected && styles.flyoutOptionActive)}
                  onClick={() => handleThemeChange(item.value)}
                >
                  <span className='flex w-full min-w-0 items-center justify-between gap-10px'>
                    <span className='truncate text-left text-15px font-[500] leading-22px'>{t(item.labelKey)}</span>
                    {selected && <CheckOne theme='outline' size='18' fill='currentColor' className='shrink-0' />}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {showLogout && onLogoutClick && (
        <>
          <div className={styles.menuDivider} />
          <Button
            type='text'
            className={classNames(styles.menuButton, styles.logoutButton)}
            onClick={handleLogoutClick}
          >
            <span className='flex w-full min-w-0 items-center gap-10px'>
              <span className={styles.menuIcon}>
                <Logout theme='outline' size='20' fill='currentColor' />
              </span>
              <span className='min-w-0 flex-1 text-left text-15px font-[500] leading-22px'>
                {t('settings.googleLogout')}
              </span>
            </span>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className='shrink-0 sider-footer mt-auto pb-8px'>
      <Popover
        trigger='click'
        position='tr'
        popupVisible={menuVisible}
        onVisibleChange={(visible) => {
          setMenuVisible(visible);
          if (!visible) setActiveFlyout(null);
        }}
        content={menuContent}
        unmountOnExit
        className={styles.popover}
      >
        <span className={styles.triggerWrap}>
          <Tooltip {...siderTooltipProps} content={settingsLabel} position='right'>
            <Button
              type='text'
              className={classNames(
                styles.triggerButton,
                collapsed && styles.triggerButtonCollapsed,
                menuVisible && styles.triggerButtonOpen,
                isMobile && 'sider-footer-btn-mobile'
              )}
              aria-label={settingsLabel}
            >
              <span className='flex w-full min-w-0 items-center gap-8px'>
                <span className={styles.avatar}>{getInitial(displayName)}</span>
                {!collapsed && (
                  <>
                    <span className='min-w-0 flex-1 truncate text-left text-14px font-[500] leading-20px text-t-primary'>
                      {displayName}
                    </span>
                    <span className={styles.settingsIconButton}>
                      <SettingTwo
                        theme='outline'
                        size='16'
                        fill='currentColor'
                        className='block leading-none shrink-0'
                        style={{ lineHeight: 0 }}
                      />
                    </span>
                  </>
                )}
              </span>
            </Button>
          </Tooltip>
        </span>
      </Popover>
    </div>
  );
};

export default SiderFooter;
