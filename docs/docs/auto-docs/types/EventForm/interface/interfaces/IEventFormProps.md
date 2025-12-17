[Admin Docs](/)

***

# Interface: IEventFormProps

Defined in: [src/types/EventForm/interface.ts:33](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L33)

## Properties

### disableRecurrence?

> `optional` **disableRecurrence**: `boolean`

Defined in: [src/types/EventForm/interface.ts:43](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L43)

***

### initialValues

> **initialValues**: [`IEventFormValues`](IEventFormValues.md)

Defined in: [src/types/EventForm/interface.ts:34](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L34)

***

### onCancel()

> **onCancel**: () => `void`

Defined in: [src/types/EventForm/interface.ts:36](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L36)

#### Returns

`void`

***

### onSubmit()

> **onSubmit**: (`payload`) => `void` \| `Promise`\<`void`\>

Defined in: [src/types/EventForm/interface.ts:35](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L35)

#### Parameters

##### payload

[`IEventFormSubmitPayload`](IEventFormSubmitPayload.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### showCreateChat?

> `optional` **showCreateChat**: `boolean`

Defined in: [src/types/EventForm/interface.ts:40](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L40)

***

### showPublicToggle?

> `optional` **showPublicToggle**: `boolean`

Defined in: [src/types/EventForm/interface.ts:42](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L42)

***

### showRecurrenceToggle?

> `optional` **showRecurrenceToggle**: `boolean`

Defined in: [src/types/EventForm/interface.ts:45](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L45)

***

### showRegisterable?

> `optional` **showRegisterable**: `boolean`

Defined in: [src/types/EventForm/interface.ts:41](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L41)

***

### submitLabel

> **submitLabel**: `string`

Defined in: [src/types/EventForm/interface.ts:37](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L37)

***

### submitting?

> `optional` **submitting**: `boolean`

Defined in: [src/types/EventForm/interface.ts:44](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L44)

***

### t()

> **t**: (`key`, `options?`) => `string`

Defined in: [src/types/EventForm/interface.ts:38](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L38)

#### Parameters

##### key

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`string`

***

### tCommon()

> **tCommon**: (`key`, `options?`) => `string`

Defined in: [src/types/EventForm/interface.ts:39](https://github.com/PalisadoesFoundation/talawa-admin/blob/main/src/types/EventForm/interface.ts#L39)

#### Parameters

##### key

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`string`
