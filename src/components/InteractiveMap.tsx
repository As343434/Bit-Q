import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Crosshair,
  ExternalLink,
  MapPin,
  Bike,
} from 'lucide-react';
import {
  buildSmoothUrbanRoute,
  calculateDistanceKm,
  fetchOsrmDrivingRoute,
  getCheckpointStreetName,
  reverseGeocodeCoords,
} from '../services/locationApi';

const TILE_PROVIDERS = [
  {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
];

// Custom HTML DivIcons for Pickup, Drop-off, and Live Courier
const createCustomPin = (bgColor: string, label: string, isCourier = false) =>
  L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        background:${bgColor};
        color:#ffffff;
        padding:6px 12px;
        border-radius:9999px;
        font-family:'Plus Jakarta Sans',sans-serif;
        font-size:11px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 10px 25px rgba(15,23,42,0.28);
        border:2px solid #ffffff;
        transform:translate(-50%, -50%);
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:9999px;
          background:${isCourier ? '#34D399' : '#ffffff'};
          display:inline-block;
        "></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

// Keeps Leaflet viewport sized accurately inside animated modals/tabs and fits bounds cleanly
const MapResizeAndBoundsController: React.FC<{
  boundsPoints: [number, number][];
  endpointKey: string;
  recenterTrigger: number;
}> = ({ boundsPoints, endpointKey, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        // Ignore if unmounted
      }
    };

    invalidate();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 350);
    const t3 = setTimeout(invalidate, 750);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer?.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (boundsPoints.length === 0) return;
    if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [72, 72], animate: true });
    }
  }, [map, endpointKey, recenterTrigger]);

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
  heightClass = 'h-[460px]',
  showNavigateButton = false,
}) => {
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [providerIndex, setProviderIndex] = useState(0);
  const tilesLoadedRef = useRef(0);
  const tileErrorCountRef = useRef(0);

  const fallbackRoute = useMemo(() => {
    const waypoints: [number, number][] = courierCoords
      ? [courierCoords, restaurantCoords, customerCoords]
      : [restaurantCoords, customerCoords];
    return buildSmoothUrbanRoute(waypoints, 28);
  }, [
    restaurantCoords[0],
    restaurantCoords[1],
    customerCoords[0],
    customerCoords[1],
    courierCoords?.[0],
    courierCoords?.[1],
  ]);

  const [routeGeometry, setRouteGeometry] =
    useState<[number, number][]>(fallbackRoute);
  const [routeKm, setRouteKm] = useState<number>(distanceKm || 4.2);
  const [streetCheckpoint, setStreetCheckpoint] = useState<string>(() =>
    getCheckpointStreetName(0.35)
  );

  // Sync immediate fallback geometry whenever coordinates update
  useEffect(() => {
    setRouteGeometry(fallbackRoute);
  }, [fallbackRoute]);

  // Fetch real OSRM street geometry in background (no API key needed)
  useEffect(() => {
    let isMounted = true;
    const waypoints: [number, number][] = courierCoords
      ? [courierCoords, restaurantCoords, customerCoords]
      : [restaurantCoords, customerCoords];

    fetchOsrmDrivingRoute(waypoints).then((route) => {
      if (!isMounted) return;
      if (route.coordinates.length >= 2) {
        setRouteGeometry(route.coordinates);
      }
      if (route.distanceKm > 0) {
        setRouteKm(route.distanceKm);
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

  // Resolve current street/landmark name near courier (or restaurant)
  useEffect(() => {
    const target = courierCoords || restaurantCoords;
    let isMounted = true;
    reverseGeocodeCoords(target[0], target[1], 0.4).then((res) => {
      if (isMounted && res.displayName) {
        setStreetCheckpoint(res.displayName);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [
    courierCoords?.[0],
    courierCoords?.[1],
    restaurantCoords[0],
    restaurantCoords[1],
  ]);

  const remainingKm = useMemo(() => {
    if (courierCoords) {
      const direct = calculateDistanceKm(
        courierCoords[0],
        courierCoords[1],
        customerCoords[0],
        customerCoords[1]
      );
      return Number(Math.max(0.1, direct * 1.15).toFixed(1));
    }
    return Number((distanceKm || routeKm || 4.2).toFixed(1));
  }, [courierCoords, customerCoords, distanceKm, routeKm]);

  const boundsPoints = useMemo<[number, number][]>(
    () =>
      courierCoords
        ? [restaurantCoords, customerCoords, courierCoords]
        : [restaurantCoords, customerCoords],
    [
      restaurantCoords[0],
      restaurantCoords[1],
      customerCoords[0],
      customerCoords[1],
      courierCoords?.[0],
      courierCoords?.[1],
    ]
  );

  const endpointKey = `${restaurantCoords[0].toFixed(4)}-${restaurantCoords[1].toFixed(4)}-${customerCoords[0].toFixed(4)}-${customerCoords[1].toFixed(4)}`;

  const restaurantIcon = useMemo(
    () => createCustomPin('#E11D48', restaurantName),
    [restaurantName]
  );
  const customerIcon = useMemo(
    () => createCustomPin('#2563EB', customerName),
    [customerName]
  );
  const courierIcon = useMemo(
    () =>
      createCustomPin(
        '#0F172A',
        `${(courierName || 'Courier').split(' ')[0]} · Live`,
        true
      ),
    [courierName]
  );

  const activeProvider = TILE_PROVIDERS[providerIndex] || TILE_PROVIDERS[0];

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm ${heightClass} w-full bg-slate-100`}
    >
      {/* Top Floating Glass Telemetry & Controls */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 pointer-events-none flex flex-wrap items-start justify-between gap-2.5">
        <div className="glass-elevated rounded-2xl px-4 py-3 pointer-events-auto max-w-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{statusLabel}</span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-lg font-bold font-display text-slate-900">
              {etaText.toLowerCase().includes('arrived') ||
              etaText.toLowerCase().includes('delivered')
                ? etaText
                : `ETA ${etaText}`}
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-medium text-slate-600">
              {remainingKm} km left
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            {restaurantName} → {customerAddress}
          </p>
          <p className="text-[11px] font-medium text-slate-700 truncate flex items-center gap-1.5 pt-0.5">
            <Bike className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span className="truncate">Near {streetCheckpoint}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setRecenterTrigger((c) => c + 1)}
            className="glass-elevated min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
            title="Recenter Route View"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span>Recenter</span>
          </button>

          {showNavigateButton && (
            <a
              href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${restaurantCoords[0]}%2C${restaurantCoords[1]}%3B${customerCoords[0]}%2C${customerCoords[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-blue-600 text-white text-xs font-semibold hover:from-rose-500 hover:to-blue-500 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
            >
              <span>Navigate</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Real JavaScript Leaflet Map (Zero API Key) */}
      <MapContainer
        center={restaurantCoords}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          key={activeProvider.name}
          attribution={activeProvider.attribution}
          url={activeProvider.url}
          eventHandlers={{
            tileload: () => {
              tilesLoadedRef.current += 1;
            },
            tileerror: () => {
              tileErrorCountRef.current += 1;
              if (
                tileErrorCountRef.current >= 3 &&
                tilesLoadedRef.current === 0 &&
                providerIndex < TILE_PROVIDERS.length - 1
              ) {
                tileErrorCountRef.current = 0;
                setProviderIndex((i) => i + 1);
              }
            },
          }}
        />

        <MapResizeAndBoundsController
          boundsPoints={boundsPoints}
          endpointKey={endpointKey}
          recenterTrigger={recenterTrigger}
        />

        {routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#E11D48',
              weight: 4.5,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />
        )}

        {courierCoords && (
          <Polyline
            positions={[courierCoords, customerCoords]}
            pathOptions={{
              color: '#2563EB',
              weight: 3.5,
              opacity: 0.45,
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
              <div className="text-xs font-sans space-y-1">
                <strong>Courier: {courierName || 'Partner'}</strong>
                <p className="text-[11px] text-slate-600">
                  Near {streetCheckpoint}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
