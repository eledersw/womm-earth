"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactGlobe, { type GlobeMethods } from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import { useCase } from "@/lib/state/use-case";
import { useUiStore } from "@/lib/state/ui-store";
import {
  ZOOM_STATES_ALTITUDE,
  capRings,
  penIndex,
  visibleFeatures,
  type CapRing,
  type RegionFeature,
} from "./layers";
import { useVariables } from "@/components/panel/useVariables";
import { UP_IS_WET, colorFor, displayUnit, domainFor, formatSlope, mixHex, type TrendRamp } from "./palette";
import { highlightIds, mirrorArcs, mirrorView, type MirrorArc } from "./highlight";
import { povStore } from "./povStore";
import { useRegionIndex } from "./useRegionIndex";
import { TRENDMAP_LIVE, useTrendMap } from "./useTrendMap";
import { useGeo } from "./useGeo";
import { useRegionToggle } from "./useRegionToggle";

// Token values for three.js, which can't read CSS variables. Read once at mount.
function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    ocean: v("--globe-ocean"),
    specular: v("--globe-specular"),
    land: v("--globe-land"),
    landHover: v("--globe-land-hover"),
    seam: v("--globe-seam"),
    oceanSeam: v("--globe-ocean-seam"),
    atmosphere: v("--globe-atmosphere"),
    silver: v("--silver"),
    pens: [v("--series-1"), v("--series-2"), v("--series-3"), v("--series-4")],
    ramp: {
      up: [v("--trend-up-1"), v("--trend-up-2"), v("--trend-up-3")],
      down: [v("--trend-down-1"), v("--trend-down-2"), v("--trend-down-3")],
      neutral: v("--trend-neutral"),
    } as TrendRamp,
  };
}

const TIER_WORD = { confirmed: "confirmed", not_proven: "not proven yet", no_case: "no case", too_short: "too short to judge" } as const;

const START_POV = { lat: 28, lng: -35, altitude: 2.3 };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function GlobeView() {
  const { state } = useCase();
  const regions = state.regions;
  const toggleRegion = useRegionToggle();
  const hovered = useUiStore((s) => s.hoveredRegion);
  const setHovered = useUiStore((s) => s.setHoveredRegion);
  const focus = useUiStore((s) => s.focus);
  const { geo } = useGeo();

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoomedIn, setZoomedIn] = useState(START_POV.altitude < ZOOM_STATES_ALTITUDE);
  const [tokens] = useState(readTokens);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  // Trend map for the current variable, period and season (Task 5).
  const trend = useTrendMap(state);
  const variables = useVariables();
  const unit = displayUnit(variables.byId[state.variable]?.unit);
  const hidden = useUiStore((s) => s.predictMode && !s.reveal);
  const domain = useMemo(() => domainFor(trend.entries), [trend.entries]);
  const upIsWet = UP_IS_WET.has(state.variable);
  const trendColor = useCallback(
    (regionId: string): string | null => {
      const entry = TRENDMAP_LIVE ? trend.entries?.[regionId] : undefined;
      if (!entry) return null;
      return colorFor(entry, domain, tokens.ramp, { upIsWet, hidden });
    },
    [trend.entries, domain, tokens.ramp, upIsWet, hidden],
  );

  // Fill the viewing window.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ width: Math.round(e.contentRect.width), height: Math.round(e.contentRect.height) }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A dark, faintly metallic sphere: the chrome of Fragment's tiles, kept quiet.
  const material = useMemo(
    () => new MeshPhongMaterial({ color: tokens.ocean, specular: tokens.specular, shininess: 18 }),
    [tokens.ocean, tokens.specular],
  );

  // Highlights from the mirror finder or a tour step (Task 6).
  const highlight = useUiStore((s) => s.highlight);
  const { byId } = useRegionIndex();
  const outlined = useMemo(() => highlightIds(highlight), [highlight]);
  const arcs = useMemo(() => mirrorArcs(highlight, byId), [highlight, byId]);

  // Highlighted regions must be drawn even when they are not in the case.
  const drawn = useMemo(() => [...new Set([...regions, ...outlined])], [regions, outlined]);
  const polygons = useMemo(
    () => (geo ? visibleFeatures(geo, zoomedIn ? 0 : Infinity, drawn) : []),
    [geo, zoomedIn, drawn],
  );

  // Frame a newly shown mirror pair.
  const firstArc = arcs[0]?.id;
  useEffect(() => {
    const view = mirrorView(arcs);
    if (view) globeRef.current?.pointOfView(view, reduced ? 0 : 1400);
    // Only when the pair changes, not on every arcs identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstArc, reduced]);

  // Polar caps (Southern Ocean, Arctic) can't be filled; selected ones draw as a ring.
  const rings = useMemo(() => (geo ? capRings(geo, regions) : []), [geo, regions]);

  // Idle drift only while nothing is selected; never with reduced motion.
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = !reduced && regions.length === 0;
    controls.autoRotateSpeed = 0.35;
  }, [regions.length, reduced, size.width]);

  // Fly to a region chosen elsewhere (search, tour).
  useEffect(() => {
    if (focus) globeRef.current?.pointOfView(focus, reduced ? 0 : 1200);
  }, [focus, reduced]);

  const onGlobeReady = useCallback(() => {
    // Full pixel density on a projector laptop costs frames for no visible gain.
    globeRef.current?.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    globeRef.current?.pointOfView(START_POV, 0);
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = !reduced && regions.length === 0;
      controls.autoRotateSpeed = 0.35;
    }
    // react-globe.gl is created once; mount-time values are what we want here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onZoom = useCallback((pov: { lat: number; lng: number; altitude: number }) => {
    povStore.set(pov);
    const next = pov.altitude < ZOOM_STATES_ALTITUDE;
    setZoomedIn((prev) => (prev === next ? prev : next));
  }, []);

  const id = (f: object) => (f as RegionFeature).properties.id;
  const isOcean = (f: object) => (f as RegionFeature).properties.type === "ocean";
  const featurePenIndex = useCallback((f: object) => {
    const feature = f as RegionFeature;
    return penIndex(feature.properties.id, regions)
      ?? (feature.properties.parent ? penIndex(feature.properties.parent, regions) : null);
  }, [regions]);

  const capColor = useCallback(
    (f: object) => {
      const pen = featurePenIndex(f);
      if (pen !== null) return tokens.pens[pen];
      const trendFill = trendColor(id(f));
      if (trendFill) return id(f) === hovered ? mixHex(trendFill, "#ffffff", 0.18) : trendFill;
      if (isOcean(f)) return id(f) === hovered ? tokens.oceanSeam : "rgba(0, 0, 0, 0)";
      return id(f) === hovered ? tokens.landHover : tokens.land;
    },
    [hovered, tokens, trendColor, featurePenIndex],
  );

  const strokeColor = useCallback(
    (f: object) => {
      const pen = featurePenIndex(f);
      if (pen !== null) return tokens.pens[pen];
      if (outlined.has(id(f))) return tokens.silver;
      return isOcean(f) ? tokens.oceanSeam : tokens.seam;
    },
    [tokens, outlined, featurePenIndex],
  );

  const altitude = useCallback(
    (f: object) => {
      if (featurePenIndex(f) !== null) return 0.022;
      if (outlined.has(id(f))) return 0.018;
      // Oceans only change colour on hover: lifting their large meshes is costly.
      if (isOcean(f)) return 0.002;
      if (id(f) === hovered) return 0.012;
      return 0.006;
    },
    [hovered, outlined, featurePenIndex],
  );

  const label = useCallback(
    (f: object) => {
      const p = (f as RegionFeature).properties;
      const pen = penIndex(p.id, regions);
      const action = pen !== null ? "Click to remove" : "Click to add to the case";
      const entry = hidden || !TRENDMAP_LIVE ? undefined : trend.entries?.[p.id];
      const trendLine = entry
        ? `<div class="mt-1 flex items-baseline gap-1.5"><span class="figure text-lg">${formatSlope(entry.slope_per_decade)}</span><span class="font-mono text-xs text-ink-2">${unit ? `${unit} / ` : "per "}decade · ${TIER_WORD[entry.tier]}</span></div>`
        : "";
      return `<div class="glass-pill rounded-xl px-3 py-2 text-ink">
        <div class="font-medium">${p.name} <span class="font-mono text-xs text-ink-3">${p.id}</span></div>
        ${trendLine}<div class="label-mono mt-1">${action}</div></div>`;
    },
    [regions, hidden, trend.entries, unit],
  );

  return (
    <div
      ref={boxRef}
      className="absolute inset-0"
      style={{ cursor: hovered ? "pointer" : "grab" }}
    >
      {size.width > 0 && (
        <ReactGlobe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          globeMaterial={material}
          showGraticules
          showAtmosphere
          atmosphereColor={tokens.atmosphere}
          atmosphereAltitude={0.16}
          polygonsData={polygons}
          polygonCapColor={capColor}
          polygonSideColor={() => "rgba(0, 0, 0, 0.45)"}
          polygonStrokeColor={strokeColor}
          polygonAltitude={altitude}
          polygonLabel={label}
          polygonsTransitionDuration={reduced ? 0 : 250}
          pathsData={rings}
          pathPoints={(r: object) => (r as CapRing).points}
          pathPointLat={(p: object) => (p as [number, number])[0]}
          pathPointLng={(p: object) => (p as [number, number])[1]}
          pathPointAlt={0.015}
          pathColor={(r: object) => tokens.pens[(r as CapRing).pen]}
          pathStroke={3}
          pathTransitionDuration={0}
          arcsData={arcs}
          arcStartLat={(a: object) => (a as MirrorArc).startLat}
          arcStartLng={(a: object) => (a as MirrorArc).startLng}
          arcEndLat={(a: object) => (a as MirrorArc).endLat}
          arcEndLng={(a: object) => (a as MirrorArc).endLng}
          arcColor={() => [tokens.silver, "rgba(201, 208, 210, 0.35)"]}
          arcStroke={0.7}
          arcAltitudeAutoScale={0.45}
          arcDashLength={0.45}
          arcDashGap={0.18}
          arcDashAnimateTime={reduced ? 0 : 2600}
          arcsTransitionDuration={reduced ? 0 : 600}
          onPolygonClick={(f) => toggleRegion(id(f))}
          onPolygonHover={(f) => setHovered(f ? id(f) : null)}
          onZoom={onZoom}
          onGlobeReady={onGlobeReady}
        />
      )}
    </div>
  );
}
