import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ListCTABand } from '@/components/ListCTABand';


describe('ListCTABand', () => {
  it('renders heading', () => {
    render(<MemoryRouter><ListCTABand /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /List Your Property With Us/i })).toBeTruthy();
  });

  it('renders Create Account and Sign In links', () => {
    render(<MemoryRouter><ListCTABand /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Create Account/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Sign In/i })).toBeTruthy();
  });

  it('both links point to portal', () => {
    render(<MemoryRouter><ListCTABand /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.every(l => l.getAttribute('href') === '/portal/login')).toBe(true);
  });
});
