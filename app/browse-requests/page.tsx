"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BrowseRequestsPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [zipCode, setZipCode] = useState("10036");
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert ZIP → coordinates
  async function fetchLatLonFromZip(zip: string) {
    const res = await fetch(`/api/geo-zip?zip=${zip}`);
    const data = await res.json();
    return { lat: data.latitude, lon: data.longitude };
  }

  // Detect device location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });
      },
      async () => {
        const fallback = await fetchLatLonFromZip("10036");
        setLocation(fallback);
      }
    );
  }, []);

  // Fetch requests
  async function loadProducts() {
    if (!location) return;

    setLoading(true);

    const params = new URLSearchParams({
      lat: String(location.lat),
      lon: String(location.lon),
      radius: String(radius),
      query: searchQuery,
    });

    const res = await fetch(`/api/search-requests?${params}`);
    const data = await res.json();

    setProducts(data);
    setLoading(false);
  }

  // Auto-refresh when filters change
  useEffect(() => {
    loadProducts();
  }, [location, radius]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(loadProducts, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ZIP override submit
  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loc = await fetchLatLonFromZip(zipCode);
    setLocation(loc);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* Search */}
      <input
        type="text"
        placeholder="Search items…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full border p-3 rounded-xl text-lg"
      />

      {/* Controls */}
      <div className="flex gap-4 items-end">

        {/* Radius dropdown */}
        <div>
          <label className="block font-medium mb-1">Within</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="border p-3 rounded-xl"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={15}>15 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>

        {/* ZIP override */}
        <form onSubmit={handleZipSubmit}>
          <label className="block font-medium mb-1">ZIP Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="border p-3 rounded-xl w-28"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl">
              Set
            </button>
          </div>
        </form>

      </div>

      {/* Results */}
      {loading ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((p: any) => (
                <Link
                key={p.id}
                href={`/browse-requests/${p.id}`}
                className="block border p-5 rounded-2xl shadow-sm hover:shadow-md transition"
                >
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-gray-700 mt-2">{p.description}</p>
                <div className="text-sm text-gray-500 mt-3">
                    ZIP: {p.zipCode} • ${(p.price / 100).toFixed(2)}
                </div>
                </Link>
            ))}
        </div>
      )}

    </div>
  );
}