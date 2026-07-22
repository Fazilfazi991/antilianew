import '@testing-library/jest-dom';

// Mock IntersectionObserver (used by framer-motion whileInView)
class MockIntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
