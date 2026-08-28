/** Converts one IndexedDB request into the promise-based result flow used by the repository. */
export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

/** Resolves only after every write in an IndexedDB transaction commits successfully. */
export function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new DOMException("IndexedDB transaction aborted.", "AbortError"));
    transaction.onerror = () => {
      // onabort owns rejection so the transaction's final error is retained.
    };
  });
}
