/**
 * Mock data for EventRecurrencePicker component tests
 */

import { Frequency, WeekDays } from 'utils/recurrenceUtils';
import type { InterfaceRecurrenceRule } from 'utils/recurrenceUtils';

/**
 * Mock start date for testing (Monday, January 15, 2024)
 */
export const mockStartDate = new Date(2024, 0, 15);

/**
 * Mock end date for testing
 */
export const mockEndDate = new Date(2024, 0, 31);

/**
 * Mock weekly recurrence rule
 */
export const mockWeeklyRecurrence: InterfaceRecurrenceRule = {
  frequency: Frequency.WEEKLY,
  interval: 1,
  byDay: [WeekDays.MO],
  never: true,
};
