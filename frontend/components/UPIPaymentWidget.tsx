"use client";
import React from "react";

interface UPIPaymentProps {
  upiId: string;
  payeeName: string;
  amount: number;
}

export default function UPIPaymentWidget({ upiId, payeeName, amount }: UPIPaymentProps) {
  // Standard UPI deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;

  return (
    <div className="border p-4 rounded-xl shadow-sm border-emerald-200 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-lg">📱 Tap to Pay</h3>
          <p className="text-sm text-emerald-700 mt-1 mb-2 font-medium">₹{amount} for ride with {payeeName}</p>
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-emerald-100 inline-flex">
            <span className="text-xs font-mono text-gray-500">To: {upiId}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <a href={upiLink} target="_blank" rel="noopener noreferrer"
             className="bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold py-3 px-6 rounded-xl transition shadow-md hover:shadow-lg">
            Pay Now
          </a>
          <div className="flex justify-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/UPI-Logo.png" alt="UPI" className="h-4 opacity-70 grayscale contrast-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
