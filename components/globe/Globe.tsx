"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { globeCopy } from "@/lib/copy/globe";

// react-globe.gl touches window/WebGL at import time, so it only ever loads in the browser.
const GlobeView = dynamic(() => import("./GlobeView"), {
  ssr: false,
  loading: () => <GlobeStatus text={globeCopy.loading} />,
});

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

const noop = () => () => {};

function GlobeStatus({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <p className="label-mono max-w-[32ch] text-center">{text}</p>
    </div>
  );
}

export function Globe() {
  // Wake the Python function while the presenter is still choosing regions.
  useEffect(() => {
    void fetch("/api/py/health").catch(() => {});
  }, []);
  // null on the server, a boolean once mounted in the browser.
  const webgl = useSyncExternalStore(noop, hasWebGL, () => null);
  if (webgl === null) return <GlobeStatus text={globeCopy.loading} />;
  if (!webgl) return <GlobeStatus text={globeCopy.noWebgl} />;
  return <GlobeView />;
}
