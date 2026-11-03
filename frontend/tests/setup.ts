import '@testing-library/jest-dom';

// Mock Leaflet for jsdom environment
vi.mock('leaflet', () => {
  return {
    default: {
      map: vi.fn(() => ({
        setView: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        eachLayer: vi.fn(),
        removeLayer: vi.fn(),
        fitBounds: vi.fn(),
        remove: vi.fn(),
      })),
      tileLayer: vi.fn(() => ({
        addTo: vi.fn(),
      })),
      marker: vi.fn(() => ({
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
      })),
      polyline: vi.fn(() => ({
        addTo: vi.fn(),
      })),
      divIcon: vi.fn(),
      latLngBounds: vi.fn(() => ({
        isValid: vi.fn().mockReturnValue(true),
      })),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn(),
        },
      },
    },
  };
});
