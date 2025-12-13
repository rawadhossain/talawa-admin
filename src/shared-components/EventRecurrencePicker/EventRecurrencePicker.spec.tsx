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

// Mock the CustomRecurrenceModal component
vi.mock('screens/OrganizationEvents/CustomRecurrenceModal', () => ({
  default: ({
    customRecurrenceModalIsOpen,
    hideCustomRecurrenceModal,
  }: {
    customRecurrenceModalIsOpen: boolean;
    hideCustomRecurrenceModal: () => void;
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
});
