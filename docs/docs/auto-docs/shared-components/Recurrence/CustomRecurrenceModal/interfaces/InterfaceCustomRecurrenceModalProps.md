[Admin Docs](/)

***

# Interface: InterfaceCustomRecurrenceModalProps

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:28](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L28)

Props interface for the CustomRecurrenceModal component

## Properties

### customRecurrenceModalIsOpen

> **customRecurrenceModalIsOpen**: `boolean`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:40](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L40)

Whether the custom recurrence modal is open

***

### endDate

> **endDate**: `Date`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:36](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L36)

Event end date

***

### hideCustomRecurrenceModal()

> **hideCustomRecurrenceModal**: () => `void`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:42](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L42)

Function to hide the custom recurrence modal

#### Returns

`void`

***

### recurrenceRuleState

> **recurrenceRuleState**: [`InterfaceRecurrenceRule`](../../../../utils/recurrenceUtils/recurrenceTypes/interfaces/InterfaceRecurrenceRule.md)

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:30](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L30)

Current recurrence rule state

***

### setCustomRecurrenceModalIsOpen()

> **setCustomRecurrenceModalIsOpen**: (`state`) => `void`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:44](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L44)

Function to set custom recurrence modal open state

#### Parameters

##### state

`SetStateAction`\<`boolean`\>

#### Returns

`void`

***

### setEndDate()

> **setEndDate**: (`state`) => `void`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:38](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L38)

Function to set event end date

#### Parameters

##### state

`SetStateAction`\<`Date`\>

#### Returns

`void`

***

### setRecurrenceRuleState()

> **setRecurrenceRuleState**: (`state`) => `void`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:32](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L32)

Function to update recurrence rule state

#### Parameters

##### state

`SetStateAction`\<[`InterfaceRecurrenceRule`](../../../../utils/recurrenceUtils/recurrenceTypes/interfaces/InterfaceRecurrenceRule.md)\>

#### Returns

`void`

***

### startDate

> **startDate**: `Date`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:50](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L50)

Event start date

***

### t()

> **t**: (`key`) => `string`

Defined in: [src/shared-components/Recurrence/CustomRecurrenceModal.tsx:48](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/shared-components/Recurrence/CustomRecurrenceModal.tsx#L48)

Translation function

#### Parameters

##### key

`string`

#### Returns

`string`
