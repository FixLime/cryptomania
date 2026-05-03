import { depositMonitor } from './depositMonitor.js';
import { withdrawalProcessor } from './withdrawalProcessor.js';

console.log('[workers] starting');

const POLL_INTERVAL_MS = 30_000;

async function loop(name: string, fn: () => Promise<void>) {
  while (true) {
    try {
      await fn();
    } catch (e) {
      console.error(`[${name}]`, e);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

loop('depositMonitor', depositMonitor);
loop('withdrawalProcessor', withdrawalProcessor);
