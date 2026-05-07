import { vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 16),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: (id: number) => window.clearTimeout(id),
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:test'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

const localStorageStore = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    clear: vi.fn(() => localStorageStore.clear()),
    getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
    removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore.set(key, value);
    }),
  },
});

Object.defineProperty(globalThis, 'localStorage', {
  writable: true,
  value: window.localStorage,
});
