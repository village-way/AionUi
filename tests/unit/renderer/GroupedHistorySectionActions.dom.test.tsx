/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const { navigateMock, onSessionClickMock, onBatchModeChangeMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  onSessionClickMock: vi.fn(),
  onBatchModeChangeMock: vi.fn(),
}));

const workspaceConversation = {
  id: 'workspace-chat',
  name: 'Workspace Chat',
} as unknown as TChatConversation;
const plainConversation = {
  id: 'plain-chat',
  name: 'Plain Chat',
} as unknown as TChatConversation;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const values: Record<string, string> = {
        'conversation.history.projectsSection': 'Workspaces',
        'conversation.history.conversationsSection': 'Chats',
        'conversation.history.newConversationInProject': 'New chat in this workspace',
        'conversation.welcome.newConversation': 'New Chat',
      };
      return values[key] ?? key;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({}),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@/renderer/pages/cron', () => ({
  useCronJobsMap: () => ({
    getJobStatus: () => 'none',
    markAsRead: vi.fn(),
    setActiveConversation: vi.fn(),
  }),
}));

vi.mock('@/renderer/components/settings/DirectorySelectionModal', () => ({
  default: ({
    visible,
    onConfirm,
  }: {
    visible: boolean;
    onConfirm: (paths: string[] | undefined) => void;
  }) =>
    visible ? (
      <div data-testid='directory-modal'>
        <button type='button' data-testid='directory-confirm' onClick={() => onConfirm(['/tmp/workspace'])}>
          Select
        </button>
      </div>
    ) : null,
}));

vi.mock('@/renderer/components/base/AionModal', () => ({
  default: () => null,
}));

vi.mock('@/renderer/pages/conversation/components/WorkspaceCollapse', () => ({
  default: ({
    header,
    trailing,
    children,
  }: {
    header?: React.ReactNode;
    trailing?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div>
      <div>
        {header}
        {trailing}
      </div>
      {children}
    </div>
  ),
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/ConversationRow', () => ({
  default: ({ conversation }: { conversation: TChatConversation }) => <div>{conversation.name}</div>,
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/SortableConversationRow', () => ({
  default: ({ conversation }: { conversation: TChatConversation }) => <div>{conversation.name}</div>,
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [workspaceConversation, plainConversation],
    isConversationGenerating: () => false,
    hasCompletionUnread: () => false,
    expandedWorkspaces: ['/tmp/workspace'],
    pinnedConversations: [],
    timelineSections: [
      {
        timeline: 'Today',
        items: [
          {
            type: 'workspace',
            time: 2,
            workspaceGroup: {
              workspace: '/tmp/workspace',
              display_name: 'Workspace',
              conversations: [workspaceConversation],
            },
          },
          {
            type: 'conversation',
            time: 1,
            conversation: plainConversation,
          },
        ],
      },
    ],
    handleToggleWorkspace: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/hooks/useBatchSelection', () => ({
  useBatchSelection: () => ({
    selectedConversationIds: new Set<string>(),
    setSelectedConversationIds: vi.fn(),
    selectedCount: 0,
    allSelected: false,
    toggleSelectedConversation: vi.fn(),
    handleToggleSelectAll: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/hooks/useConversationActions', () => ({
  useConversationActions: () => ({
    renameModalVisible: false,
    renameModalName: '',
    setRenameModalName: vi.fn(),
    renameLoading: false,
    dropdownVisibleId: null,
    handleConversationClick: vi.fn(),
    handleDeleteClick: vi.fn(),
    handleBatchDelete: vi.fn(),
    handleEditStart: vi.fn(),
    handleRenameConfirm: vi.fn(),
    handleRenameCancel: vi.fn(),
    handleTogglePin: vi.fn(),
    handleMenuVisibleChange: vi.fn(),
    handleOpenMenu: vi.fn(),
    handleRemoveProject: vi.fn(),
    removeProjectTarget: null,
    removeProjectLoading: false,
    handleRemoveProjectCancel: vi.fn(),
    handleRemoveProjectConfirm: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/hooks/useExport', () => ({
  useExport: () => ({
    exportTask: null,
    exportModalVisible: false,
    exportTargetPath: '',
    exportModalLoading: false,
    showExportDirectorySelector: false,
    setShowExportDirectorySelector: vi.fn(),
    closeExportModal: vi.fn(),
    handleSelectExportDirectoryFromModal: vi.fn(),
    handleSelectExportFolder: vi.fn(),
    handleConfirmExport: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/conversation/GroupedHistory/hooks/useDragAndDrop', () => ({
  useDragAndDrop: () => ({
    sensors: [],
    activeId: null,
    activeConversation: null,
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
    isDragEnabled: false,
  }),
}));

import WorkspaceGroupedHistory from '@/renderer/pages/conversation/GroupedHistory';

describe('WorkspaceGroupedHistory section actions', () => {
  it('creates chats from the workspace and chat section headers', () => {
    render(
      <WorkspaceGroupedHistory onSessionClick={onSessionClickMock} onBatchModeChange={onBatchModeChangeMock} />
    );

    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Chats')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('chat-section-create-btn'));

    expect(navigateMock).toHaveBeenCalledWith('/guid', { state: { resetAssistant: true } });
    expect(onBatchModeChangeMock).toHaveBeenCalledWith(false);
    expect(onSessionClickMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('workspace-section-create-btn'));
    expect(screen.getByTestId('directory-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('directory-confirm'));

    expect(navigateMock).toHaveBeenCalledWith('/guid', { state: { workspace: '/tmp/workspace' } });
    expect(onBatchModeChangeMock).toHaveBeenCalledWith(false);
    expect(onSessionClickMock).toHaveBeenCalledTimes(2);
  });
});
