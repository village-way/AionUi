/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

const i18nServiceMocks = vi.hoisted(() => ({
  changeLanguageMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const ReactModule = await import('react');
  const React = ReactModule.default;
  type ButtonProps = {
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    'aria-label'?: string;
  };
  type PopoverProps = {
    children?: React.ReactNode;
    content?: React.ReactNode;
    popupVisible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
  };
  type TooltipProps = {
    children?: React.ReactNode;
  };

  return {
    Button: ({ children, className, onClick, ...props }: ButtonProps) =>
      React.createElement('button', { ...props, type: 'button', className, onClick }, children),
    Popover: ({ children, content, popupVisible = false, onVisibleChange }: PopoverProps) =>
      React.createElement(
        'span',
        {
          onClick: () => onVisibleChange?.(!popupVisible),
        },
        children,
        popupVisible ? content : null
      ),
    Tooltip: ({ children }: TooltipProps) => React.createElement(React.Fragment, null, children),
  };
});

vi.mock('@/renderer/services/i18n', () => ({
  changeLanguage: i18nServiceMocks.changeLanguageMock,
  normalizeLanguageCode: (language: string) => {
    if (language === 'en') return 'en-US';
    if (language === 'zh') return 'zh-CN';
    return language;
  },
}));

import SiderFooter from '@renderer/components/layout/Sider/SiderFooter';

const renderSiderFooter = (props: Partial<React.ComponentProps<typeof SiderFooter>> = {}) => {
  return render(
    <SiderFooter
      isMobile={false}
      isSettings={false}
      collapsed={false}
      theme='light'
      userName='Devine'
      siderTooltipProps={{ disabled: true }}
      onSettingsClick={vi.fn()}
      onThemeChange={vi.fn()}
      showLogout={true}
      onLogoutClick={vi.fn()}
      {...props}
    />
  );
};

describe('SiderFooter account menu', () => {
  beforeEach(() => {
    i18nServiceMocks.changeLanguageMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the compact account menu with real settings entries', () => {
    renderSiderFooter();

    fireEvent.click(screen.getByLabelText('common.settings'));

    expect(screen.getByText('common.settings')).toBeInTheDocument();
    expect(screen.getByText('settings.language')).toBeInTheDocument();
    expect(screen.getByText('settings.appearancePanel')).toBeInTheDocument();
    expect(screen.getByText('settings.googleLogout')).toBeInTheDocument();
  });

  it('closes the menu after opening settings', () => {
    const onSettingsClick = vi.fn();
    renderSiderFooter({ onSettingsClick });
    fireEvent.click(screen.getByLabelText('common.settings'));

    const settingsButton = screen.getByText('common.settings').closest('button');
    expect(settingsButton).toBeTruthy();
    fireEvent.click(settingsButton as HTMLElement);

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('settings.language')).toBeNull();
  });

  it('opens the language flyout and changes language from the submenu', () => {
    renderSiderFooter();
    fireEvent.click(screen.getByLabelText('common.settings'));

    const languageButton = screen.getByText('settings.language').closest('button');
    expect(languageButton).toBeTruthy();
    fireEvent.mouseEnter(languageButton as HTMLElement);

    expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.queryByText('日本語')).toBeNull();

    fireEvent.click(screen.getByText('中文'));

    expect(i18nServiceMocks.changeLanguageMock).toHaveBeenCalledWith('zh-CN');
    expect(screen.queryByText('settings.language')).toBeNull();
  });

  it('opens the appearance flyout and changes theme from the submenu', () => {
    const onThemeChange = vi.fn();
    renderSiderFooter({ onThemeChange });
    fireEvent.click(screen.getByLabelText('common.settings'));

    const appearanceButton = screen.getByText('settings.appearancePanel').closest('button');
    expect(appearanceButton).toBeTruthy();
    fireEvent.mouseEnter(appearanceButton as HTMLElement);

    fireEvent.click(screen.getByText('settings.darkMode'));

    expect(onThemeChange).toHaveBeenCalledWith('dark');
    expect(screen.queryByText('settings.appearancePanel')).toBeNull();
  });

  it('shows logout only when available and invokes logout', () => {
    const onLogoutClick = vi.fn();
    renderSiderFooter({ onLogoutClick });
    fireEvent.click(screen.getByLabelText('common.settings'));

    const logoutButton = screen.getByText('settings.googleLogout').closest('button');
    expect(logoutButton?.className).toContain('logoutButton');
    fireEvent.click(logoutButton as HTMLElement);

    expect(onLogoutClick).toHaveBeenCalledTimes(1);
  });

  it('hides logout when logout is not available', () => {
    renderSiderFooter({ showLogout: false, onLogoutClick: undefined });
    fireEvent.click(screen.getByLabelText('common.settings'));

    expect(screen.queryByText('settings.googleLogout')).toBeNull();
  });

  it('opens the menu while collapsed', () => {
    renderSiderFooter({ collapsed: true });

    fireEvent.click(screen.getByLabelText('common.settings'));

    expect(screen.getByText('settings.language')).toBeInTheDocument();
  });
});
