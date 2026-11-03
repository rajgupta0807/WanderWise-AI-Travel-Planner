import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../src/pages/LandingPage';
import { AuthProvider } from '../src/context/AuthContext';

describe('LandingPage Component', () => {
  it('renders brand identity and hero headline "Make room for wonder."', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Make room for/i)).toBeInTheDocument();
    expect(screen.getByText(/wonder\./i)).toBeInTheDocument();
    expect(screen.getByText(/Plan Your Next Trip Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant 1-Click Guest Demo/i)).toBeInTheDocument();
  });

  it('renders features and interactive preview sections', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Experience the Wanderwise Standard/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom Pace & Travel Style/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparent Budget Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Route Maps/i)).toBeInTheDocument();
  });
});
