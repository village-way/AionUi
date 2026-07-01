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
    trigger?: string;
  };
  type TooltipProps = {
    children?: React.ReactNode;
  };

  const Popover = ({ children, content, popupVisible, onVisibleChange, trigger }: PopoverProps) => {
    const isControlled = popupVisible !== undefined;
    const [internalVisible, setInternalVisible] = React.useState(false);
    const visible = isControlled ? popupVisible : internalVisible;

    const setVisible = (next: boolean) => {
      if (!isControlled) {
        setInternalVisible(next);
      }
      onVisibleChange?.(next);
    };

    const handlers =
      trigger === 'hover'
        ? {
            onMouseEnter: () => setVisible(true),
            onMouseLeave: () => setVisible(false),
          }
        : {
            onClick: () => setVisible(!visible),
          };

    return React.createElement('span', handlers, children, visible ? content : null);
  };

  return {
    Button: ({ children, className, onClick, ...props }: ButtonProps) =>
      React.createElement('button', { ...props, type: 'button', className, onClick }, children),
    Popover,
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

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/renderer/hooks/system/useWebuiQuickStatus', () => ({
  useWebuiQuickStatus: vi.fn(() => ({
    iconColor: 'var(--color-text-4)',
    status: 'checking',
    statusLabel: 'settings.webui.starting',
    tooltip: 'settings.webui · settings.webui.starting',
    showQrHover: false,
    qrContext: null,
  })),
}));

vi.mock('@renderer/components/layout/Sider/SiderFooter/WebuiQrHoverCard', () => ({
  default: () => <div data-testid='webui-qr-hover-card'>settings.webui.qrLogin</div>,
}));

import SiderFooter from '@renderer/components/layout/Sider/SiderFooter';
import { useWebuiQuickStatus } from '@/renderer/hooks/system/useWebuiQuickStatus';

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
    navigateMock.mockClear();
    vi.mocked(useWebuiQuickStatus).mockReturnValue({
      iconColor: 'var(--color-text-4)',
      status: 'checking',
      statusLabel: 'settings.webui.starting',
      tooltip: 'settings.webui · settings.webui.starting',
      showQrHover: false,
      qrContext: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the compact account menu with real settings entries', () => {
    renderSiderFooter();

    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

    expect(screen.getByText('common.settings')).toBeInTheDocument();
    expect(screen.getByText('settings.language')).toBeInTheDocument();
    expect(screen.getByText('settings.appearancePanel')).toBeInTheDocument();
    expect(screen.getByText('settings.googleLogout')).toBeInTheDocument();
  });

  it('closes the menu after opening settings', () => {
    const onSettingsClick = vi.fn();
    renderSiderFooter({ onSettingsClick });
    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

    const settingsButton = screen.getByText('common.settings').closest('button');
    expect(settingsButton).toBeTruthy();
    fireEvent.click(settingsButton as HTMLElement);

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('settings.language')).toBeNull();
  });

  it('opens the language flyout and changes language from the submenu', () => {
    renderSiderFooter();
    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

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
    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

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
    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

    const logoutButton = screen.getByText('settings.googleLogout').closest('button');
    expect(logoutButton?.className).toContain('logoutButton');
    fireEvent.click(logoutButton as HTMLElement);

    expect(onLogoutClick).toHaveBeenCalledTimes(1);
  });

  it('hides logout when logout is not available', () => {
    renderSiderFooter({ showLogout: false, onLogoutClick: undefined });
    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

    expect(screen.queryByText('settings.googleLogout')).toBeNull();
  });

  it('opens the menu while collapsed', () => {
    renderSiderFooter({ collapsed: true });

    fireEvent.click(screen.getAllByLabelText('common.settings')[0]);

    expect(screen.getByText('settings.language')).toBeInTheDocument();
  });

  it('navigates to webui settings when the remote connection button is clicked', () => {
    renderSiderFooter();

    fireEvent.click(screen.getByLabelText('settings.webui · settings.webui.starting'));

    expect(navigateMock).toHaveBeenCalledWith('/settings/webui');
  });

  it('navigates to settings when the settings icon is clicked', () => {
    const onSettingsClick = vi.fn();
    renderSiderFooter({ onSettingsClick });

    const settingsButtons = screen.getAllByLabelText('common.settings');
    expect(settingsButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(settingsButtons[1]);

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('settings.language')).toBeNull();
  });

  it('shows the login QR hover card when WebUI is running with remote access', () => {
    vi.mocked(useWebuiQuickStatus).mockReturnValue({
      iconColor: 'rgb(var(--success-6))',
      status: 'running',
      statusLabel: 'settings.webui.running',
      tooltip: 'settings.webui · settings.webui.running',
      showQrHover: true,
      qrContext: {
        allowRemote: true,
        networkUrl: 'http://192.168.1.10:3000',
        localUrl: 'http://127.0.0.1:3000',
        port: 3000,
      },
    });

    renderSiderFooter();

    fireEvent.mouseEnter(screen.getByLabelText('settings.webui · settings.webui.running'));

    expect(screen.getByTestId('webui-qr-hover-card')).toBeInTheDocument();
  });
});
