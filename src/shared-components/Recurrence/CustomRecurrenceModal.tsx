import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Form, FormControl, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import styles from '../../style/app-fixed.module.css';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Days,
  Frequency,
  daysOptions,
  endsAfter,
  endsNever,
  endsOn,
  frequencies,
  recurrenceEndOptions,
  monthNames,
} from '../../utils/recurrenceUtils';
import type {
  InterfaceRecurrenceRule,
  RecurrenceEndOptionType,
  WeekDays,
} from '../../utils/recurrenceUtils';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * Props interface for the CustomRecurrenceModal component
 */
export interface InterfaceCustomRecurrenceModalProps {
  /** Current recurrence rule state */
  recurrenceRuleState: InterfaceRecurrenceRule;
  /** Function to update recurrence rule state */
  setRecurrenceRuleState: (
    state: React.SetStateAction<InterfaceRecurrenceRule>,
  ) => void;
  /** Event end date */
  endDate: Date | null;
  /** Function to set event end date */
  setEndDate: (state: React.SetStateAction<Date | null>) => void;
  /** Whether the custom recurrence modal is open */
  customRecurrenceModalIsOpen: boolean;
  /** Function to hide the custom recurrence modal */
  hideCustomRecurrenceModal: () => void;
  /** Function to set custom recurrence modal open state */
  setCustomRecurrenceModalIsOpen: (
    state: React.SetStateAction<boolean>,
  ) => void;
  /** Translation function */
  t: (key: string) => string;
  /** Event start date */
  startDate: Date;
}

/**
 * CustomRecurrenceModal Component
 *
 * A shared modal component for configuring custom recurrence rules for events.
 * This component is used by both Admin and User portals via the shared EventForm.
 *
 * @component
 * @param {InterfaceCustomRecurrenceModalProps} props - The props for the component
 * @param {InterfaceRecurrenceRule} props.recurrenceRuleState - Current recurrence rule state
 * @param {(state: React.SetStateAction<InterfaceRecurrenceRule>) => void} props.setRecurrenceRuleState - Function to update recurrence rule state
 * @param {Date | null} props.endDate - Event end date
 * @param {(state: React.SetStateAction<Date | null>) => void} props.setEndDate - Function to set event end date
 * @param {boolean} props.customRecurrenceModalIsOpen - Whether the modal is open
 * @param {() => void} props.hideCustomRecurrenceModal - Function to hide the modal
 * @param {(state: React.SetStateAction<boolean>) => void} props.setCustomRecurrenceModalIsOpen - Function to set modal open state
 * @param {(key: string) => string} props.t - Translation function
 * @param {Date} props.startDate - Event start date
 *
 * @returns {React.ReactElement} The rendered CustomRecurrenceModal component
 *
 * @remarks
 * - Supports daily, weekly, monthly, and yearly recurrence frequencies
 * - Allows configuration of interval (every N days/weeks/months/years)
 * - Weekly recurrence supports day-of-week selection
 * - Monthly recurrence supports by-date or by-weekday options
 * - End conditions: never, on specific date, or after N occurrences
 * - Includes comprehensive ARIA attributes for accessibility
 * - Supports keyboard navigation for weekday selection
 * - Includes data-cy attributes for E2E testing
 *
 * @example
 * ```tsx
 * <CustomRecurrenceModal
 *   recurrenceRuleState={recurrenceRule}
 *   setRecurrenceRuleState={setRecurrenceRule}
 *   endDate={eventEndDate}
 *   setEndDate={setEventEndDate}
 *   customRecurrenceModalIsOpen={isOpen}
 *   hideCustomRecurrenceModal={() => setIsOpen(false)}
 *   setCustomRecurrenceModalIsOpen={setIsOpen}
 *   t={t}
 *   startDate={eventStartDate}
 * />
 * ```
 */
const CustomRecurrenceModal: React.FC<InterfaceCustomRecurrenceModalProps> = ({
  recurrenceRuleState,
  setRecurrenceRuleState,
  endDate,
  customRecurrenceModalIsOpen,
  hideCustomRecurrenceModal,
  setCustomRecurrenceModalIsOpen,
  t,
  startDate,
}) => {
  const { frequency, byDay, interval = 1, count, never } = recurrenceRuleState;
  const [selectedRecurrenceEndOption, setSelectedRecurrenceEndOption] =
    useState<RecurrenceEndOptionType>(() => {
      // Initialize based on current recurrence state
      if (never) return endsNever;
      if (recurrenceRuleState.endDate) return endsOn;
      if (count) return endsAfter;
      // Default to "after" for yearly frequency, "never" for others
      return frequency === Frequency.YEARLY ? endsAfter : endsNever;
    });

  const [localInterval, setLocalInterval] = useState<number | string>(interval);
  const [localCount, setLocalCount] = useState<number | string>(
    count || (frequency === Frequency.YEARLY ? 5 : 1),
  );

  /**
   * Calculates which week of the month a given date falls in
   * @param date - The date to calculate the week for
   * @returns The week number (1-5) within the month
   */
  const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const weekNumber = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
    return weekNumber;
  };

  /**
   * Converts a number to its ordinal string representation
   * @param num - The number to convert (1-5)
   * @returns The ordinal string (e.g., "first", "second", etc.)
   */
  const getOrdinalString = (num: number): string => {
    const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    return ordinals[num] || 'last';
  };

  /**
   * Gets the full day name from a day index
   * @param dayIndex - The day index (0-6, where 0 is Sunday)
   * @returns The full day name
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
   * Generates monthly recurrence options based on the start date
   * @returns {Object} Object containing monthly recurrence display strings and values
   * @returns {string} returns.byDate - Display string for by-date option (e.g., "Monthly on day 15")
   * @returns {string} returns.byWeekday - Display string for by-weekday option (e.g., "Monthly on the third Wednesday")
   * @returns {number} returns.dateValue - The day of the month (1-31)
   * @returns {Object} returns.weekdayValue - Object with week number and day
   * @returns {number} returns.weekdayValue.week - Week number within the month (1-5)
   * @returns {WeekDays} returns.weekdayValue.day - The weekday enum value
   */
  const getMonthlyOptions = () => {
    const eventDate = new Date(startDate);
    const dayOfMonth = eventDate.getDate();
    const dayOfWeek = eventDate.getDay();
    const weekOfMonth = getWeekOfMonth(eventDate);

    return {
      byDate: `Monthly on day ${dayOfMonth}`,
      byWeekday: `Monthly on the ${getOrdinalString(weekOfMonth)} ${getDayName(dayOfWeek)}`,
      dateValue: dayOfMonth,
      weekdayValue: { week: weekOfMonth, day: Days[dayOfWeek] },
    };
  };

  /**
   * Synchronizes the selected recurrence end option when the recurrence rule's endDate changes
   * Automatically selects "endsOn" option if endDate is set and neither never nor count are set
   */
  useEffect(() => {
    // Update selected end option when recurrence rule's endDate changes
    if (recurrenceRuleState.endDate && !never && !count) {
      setSelectedRecurrenceEndOption(endsOn);
    }
  }, [recurrenceRuleState.endDate, never, count]);

  /**
   * Handles changes to the recurrence end option (never, on date, after count)
   * @param e - The change event from the radio button input
   */
  const handleRecurrenceEndOptionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const selectedOption = e.target.value as RecurrenceEndOptionType;
    setSelectedRecurrenceEndOption(selectedOption);
    if (selectedOption === endsNever) {
      setRecurrenceRuleState((prev) => ({
        ...prev,
        never: true,
        count: undefined,
        endDate: undefined,
      }));
    } else if (selectedOption === endsOn) {
      const defaultRecurrenceEndDate = endDate
        ? new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      setRecurrenceRuleState((prev) => ({
        ...prev,
        never: false,
        count: undefined,
        endDate: defaultRecurrenceEndDate,
      }));
    } else if (selectedOption === endsAfter) {
      const totalCount =
        typeof localCount === 'string' ? parseInt(localCount) : localCount;
      setRecurrenceRuleState((prev) => ({
        ...prev,
        never: false,
        endDate: undefined,
        count: totalCount,
      }));
    }
  };

  /**
   * Handles changes to the recurrence frequency (daily, weekly, monthly, yearly)
   * @param newFrequency - The new frequency to set
   */
  const handleFrequencyChange = (newFrequency: Frequency): void => {
    const eventDate = new Date(startDate);
    const currentDay = Days[eventDate.getDay()];
    const currentMonth = eventDate.getMonth() + 1;
    const currentMonthDay = eventDate.getDate();

    let updatedRule: Partial<InterfaceRecurrenceRule> = {
      frequency: newFrequency,
      byDay: undefined,
      byMonth: undefined,
      byMonthDay: undefined,
    };
    switch (newFrequency) {
      case Frequency.WEEKLY:
        updatedRule.byDay = [currentDay];
        break;
      case Frequency.MONTHLY:
        updatedRule.byMonthDay = [currentMonthDay];
        break;
      case Frequency.YEARLY:
        updatedRule.byMonth = [currentMonth];
        updatedRule.byMonthDay = [currentMonthDay];
        updatedRule.count = 5;
        updatedRule.never = false;
        updatedRule.endDate = undefined;
        break;
      case Frequency.DAILY:
      default:
        break;
    }

    setRecurrenceRuleState((prev) => ({
      ...prev,
      ...updatedRule,
    }));

    if (newFrequency === Frequency.YEARLY) {
      setSelectedRecurrenceEndOption(endsAfter);
      setLocalCount(5);
    }
  };

  /**
   * Handles changes to the recurrence interval (every N days/weeks/months/years)
   * @param e - The change event from the interval input
   */
  const handleIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const inputValue = e.target.value;
    setLocalInterval(inputValue);

    const newInterval = Math.max(1, parseInt(inputValue) || 1);
    setRecurrenceRuleState((prev) => ({
      ...prev,
      interval: newInterval,
    }));
  };

  /**
   * Handles changes to the occurrence count for "ends after" option
   * @param e - The change event from the count input
   */
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    setLocalCount(inputValue);

    if (selectedRecurrenceEndOption === endsAfter) {
      const newCount = Math.max(1, parseInt(inputValue) || 1);
      setRecurrenceRuleState((prev) => ({
        ...prev,
        count: newCount,
        never: false,
        endDate: undefined,
      }));
    }
  };

  /**
   * Handles clicking on day buttons for weekly recurrence
   * @param day - The day that was clicked
   */
  const handleDayClick = (day: WeekDays): void => {
    if (byDay?.includes(day)) {
      setRecurrenceRuleState((prev) => ({
        ...prev,
        byDay: byDay.filter((d) => d !== day),
      }));
    } else {
      setRecurrenceRuleState((prev) => ({
        ...prev,
        byDay: [...(byDay || []), day],
      }));
    }
  };

  /**
   * Handles keyboard navigation for weekday buttons
   * @param e - The keyboard event
   * @param currentIndex - The current day button index
   */
  const handleWeekdayKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    const total = daysOptions.length;
    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + total) % total;
    } else if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % total;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = total - 1;
    } else {
      return; // Not a navigation key, let default behavior handle it
    }

    e.preventDefault();
    const button = document.querySelector(
      `[data-cy="recurrenceWeekDay-${newIndex}"]`,
    ) as HTMLButtonElement;
    if (button) {
      button.focus();
    }
  };

  /**
   * Handles submission of the custom recurrence modal
   * Validates inputs and updates the recurrence rule state
   */
  const handleCustomRecurrenceSubmit = (): void => {
    let finalRule = { ...recurrenceRuleState };

    const parsedInterval =
      typeof localInterval === 'string'
        ? parseInt(localInterval)
        : localInterval;
    if (isNaN(parsedInterval) || parsedInterval < 1) {
      toast.error(
        t('invalidDetailsMessage') ||
          'Please enter a valid interval (must be at least 1)',
      );
      return;
    }
    finalRule.interval = parsedInterval;

    if (selectedRecurrenceEndOption === endsNever) {
      finalRule = {
        ...finalRule,
        never: true,
        count: undefined,
        endDate: undefined,
      };
    } else if (selectedRecurrenceEndOption === endsOn) {
      const recurrenceEndDate =
        recurrenceRuleState.endDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      finalRule = {
        ...finalRule,
        never: false,
        count: undefined,
        endDate: recurrenceEndDate,
      };
    } else if (selectedRecurrenceEndOption === endsAfter) {
      const parsedCount =
        typeof localCount === 'string' ? parseInt(localCount) : localCount;
      if (isNaN(parsedCount) || parsedCount < 1) {
        toast.error(
          t('invalidDetailsMessage') ||
            'Please enter a valid occurrence count (must be at least 1)',
        );
        return;
      }

      finalRule = {
        ...finalRule,
        never: false,
        endDate: undefined,
        count: parsedCount,
      };
    }

    setRecurrenceRuleState(finalRule);
    setCustomRecurrenceModalIsOpen(false);
  };

  return (
    <>
      <Modal
        show={customRecurrenceModalIsOpen}
        onHide={hideCustomRecurrenceModal}
        centered
        aria-labelledby="custom-recurrence-modal-title"
        aria-modal="true"
      >
        <Modal.Header>
          <p id="custom-recurrence-modal-title" className={styles.titlemodal}>
            {t('customRecurrence')}
          </p>
          <Button
            variant="danger"
            onClick={hideCustomRecurrenceModal}
            data-testid="customRecurrenceModalCloseBtn"
            data-cy="customRecurrenceModalCloseBtn"
            aria-label={t('close')}
          >
            <i className="fa fa-times"></i>
          </Button>
        </Modal.Header>
        <Modal.Body className="pb-2">
          <div className="mb-4">
            <span className="fw-semibold text-secondary">
              {t('repeatsEvery')}
            </span>{' '}
            <FormControl
              type="number"
              value={localInterval}
              onChange={handleIntervalChange}
              onDoubleClick={(e) => {
                (e.target as HTMLInputElement).select();
              }}
              onKeyDown={(e) => {
                if (
                  e.key === '-' ||
                  e.key === '+' ||
                  e.key === 'e' ||
                  e.key === 'E'
                ) {
                  e.preventDefault();
                }
              }}
              min="1"
              className={`${styles.recurrenceRuleNumberInput} ms-2 d-inline-block py-2`}
              data-testid="customRecurrenceIntervalInput"
              data-cy="customRecurrenceIntervalInput"
              aria-label={t('repeatsEvery')}
              aria-required="true"
              placeholder="1"
            />
            <Dropdown className="ms-3 d-inline-block">
              <Dropdown.Toggle
                className={`${styles.dropdown}`}
                variant="outline-secondary"
                id="dropdown-basic"
                data-testid="customRecurrenceFrequencyDropdown"
                data-cy="customRecurrenceFrequencyDropdown"
                aria-label={t('frequency')}
              >
                {frequencies[frequency]}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => handleFrequencyChange(Frequency.DAILY)}
                  data-testid="customDailyRecurrence"
                  data-cy="customDailyRecurrence"
                >
                  {t('day')}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleFrequencyChange(Frequency.WEEKLY)}
                  data-testid="customWeeklyRecurrence"
                  data-cy="customWeeklyRecurrence"
                >
                  {t('week')}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleFrequencyChange(Frequency.MONTHLY)}
                  data-testid="customMonthlyRecurrence"
                  data-cy="customMonthlyRecurrence"
                >
                  {t('month')}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleFrequencyChange(Frequency.YEARLY)}
                  data-testid="customYearlyRecurrence"
                  data-cy="customYearlyRecurrence"
                >
                  {t('year')}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {frequency === Frequency.WEEKLY && (
            <div className="mb-4">
              <span className="fw-semibold text-secondary">
                {t('repeatsOn')}
              </span>
              <br />
              <div
                className="mx-2 mt-3 d-flex gap-1"
                role="group"
                aria-label={t('repeatsOn')}
              >
                {daysOptions.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.recurrenceDayButton} ${byDay?.includes(Days[index]) ? styles.selected : ''}`}
                    onClick={() => handleDayClick(Days[index])}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDayClick(Days[index]);
                      } else {
                        handleWeekdayKeyDown(e, index);
                      }
                    }}
                    data-testid="recurrenceWeekDay"
                    data-cy={`recurrenceWeekDay-${index}`}
                    aria-pressed={byDay?.includes(Days[index])}
                    aria-label={`${t('select')} ${day}`}
                    role="button"
                    tabIndex={0}
                  >
                    <span>{day}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Options */}
          {frequency === Frequency.MONTHLY && (
            <div className="mb-4">
              <span className="fw-semibold text-secondary">
                {t('monthlyOn')}
              </span>
              <br />
              <div className="mx-2 mt-3">
                <Dropdown className="d-inline-block">
                  <Dropdown.Toggle
                    className="py-2"
                    variant="outline-secondary"
                    id="monthly-dropdown"
                    data-testid="monthlyRecurrenceDropdown"
                    data-cy="monthlyRecurrenceDropdown"
                    aria-label={t('monthlyOn')}
                  >
                    {recurrenceRuleState.byDay
                      ? getMonthlyOptions().byWeekday
                      : getMonthlyOptions().byDate}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => {
                        const options = getMonthlyOptions();
                        setRecurrenceRuleState((prev) => ({
                          ...prev,
                          byMonthDay: [options.dateValue],
                          byDay: undefined,
                        }));
                      }}
                      data-testid="monthlyByDate"
                      data-cy="monthlyByDate"
                    >
                      {getMonthlyOptions().byDate}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          )}

          {/* Yearly Options */}
          {frequency === Frequency.YEARLY && (
            <div className="mb-4">
              <span className="fw-semibold text-secondary">
                {t('yearlyOn')}
              </span>
              <br />
              <div className="mx-2 mt-3">
                <span className="text-muted">
                  {monthNames[new Date(startDate).getMonth()]}{' '}
                  {new Date(startDate).getDate()}
                </span>
                <p className="small mt-1 text-muted mb-0">
                  {t('yearlyRecurrenceDesc')}
                </p>
              </div>
            </div>
          )}

          <div className="mb-3">
            <span className="fw-semibold text-secondary">{t('ends')}</span>
            <div className="ms-3 mt-3">
              <Form>
                {recurrenceEndOptions
                  .filter(
                    (option) =>
                      frequency !== Frequency.YEARLY || option !== endsNever,
                  )
                  .map((option, index) => (
                    <div key={index} className="my-2 d-flex align-items-center">
                      <Form.Check
                        type="radio"
                        id={`radio-${index}`}
                        label={t(option)}
                        name="recurrenceEndOption"
                        className="d-inline-block me-5"
                        value={option}
                        onChange={handleRecurrenceEndOptionChange}
                        checked={option === selectedRecurrenceEndOption}
                        data-testid={`${option}`}
                        data-cy={`recurrenceEndOption-${option}`}
                        aria-label={t(option)}
                      />

                      {option === endsOn && (
                        <div className="ms-3">
                          <DatePicker
                            label={t('endDate')}
                            data-testid="customRecurrenceEndDatePicker"
                            data-cy="customRecurrenceEndDatePicker"
                            className={styles.recurrenceRuleDateBox}
                            disabled={selectedRecurrenceEndOption !== endsOn}
                            value={dayjs(
                              recurrenceRuleState.endDate ?? new Date(),
                            )}
                            onChange={(date: Dayjs | null): void => {
                              if (date) {
                                const newRecurrenceEndDate = date.toDate();
                                setRecurrenceRuleState((prev) => ({
                                  ...prev,
                                  endDate: newRecurrenceEndDate,
                                  never: false,
                                  count: undefined,
                                }));
                              }
                            }}
                            minDate={dayjs()}
                            slotProps={{
                              textField: {
                                'aria-label': t('endDate'),
                              },
                            }}
                          />
                        </div>
                      )}
                      {option === endsAfter && (
                        <>
                          <FormControl
                            type="number"
                            value={localCount}
                            onChange={handleCountChange}
                            onDoubleClick={(e) => {
                              (e.target as HTMLInputElement).select();
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === '-' ||
                                e.key === '+' ||
                                e.key === 'e' ||
                                e.key === 'E'
                              ) {
                                e.preventDefault();
                              }
                            }}
                            min="1"
                            className={`${styles.recurrenceRuleNumberInput} ms-1 me-2 d-inline-block py-2`}
                            disabled={selectedRecurrenceEndOption !== endsAfter}
                            data-testid="customRecurrenceCountInput"
                            data-cy="customRecurrenceCountInput"
                            aria-label={t('occurences')}
                            aria-required={
                              selectedRecurrenceEndOption === endsAfter
                                ? 'true'
                                : 'false'
                            }
                            placeholder="1"
                          />{' '}
                          {t('occurences')}
                        </>
                      )}
                    </div>
                  ))}
              </Form>
            </div>
          </div>

          <hr className="mt-4 mb-2 mx-2" />

          <div className="mx w-100 position-relative">
            <Button
              className={styles.recurrenceRuleSubmitBtn}
              data-testid="customRecurrenceSubmitBtn"
              data-cy="customRecurrenceSubmitBtn"
              onClick={handleCustomRecurrenceSubmit}
              aria-label={t('done')}
            >
              {t('done')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CustomRecurrenceModal;
