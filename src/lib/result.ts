/**
 * A success carrying `value`, or a failure carrying `error`.
 * Expected failures return one of these rather than throwing, so a caller can
 * switch on `ok` and needs no try block.
 */
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }

/** Wraps a successful value in a `Result`. */
export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value }
}

/** Wraps a failure reason in a `Result`. */
export function err<E, T = never>(error: E): Result<T, E> {
  return { ok: false, error }
}
