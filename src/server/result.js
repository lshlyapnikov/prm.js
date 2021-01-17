// @flow strict
type Success<A> = {| success: true, value: A |}
type Failure = {| success: false, error: Error |}
export type Result<A> = Failure | Success<A>

export function success<A>(value: A): Success<A> {
  return { success: true, value }
}

export function failure(error: Error | string): Failure {
  if (typeof error == "string") {
    return { success: false, error: new Error(error) }
  } else {
    return { success: false, error }
  }
}

export function resultFromTryCatch<A>(fn: () => A): Result<A> {
  try {
    const a: A = fn()
    return success(a)
  } catch (error) {
    return failure(error)
  }
}

export function flatMapResult<A, B>(f: (A) => Result<B>, fa: Result<A>): Result<B> {
  if (fa.success) {
    return f(fa.value)
  } else {
    return failure(fa.error)
  }
}

export function mapResult<A, B>(f: (A) => B, fa: Result<A>): Result<B> {
  return flatMapResult((a: A) => resultFromTryCatch(() => f(a)), fa)
}

export function applyResult<A, B, C>(f: (A, B) => C, fa: Result<A>, fb: Result<B>): Result<C> {
  if (fa.success) {
    if (fb.success) {
      return resultFromTryCatch(() => f(fa.value, fb.value))
    } else {
      return failure(fb.error)
    }
  } else {
    return failure(fa.error)
  }
}

export function resultToPromise<A>(f: () => Result<A>): Promise<A> {
  return resultToPromiseWithDelay(f, 0)
}

export function resultToPromiseWithDelay<A>(f: () => Result<A>, delayMillis: number): Promise<A> {
  return new Promise((resolve: (A) => void, reject: (Error) => void) => {
    const callback: () => void = () => {
      const fa: Result<A> = f()
      if (fa.success) {
        resolve(fa.value)
      } else {
        reject(fa.error)
      }
    }
    setTimeout(callback, delayMillis)
  })
}
