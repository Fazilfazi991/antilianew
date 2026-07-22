import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhyAntilia } from '@/components/WhyAntilia';


describe('WhyAntilia', () => {
  it('renders section heading', () => {
    render(<WhyAntilia />);
    expect(screen.getByRole('heading', { name: /The Antilia Standard/i })).toBeTruthy();
  });

  it('renders all 3 feature titles', () => {
    render(<WhyAntilia />);
    expect(screen.getByText('Curated Excellence')).toBeTruthy();
    expect(screen.getByText('Expert Guidance')).toBeTruthy();
    expect(screen.getByText('Total Service')).toBeTruthy();
  });
});
