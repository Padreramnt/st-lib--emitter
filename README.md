# Typed event emitter

```ts
import Emitter from '@st-lib/emitter'

const symbolEventName = Symbol('symbolEventName')

// use interface or record to describe event map
interface EventMap {
	[0](): void
	singleArgEvent(arg: number): void
	multipleArgEvent(arg1: number, arg2: string, arg3: object, ...restArgsAllowed: (symbol | null | undefined)[]): void
	optionalArgs(arg1?: string, arg2?: number): void
	[symbolEventName](...rest: any[]): any
	eventWithReturnedValue(returnValue: number): number
}

// pass event map to Emitter
const emitter = new Emitter<EventMap>()
```

## Emitter#on

Adds an event handler.

```ts
emitter.on(0, () => {
	console.log('numberEventName')
})

emitter.on('singleArgEvent', (arg /*: number*/) => {
	console.log('singleArgEvent', arg)
})

emitter.on('multipleArgEvent', (arg1 /*: number*/, arg2 /*: string*/, arg3 /*: object*/, ...rest /*: (symbol | null | undefined)[] */) => {
	console.log('multileArgEvent', arg1, arg2, arg3, rest)
})

emitter.on(symbolEventName, (...args: /*: any[]*/) => {
	console.log(symbolEventName, args)
})
```

## Emitter#off

Deletes an event handler.

```ts
function handler {
	console.log('will not fire =(')
}

emitter.on(0, handler)
emitter.off(0, hander)
```

Use Emitter#on return value to remove added anonymous handler.

```ts
const off = emitter.on(0, () => {
	console.log('will not fire =(')
})

off()
```

## Emitter#once

Uses a handler only once.

> Deletes the used event handler anyway.

```ts
emitter.once(0, () => {
	console.log('fire one time')
})

emitter.emit(0) // console.log('fire one time')
emitter.emit(0) // no console log

emitter.once(0, () => {
	console.log('will throw error')
	throw new Error('some message')
})

try {
	emitter.emit(0) // console.log('will throw error')
} catch (e) {
	console.error(e) // Error('some message')
}

// will be fine =3
emitter.emit(0) // no console log
```


## Emitter#emit

Emit the specified event with arguments.

```ts
emitter.emit(0) // without args
emitter.emit('singleArgEvent', 0) // all args are required
emitter.emit('multipleArgEvent', 0, '1', { 2: 2 }, Symbol(3), null, void 0) // required & rest args

 // optional args can be omitted
emitter.emit('optionalArgs')
emitter.emit('optionalArgs', 'str')
emitter.emit('optionalArgs', 'str', 0)

// pass any number of res argumets
emitter.emit(symbolEventName, 'a', 'r', 'g', 'u', 'm', 'e', 'n', 't', 's')
```

## Emitter.emit

Static helper method for manual control emit process.

```ts
// add some handlers
emitter.on('eventWithReturnedValue', it => {
	console.log('handler 1')
	return it
})
emitter.on('eventWithReturnedValue', it => {
	console.log('handler 2')
	return it
})
emitter.on('eventWithReturnedValue', () => {
	throw new Error('handler 3 error')
})
emitter.on('eventWithReturnedValue', it => {
	console.log('handler 4')
	return it
})
emitter.on('eventWithReturnedValue', it => {
	console.log('handler 5')
	return it
})

// default behavior
try {
	emitter.emit('eventWithReturnedValue', 0)
	// handler 1
	// handler 2
} catch (e) {
	console.error(e) // Error('handler 3 error')
}
// event loop stopped

// manual control
for (const it of Emitter.emit(emitter, 'eventWithReturnedValue', 4)) {
	if (it.ok) {
		if (4 <= it.result) {
			// call it.break to stop
			it.break() // handler 5 will not be emitted
		}
		// otherwise continue
	} else {
		console.error(it.error) // Error('handler 3 error')
		it.continue() // continue emitting
		// otherwise break
	}
}
```

### Success emit result

```ts
export interface Success<E, A extends any[], R> {
	ok: true // used to separate declarations
	handler: (...args: A) => R // current handler
	args: A, // event arguments
	event: E, // current event
	result: R // returned result
	break(): void // stop event loop
}
```


### Failure emit result

```ts
export interface Failure<E, A extends any[], R> {
	ok: true // used to separate declarations
	handler: (...args: A) => R // current handler
	args: A, // event arguments
	event: E, // current event
	error: any // throwed error
	continue(): void // continue event loop
}
```
