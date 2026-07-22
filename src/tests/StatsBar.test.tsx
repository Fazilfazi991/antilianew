import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBar } from '@/components/StatsBar';

declare global {
  interface Window {
    IntersectionObserver: any;
  }
}

beforeAll(() => {
  window.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
});

describe('StatsBar', () => {
  it('renders all four stat labels', () => {
    render(<StatsBar />);
    expect(screen.getByText('Properties Listed')).toBeTruthy();
    expect(screen.getByText('Prime Market')).toBeTruthy();
    expect(screen.getByText('Years of Excellence')).toBeTruthy();
    expect(screen.getByText('Client Satisfaction')).toBeTruthy();
  });

  it('renders all four stat numbers', () => {
    render(<StatsBar />);
    expect(screen.getByText('500+')).toBeTruthy();
    expect(screen.getByText('Qatar')).toBeTruthy();
    expect(screen.getByText('15+')).toBeTruthy();
    expect(screen.getByText('98%')).toBeTruthy();
  });
});
