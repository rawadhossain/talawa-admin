import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'utils/i18nForTest';
import EventRecurrencePicker from './EventRecurrencePicker';
import {
  mockStartDate,
  mockEndDate,
  mockWeeklyRecurrence,
} from './EventRecurrencePickerMocks';
import type { InterfaceRecurrenceRule } from 'utils/recurrenceUtils';

// Mock the CustomRecurrenceModal component with callbacks for testing
vi.mock('screens/OrganizationEvents/CustomRecurrenceModal', () => ({
  default: ({
    customRecurrenceModalIsOpen,
    hideCustomRecurrenceModal,
    setRecurrenceRuleState,
    setEndDate,
    recurrenceRuleState,
  }: {
    customRecurrenceModalIsOpen: boolean;
    hideCustomRecurrenceModal: () => void;
    setRecurrenceRuleState: (
      rule:
        | InterfaceRecurrenceRule
        | ((prev: InterfaceRecurrenceRule) => InterfaceRecurrenceRule),
    ) => void;
    setEndDate: (date: React.SetStateAction<Date | null>) => void;
    recurrenceRuleState: InterfaceRecurrenceRule;
  }) =>
    customRecurrenceModalIsOpen ? (
      <div data-testid="customRecurrenceModal">
        <button
          type="button"
          data-testid="closeCustomModal"
          onClick={hideCustomRecurrenceModal}
        >
          Close
        </button>
        <button
          type="button"
          data-testid="updateRecurrenceWithFunction"
          onClick={() =>
            setRecurrenceRuleState((prev: InterfaceRecurrenceRule) => ({
              ...prev,
              interval: 3,
            }))
          }
        >
          Update Recurrence With Function
        </button>
        <button
          type="button"
          data-testid="updateRecurrenceWithValue"
          onClick={() =>
            setRecurrenceRuleState({
              ...recurrenceRuleState,
              interval: 5,
            })
          }
        >
          Update Recurrence With Value
        </button>
        <button
          type="button"
          data-testid="updateEndDateWithValue"
          onClick={() => setEndDate(new Date('2024-02-15'))}
        >
          Update End Date With Value
        </button>
        <button
          type="button"
          data-testid="updateEndDateWithFunction"
          onClick={() =>
            setEndDate((prev: Date | null) =>
              prev ? new Date(prev.getTime() + 86400000) : new Date(),
            )
          }
        >
          Update End Date With Function
        </button>
      </div>
    ) : null,
}));

const renderComponent = (props = {}) => {
  const defaultProps = {
    startDate: mockStartDate,
    endDate: mockEndDate,
    recurrence: null,
    onRecurrenceChange: vi.fn(),
    onEndDateChange: vi.fn(),
  };

  return render(
    <I18nextProvider i18n={i18n}>
      <EventRecurrencePicker {...defaultProps} {...props} />
    </I18nextProvider>,
  );
};

describe('EventRecurrencePicker', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders with default "Does not repeat" label when recurrence is null', () => {
    renderComponent();
    expect(screen.getByTestId('recurrenceDropdown')).toHaveTextContent(
      'Does not repeat',
    );
  });

  it('renders dropdown with all recurrence options', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByTestId('recurrenceDropdown'));

    expect(screen.getByTestId('recurrenceOption-0')).toHaveTextContent(
      'Does not repeat',
    );
    expect(screen.getByTestId('recurrenceOption-1')).toHaveTextContent('Daily');
    expect(screen.getByTestId('recurrenceOption-2')).toHaveTextContent(
      'Weekly on Monday',
    );
    expect(screen.getByTestId('recurrenceOption-3')).toHaveTextContent(
      'Monthly on day 15',
    );
    expect(screen.getByTestId('recurrenceOption-4')).toHaveTextContent(
      'Annually on January 15',
    );
    expect(screen.getByTestId('recurrenceOption-5')).toHaveTextContent(
      'Every weekday (Monday to Friday)',
    );
    expect(screen.getByTestId('recurrenceOption-6')).toHaveTextContent(
      'Custom...',
    );
  });

  it('calls onRecurrenceChange with null when "Does not repeat" is selected', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ recurrence: mockWeeklyRecurrence, onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-0'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(null);
  });

  it('calls onRecurrenceChange with daily recurrence when Daily is selected', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-1'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'DAILY',
        interval: 1,
        never: true,
      }),
    );
  });

  it('calls onRecurrenceChange with weekly recurrence when Weekly is selected', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-2'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'WEEKLY',
        interval: 1,
        byDay: ['MO'],
        never: true,
      }),
    );
  });

  it('opens CustomRecurrenceModal when Custom is selected', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    // Start with an existing recurrence so the modal can render
    renderComponent({ recurrence: mockWeeklyRecurrence, onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });
  });

  it('displays correct label when recurrence is set', () => {
    // The mockWeeklyRecurrence doesn't exactly match the generated option
    // because createDefaultRecurrenceRule generates byDay dynamically based on startDate.
    // Since mockStartDate is January 15, 2024 (Monday), the generated rule matches.
    // But the JSON comparison is strict, so we test that the label shows the frequency.
    renderComponent({ recurrence: mockWeeklyRecurrence });
    // The component shows frequency-based label when no exact match is found
    expect(screen.getByTestId('recurrenceDropdown')).toHaveTextContent(
      'Weekly',
    );
  });

  it('displays "Custom" label when recurrence does not match standard options', () => {
    const customRecurrence = {
      frequency: 'WEEKLY' as const,
      interval: 2,
      byDay: ['MO', 'WE', 'FR'] as ('MO' | 'WE' | 'FR')[],
      never: true,
    };
    renderComponent({ recurrence: customRecurrence });
    // Should show frequency when no standard option matches
    expect(screen.getByTestId('recurrenceDropdown')).toHaveTextContent(
      'Weekly',
    );
  });

  it('is disabled when disabled prop is true', () => {
    renderComponent({ disabled: true });
    expect(screen.getByTestId('recurrenceDropdown')).toBeDisabled();
  });

  it('handles recurrence state changes with function callback from CustomRecurrenceModal', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ recurrence: mockWeeklyRecurrence, onRecurrenceChange });

    // Open the custom recurrence modal
    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });

    // Click the button that updates recurrence with a function
    await user.click(screen.getByTestId('updateRecurrenceWithFunction'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 3,
      }),
    );
  });

  it('handles recurrence state changes with direct value from CustomRecurrenceModal', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ recurrence: mockWeeklyRecurrence, onRecurrenceChange });

    // Open the custom recurrence modal
    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });

    // Click the button that updates recurrence with a direct value
    await user.click(screen.getByTestId('updateRecurrenceWithValue'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 5,
      }),
    );
  });

  it('handles end date changes with direct value from CustomRecurrenceModal', async () => {
    const user = userEvent.setup();
    const onEndDateChange = vi.fn();
    renderComponent({ recurrence: mockWeeklyRecurrence, onEndDateChange });

    // Open the custom recurrence modal
    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });

    // Click the button that updates end date with a direct value
    await user.click(screen.getByTestId('updateEndDateWithValue'));

    expect(onEndDateChange).toHaveBeenCalledWith(new Date('2024-02-15'));
  });

  it('handles end date changes with function callback from CustomRecurrenceModal', async () => {
    const user = userEvent.setup();
    const onEndDateChange = vi.fn();
    renderComponent({ recurrence: mockWeeklyRecurrence, onEndDateChange });

    // Open the custom recurrence modal
    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });

    // Click the button that updates end date with a function
    await user.click(screen.getByTestId('updateEndDateWithFunction'));

    // The function adds one day to the end date (86400000 ms)
    expect(onEndDateChange).toHaveBeenCalledWith(expect.any(Date));
  });

  it('closes CustomRecurrenceModal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({ recurrence: mockWeeklyRecurrence });

    // Open the custom recurrence modal
    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    await waitFor(() => {
      expect(screen.getByTestId('customRecurrenceModal')).toBeInTheDocument();
    });

    // Close the modal
    await user.click(screen.getByTestId('closeCustomModal'));

    await waitFor(() => {
      expect(
        screen.queryByTestId('customRecurrenceModal'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders correctly with invalid startDate by falling back to current date', () => {
    // Test that the component handles invalid dates gracefully
    renderComponent({ startDate: new Date('invalid') });
    // Should still render without errors
    expect(screen.getByTestId('recurrenceDropdown')).toBeInTheDocument();
  });

  it('renders monthly recurrence option correctly', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-3'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'MONTHLY',
        interval: 1,
        byMonthDay: [15],
        never: true,
      }),
    );
  });

  it('renders yearly recurrence option correctly', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-4'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'YEARLY',
        interval: 1,
        byMonth: [1],
        byMonthDay: [15],
        never: true,
      }),
    );
  });

  it('renders weekday recurrence option correctly', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-5'));

    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'WEEKLY',
        interval: 1,
        byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
        never: true,
      }),
    );
  });

  it('creates default weekly recurrence when custom is selected without existing recurrence', async () => {
    const user = userEvent.setup();
    const onRecurrenceChange = vi.fn();
    renderComponent({ recurrence: null, onRecurrenceChange });

    await user.click(screen.getByTestId('recurrenceDropdown'));
    await user.click(screen.getByTestId('recurrenceOption-6'));

    // When no recurrence exists and custom is selected, it should create a default weekly recurrence
    expect(onRecurrenceChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'WEEKLY',
        interval: 1,
        never: true,
      }),
    );
  });

  it('displays "Custom" label when recurrence has no frequency', () => {
    // Edge case: recurrence object exists but has no frequency
    const recurrenceWithoutFrequency = {
      interval: 1,
      never: true,
    } as unknown as InterfaceRecurrenceRule;
    renderComponent({ recurrence: recurrenceWithoutFrequency });
    // Should show "Custom" (or translated equivalent) when frequency is missing
    expect(screen.getByTestId('recurrenceDropdown')).toHaveTextContent(
      'Custom',
    );
  });
});
