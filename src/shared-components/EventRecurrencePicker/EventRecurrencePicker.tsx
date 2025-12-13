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
 * Compares two arrays for equality (order-sensitive)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays are equal
 */
const arraysEqual = <T,>(
  arr1: T[] | undefined,
  arr2: T[] | undefined,
): boolean => {
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
};

/**
 * Compares two recurrence rules for semantic equality
 * @param rule1 - First recurrence rule
 * @param rule2 - Second recurrence rule
 * @returns True if rules are semantically equal
 */
const recurrenceRulesEqual = (
  rule1: InterfaceRecurrenceRule,
  rule2: InterfaceRecurrenceRule,
): boolean => {
  return (
    rule1.frequency === rule2.frequency &&
    rule1.interval === rule2.interval &&
    rule1.never === rule2.never &&
    arraysEqual(rule1.byDay, rule2.byDay) &&
    arraysEqual(rule1.byMonth, rule2.byMonth) &&
    arraysEqual(rule1.byMonthDay, rule2.byMonthDay) &&
    rule1.count === rule2.count &&
    rule1.endDate === rule2.endDate
  );
};

const EventRecurrencePicker: React.FC<InterfaceEventRecurrencePickerProps> = ({
  startDate,
  endDate,
  recurrence,
  onRecurrenceChange,
  onEndDateChange,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation('translation', {
    keyPrefix: 'organizationEvents',
  });

  const [customRecurrenceModalIsOpen, setCustomRecurrenceModalIsOpen] =
    useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /**
   * Gets the localized day name from a numeric day index
   * @param dayIndex - Day index (0 = Sunday, 1 = Monday, etc.)
   * @returns The localized full name of the day
   */
  const getDayName = (dayIndex: number): string => {
    // Create a date from a known Sunday (Jan 7, 2024) and add the day index
    const date = new Date(2024, 0, 7 + dayIndex);
    return new Intl.DateTimeFormat(i18n.language || navigator.language, {
      weekday: 'long',
    }).format(date);
  };

  /**
   * Gets the localized month name from a numeric month index
   * @param monthIndex - Month index (0 = January, 1 = February, etc.)
   * @returns The localized full name of the month
   */
  const getMonthName = (monthIndex: number): string => {
    const date = new Date(2024, monthIndex, 1);
    return new Intl.DateTimeFormat(i18n.language || navigator.language, {
      month: 'long',
    }).format(date);
  };

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
    // Ensure we have a valid date, fallback to current date if invalid
    const eventDate = new Date(startDate);
    const isValidDate = !isNaN(eventDate.getTime());
    const safeDate = isValidDate ? eventDate : new Date();

    const dayOfWeek = safeDate.getDay();
    const dayOfMonth = safeDate.getDate();
    const month = safeDate.getMonth();
    const dayName = getDayName(dayOfWeek);
    const monthName = getMonthName(month);

    return [
      {
        label: 'Does not repeat',
        value: null,
      },
      {
        label: 'Daily',
        value: createDefaultRecurrenceRule(safeDate, Frequency.DAILY),
      },
      {
        label: `Weekly on ${dayName}`,
        value: createDefaultRecurrenceRule(safeDate, Frequency.WEEKLY),
      },
      {
        label: `Monthly on day ${dayOfMonth}`,
        value: createDefaultRecurrenceRule(safeDate, Frequency.MONTHLY),
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
      return recurrenceRulesEqual(option.value, recurrence);
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
