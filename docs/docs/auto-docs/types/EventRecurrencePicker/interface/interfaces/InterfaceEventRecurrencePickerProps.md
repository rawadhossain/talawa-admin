[Admin Docs](/)

***

# Interface: InterfaceEventRecurrencePickerProps

Defined in: [src/types/EventRecurrencePicker/interface.ts:14](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L14)

Props interface for the EventRecurrencePicker component

This component provides a dropdown for selecting recurrence patterns
(Daily, Weekly, Monthly, etc.) and integrates with CustomRecurrenceModal
for advanced configuration.

## Properties

### disabled?

> `optional` **disabled**: `boolean`

Defined in: [src/types/EventRecurrencePicker/interface.ts:44](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L44)

Whether the picker is disabled

***

### endDate

> **endDate**: `Date`

Defined in: [src/types/EventRecurrencePicker/interface.ts:24](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L24)

The event end date, used by CustomRecurrenceModal

***

### onEndDateChange()?

> `optional` **onEndDateChange**: (`date`) => `void`

Defined in: [src/types/EventRecurrencePicker/interface.ts:39](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L39)

Optional callback for end date changes from CustomRecurrenceModal

#### Parameters

##### date

`Date`

#### Returns

`void`

***

### onRecurrenceChange()

> **onRecurrenceChange**: (`recurrence`) => `void`

Defined in: [src/types/EventRecurrencePicker/interface.ts:34](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L34)

Callback fired when recurrence selection changes

#### Parameters

##### recurrence

[`InterfaceRecurrenceRule`](../../../../utils/recurrenceUtils/recurrenceTypes/interfaces/InterfaceRecurrenceRule.md)

#### Returns

`void`

***

### recurrence

> **recurrence**: [`InterfaceRecurrenceRule`](../../../../utils/recurrenceUtils/recurrenceTypes/interfaces/InterfaceRecurrenceRule.md)

Defined in: [src/types/EventRecurrencePicker/interface.ts:29](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L29)

Current recurrence rule state. Null means "Does not repeat"

***

### startDate

> **startDate**: `Date`

Defined in: [src/types/EventRecurrencePicker/interface.ts:19](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventRecurrencePicker/interface.ts#L19)

The event start date, used to generate context-aware labels
(e.g., "Weekly on Monday", "Monthly on day 15")
