"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number] | null;
  centerLocation?: [number, number] | null;
  showRadius?: number; // if provided, draws a circle
}

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14);
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPickerMap({ onLocationSelect, initialLocation, centerLocation, showRadius }: MapPickerProps) {
  // Default to Islamabad coordinates
  const defaultCenter: [number, number] = [33.6844, 73.0479];
  const [position, setPosition] = useState<[number, number] | null>(initialLocation || null);

  useEffect(() => {
    if (centerLocation) {
      setPosition(centerLocation);
      onLocationSelect(centerLocation[0], centerLocation[1]);
    }
  }, [centerLocation]);

  return (
    <MapContainer 
      center={initialLocation || defaultCenter} 
      zoom={12} 
      style={{ height: "300px", width: "100%", borderRadius: "8px", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={centerLocation || null} />
      <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      {showRadius && position && (
        <Circle center={position} radius={showRadius} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6' }} />
      )}
    </MapContainer>
  );
}
