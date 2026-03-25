"use client";
import { useEffect, useRef, useState } from "react";
import { geocode, GeoResult } from "@/lib/geocode";

interface Props {
  placeholder?: string;
  value: string;
  onChange: (value: string, coords?: [number, number]) => void;
}

export default function LocationSearch({ placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await geocode(query);
      setResults(res);
      setOpen(true);
    }, 400);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(r: GeoResult) {
    const short = r.display_name.split(",").slice(0, 2).join(",").trim();
    setQuery(short);
    setOpen(false);
    onChange(short, [parseFloat(r.lat as unknown as string), parseFloat(r.lon as unknown as string)]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-[100] w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              className="px-3 py-2 text-sm hover:bg-green-50 cursor-pointer truncate">
              📍 {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
