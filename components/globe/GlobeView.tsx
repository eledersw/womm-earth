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
import { povStore } from "./povStore";
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
    pens: [v("--series-1"), v("--series-2"), v("--series-3"), v("--series-4")],
  };
}

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

  const polygons = useMemo(
    () => (geo ? visibleFeatures(geo, zoomedIn ? 0 : Infinity, regions) : []),
    [geo, zoomedIn, regions],
  );

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

  const capColor = useCallback(
    (f: object) => {
      const pen = penIndex(id(f), regions);
      if (pen !== null) return tokens.pens[pen];
      if (isOcean(f)) return id(f) === hovered ? tokens.oceanSeam : "rgba(0, 0, 0, 0)";
      return id(f) === hovered ? tokens.landHover : tokens.land;
    },
    [regions, hovered, tokens],
  );

  const strokeColor = useCallback(
    (f: object) => {
      const pen = penIndex(id(f), regions);
      if (pen !== null) return tokens.pens[pen];
      return isOcean(f) ? tokens.oceanSeam : tokens.seam;
    },
    [regions, tokens],
  );

  const altitude = useCallback(
    (f: object) => {
      if (penIndex(id(f), regions) !== null) return 0.022;
      if (id(f) === hovered) return 0.012;
      return isOcean(f) ? 0.002 : 0.006;
    },
    [regions, hovered],
  );

  const label = useCallback(
    (f: object) => {
      const p = (f as RegionFeature).properties;
      const pen = penIndex(p.id, regions);
      const action = pen !== null ? "Click to remove" : "Click to add to the case";
      return `<div class="glass-pill rounded-xl px-3 py-2 text-ink">
        <div class="font-medium">${p.name} <span class="font-mono text-xs text-ink-3">${p.id}</span></div>
        <div class="label-mono mt-1">${action}</div></div>`;
    },
    [regions],
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
          onPolygonClick={(f) => toggleRegion(id(f))}
          onPolygonHover={(f) => setHovered(f ? id(f) : null)}
          onZoom={onZoom}
          onGlobeReady={onGlobeReady}
        />
      )}
    </div>
  );
}
