// Generic helper to simulate a network request
export function simulateRequest<T>(
  data: T,
  delay = 700,
  shouldFail = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Fake network error"));
      } else {
        resolve(data);
      }
    }, delay);
  });
}