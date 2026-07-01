/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CapabilitiesPage — Combined page for Skills Hub and MCP/Tools.
 *
 * Accessible from the main app sidebar via /capabilities (not under /settings).
 * Old routes (/settings/capabilities, /settings/skills-hub, /settings/tools)
 * redirect here.
 */

import { Tabs } from '@arco-design/web-react';
import classNames from 'classnames';
import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLayoutContext } from '@renderer/hooks/context/LayoutContext';
import ToolsModalContent from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import SkillsHubSettings from './SkillsHubSettings';

type CapabilitiesTab = 'skills' | 'tools';

const isCapabilitiesTab = (value: string | null): value is CapabilitiesTab => value === 'skills' || value === 'tools';

const CapabilitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: CapabilitiesTab =
    location.pathname.startsWith('/capabilities/skills/') || !isCapabilitiesTab(tabParam) ? 'skills' : tabParam;

  const handleTabChange = (key: string) => {
    if (!isCapabilitiesTab(key) || key === activeTab) {
      return;
    }

    if (location.pathname !== '/capabilities') {
      void navigate(`/capabilities?tab=${key}`, { replace: true });
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div
      className={classNames(
        'w-full min-h-full box-border overflow-y-auto',
        isMobile ? 'px-16px py-14px' : 'px-12px py-24px md:px-40px md:py-32px'
      )}
    >
      <div className='mx-auto flex w-full max-w-1200px flex-col'>
        <Tabs
          activeTab={activeTab}
          onChange={handleTabChange}
          type='line'
          animation={{ tabPane: false, inkBar: true }}
          className='flex flex-col flex-1 min-h-0 [&>.arco-tabs-content]:pt-0'
        >
          <Tabs.TabPane key='skills' title={t('settings.capabilitiesTab.skills', { defaultValue: 'Skills' })}>
            <SkillsHubSettings />
          </Tabs.TabPane>
          <Tabs.TabPane key='tools' title={t('settings.capabilitiesTab.tools', { defaultValue: 'Tools' })}>
            <ToolsModalContent />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default CapabilitiesPage;
