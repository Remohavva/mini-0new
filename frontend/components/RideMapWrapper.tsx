"use client";
import dynamic from "next/dynamic";

const RideMap = dynamic(() => import("./RideMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border bg-gray-100 flex items-center justify-center" style={{ height: 380 }}>
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  ),
});

export default RideMap;
