import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Crosshair, ExternalLink } from 'lucide-react';

// Custom SVG DivIcons matching the Glass Layer aesthetic
const createCustomPin = (bgColor: string, label: string) =>
  L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        background:${bgColor};
        color:#ffffff;
        padding:5px 10px;
        border-radius:9999px;
        font-family:'Plus Jakarta Sans',sans-serif;
        font-size:11px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 8px 20px rgba(0,0,0,0.22);
        border:2px solid #ffffff;
        transform:translate(-50%, -50%);
      ">
        <span style="width:7px;height:7px;border-radius:9999px;background:#ffffff;display:inline-block;"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

const MapBoundsRecenter: React.FC<{
  points: [number, number][];
  recenterTrigger: number;
}> = ({ points, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [55, 55], animate: true });
    }
  }, [map, points, recenterTrigger]);

  return null;
};

export interface InteractiveRouteMapProps {
  restaurantName: string;
  restaurantCoords: [number, number];
  customerName?: string;
  customerAddress: string;
  customerCoords: [number, number];
  courierName?: string;
  courierCoords?: [number, number];
  etaText: string;
  distanceKm: number;
  statusLabel: string;
  heightClass?: string;
  showNavigateButton?: boolean;
  onSimulateStep?: () => void;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  restaurantName,
  restaurantCoords,
  customerName = 'Customer',
  customerAddress,
  customerCoords,
  courierName,
  courierCoords,
  etaText,
  distanceKm,
  statusLabel,
  heightClass = 'h-[440px]',
  showNavigateButton = false,
  onSimulateStep,
}) => {
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [computedDistanceKm, setComputedDistanceKm] =
    useState<number>(distanceKm);
  const [computedEtaMin, setComputedEtaMin] = useState<string>(etaText);

  // Fetch real road geometry from OSRM public routing service with fallback to direct polyline
  useEffect(() => {
    let isMounted = true;
    const waypoints: [number, number][] = courierCoords
      ? [courierCoords, restaurantCoords, customerCoords]
      : [restaurantCoords, customerCoords];

    const coordsString = waypoints
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(';');

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] =
            data.routes[0].geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );
          setRouteGeometry(coords);
          if (typeof data.routes[0].distance === 'number') {
            const km = Number((data.routes[0].distance / 1000).toFixed(1));
            if (km > 0 && km < 100) {
              setComputedDistanceKm(km);
              const mins = Math.max(8, Math.round(km * 4.5));
              setComputedEtaMin(`${mins} min`);
            }
          }
        } else {
          setRouteGeometry(waypoints);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteGeometry(waypoints);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    restaurantCoords[0],
    restaurantCoords[1],
    customerCoords[0],
    customerCoords[1],
    courierCoords?.[0],
    courierCoords?.[1],
  ]);

  const allPoints: [number, number][] = courierCoords
    ? [restaurantCoords, customerCoords, courierCoords]
    : [restaurantCoords, customerCoords];

  const restaurantIcon = createCustomPin('#E11D48', `🏪 ${restaurantName}`);
  const customerIcon = createCustomPin('#2563EB', `📍 ${customerName}`);
  const courierIcon = createCustomPin(
    '#0F172A',
    `🛵 ${courierName || 'Courier'}`
  );

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm ${heightClass} w-full bg-[#EFF6FF]`}
    >
      {/* Top Floating Glass Card over Map */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-start justify-between gap-3">
        <div className="glass-elevated rounded-2xl px-4 py-3 pointer-events-auto max-w-xs space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>{statusLabel}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-display text-slate-900 tabular-nums">
              ETA {computedEtaMin}
            </span>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              • {computedDistanceKm} km
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            {restaurantName} → {customerAddress}
          </p>
        </div>

        {/* Floating Map Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onSimulateStep && (
            <button
              type="button"
              onClick={onSimulateStep}
              className="glass-elevated min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Move Courier</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setRecenterTrigger((c) => c + 1)}
            className="glass-elevated min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span>Recenter Location</span>
          </button>
          {showNavigateButton && (
            <a
              href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${restaurantCoords[0]}%2C${restaurantCoords[1]}%3B${customerCoords[0]}%2C${customerCoords[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-blue-600 text-white text-xs font-semibold hover:from-rose-500 hover:to-blue-500 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <span>Navigate</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Real Interactive JS Leaflet Map */}
      <MapContainer
        center={restaurantCoords}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapBoundsRecenter
          points={allPoints}
          recenterTrigger={recenterTrigger}
        />

        {routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#E11D48',
              weight: 5,
              opacity: 0.88,
              dashArray: '10, 8',
            }}
          />
        )}

        <Marker position={restaurantCoords} icon={restaurantIcon}>
          <Popup>
            <div className="text-xs font-sans">
              <strong>Pickup: {restaurantName}</strong>
            </div>
          </Popup>
        </Marker>

        <Marker position={customerCoords} icon={customerIcon}>
          <Popup>
            <div className="text-xs font-sans">
              <strong>Drop-off: {customerName}</strong>
              <br />
              {customerAddress}
            </div>
          </Popup>
        </Marker>

        {courierCoords && (
          <Marker position={courierCoords} icon={courierIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong>Active Courier: {courierName || 'Partner'}</strong>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
