import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TripWizardPage } from '../src/pages/TripWizardPage';

describe('TripWizardPage Component', () => {
  it('renders Step 1 initially and displays destination and dates inputs', () => {
    render(
      <BrowserRouter>
        <TripWizardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Where and when are you traveling\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Paris, Tokyo/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue/i)).toBeInTheDocument();
  });

  it('validates destination before proceeding to next step', () => {
    render(
      <BrowserRouter>
        <TripWizardPage />
      </BrowserRouter>
    );

    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Please enter a destination city/i)).toBeInTheDocument();
  });

  it('advances to Step 2 when destination is provided', () => {
    render(
      <BrowserRouter>
        <TripWizardPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/e\.g\. Paris, Tokyo/i);
    fireEvent.change(input, { target: { value: 'Barcelona' } });

    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Travelers & Financial Plan/i)).toBeInTheDocument();
    expect(screen.getByText('Total Target Budget *')).toBeInTheDocument();
  });
});
