"use client";

import dynamic from "next/dynamic";

const MapPlannerMapTool = dynamic(() => import("@/components/tools/MapPlannerMapTool"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-zinc-500 dark:text-zinc-400">
      Karte wird geladen…
    </div>
  ),
});

export default function MapPlannerGate() {
  return <MapPlannerMapTool />;
}
