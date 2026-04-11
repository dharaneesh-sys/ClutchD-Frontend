"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTrackingStore } from "../../store/trackingStore";
import { useThemeStore } from "../../store/themeStore";

// Fix for default Leaflet icon in Next.js
const customMarkerIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapView() {
  const { userLocation, mechanicLocation, navigationTarget, nearbyMechanics, nearbyGarages, fetchNearbyProviders } = useTrackingStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      fetchNearbyProviders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNearbyProviders]);

  const [routePath, setRoutePath] = useState(null);

  useEffect(() => {
    if (navigationTarget && userLocation) {
      const getRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${navigationTarget.lng},${navigationTarget.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRoutePath(coords);
          }
        } catch (err) {
          console.error("Failed to fetch route:", err);
        }
      };
      getRoute();
    } else {
      setRoutePath(null);
    }
  }, [navigationTarget, userLocation]);

  if (!mounted) {
    return <div className={`w-full h-full rounded-2xl animate-pulse ${isLight ? "bg-stone-100" : "bg-[#0a2a1a]"}`} />;
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
      <MapContainer 
        center={userLocation} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        <MapUpdater center={userLocation} />

        {/* User Location */}
        <Marker position={userLocation} icon={customMarkerIcon("blue")}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Tracking Mechanic (if assigned) */}
        {mechanicLocation && (
          <Marker position={mechanicLocation} icon={customMarkerIcon("red")}>
            <Popup>
              <div className="font-semibold text-white">Mechanic En Route</div>
            </Popup>
          </Marker>
        )}

        {/* Navigation Info */}
        {routePath && (
          <Polyline positions={routePath} color="#10b981" weight={5} opacity={0.7} />
        )}
        {navigationTarget && (
          <Marker position={[navigationTarget.lat, navigationTarget.lng]} icon={customMarkerIcon("orange")}>
            <Popup>
              <div className="font-semibold text-amber-900">Customer Location</div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Mechanics (if no active request) */}
        {!mechanicLocation && nearbyMechanics.map(mechanic => (
          <Marker 
            key={mechanic.id} 
            position={mechanic.location}
            icon={customMarkerIcon("green")}
          >
            <Popup>
              <div className="font-semibold">{mechanic.name}</div>
              <div className="text-xs opacity-80 text-amber-400">⭐ {mechanic.rating}</div>
              <div className="text-xs opacity-70 mt-1">Mechanic</div>
            </Popup>
          </Marker>
        ))}

        {/* Nearby Garages (if no active request) */}
        {!mechanicLocation && nearbyGarages.map(garage => (
          <Marker 
            key={garage.id} 
            position={garage.location}
            icon={customMarkerIcon("violet")}
          >
            <Popup>
              <div className="font-semibold">{garage.name}</div>
              <div className="text-xs opacity-80 text-amber-400">⭐ {garage.rating}</div>
              <div className="text-xs opacity-70 mt-1">Garage</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay map controls here later if needed */}
    </div>
  );
}
