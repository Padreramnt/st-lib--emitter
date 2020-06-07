const $$handlers = Symbol('handlers')

export interface Failure<E, A extends any[], R> {
	ok: false
	handler: (...args: A) => R
	args: A,
	event: E,
	error: any
	continue(): void
}

export interface Success<E, A extends any[], R> {
	ok: true
	handler: (...args: A) => R
	args: A,
	event: E,
	result: R
	break(): void
}

export type Arguments<T> = T extends (...args: infer A) => any ? A : never
export type Return<T> = T extends (...args: any[]) => infer R ? R : never

export default class Emitter<T extends object> {
	static *emit<T extends object, K extends keyof T>(
		emitter: Emitter<T>,
		event: K,
		...args: Arguments<T[K]>
	): Generator<Success<K, Arguments<T[K]>, Return<T[K]>> | Failure<K, Arguments<T[K]>, Return<T[K]>>> {
		if (event in emitter[$$handlers]) {
			const handlers = Array.from(emitter[$$handlers][event])
			let i = 0
			let done = false
			while (!done && i < handlers.length) {
				const handler = handlers[i]
				try {
					const result = handler.apply(this, args)
					yield {
						ok: true,
						break() {
							done = true
						},
						event,
						args,
						handler,
						result,
					}
				} catch (error) {
					done = true
					yield {
						ok: false,
						continue() {
							done = false
						},
						event,
						args,
						error,
						handler,
					}
				} finally {
					i += 1
				}
			}
		}
	}
	private [$$handlers]: Record<keyof any, Set<(...args: any[]) => any>>
	constructor() {
		this[$$handlers] = Object.create(null)
	}

	on<K extends keyof T>(event: K, handler: (this: this, ...args: Arguments<T[K]>) => Return<T[K]>) {
		if (event in this[$$handlers]) {
			this[$$handlers][event].add(handler)
		} else {
			this[$$handlers][event] = new Set([handler])
		}
		return this.off.bind<this, K, (this: this, ...args: Arguments<T[K]>) => Return<T[K]>, [], boolean>(this, event, handler)
	}

	off<K extends keyof T>(event: K, handler: (this: this, ...args: Arguments<T[K]>) => Return<T[K]>) {
		if (event in this[$$handlers]) {
			return this[$$handlers][event].delete(handler)
		}
		return false
	}

	offAll<K extends keyof T>(event: K) {
		return Reflect.deleteProperty(this[$$handlers], event)
	}

	once<K extends keyof T>(event: K, handler: (this: this, ...args: Arguments<T[K]>) => Return<T[K]>) {
		const off = this.on(event, function (...args) {
			try {
				return handler.apply(this, args)
			} catch (e) {
				throw e
			} finally {
				off()
			}
		})
		return off
	}

	emit<K extends keyof T>(event: K, ...args: Arguments<T[K]>) {
		if (event in this[$$handlers]) {
			for (const handler of Array.from(this[$$handlers][event])) {
				handler.apply(this, args)
			}
		}
	}
}
