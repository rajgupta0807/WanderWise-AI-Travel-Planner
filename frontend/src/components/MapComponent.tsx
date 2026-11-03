import React, { useEffect, useRef } from 'react';
import { Activity } from '../types/trip';
import { MapPin, Navigation, Info } from 'lucide-react';
import L from 'leaflet';

interface MapComponentProps {
  destination: string;
  activities: Activity[];
}

export const MapComponent: React.FC<MapComponentProps> = ({ destination, activities }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filter activities that have verified coordinates
  const validPins = activities.filter(
    (act) => act.latitude != null && act.longitude != null && !isNaN(act.latitude) && !isNaN(act.longitude)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths in bundler
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (validPins.length === 0) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    const markers: L.Marker[] = [];
    const latLngs: L.LatLngExpression[] = [];

    // Clear existing layers except tiles
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    validPins.forEach((act, idx) => {
      const lat = act.latitude!;
      const lng = act.longitude!;
      latLngs.push([lat, lng]);

      // Custom marker color depending on time of day
      const color = act.activity_type === 'morning' ? '#3b82f6' : (act.activity_type === 'afternoon' ? '#f59e0b' : '#8b5cf6');
      
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${idx + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">${act.title}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">${act.start_time} - ${act.end_time} &bull; ${act.currency} ${act.estimated_cost.toFixed(2)}</div>
          <div style="color: #334155; margin-bottom: 6px;">📍 ${act.location_name}</div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(act.location_name + ', ' + destination)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 11px; color: #4f46e5; font-weight: 600; text-decoration: underline;">
            Get Directions &rarr;
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
      marker.addTo(map);
      markers.push(marker);
    });

    if (latLngs.length > 1) {
      // Connect sequential activities with a dashed route line
      L.polyline(latLngs, { color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '6, 8' }).addTo(map);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 14);
    }

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, [destination, activities, validPins.length]);

  if (validPins.length === 0) {
    return (
      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 text-center text-slate-600">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
          <MapPin className="w-6 h-6 text-indigo-500" />
        </div>
        <h4 className="font-semibold text-slate-800 text-sm mb-1">Geographic Coordinates Guidance</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
          Exact coordinates for places in <strong>{destination}</strong> are shown when verified by the places provider. All scheduled locations have instant Google Maps navigation links.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          <Info className="w-3.5 h-3.5" />
          Click any location below to open directions in your preferred map app.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          Interactive Destination Route Map — {destination}
        </div>
        <span className="text-slate-400">{validPins.length} plotted location{validPins.length > 1 ? 's' : ''}</span>
      </div>
      <div ref={mapContainerRef} className="h-72 w-full z-10" />
    </div>
  );
};
