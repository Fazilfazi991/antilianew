import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AreaHighlights } from '@/components/AreaHighlights';

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

describe('AreaHighlights', () => {
  it('renders section heading', () => {
    render(
      <MemoryRouter>
        <AreaHighlights />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Prime Locations/i })).toBeTruthy();
  });

  it('renders all 4 area names', () => {
    render(
      <MemoryRouter>
        <AreaHighlights />
      </MemoryRouter>
    );
    expect(screen.getByText('The Pearl')).toBeTruthy();
    expect(screen.getByText('West Bay')).toBeTruthy();
    expect(screen.getByText('Lusail City')).toBeTruthy();
    expect(screen.getByText('Msheireb')).toBeTruthy();
  });

  it('area cards link to filtered properties page', () => {
    render(
      <MemoryRouter>
        <AreaHighlights />
      </MemoryRouter>
    );
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href')?.includes('/properties'))).toBe(true);
  });
});

