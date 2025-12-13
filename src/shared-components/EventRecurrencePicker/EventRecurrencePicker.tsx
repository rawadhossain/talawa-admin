/**
 * EventRecurrencePicker Component
 *
 * A reusable dropdown component for selecting event recurrence patterns.
 * Provides options for Daily, Weekly, Monthly, Yearly, and Custom recurrence rules.
 * Integrates with CustomRecurrenceModal for advanced configuration.
 *
 * @param props - The component props
 * @returns JSX.Element - The rendered recurrence picker
 *
 * @example
 * <EventRecurrencePicker
 *   startDate={eventStartDate}
 *   endDate={eventEndDate}
 *   recurrence={recurrence}
 *   onRecurrenceChange={setRecurrence}
 *   onEndDateChange={setEndDate}
 * />
 */
import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from 'style/app-fixed.module.css';
import CustomRecurrenceModal from 'screens/OrganizationEvents/CustomRecurrenceModal';
import {
  Frequency,
  WeekDays,
  InterfaceRecurrenceRule,
  createDefaultRecurrenceRule,
} from 'utils/recurrenceUtils';
import type { InterfaceEventRecurrencePickerProps } from 'types/EventRecurrencePicker/interface';

/**
 * Gets the day name from a numeric day index
 * @param dayIndex - Day index (0 = Sunday, 1 = Monday, etc.)
 * @returns The full name of the day
 */
const getDayName = (dayIndex: number): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayIndex];
};

/**
 * Gets the month name from a numeric month index
 * @param monthIndex - Month index (0 = January, 1 = February, etc.)
 * @returns The full name of the month
 */
const getMonthName = (monthIndex: number): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[monthIndex];
};

const EventRecurrencePicker: React.FC<InterfaceEventRecurrencePickerProps> = ({
  startDate,
  endDate,
  recurrence,
  onRecurrenceChange,
  onEndDateChange,
  disabled = false,
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'organizationEvents',
  });

  const [customRecurrenceModalIsOpen, setCustomRecurrenceModalIsOpen] =
    useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /**
   * Shows the custom recurrence configuration modal
   */
  const showCustomRecurrenceModal = (): void =>
    setCustomRecurrenceModalIsOpen(true);

  /**
   * Hides the custom recurrence configuration modal
   */
  const hideCustomRecurrenceModal = (): void =>
    setCustomRecurrenceModalIsOpen(false);

  /**
   * Generates recurrence options based on the current start date
   * @returns Array of recurrence options with labels and values
   */
  const getRecurrenceOptions = (): Array<{
    label: string;
    value: InterfaceRecurrenceRule | 'custom' | null;
  }> => {
    const eventDate = new Date(startDate);
    const dayOfWeek = eventDate.getDay();
    const dayOfMonth = eventDate.getDate();
    const month = eventDate.getMonth();
    const dayName = getDayName(dayOfWeek);
    const monthName = getMonthName(month);

    return [
      {
        label: 'Does not repeat',
        value: null,
      },
      {
        label: 'Daily',
        value: createDefaultRecurrenceRule(eventDate, Frequency.DAILY),
      },
      {
        label: `Weekly on ${dayName}`,
        value: createDefaultRecurrenceRule(eventDate, Frequency.WEEKLY),
      },
      {
        label: `Monthly on day ${dayOfMonth}`,
        value: createDefaultRecurrenceRule(eventDate, Frequency.MONTHLY),
      },
      {
        label: `Annually on ${monthName} ${dayOfMonth}`,
        value: {
          frequency: Frequency.YEARLY,
          interval: 1,
          byMonth: [month + 1],
          byMonthDay: [dayOfMonth],
          never: true,
        },
      },
      {
        label: 'Every weekday (Monday to Friday)',
        value: {
          frequency: Frequency.WEEKLY,
          interval: 1,
          byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] as WeekDays[],
          never: true,
        },
      },
      {
        label: 'Custom...',
        value: 'custom',
      },
    ];
  };

  /**
   * Handles selection of a recurrence option from the dropdown
   * @param option - Selected recurrence option with label and value
   */
  const handleRecurrenceSelect = (option: {
    label: string;
    value: InterfaceRecurrenceRule | 'custom' | null;
  }): void => {
    if (option.value === 'custom') {
      if (!recurrence) {
        onRecurrenceChange(
          createDefaultRecurrenceRule(startDate, Frequency.WEEKLY),
        );
      }
      showCustomRecurrenceModal();
    } else {
      onRecurrenceChange(option.value);
    }
    setDropdownOpen(false);
  };

  /**
   * Gets the current recurrence label to display in the dropdown
   * @returns String label describing the current recurrence pattern
   */
  const getCurrentRecurrenceLabel = (): string => {
    if (!recurrence) return 'Does not repeat';

    const options = getRecurrenceOptions();
    const matchingOption = options.find((option) => {
      if (!option.value || option.value === 'custom') return false;
      return JSON.stringify(option.value) === JSON.stringify(recurrence);
    });

    if (matchingOption) {
      return matchingOption.label;
    }

    // If no standard option matches, display the frequency of the custom rule
    if (recurrence.frequency) {
      return (
        recurrence.frequency.charAt(0).toUpperCase() +
        recurrence.frequency.slice(1).toLowerCase()
      );
    }

    return 'Custom';
  };

  /**
   * Handles recurrence state updates from CustomRecurrenceModal
   */
  const handleRecurrenceStateChange = (
    newRecurrence:
      | InterfaceRecurrenceRule
      | ((prev: InterfaceRecurrenceRule) => InterfaceRecurrenceRule),
  ): void => {
    if (typeof newRecurrence === 'function') {
      if (recurrence) {
        onRecurrenceChange(newRecurrence(recurrence));
      }
    } else {
      onRecurrenceChange(newRecurrence);
    }
  };

  return (
    <>
      <Dropdown show={dropdownOpen} onToggle={setDropdownOpen}>
        <Dropdown.Toggle
          variant="outline-secondary"
          id="recurrence-dropdown"
          data-testid="recurrenceDropdown"
          className={styles.dropdown}
          disabled={disabled}
        >
          {getCurrentRecurrenceLabel()}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {getRecurrenceOptions().map((option, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => handleRecurrenceSelect(option)}
              data-testid={`recurrenceOption-${index}`}
            >
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      {recurrence && (
        <CustomRecurrenceModal
          recurrenceRuleState={recurrence}
          setRecurrenceRuleState={handleRecurrenceStateChange}
          endDate={endDate}
          setEndDate={(stateAction) => {
            if (onEndDateChange) {
              const newDate =
                typeof stateAction === 'function'
                  ? stateAction(endDate)
                  : stateAction;
              onEndDateChange(newDate);
            }
          }}
          customRecurrenceModalIsOpen={customRecurrenceModalIsOpen}
          hideCustomRecurrenceModal={hideCustomRecurrenceModal}
          setCustomRecurrenceModalIsOpen={setCustomRecurrenceModalIsOpen}
          t={t}
          startDate={startDate}
        />
      )}
    </>
  );
};

export default EventRecurrencePicker;
