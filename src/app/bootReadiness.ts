let resolveVisualReady: (() => void) | null = null;
let visualReady = false;

const visualReadyPromise = new Promise<void>((resolve) => {
  resolveVisualReady = resolve;
});

export function markAppShellVisualReady() {
  if (visualReady) return;
  visualReady = true;
  resolveVisualReady?.();
  resolveVisualReady = null;
}

export function waitForAppShellVisualReady() {
  return visualReady ? Promise.resolve() : visualReadyPromise;
}
