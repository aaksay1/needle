"use client";

import { useEffect, useState } from "react";
import { OfferModal } from "./OfferModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, SlidersHorizontal } from "lucide-react";

export default function BrowseRequestsPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [zipCode, setZipCode] = useState("10036");
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, radius]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(loadProducts, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ZIP override submit
  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loc = await fetchLatLonFromZip(zipCode);
    setLocation(loc);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Browse Requests
          </h1>
          <p className="text-gray-600">
            Discover product requests near you and make offers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SlidersHorizontal className="inline w-4 h-4 mr-1" />
                  Search Radius
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={5}>5 miles</option>
                  <option value={10}>10 miles</option>
                  <option value={15}>15 miles</option>
                  <option value={25}>25 miles</option>
                  <option value={50}>50 miles</option>
                </select>
              </div>

              <form onSubmit={handleZipSubmit} className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  ZIP Code
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10036"
                    className="flex-1 h-10"
                  />
                  <Button type="submit" className="h-10">
                    Set
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search radius or ZIP code to find more requests.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {products.length} {products.length === 1 ? "request" : "requests"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setIsModalOpen(true);
                  }}
                  className="text-left bg-white rounded-xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h3>
                    <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                      ${(p.price / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                    {p.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <MapPin className="w-4 h-4" />
                    <span>ZIP: {p.zipCode}</span>
                  </div>
                </button>
              ))}
            </div>

            <OfferModal
              product={selectedProduct}
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}