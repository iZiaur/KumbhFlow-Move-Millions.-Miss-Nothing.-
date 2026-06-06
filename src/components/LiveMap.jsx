import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
} from 'react-leaflet';
import { useAppState } from '../context/AppContext';
import { ghatLocations, majorRoads, transportRoutes } from '../data/ghatLocations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a density colour based on crowd-to-capacity ratio. */
function getDensityColor(ratio) {
  if (ratio >= 0.7) return '#FF1744'; // high → red
  if (ratio >= 0.4) return '#FFB300'; // medium → amber
  return '#00E676';                   // low → green
}

/** Returns a parking colour based on fill percentage. */
function getParkingColor(fillPercent) {
  if (fillPercent > 80) return '#FF1744';
  if (fillPercent >= 50) return '#FFB300';
  return '#00E676';
}

/** Build a Leaflet divIcon for a ghat marker. */
function createGhatIcon(ghat) {
  return L.divIcon({
    className: 'kf-ghat-icon',
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:32px;height:32px;
        background:#FF6B00;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 0 6px rgba(255,107,0,.6);
      ">
        <span style="transform:rotate(45deg);font-size:16px;line-height:1;">
          ${ghat.icon || '📍'}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  });
}

// ---------------------------------------------------------------------------
// Sub-components rendered inside the map
// ---------------------------------------------------------------------------

/** Crowd density circles for each ghat. */
function CrowdOverlays({ crowds }) {
  return crowds.map((ghat) => {
    const ratio = ghat.currentCrowd / ghat.capacity;
    const radius = Math.max(8, Math.min(40, ratio * 50));
    const color = getDensityColor(ratio);

    return (
      <CircleMarker
        key={`crowd-${ghat.id}`}
        center={[ghat.lat, ghat.lng]}
        radius={radius}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2,
        }}
      >
        <Tooltip direction="top" sticky>
          <span className="font-[Space_Grotesk] text-xs">
            <strong>{ghat.name}</strong>
            <br />
            {ghat.currentCrowd.toLocaleString()} / {ghat.capacity.toLocaleString()}
            <br />
            Density: {ghat.density}
          </span>
        </Tooltip>
      </CircleMarker>
    );
  });
}

/** Ghat pin markers built with L.divIcon. */
function GhatMarkers({ crowds }) {
  // Build a lookup so we can show live crowd count in the tooltip
  const crowdMap = useMemo(() => {
    const m = {};
    crowds.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [crowds]);

  return ghatLocations.map((ghat) => {
    const live = crowdMap[ghat.id];
    const crowdLabel = live
      ? `${live.currentCrowd.toLocaleString()} pilgrims`
      : '—';

    return (
      <Marker
        key={`ghat-${ghat.id}`}
        position={[ghat.lat, ghat.lng]}
        icon={createGhatIcon(ghat)}
      >
        <Tooltip direction="top" offset={[0, -4]}>
          <div className="font-[Space_Grotesk] text-xs leading-snug">
            <strong className="text-[#FF6B00]">{ghat.name}</strong>
            <br />
            {ghat.nameHi}
            <br />
            <span className="font-[IBM_Plex_Mono]">{crowdLabel}</span>
          </div>
        </Tooltip>
      </Marker>
    );
  });
}

/** Road polylines. */
function RoadOverlays() {
  return majorRoads.map((road) => (
    <Polyline
      key={`road-${road.id}`}
      positions={road.path}
      pathOptions={{
        color: road.color,
        weight: 3,
        opacity: 0.7,
        dashArray: road.trafficLevel === 'heavy' ? '8 6' : undefined,
      }}
    >
      <Tooltip sticky>
        <span className="font-[Space_Grotesk] text-xs">
          {road.name} — {road.trafficLevel}
        </span>
      </Tooltip>
    </Polyline>
  ));
}

/** Parking zone circles. */
function ParkingOverlays({ parking }) {
  return parking.map((zone) => {
    const color = getParkingColor(zone.fillPercent);

    return (
      <CircleMarker
        key={`park-${zone.id}`}
        center={[zone.lat, zone.lng]}
        radius={10}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 2,
        }}
      >
        <Tooltip direction="bottom" sticky>
          <div className="font-[Space_Grotesk] text-xs leading-snug">
            <strong>{zone.name}</strong>
            <br />
            <span className="font-[IBM_Plex_Mono]">
              {zone.available} / {zone.totalSlots} slots free
            </span>
            <br />
            {zone.fillPercent}% full — {zone.status}
          </div>
        </Tooltip>
      </CircleMarker>
    );
  });
}

/** Animated vehicle blips that cycle through route path points. */
function VehicleBlips() {
  const indicesRef = useRef(transportRoutes.map(() => 0));
  const blipRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      indicesRef.current = indicesRef.current.map((idx, i) => {
        const route = transportRoutes[i];
        const nextIdx = (idx + 1) % route.path.length;

        // Move the blip by updating the underlying Leaflet layer
        const layer = blipRefs.current[i];
        if (layer) {
          layer.setLatLng(route.path[nextIdx]);
        }
        return nextIdx;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return transportRoutes.map((route, i) => {
    const isTrain = route.type === 'train';
    const color = isTrain ? '#00E5FF' : '#FF6B00';
    const startPos = route.path[0];

    return (
      <CircleMarker
        key={`blip-${route.id}`}
        center={startPos}
        radius={isTrain ? 6 : 5}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        }}
        ref={(el) => {
          blipRefs.current[i] = el;
        }}
      >
        <Tooltip direction="top" sticky>
          <span className="font-[Space_Grotesk] text-xs">
            {isTrain ? '🚆' : '🚌'} {route.name}
          </span>
        </Tooltip>
      </CircleMarker>
    );
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LiveMap() {
  const { crowds, parking } = useAppState();

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[25.4310, 81.8850]}
        zoom={13}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        {/* ── Dark tile layer ────────────────────────────────── */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* ── Road overlays ─────────────────────────────────── */}
        <RoadOverlays />

        {/* ── Crowd density circles ─────────────────────────── */}
        <CrowdOverlays crowds={crowds} />

        {/* ── Ghat pin markers ──────────────────────────────── */}
        <GhatMarkers crowds={crowds} />

        {/* ── Parking zones ─────────────────────────────────── */}
        <ParkingOverlays parking={parking} />

        {/* ── Animated vehicle blips ────────────────────────── */}
        <VehicleBlips />
      </MapContainer>

      {/* ── Map legend (floating) ────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#131A2B]/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-xs font-[Space_Grotesk] text-white/70 space-y-1.5 pointer-events-none select-none">
        <p className="text-white/90 font-semibold mb-1 tracking-wide uppercase text-[10px]">
          Legend
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#00E676]" />
          Low density / Available
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FFB300]" />
          Medium density / Filling
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FF1744]" />
          High density / Full
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FF6B00]" />
          Ghat marker / Bus
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#00E5FF]" />
          Train blip
        </div>
      </div>
    </div>
  );
}
