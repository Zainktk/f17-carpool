"use client";

import dynamic from 'next/dynamic';
import { MapPickerProps } from './MapPickerMap';

// Dynamically import the map to avoid SSR "window is not defined" errors
const DynamicMap = dynamic(() => import('./MapPickerMap'), { 
  ssr: false, 
  loading: () => <div style={{ height: 300, background: "var(--surface)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading interactive map...</div> 
});

export default function MapPicker(props: MapPickerProps) {
  return <DynamicMap {...props} />;
}
