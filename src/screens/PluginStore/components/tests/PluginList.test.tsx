// src/screens/PluginStore/components/tests/PluginList.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18nForTest from 'utils/i18nForTest';
import PluginList from '../PluginList';
import type { IPluginMeta } from 'plugin';

// Mock the PluginCard component - Fix ESLint errors
vi.mock('../PluginCard', () => ({
  default: ({
    plugin,
    onManage,
  }: {
    plugin: IPluginMeta;
    onManage: (plugin: IPluginMeta) => void;
  }) => {
    return (
      <div data-testid={`plugin-list-item-${plugin.id}`}>
        <div data-testid={`plugin-name-${plugin.id}`}>{plugin.name}</div>
        <div data-testid={`plugin-description-${plugin.id}`}>
          {plugin.description}
        </div>
        <div data-testid={`plugin-author-${plugin.id}`}>{plugin.author}</div>
        <img
          data-testid={`plugin-icon-${plugin.id}`}
          src={plugin.icon}
          alt="Plugin Icon"
        />
        <button
          type="button"
          onClick={() => onManage(plugin)}
          data-testid={`plugin-action-btn-${plugin.id}`}
        >
          Manage
        </button>
      </div>
    );
  },
}));

// Mock react-i18next - Vitest syntax
const mockT = vi.hoisted(() =>
  vi.fn((key: string) => {
    const translations: Record<string, string> = {
      noPluginsFound: 'No plugins found for your search',
      noInstalledPlugins: 'No installed plugins',
      noPluginsAvailable: 'No plugins available',
      installPluginsToSeeHere: 'Install plugins to see them here',
      checkBackLater: 'Check back later for new plugins',
    };
    return translations[key];
  }),
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

describe('PluginList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Complete mock plugins with all required properties from IPluginMeta
  const mockPlugins: IPluginMeta[] = [
    {
      id: '1',
      name: 'Test Plugin 1',
      description: 'Description 1',
      author: 'Author 1',
      icon: 'icon1.png',
    },
    {
      id: '2',
      name: 'Test Plugin 2',
      description: 'Description 2',
      author: 'Author 2',
      icon: 'icon2.png',
    },
  ];

  const defaultProps = {
    plugins: mockPlugins,
    searchTerm: '',
    filterOption: 'all',
    onManagePlugin: vi.fn(),
  };

  // Test 1: When plugins are available - renders plugin list
  it('renders plugin list container when plugins are available', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugin-list-container')).toBeInTheDocument();
    expect(screen.queryByTestId('plugins-empty-state')).not.toBeInTheDocument();
  });

  // Test 2: When plugins are available - renders all plugin cards
  it('renders all plugin cards when plugins are available', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugin-list-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('plugin-list-item-2')).toBeInTheDocument();
    expect(screen.getByText('Test Plugin 1')).toBeInTheDocument();
    expect(screen.getByText('Test Plugin 2')).toBeInTheDocument();
  });

  // Test 3: When plugins are available - passes correct props to PluginCard
  it('passes correct plugin and onManage function to PluginCard', () => {
    const mockOnManage = vi.fn();
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} onManagePlugin={mockOnManage} />
      </I18nextProvider>,
    );

    const manageButton = screen.getByTestId('plugin-action-btn-1');
    fireEvent.click(manageButton);

    expect(mockOnManage).toHaveBeenCalledWith(mockPlugins[0]);
  });

  // Test 4: When no plugins and no search term - shows "no plugins available"
  it('shows "no plugins available" when no plugins and no search term', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} plugins={[]} searchTerm="" />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugins-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('plugins-empty-state-icon')).toBeInTheDocument();
    expect(
      screen.getByTestId('plugins-empty-state-message'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('plugins-empty-state-description'),
    ).toBeInTheDocument();
    expect(screen.getByText('No plugins available')).toBeInTheDocument();
    expect(
      screen.getByText('Check back later for new plugins'),
    ).toBeInTheDocument();
  });

  // Test 5: When no plugins and has search term - shows "no plugins found"
  it('shows "no plugins found" when no plugins and search term exists', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} plugins={[]} searchTerm="react" />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugins-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('plugins-empty-state-icon')).toBeInTheDocument();
    expect(
      screen.getByTestId('plugins-empty-state-message'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No plugins found matching your search'),
    ).toBeInTheDocument();
    // Description should not be shown when searchTerm exists
    expect(
      screen.queryByTestId('plugins-empty-state-description'),
    ).not.toBeInTheDocument();
  });

  // Test 6: When no plugins and filter is "installed" - shows "no installed plugins"
  it('shows "no installed plugins" when no plugins and filter is installed', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} plugins={[]} filterOption="installed" />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugins-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('plugins-empty-state-icon')).toBeInTheDocument();
    expect(
      screen.getByTestId('plugins-empty-state-message'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('plugins-empty-state-description'),
    ).toBeInTheDocument();
    expect(screen.getByText('No plugins installed yet')).toBeInTheDocument();
    expect(
      screen.getByText('Install plugins to see them here'),
    ).toBeInTheDocument();
  });

  // Test 7: Empty state renders with icon
  it('renders empty state with extension icon', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} plugins={[]} />
      </I18nextProvider>,
    );

    const emptyState = screen.getByTestId('plugins-empty-state');
    const icon = screen.getByTestId('plugins-empty-state-icon');

    expect(emptyState).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  // Test 8: Plugin list container has correct styles
  it('applies correct styles to plugin list container', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} />
      </I18nextProvider>,
    );

    const listContainer = screen.getByTestId('plugin-list-container');

    // Check that the container has the CSS module class applied
    expect(listContainer).toBeInTheDocument();
    // Styles are now in CSS module, so we verify the element exists with the class
    // The computed styles will still match the CSS module styles
    expect(listContainer).toHaveStyle('display: flex');
    expect(listContainer).toHaveStyle('flex-direction: column');
    expect(listContainer).toHaveStyle('gap: 20px');
  });

  // Test 9: renders one item per plugin id for each PluginCard
  it('renders one item per plugin id for each PluginCard in the list', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList {...defaultProps} />
      </I18nextProvider>,
    );

    mockPlugins.forEach((plugin) => {
      expect(
        screen.getByTestId(`plugin-list-item-${plugin.id}`),
      ).toBeInTheDocument();
    });
  });

  // Test 10: All conditional rendering paths are covered
  it('covers all conditional rendering paths for empty states', () => {
    // Test case 1: Empty with search term
    const { rerender } = render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList
          {...defaultProps}
          plugins={[]}
          searchTerm="search"
          filterOption="all"
        />
      </I18nextProvider>,
    );
    expect(
      screen.getByText('No plugins found matching your search'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('plugins-empty-state-description'),
    ).not.toBeInTheDocument();

    // Test case 2: Empty with installed filter
    rerender(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList
          {...defaultProps}
          plugins={[]}
          searchTerm=""
          filterOption="installed"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText('No plugins installed yet')).toBeInTheDocument();
    expect(
      screen.getByText('Install plugins to see them here'),
    ).toBeInTheDocument();

    // Test case 3: Empty with no filters or search
    rerender(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList
          {...defaultProps}
          plugins={[]}
          searchTerm=""
          filterOption="all"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText('No plugins available')).toBeInTheDocument();
    expect(
      screen.getByText('Check back later for new plugins'),
    ).toBeInTheDocument();
  });
  // Test 11: Edge case - searchTerm takes precedence over filterOption
  it('shows "no plugins found" when searchTerm exists even with installed filter', () => {
    render(
      <I18nextProvider i18n={i18nForTest}>
        <PluginList
          {...defaultProps}
          plugins={[]}
          searchTerm="test"
          filterOption="installed"
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('plugins-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No plugins found matching your search'),
    ).toBeInTheDocument();
    // Description should not be shown when searchTerm exists
    expect(
      screen.queryByTestId('plugins-empty-state-description'),
    ).not.toBeInTheDocument();
  });
});
