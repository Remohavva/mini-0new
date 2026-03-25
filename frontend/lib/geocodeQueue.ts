// Serial queue for Nominatim — max 1 request/sec to respect rate limits
type Task = () => Promise<void>;

const queue: Task[] = [];
let running = false;

async function runQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
    await new Promise((r) => setTimeout(r, 1100)); // 1.1s between requests
  }
  running = false;
}

export function enqueueGeocode<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try { resolve(await fn()); }
      catch (e) { reject(e); }
    });
    runQueue();
  });
}
