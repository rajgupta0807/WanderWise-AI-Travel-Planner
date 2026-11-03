import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../src/pages/DashboardPage';
import { AuthProvider } from '../src/context/AuthContext';
import * as apiModule from '../src/services/api';

describe('DashboardPage Component', () => {
  it('renders dashboard with stats and empty state when no trips exist', async () => {
    vi.spyOn(apiModule.api, 'listTrips').mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      pages: 1,
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(await screen.findByText(/No Itineraries Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Trips/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Journeys/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan New Itinerary/i)).toBeInTheDocument();
  });
});
