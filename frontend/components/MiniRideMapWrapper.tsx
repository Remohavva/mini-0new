"use client";
import dynamic from "next/dynamic";

const MiniRideMap = dynamic(() => import("./MiniRideMap"), {
  ssr: false,
  loading: () => (
    <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400 text-xs">Loading map...</p>
    </div>
  ),
});

export default MiniRideMap;
