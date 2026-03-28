"use client";
import React, { useState } from "react";

interface FareSplitProps {
  totalFare: number;
}

export default function FareSplitWidget({ totalFare }: FareSplitProps) {
  const [passengers, setPassengers] = useState(1);
  const splitAmount = Math.ceil(totalFare / (passengers + 1)); // including the rider

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
      <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">🧮 Fare Split Calculator</h3>
      <div className="flex items-center gap-4 justify-between">
        <div>
          <p className="text-sm text-indigo-700 font-medium">Passengers Requesting:</p>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setPassengers(Math.max(1, passengers - 1))}
              className="bg-white hover:bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full shadow-sm font-bold border border-indigo-200 transition">-</button>
            <span className="font-bold w-6 text-center">{passengers}</span>
            <button onClick={() => setPassengers(Math.min(4, passengers + 1))}
              className="bg-white hover:bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full shadow-sm font-bold border border-indigo-200 transition">+</button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mb-1">Per Person</p>
          <p className="text-3xl font-black text-indigo-800">₹{splitAmount}</p>
        </div>
      </div>
    </div>
  );
}
