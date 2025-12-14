/**
 * Interface definitions for the EventRecurrencePicker shared component
 */

import type { InterfaceRecurrenceRule } from 'utils/recurrenceUtils/recurrenceTypes';

/**
 * Props interface for the EventRecurrencePicker component
 *
 * This component provides a dropdown for selecting recurrence patterns
 * (Daily, Weekly, Monthly, etc.) and integrates with CustomRecurrenceModal
 * for advanced configuration.
 */
export interface InterfaceEventRecurrencePickerProps {
  /**
   * The event start date, used to generate context-aware labels
   * (e.g., "Weekly on Monday", "Monthly on day 15")
   */
  startDate: Date;

  /**
   * The event end date, used by CustomRecurrenceModal
   */
  endDate: Date | null;

  /**
   * Current recurrence rule state. Null means "Does not repeat"
   */
  recurrence: InterfaceRecurrenceRule | null;

  /**
   * Callback fired when recurrence selection changes
   */
  onRecurrenceChange: (recurrence: InterfaceRecurrenceRule | null) => void;

  /**
   * Optional callback for end date changes from CustomRecurrenceModal
   */
  onEndDateChange?: (date: Date | null) => void;

  /**
   * Whether the picker is disabled
   */
  disabled?: boolean;
}
