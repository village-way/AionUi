/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setSearchParamsMock, searchParamsMock, navigateMock, locationMock } = vi.hoisted(() => ({
  setSearchParamsMock: vi.fn(),
  searchParamsMock: { current: new URLSearchParams('tab=skills&highlight=sample') },
  navigateMock: vi.fn(),
  locationMock: { pathname: '/capabilities' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => locationMock,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParamsMock.current, setSearchParamsMock],
  };
});

vi.mock('@renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@arco-design/web-react', () => {
  const Tabs = Object.assign(
    ({
      activeTab,
      children,
      onChange,
    }: {
      activeTab?: string;
      children?: React.ReactNode;
      onChange?: (key: string) => void;
    }) => (
      <div data-testid='tabs' data-active-tab={activeTab}>
        <button type='button' onClick={() => onChange?.('skills')}>
          Skills
        </button>
        <button type='button' onClick={() => onChange?.('tools')}>
          Tools
        </button>
        {children}
      </div>
    ),
    {
      TabPane: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    }
  );

  return { Tabs };
});

vi.mock('@/renderer/pages/capabilities/SkillsHubSettings', () => ({
  default: () => <div data-testid='skills-panel'>SkillsHubSettings</div>,
}));

vi.mock('@/renderer/components/settings/SettingsModal/contents/ToolsModalContent', () => ({
  default: () => <div data-testid='tools-panel'>ToolsModalContent</div>,
}));

import CapabilitiesPage from '@/renderer/pages/capabilities/CapabilitiesPage';

describe('CapabilitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.current = new URLSearchParams('tab=skills&highlight=sample');
    locationMock.pathname = '/capabilities';
  });

  it('does not rewrite the URL when clicking the already active tab', () => {
    render(<CapabilitiesPage />);

    expect(screen.getByTestId('tabs')).toHaveAttribute('data-active-tab', 'skills');

    fireEvent.click(screen.getByText('Skills'));

    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });

  it('renders the active tab directly from the latest URL query', () => {
    const { rerender } = render(<CapabilitiesPage />);

    expect(screen.getByTestId('tabs')).toHaveAttribute('data-active-tab', 'skills');

    searchParamsMock.current = new URLSearchParams('tab=tools&highlight=sample');
    rerender(<CapabilitiesPage />);

    expect(screen.getByTestId('tabs')).toHaveAttribute('data-active-tab', 'tools');
  });

  it('preserves existing query parameters when switching tabs', () => {
    render(<CapabilitiesPage />);

    fireEvent.click(screen.getByText('Tools'));

    expect(setSearchParamsMock).toHaveBeenCalledTimes(1);
    const [next, options] = setSearchParamsMock.mock.calls[0] as [URLSearchParams, { replace?: boolean }];
    expect(next.toString()).toBe('tab=tools&highlight=sample');
    expect(options).toEqual({ replace: true });
  });

  it('leaves the import history route when switching to tools', () => {
    locationMock.pathname = '/capabilities/skills/import-history';
    render(<CapabilitiesPage />);

    expect(screen.getByTestId('tabs')).toHaveAttribute('data-active-tab', 'skills');

    fireEvent.click(screen.getByText('Tools'));

    expect(navigateMock).toHaveBeenCalledWith('/capabilities?tab=tools', { replace: true });
    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });
});
