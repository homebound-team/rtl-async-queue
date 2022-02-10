let waitQueue: Promise<any>[] = [];
let waitWrapperInPlace = false;
let unexpectedAsync: Error | undefined = undefined;

export type AllowAsyncOpts = { allowAsync?: boolean };

// Guess about whether we're running in tests or production
const inTests = "beforeEach" in global;

/** A utility class for putting a promise that is explicitly resolved into the async queue. */
export class Deferred {
  resolve: () => void;
  promise: Promise<unknown>;
  constructor() {
    this.promise = new Promise((resolve) => (this.resolve = () => resolve(undefined)));
  }
}

/**
 * Adds a promise (i.e. a GraphQL request) to the queue of "this will probably affect rendering,
 * so block the test until after this finishes".
 */
export function addToAsyncQueue(description: string, promise: Promise<any>): void {
  if (!waitWrapperInPlace && inTests) {
    // Oddly, we don't actually throw here, b/c this is likely triggered from a callback
    // that, if we did throw an exception, would go to just `console.error`, instead of
    // blowing up the user's `click(element)` line.
    // So we stash this error for the `click` to throw later.
    unexpectedAsync = new Error(
      `Async behavior '${description}' was triggered, either use '...AndWait' or pass allowAsync`,
    );
  }
  waitQueue.push(promise);
  promise.then(() => {
    // Proactively clear the queue, in case this is production and tests aren't calling `drainAsyncQueue` regularly.
    waitQueue = waitQueue.filter((p) => p !== promise);
  });
}

/** Returns whether we have pending async operations. */
export function isAsyncQueueEmpty(): boolean {
  return waitQueue.length === 0;
}

export function drainAsyncQueue(): Promise<any>[] {
  const copy = [...waitQueue];
  waitQueue = [];
  unexpectedAsync = undefined;
  return copy;
}

/**
 * Invokes `fn` and allows it to cause async operations to occur, which if we're testing
 * will explicitly `wait`-ed for later.
 *
 * This allows observing in-flight loading/waiting states.
 */
export function allowAsyncBehavior<T>(fn: () => Promise<T>): Promise<T>;
export function allowAsyncBehavior<T>(fn: () => T): T;
export function allowAsyncBehavior<T>(fn: () => T | Promise<T>): T | Promise<T> {
  waitWrapperInPlace = true;
  let isPromise = false;
  try {
    const result = fn();
    if (!!result && typeof result === "object" && "then" in result) {
      isPromise = true;
      (result as any).then(() => {
        waitWrapperInPlace = false;
      });
    }
    return result;
  } finally {
    // Keep this open until the promise resolves
    if (!isPromise) {
      waitWrapperInPlace = false;
    }
  }
}

export function checkUnexpectedAsync(opts: AllowAsyncOpts = {}): void {
  if (unexpectedAsync) {
    // Allow the test to observe in-flight async behavior if they want to
    if (opts?.allowAsync === true) {
      unexpectedAsync = undefined;
    } else {
      throw unexpectedAsync;
    }
  }
}
