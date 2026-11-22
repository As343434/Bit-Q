import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Crosshair,
  ExternalLink,
  MapPin,
  Store,
  Bike,
  Layers,
} from 'lucide-react';
import {
  buildSmoothUrbanRoute,
  calculateDistanceKm,
  fetchOsrmDrivingRoute,
  getCheckpointStreetName,
  reverseGeocodeCoords,
} from '../services/locationApi';

// Custom SVG DivIcons matching the Glass Layer aesthetic
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

// Ensures Leaflet always recalculates dimensions after Framer Motion / modal transitions
const MapResizeAndBoundsController: React.FC<{
  points: [number, number][];
  recenterTrigger: number;
}> = ({ points, recenterTrigger }) => {
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
    const t1 = setTimeout(invalidate, 120);
    const t2 = setTimeout(invalidate, 400);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer?.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [70, 70], animate: true });
    }
  }, [map, points, recenterTrigger]);

  return null;
};

/**
 * Linear interpolation along a multi-point coordinate polyline for t in [0, 1]
 */
function interpolateAlongRoute(
  coords: [number, number][],
  progress: number
): { point: [number, number]; passedPoints: [number, number][] } {
  if (coords.length === 0) {
    return { point: [12.9716, 77.5946], passedPoints: [] };
  }
  if (coords.length === 1 || progress <= 0) {
    return { point: coords[0], passedPoints: [coords[0]] };
  }
  if (progress >= 1) {
    return { point: coords[coords.length - 1], passedPoints: coords };
  }

  const scaled = progress * (coords.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const p1 = coords[idx];
  const p2 = coords[Math.min(idx + 1, coords.length - 1)];

  const interp: [number, number] = [
    p1[0] + (p2[0] - p1[0]) * frac,
    p1[1] + (p2[1] - p1[1]) * frac,
  ];
  return {
    point: interp,
    passedPoints: [...coords.slice(0, idx + 1), interp],
  };
}

/**
 * Built-in Zero-Dependency Vector Street Map Canvas
 * Always renders crisp city blocks, arterial roads, parks, landmarks, and animated route pins.
 */
const OfflineStreetCanvas: React.FC<{
  restaurantName: string;
  restaurantCoords: [number, number];
  customerName: string;
  customerCoords: [number, number];
  courierName: string;
  courierCoords?: [number, number];
  routeGeometry: [number, number][];
  passedGeometry: [number, number][];
  zoomFactor: number;
}> = ({
  restaurantName,
  restaurantCoords,
  customerName,
  customerCoords,
  courierName,
  courierCoords,
  routeGeometry,
  passedGeometry,
  zoomFactor,
}) => {
  const width = 800;
  const height = 500;

  const { project } = useMemo(() => {
    const allPts: [number, number][] = [
      restaurantCoords,
      customerCoords,
      ...(courierCoords ? [courierCoords] : []),
      ...routeGeometry,
    ];
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const [lat, lng] of allPts) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    const latSpan = Math.max(0.015, maxLat - minLat);
    const lngSpan = Math.max(0.015, maxLng - minLng);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const padX = 140;
    const padY = 120;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const projectFn = ([lat, lng]: [number, number]): [number, number] => {
      const normX = (lng - centerLng) / lngSpan;
      const normY = (centerLat - lat) / latSpan;
      const x = width / 2 + normX * usableW * zoomFactor;
      const y = height / 2 + normY * usableH * zoomFactor;
      return [x, y];
    };

    return { project: projectFn };
  }, [restaurantCoords, customerCoords, courierCoords, routeGeometry, zoomFactor]);

  const routeSvgPath = useMemo(() => {
    if (routeGeometry.length < 2) return '';
    return routeGeometry
      .map((pt, idx) => {
        const [x, y] = project(pt);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [routeGeometry, project]);

  const passedSvgPath = useMemo(() => {
    if (passedGeometry.length < 2) return '';
    return passedGeometry
      .map((pt, idx) => {
        const [x, y] = project(pt);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [passedGeometry, project]);

  const [restX, restY] = project(restaurantCoords);
  const [custX, custY] = project(customerCoords);
  const [courX, courY] = courierCoords
    ? project(courierCoords)
    : [restX, restY];

  return (
    <div className="relative w-full h-full bg-[#F4F2EC] select-none overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id="biteqTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Base Terrain */}
        <rect x="0" y="0" width={width} height={height} fill="#F4F2EC" />

        {/* Urban City Blocks */}
        <g fill="#EAE6DD">
          <rect x="24" y="26" width="130" height="86" rx="10" />
          <rect x="176" y="26" width="160" height="86" rx="10" />
          <rect x="358" y="26" width="150" height="86" rx="10" />
          <rect x="530" y="26" width="120" height="86" rx="10" />
          <rect x="672" y="26" width="110" height="86" rx="10" />

          <rect x="24" y="134" width="130" height="106" rx="10" />
          <rect x="176" y="134" width="160" height="106" rx="10" />
          <rect x="530" y="134" width="120" height="106" rx="10" />
          <rect x="672" y="134" width="110" height="106" rx="10" />

          <rect x="24" y="262" width="130" height="110" rx="10" />
          <rect x="358" y="262" width="150" height="110" rx="10" />
          <rect x="530" y="262" width="120" height="110" rx="10" />
          <rect x="672" y="262" width="110" height="110" rx="10" />

          <rect x="24" y="394" width="130" height="86" rx="10" />
          <rect x="176" y="394" width="160" height="86" rx="10" />
          <rect x="358" y="394" width="150" height="86" rx="10" />
          <rect x="530" y="394" width="252" height="86" rx="10" />
        </g>

        {/* Botanical Parks & Water Feature */}
        <rect x="358" y="134" width="150" height="106" rx="14" fill="#DFECE3" />
        <rect x="176" y="262" width="160" height="110" rx="14" fill="#DFECE3" />
        <path
          d="M -20 445 Q 220 410, 440 455 T 830 430 L 830 510 L -20 510 Z"
          fill="#DCEBF7"
          opacity="0.75"
        />

        {/* Secondary Cross Streets */}
        <g stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity="0.92">
          <line x1="0" y1="123" x2={width} y2="123" />
          <line x1="0" y1="251" x2={width} y2="251" />
          <line x1="0" y1="383" x2={width} y2="383" />
          <line x1="165" y1="0" x2="165" y2={height} />
          <line x1="347" y1="0" x2="347" y2={height} />
          <line x1="519" y1="0" x2="519" y2={height} />
          <line x1="661" y1="0" x2="661" y2={height} />
        </g>

        {/* Primary Arterial Avenues */}
        <g stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round">
          <path d="M -10 190 Q 320 155, 810 215" fill="none" />
          <path d="M 270 -10 Q 390 250, 460 510" fill="none" />
          <path d="M 600 -10 L 560 510" fill="none" />
        </g>

        {/* Street Name Labels */}
        <g
          fill="#78716C"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontSize="10"
          fontWeight="600"
          opacity="0.85"
        >
          <text x="200" y="119">CMH ROAD</text>
          <text x="538" y="182">100 FEET RD</text>
          <text x="380" y="247">12TH MAIN AVE</text>
          <text x="195" y="379">80 FEET RD</text>
          <text x="392" y="190" fill="#4B6B56">Domlur Park</text>
        </g>

        {/* Route Path Shadow + Upcoming Dashed Route */}
        {routeSvgPath && (
          <>
            <path
              d={routeSvgPath}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            <path
              d={routeSvgPath}
              fill="none"
              stroke="#E11D48"
              strokeWidth="4.5"
              strokeDasharray="9 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </>
        )}

        {/* Completed Route Trail */}
        {passedSvgPath && (
          <path
            d={passedSvgPath}
            fill="none"
            stroke="url(#biteqTrailGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Restaurant Pickup Pin */}
        <g transform={`translate(${restX}, ${restY})`} filter="url(#pinShadow)">
          <rect
            x="-64"
            y="-16"
            width="128"
            height="32"
            rx="16"
            fill="#E11D48"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <circle cx="-46" cy="0" r="4" fill="#FFFFFF" />
          <text
            x="6"
            y="4"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="11"
            fontWeight="700"
          >
            {restaurantName.length > 14
              ? `${restaurantName.slice(0, 13)}…`
              : restaurantName}
          </text>
        </g>

        {/* Customer Drop-Off Pin */}
        <g transform={`translate(${custX}, ${custY})`} filter="url(#pinShadow)">
          <rect
            x="-58"
            y="-16"
            width="116"
            height="32"
            rx="16"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <circle cx="-40" cy="0" r="4" fill="#FFFFFF" />
          <text
            x="6"
            y="4"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="11"
            fontWeight="700"
          >
            {customerName.length > 12
              ? `${customerName.slice(0, 11)}…`
              : customerName}
          </text>
        </g>

        {/* Animated Courier Pin */}
        {courierCoords && (
          <g
            transform={`translate(${courX}, ${courY})`}
            style={{ transition: 'transform 180ms linear' }}
            filter="url(#pinShadow)"
          >
            <circle r="22" fill="#0F172A" opacity="0.14" />
            <rect
              x="-62"
              y="-17"
              width="124"
              height="34"
              rx="17"
              fill="#0F172A"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle cx="-44" cy="0" r="4.5" fill="#34D399" />
            <text
              x="7"
              y="4"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="11"
              fontWeight="700"
            >
              {courierName.split(' ')[0] || 'Courier'} · Live
            </text>
          </g>
        )}
      </svg>
    </div>
  );
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
  onUpdateCoords?: (coords: [number, number], etaText?: string) => void;
  onProgressChange?: (progress: number) => void;
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
  onUpdateCoords,
  onProgressChange,
}) => {
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [zoomFactor, setZoomFactor] = useState(1);

  // Build guaranteed curved route immediately so vector & markers never start empty
  const fallbackRoute = useMemo(() => {
    const baseWaypoints: [number, number][] = courierCoords
      ? [courierCoords, restaurantCoords, customerCoords]
      : [restaurantCoords, customerCoords];
    return buildSmoothUrbanRoute(baseWaypoints, 28);
  }, [
    restaurantCoords[0],
    restaurantCoords[1],
    customerCoords[0],
    customerCoords[1],
  ]);

  const [routeGeometry, setRouteGeometry] =
    useState<[number, number][]>(fallbackRoute);
  const [totalRouteKm, setTotalRouteKm] = useState<number>(distanceKm || 4.2);
  const [totalRouteMins, setTotalRouteMins] = useState<number>(() => {
    const parsed = parseInt(etaText, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
  });

  // Playback state for smooth demo animation + manual steps
  const [isPlaying, setIsPlaying] = useState(false);
  const [routeProgress, setRouteProgress] = useState<number>(0.12);
  const [streetCheckpoint, setStreetCheckpoint] = useState<string>(() =>
    getCheckpointStreetName(0.12)
  );

  // Hybrid rendering mode: tries Live Leaflet tiles, auto-falls back to Vector Street Map on error/timeout
  const [mapMode, setMapMode] = useState<'live' | 'vector'>('live');
  const [tilesLoadedCount, setTilesLoadedCount] = useState(0);
  const tileErrorCountRef = useRef(0);
  const lastSyncRef = useRef(0);

  // Fetch OSRM driving route in background; keep fallbackRoute if unreachable
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
        setTotalRouteKm(route.distanceKm);
        setTotalRouteMins(route.durationMinutes);
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
  ]);

  // Automatic tile-load watchdog: if external tiles fail or block within 3.8s, switch to Vector Map
  useEffect(() => {
    if (mapMode !== 'live' || tilesLoadedCount > 0) return;
    const timer = setTimeout(() => {
      if (tilesLoadedCount === 0) {
        setMapMode('vector');
      }
    }, 3800);
    return () => clearTimeout(timer);
  }, [mapMode, tilesLoadedCount]);

  // Smooth auto-play interpolation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setRouteProgress((prev) => {
        const next = prev + 0.015;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
    }, 220);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Compute current animated courier position & remaining telemetry from routeProgress
  const { point: activeCourierPoint, passedPoints } = useMemo(
    () => interpolateAlongRoute(routeGeometry, routeProgress),
    [routeGeometry, routeProgress]
  );

  const displayCourierCoords: [number, number] | undefined = useMemo(() => {
    if (isPlaying || routeProgress > 0.12) {
      return activeCourierPoint;
    }
    return courierCoords || activeCourierPoint;
  }, [isPlaying, routeProgress, activeCourierPoint, courierCoords]);

  const remainingKm = useMemo(() => {
    if (displayCourierCoords) {
      const direct = calculateDistanceKm(
        displayCourierCoords[0],
        displayCourierCoords[1],
        customerCoords[0],
        customerCoords[1]
      );
      return Number(Math.max(0.1, direct * 1.15).toFixed(1));
    }
    return Number(Math.max(0.1, totalRouteKm * (1 - routeProgress)).toFixed(1));
  }, [displayCourierCoords, customerCoords, totalRouteKm, routeProgress]);

  const displayEta = useMemo(() => {
    if (routeProgress >= 0.98) return 'Arrived';
    const mins = Math.max(1, Math.round(totalRouteMins * (1 - routeProgress)));
    return `${mins} min`;
  }, [totalRouteMins, routeProgress]);

  // Update street name + throttled parent/Firestore sync
  useEffect(() => {
    const checkpoint = getCheckpointStreetName(routeProgress);
    setStreetCheckpoint(checkpoint);
    onProgressChange?.(routeProgress);

    if (onUpdateCoords && displayCourierCoords && (isPlaying || routeProgress > 0.12)) {
      const now = Date.now();
      if (now - lastSyncRef.current > 2400 || routeProgress >= 1) {
        lastSyncRef.current = now;
        onUpdateCoords(displayCourierCoords, displayEta);
      }
    }
  }, [routeProgress, displayEta]);

  // Optionally resolve real street name via Nominatim on discrete steps
  useEffect(() => {
    if (!displayCourierCoords || isPlaying) return;
    let isMounted = true;
    reverseGeocodeCoords(
      displayCourierCoords[0],
      displayCourierCoords[1],
      routeProgress
    ).then((res) => {
      if (isMounted && res.displayName) {
        setStreetCheckpoint(res.displayName);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [Math.round(routeProgress * 8)]);

  const handleStepForward = () => {
    setIsPlaying(false);
    setRouteProgress((prev) => {
      const next = prev >= 1 ? 0.125 : Math.min(1, Number((prev + 0.125).toFixed(3)));
      return next;
    });
  };

  const handleResetRoute = () => {
    setIsPlaying(false);
    setRouteProgress(0);
    setZoomFactor(1);
    setRecenterTrigger((c) => c + 1);
  };

  const handleRecenter = () => {
    setZoomFactor(1);
    setRecenterTrigger((c) => c + 1);
  };

  const allPoints: [number, number][] = displayCourierCoords
    ? [restaurantCoords, customerCoords, displayCourierCoords]
    : [restaurantCoords, customerCoords];

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

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm ${heightClass} w-full bg-[#F4F2EC] flex flex-col`}
    >
      {/* Top Floating Glass Overlay: Telemetry + Mode Toggle */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 pointer-events-none flex flex-wrap items-start justify-between gap-2.5">
        <div className="glass-elevated rounded-2xl px-4 py-3 pointer-events-auto max-w-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{statusLabel}</span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-lg font-bold font-display text-slate-900">
              {displayEta === 'Arrived' ? 'Arrived' : `ETA ${displayEta}`}
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

        {/* Map Mode Switcher + Recenter + External Navigation */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="glass-elevated p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                tileErrorCountRef.current = 0;
                setMapMode('live');
              }}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                mapMode === 'live'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                mapMode === 'vector'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Street Map
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="glass-elevated min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
            title="Recenter Route View"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Recenter</span>
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

      {/* Main Map Surface: Live Leaflet or Built-In Offline Vector Street Map */}
      <div className="relative flex-1 w-full h-full">
        {mapMode === 'live' ? (
          <MapContainer
            center={restaurantCoords}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              eventHandlers={{
                tileload: () => {
                  setTilesLoadedCount((c) => c + 1);
                },
                tileerror: () => {
                  tileErrorCountRef.current += 1;
                  if (
                    tileErrorCountRef.current >= 2 &&
                    tilesLoadedCount === 0
                  ) {
                    setMapMode('vector');
                  }
                },
              }}
            />

            <MapResizeAndBoundsController
              points={allPoints}
              recenterTrigger={recenterTrigger}
            />

            {routeGeometry.length > 1 && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{
                  color: '#E11D48',
                  weight: 4,
                  opacity: 0.55,
                  dashArray: '8, 8',
                }}
              />
            )}

            {passedPoints.length > 1 && (
              <Polyline
                positions={passedPoints}
                pathOptions={{
                  color: '#2563EB',
                  weight: 5,
                  opacity: 0.92,
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

            {displayCourierCoords && (
              <Marker position={displayCourierCoords} icon={courierIcon}>
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
        ) : (
          <OfflineStreetCanvas
            restaurantName={restaurantName}
            restaurantCoords={restaurantCoords}
            customerName={customerName}
            customerCoords={customerCoords}
            courierName={courierName || 'Courier'}
            courierCoords={displayCourierCoords}
            routeGeometry={routeGeometry}
            passedGeometry={passedPoints}
            zoomFactor={zoomFactor}
          />
        )}
      </div>

      {/* Bottom Playback & Step Control Bar */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 pointer-events-none flex justify-center">
        <div className="glass-elevated rounded-2xl px-3.5 py-2.5 pointer-events-auto flex flex-wrap items-center justify-between gap-3 w-full max-w-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (routeProgress >= 1) setRouteProgress(0);
                setIsPlaying((p) => !p);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                isPlaying
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{routeProgress >= 1 ? 'Replay' : 'Auto-Play'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStepForward}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0"
            >
              <SkipForward className="w-3.5 h-3.5 text-blue-600" />
              <span>Step</span>
            </button>

            <button
              type="button"
              onClick={handleResetRoute}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center transition-transform active:scale-95 shrink-0"
              title="Reset Route"
              aria-label="Reset Route"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Route Progress Scrubber */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[140px]">
            <Store className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(routeProgress * 100)}
              onChange={(e) => {
                setIsPlaying(false);
                setRouteProgress(Number(e.target.value) / 100);
              }}
              aria-label="Delivery route progress"
              className="w-full accent-rose-600 cursor-pointer h-1.5"
            />
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums w-9 text-right shrink-0">
              {Math.round(routeProgress * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
