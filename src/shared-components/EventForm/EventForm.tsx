/**
 * EventForm - A reusable form component for creating and editing events.
 * Supports date/time selection, recurrence configuration, and various event options.
 *
 * @module EventForm
 */
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Form } from 'react-bootstrap';
import styles from 'style/app-fixed.module.css';
import type {
  IEventFormProps,
  IEventFormSubmitPayload,
  IEventFormValues,
} from 'types/EventForm/interface';
import CustomRecurrenceModal from '../Recurrence/CustomRecurrenceModal';
import {
  Frequency,
  WeekDays,
  createDefaultRecurrenceRule,
  formatRecurrenceForApi,
  validateRecurrenceInput,
} from 'utils/recurrenceUtils';
import type { InterfaceRecurrenceRule } from 'utils/recurrenceUtils';

const timeToDayJs = (time: string) => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return dayjs()
    .hour(hours)
    .minute(minutes)
    .second(seconds || 0);
};

const buildRecurrenceOptions = (
  startDate: Date,
  t: (key: string, options?: Record<string, unknown>) => string,
): Array<{
  label: string;
  value: InterfaceRecurrenceRule | 'custom' | null;
}> => {
  const eventDate = new Date(startDate);
  const isValidDate = !Number.isNaN(eventDate.getTime());
  const safeDate = isValidDate ? eventDate : new Date();

  const dayOfWeek = safeDate.getDay();
  const dayOfMonth = safeDate.getDate();
  const month = safeDate.getMonth();

  const locale = navigator.language || 'en-US';
  const dayName = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
  }).format(new Date(2024, 0, 7 + dayOfWeek));
  const monthName = new Intl.DateTimeFormat(locale, {
    month: 'long',
  }).format(new Date(2024, month, 1));

  return [
    {
      label: t('doesNotRepeat'),
      value: null,
    },
    {
      label: t('daily'),
      value: createDefaultRecurrenceRule(safeDate, Frequency.DAILY),
    },
    {
      label: t('weeklyOn', { day: dayName }),
      value: createDefaultRecurrenceRule(safeDate, Frequency.WEEKLY),
    },
    {
      label: t('monthlyOnDay', { day: dayOfMonth }),
      value: createDefaultRecurrenceRule(safeDate, Frequency.MONTHLY),
    },
    {
      label: t('annuallyOn', { month: monthName, day: dayOfMonth }),
      value: {
        frequency: Frequency.YEARLY,
        interval: 1,
        byMonth: [month + 1],
        byMonthDay: [dayOfMonth],
        never: true,
      },
    },
    {
      label: t('everyWeekday'),
      value: {
        frequency: Frequency.WEEKLY,
        interval: 1,
        byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] as WeekDays[],
        never: true,
      },
    },
    {
      label: t('custom'),
      value: 'custom',
    },
  ];
};

const EventForm: React.FC<IEventFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  t,
  tCommon,
  showCreateChat = false,
  showRegisterable = true,
  showPublicToggle = true,
  disableRecurrence = false,
  submitting = false,
  showRecurrenceToggle = false,
}) => {
  const [formState, setFormState] = useState<IEventFormValues>(initialValues);
  const [recurrenceDropdownOpen, setRecurrenceDropdownOpen] = useState(false);
  const [customRecurrenceModalIsOpen, setCustomRecurrenceModalIsOpen] =
    useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(
    !disableRecurrence &&
      (!!initialValues.recurrenceRule || !showRecurrenceToggle),
  );

  useEffect(() => {
    setFormState(initialValues);
    setRecurrenceEnabled(
      !disableRecurrence &&
        (!!initialValues.recurrenceRule || !showRecurrenceToggle),
    );
  }, [initialValues, disableRecurrence, showRecurrenceToggle]);

  const recurrenceOptions = useMemo(
    () => buildRecurrenceOptions(formState.startDate, t),
    [formState.startDate, t],
  );

  const handleRecurrenceSelect = (option: {
    label: string;
    value: InterfaceRecurrenceRule | 'custom' | null;
  }): void => {
    if (option.value === 'custom') {
      if (!formState.recurrenceRule) {
        setFormState((prev) => ({
          ...prev,
          recurrenceRule: createDefaultRecurrenceRule(
            prev.startDate,
            Frequency.WEEKLY,
          ),
        }));
      }
      setCustomRecurrenceModalIsOpen(true);
    } else {
      setFormState((prev) => ({
        ...prev,
        recurrenceRule: option.value as InterfaceRecurrenceRule | null,
      }));
    }
    setRecurrenceDropdownOpen(false);
  };

  const currentRecurrenceLabel = (): string => {
    if (!formState.recurrenceRule) return t('doesNotRepeat');
    const matchingOption = recurrenceOptions.find((option) => {
      if (!option.value || option.value === 'custom') return false;
      return (
        JSON.stringify(option.value) ===
        JSON.stringify(formState.recurrenceRule)
      );
    });
    return matchingOption ? matchingOption.label : t('custom');
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (
      !formState.name.trim() ||
      !formState.description.trim() ||
      !formState.location.trim()
    ) {
      return;
    }

    const startTimeParts = formState.startTime.split(':');
    const endTimeParts = formState.endTime.split(':');

    const startAtISO = formState.allDay
      ? dayjs(formState.startDate)
          .startOf('day')
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
      : dayjs(formState.startDate)
          .hour(parseInt(startTimeParts[0]))
          .minute(parseInt(startTimeParts[1]))
          .second(parseInt(startTimeParts[2]))
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    const endAtISO = formState.allDay
      ? dayjs(formState.endDate)
          .endOf('day')
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
      : dayjs(formState.endDate)
          .hour(parseInt(endTimeParts[0]))
          .minute(parseInt(endTimeParts[1]))
          .second(parseInt(endTimeParts[2]))
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    if (recurrenceEnabled && formState.recurrenceRule) {
      const validation = validateRecurrenceInput(
        formState.recurrenceRule,
        formState.startDate,
      );
      if (!validation.isValid) {
        return;
      }
    }

    const payload: IEventFormSubmitPayload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      allDay: formState.allDay,
      isPublic: formState.isPublic,
      isRegisterable: formState.isRegisterable,
      recurrenceRule:
        recurrenceEnabled && formState.recurrenceRule
          ? formState.recurrenceRule
          : null,
      createChat: formState.createChat,
      startAtISO,
      endAtISO,
      startDate: formState.startDate,
      endDate: formState.endDate,
    };

    await onSubmit(payload);
  };

  const toggleAllDay = (): void => {
    setFormState((prev) => ({
      ...prev,
      allDay: !prev.allDay,
      startTime: prev.startTime,
      endTime: prev.endTime,
    }));
  };

  const toggleRecurrence = (): void => {
    if (disableRecurrence || !showRecurrenceToggle) return;
    setRecurrenceEnabled((prev) => !prev);
    if (recurrenceEnabled) {
      setFormState((prev) => ({
        ...prev,
        recurrenceRule: null,
      }));
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <label htmlFor="eventName">{t('eventName')}</label>
        <Form.Control
          type="text"
          id="eventitle"
          placeholder={t('enterName')}
          data-testid="eventTitleInput"
          data-cy="eventTitleInput"
          autoComplete="off"
          required
          value={formState.name}
          className={styles.inputField}
          onChange={(e): void => {
            setFormState({ ...formState, name: e.target.value });
          }}
        />
        <label htmlFor="eventdescrip">{tCommon('description')}</label>
        <Form.Control
          as="textarea"
          id="eventdescrip"
          placeholder={t('enterDescrip')}
          data-testid="eventDescriptionInput"
          data-cy="eventDescriptionInput"
          autoComplete="off"
          required
          value={formState.description}
          className={styles.inputField}
          onChange={(e): void => {
            setFormState({ ...formState, description: e.target.value });
          }}
        />
        <label htmlFor="eventLocation">{tCommon('enterLocation')}</label>
        <Form.Control
          type="text"
          id="eventLocation"
          placeholder={tCommon('enterLocation')}
          data-testid="eventLocationInput"
          data-cy="eventLocationInput"
          autoComplete="off"
          required
          value={formState.location}
          className={styles.inputField}
          onChange={(e): void => {
            setFormState({ ...formState, location: e.target.value });
          }}
        />
        <div className={styles.datedivOrganizationEvents}>
          <div>
            <DatePicker
              label={tCommon('startDate')}
              className={styles.dateboxOrganizationEvents}
              value={dayjs(formState.startDate)}
              onChange={(date): void => {
                if (date) {
                  setFormState((prev) => ({
                    ...prev,
                    startDate: date.toDate(),
                    endDate:
                      prev.endDate < date.toDate()
                        ? date.toDate()
                        : prev.endDate,
                  }));
                }
              }}
            />
          </div>
          <div>
            <DatePicker
              label={tCommon('endDate')}
              className={styles.dateboxOrganizationEvents}
              value={dayjs(formState.endDate)}
              onChange={(date): void => {
                if (date) {
                  setFormState((prev) => ({
                    ...prev,
                    endDate: date.toDate(),
                  }));
                }
              }}
              minDate={dayjs(formState.startDate)}
            />
          </div>
        </div>
        {!formState.allDay && (
          <div className={styles.datediv}>
            <div className="mr-3">
              <TimePicker
                label={tCommon('startTime')}
                className={styles.dateboxOrganizationEvents}
                timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                value={timeToDayJs(formState.startTime)}
                onChange={(time): void => {
                  if (time) {
                    setFormState((prev) => ({
                      ...prev,
                      startTime: time.format('HH:mm:ss'),
                      endTime:
                        timeToDayJs(prev.endTime) < time
                          ? time.format('HH:mm:ss')
                          : prev.endTime,
                    }));
                  }
                }}
                disabled={formState.allDay}
              />
            </div>
            <div>
              <TimePicker
                label={tCommon('endTime')}
                className={styles.dateboxOrganizationEvents}
                timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                value={timeToDayJs(formState.endTime)}
                onChange={(time): void => {
                  if (time) {
                    setFormState((prev) => ({
                      ...prev,
                      endTime: time.format('HH:mm:ss'),
                    }));
                  }
                }}
                minTime={timeToDayJs(formState.startTime)}
                disabled={formState.allDay}
              />
            </div>
          </div>
        )}
        <div className={styles.checkboxdiv}>
          <div className={styles.dispflexOrganizationEvents}>
            <label htmlFor="allday">{t('allDay')}?</label>
            <Form.Switch
              className={`me-4 ${styles.switch}`}
              id="allday"
              type="checkbox"
              checked={formState.allDay}
              data-testid="alldayCheck"
              onChange={toggleAllDay}
            />
          </div>
          {showPublicToggle && (
            <div className={styles.dispflexOrganizationEvents}>
              <label htmlFor="ispublic">{t('isPublic')}?</label>
              <Form.Switch
                className={`me-4 ${styles.switch}`}
                id="ispublic"
                type="checkbox"
                checked={formState.isPublic}
                data-testid="ispublicCheck"
                onChange={(): void =>
                  setFormState((prev) => ({
                    ...prev,
                    isPublic: !prev.isPublic,
                  }))
                }
              />
            </div>
          )}
          {showRegisterable && (
            <div className={styles.dispflexOrganizationEvents}>
              <label htmlFor="registrable">{t('isRegistrable')}?</label>
              <Form.Switch
                className={`me-4 ${styles.switch}`}
                id="registrable"
                type="checkbox"
                checked={formState.isRegisterable}
                data-testid="registrableCheck"
                onChange={(): void =>
                  setFormState((prev) => ({
                    ...prev,
                    isRegisterable: !prev.isRegisterable,
                  }))
                }
              />
            </div>
          )}
        </div>
        {!disableRecurrence && (
          <div className={styles.checkboxdiv}>
            {showRecurrenceToggle && (
              <div className={styles.dispflexOrganizationEvents}>
                <label htmlFor="recurring">{t('recurring')}</label>
                <Form.Switch
                  className={`me-4 ${styles.switch}`}
                  id="recurring"
                  type="checkbox"
                  checked={recurrenceEnabled}
                  data-testid="recurringEventCheck"
                  onChange={toggleRecurrence}
                />
              </div>
            )}
            <div>
              <Dropdown
                show={recurrenceDropdownOpen}
                onToggle={setRecurrenceDropdownOpen}
              >
                <Dropdown.Toggle
                  variant="outline-secondary"
                  id="recurrence-dropdown"
                  data-testid="recurrenceDropdown"
                  className={`${styles.dropdown}`}
                  disabled={!recurrenceEnabled}
                >
                  {currentRecurrenceLabel()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {recurrenceOptions.map((option, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() =>
                        handleRecurrenceSelect({
                          ...option,
                          value: option.value as
                            | InterfaceRecurrenceRule
                            | 'custom'
                            | null,
                        })
                      }
                      data-testid={`recurrenceOption-${index}`}
                    >
                      {option.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        )}
        {showCreateChat && (
          <div className={styles.dispflex}>
            <label htmlFor="createChat">{t('createChat')}?</label>
            <Form.Switch
              className={`me-4 ${styles.switch}`}
              id="chat"
              type="checkbox"
              data-testid="createChatCheck"
              checked={formState.createChat}
              onChange={(): void =>
                setFormState((prev) => ({
                  ...prev,
                  createChat: !prev.createChat,
                }))
              }
            />
          </div>
        )}
        <div className="d-flex gap-2 mt-3">
          <Button
            type="submit"
            className={styles.addButton}
            value="createevent"
            data-testid="createEventBtn"
            disabled={submitting}
          >
            {submitLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            data-testid="eventFormCancelBtn"
          >
            {tCommon('cancel')}
          </Button>
        </div>
      </Form>

      {recurrenceEnabled && formState.recurrenceRule && (
        <CustomRecurrenceModal
          recurrenceRuleState={formState.recurrenceRule}
          setRecurrenceRuleState={(newRecurrence) => {
            setFormState((prev) => ({
              ...prev,
              recurrenceRule:
                typeof newRecurrence === 'function'
                  ? newRecurrence(
                      prev.recurrenceRule as InterfaceRecurrenceRule,
                    )
                  : newRecurrence,
            }));
          }}
          endDate={formState.endDate}
          setEndDate={(dateSetter) => {
            const nextDate =
              typeof dateSetter === 'function'
                ? dateSetter(formState.endDate)
                : dateSetter;
            setFormState((prev) => ({
              ...prev,
              endDate: nextDate ?? prev.endDate,
            }));
          }}
          customRecurrenceModalIsOpen={customRecurrenceModalIsOpen}
          hideCustomRecurrenceModal={(): void =>
            setCustomRecurrenceModalIsOpen(false)
          }
          setCustomRecurrenceModalIsOpen={setCustomRecurrenceModalIsOpen}
          t={t}
          startDate={formState.startDate}
        />
      )}
    </>
  );
};

export const formatRecurrenceForPayload = (
  recurrenceRule: InterfaceRecurrenceRule | null,
  startDate: Date,
) => {
  if (!recurrenceRule) return null;
  const { isValid, errors } = validateRecurrenceInput(
    recurrenceRule,
    startDate,
  );
  if (!isValid) {
    throw new Error(errors.join(', '));
  }
  return formatRecurrenceForApi(recurrenceRule);
};

export default EventForm;
