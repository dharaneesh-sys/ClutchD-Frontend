"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  Tooltip,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useTrackingStore } from "@/store/trackingStore";
import {
  createUserLocationIcon,
  createMechanicIcon,
  createNearbyMechanicIcon,
  createGarageIcon,
  createTargetIcon,
} from "@/lib/mapMarkers";

import L from "leaflet";

// Fix default marker icon paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Map updater — recenters when userLocation changes ─────────────────────
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// ─── Map Controls overlay (zoom + my-location, grouped in one container) ─────
function MapControls() {
  const map = useMap();
  const { requestGPSLocation, gpsStatus } = useTrackingStore();

  const handleZoomIn = () => map.setZoom(map.getZoom() + 1);
  const handleZoomOut = () => map.setZoom(Math.max(1, map.getZoom() - 1));
  const handleMyLocation = () => requestGPSLocation();

  const isRequesting = gpsStatus === "requesting";
  const isGranted = gpsStatus === "granted";
  const isDenied = gpsStatus === "denied";

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar" style={{ border: "none" }}>
        <div className="zoom-controls">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="zoom-control-btn"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="zoom-control-divider" />
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="zoom-control-btn"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="zoom-control-divider" />
          {/* My Location */}
          <button
            onClick={handleMyLocation}
            disabled={isRequesting}
            className="my-location-btn"
            style={{ borderRadius: 0, border: "none" }}
            aria-label="My Location"
            title={isDenied ? "Location access denied — check browser permissions" : "Show my location"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              {isGranted && (<><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>)}
            </svg>
            {isRequesting && <span className="my-location-spinner" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map legend ─────────────────────────────────────────────────────────────
function MapLegend() {
  return (
    <div className="leaflet-bottom leaflet-left">
      <div className="leaflet-control leaflet-bar" style={{ border: "none" }}>
        <div className="map-legend">
          <span className="map-legend-title">Legend</span>
          <div className="map-legend-items">
            <span className="map-legend-item">
              <span className="legend-dot legend-dot-blue" />
              You
            </span>
            <span className="map-legend-item">
              <span className="legend-dot legend-dot-red" />
              En Route
            </span>
            <span className="map-legend-item">
              <span className="legend-dot legend-dot-green" />
              Mechanic
            </span>
            <span className="map-legend-item">
              <span className="legend-dot legend-dot-violet" />
              Garage
            </span>
            <span className="map-legend-item">
              <span className="legend-dot legend-dot-orange" />
              Target
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Glass-lux popup content builder ────────────────────────────────────────
function MechanicPopupContent({ name, rating, subtitle }) {
  return (
    <div className="map-popup-glass">
      <div className="map-popup-name">{name}</div>
      {rating != null && (
        <div className="map-popup-rating">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{rating}</span>
        </div>
      )}
      {subtitle && <div className="map-popup-subtitle">{subtitle}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main MapView
// ═══════════════════════════════════════════════════════════════════════════

export default function MapView({ role = "customer" }) {
  const {
    userLocation,
    mechanicLocation,
    navigationTarget,
    nearbyMechanics,
    nearbyGarages,
    fetchNearbyProviders,
    requestGPSLocation,
  } = useTrackingStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      requestGPSLocation();
      fetchNearbyProviders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNearbyProviders, requestGPSLocation]);

  const [routePath, setRoutePath] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);

  useEffect(() => {
    if (navigationTarget && userLocation) {
      const getRoute = async () => {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${navigationTarget.lng},${navigationTarget.lat}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((coord) => [
              coord[1],
              coord[0],
            ]);
            setRoutePath(coords);
            setRouteDistance(data.routes[0].distance / 1000);
          }
        } catch (err) {
          console.error("Failed to fetch route:", err);
        }
      };
      getRoute();
    } else {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setRoutePath(null);
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setRouteDistance(null);
    }
  }, [navigationTarget, userLocation]);

  if (!mounted) {
    return (
      <div className="w-full h-full rounded-2xl animate-pulse bg-surface-container-low" />
    );
  }

  const userIcon = createUserLocationIcon();
  const mechanicIcon = createMechanicIcon();
  const nearbyMechanicIcon = createNearbyMechanicIcon();
  const garageIcon = createGarageIcon();
  const targetIcon = createTargetIcon();

  const showNavigation = ["customer", "mechanic"].includes(role);

  // Invisible icon to carry the route distance tooltip at the polyline midpoint
  const distanceLabelIcon = L.divIcon({
    className: "",
    html: '<div class="route-distance-dot" />',
    iconSize: [1, 1],
    iconAnchor: [6, 6],
  });

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: (e) => console.warn("Tile failed:", e.tile?.src),
          }}
        />

        <MapUpdater center={userLocation} />

        {/* ── User Location ──────────────────────────────────────────── */}
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div className="map-popup-glass">
              <div className="map-popup-name">You are here</div>
              <div className="map-popup-subtitle">Current location</div>
            </div>
          </Popup>
        </Marker>

        {/* ── Tracking Mechanic (assigned & en-route) ────────────────── */}
        {mechanicLocation && (
          <Marker position={mechanicLocation} icon={mechanicIcon}>
            <Popup>
              <MechanicPopupContent
                name="Mechanic En Route"
                subtitle="Your assigned mechanic is on the way"
              />
            </Popup>
          </Marker>
        )}

        {/* ── Navigation route (customer & mechanic only) ────────────── */}
        {showNavigation && routePath && (
          <>
            <Polyline
              positions={routePath}
              color="#10b981"
              weight={5}
              opacity={0.7}
              eventHandlers={{
                click: () => {
                  /* polyline click placeholder for future route details */
                },
              }}
            >
              <Tooltip sticky>
                <span className="text-xs font-semibold">
                  {routeDistance < 1
                    ? `${Math.round(routeDistance * 1000)} m`
                    : `${routeDistance.toFixed(1)} km`}
                </span>
              </Tooltip>
            </Polyline>

            {/* Midpoint distance label */}
            {routePath.length > 0 && routeDistance != null && (
              <Marker
                position={routePath[Math.floor(routePath.length / 2)]}
                icon={distanceLabelIcon}
                interactive={false}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent>
                  <div className="route-distance-label">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                    <span>
                      {routeDistance < 1
                        ? `${Math.round(routeDistance * 1000)} m`
                        : `${routeDistance.toFixed(1)} km`}
                    </span>
                  </div>
                </Tooltip>
              </Marker>
            )}
          </>
        )}

        {/* ── Navigation Target (customer location) ──────────────────── */}
        {showNavigation && navigationTarget && (
          <Marker
            position={[navigationTarget.lat, navigationTarget.lng]}
            icon={targetIcon}
          >
            <Popup>
              <div className="map-popup-glass">
                <div className="map-popup-name">Customer Location</div>
                <div className="map-popup-subtitle">Drop-off point</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── Clustered Nearby Providers ──────────────────────────────── */}
        {!mechanicLocation && (
          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            maxClusterRadius={60}
          >
            {nearbyMechanics
              .filter((m) => m.location)
              .map((mechanic) => (
                <Marker
                  key={mechanic.id}
                  position={mechanic.location}
                  icon={nearbyMechanicIcon}
                >
                  <Popup>
                    <MechanicPopupContent
                      name={mechanic.name}
                      rating={mechanic.rating}
                      subtitle="Mechanic"
                    />
                  </Popup>
                </Marker>
              ))}

            {nearbyGarages
              .filter((g) => g.location)
              .map((garage) => (
                <Marker
                  key={garage.id}
                  position={garage.location}
                  icon={garageIcon}
                >
                  <Popup>
                    <MechanicPopupContent
                      name={garage.name}
                      rating={garage.rating}
                      subtitle="Garage"
                    />
                  </Popup>
                </Marker>
              ))}
          </MarkerClusterGroup>
        )}

        {/* ── Overlay controls (zoom + my-location) ────────────────────── */}
        <MapControls />
        <MapLegend />
      </MapContainer>
    </div>
  );
}
