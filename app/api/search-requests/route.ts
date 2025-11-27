import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// Earth radius in miles
const R = 3958.8;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = parseFloat(searchParams.get("lat") || "");
  const lon = parseFloat(searchParams.get("lon") || "");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const query = searchParams.get("query")?.toLowerCase() || "";

  if (!lat || !lon)
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });

  // Fetch all products
  const allProducts = await prisma.product.findMany();

  // Filter by search term + distance
  const results = allProducts.filter((p) => {
    if (!p.latitude || !p.longitude) return false;

    const distance = haversine(lat, lon, p.latitude, p.longitude);

    const matchesSearch =
      query.length === 0 || p.name.toLowerCase().includes(query);

    return matchesSearch && distance <= radius;
  });

  return NextResponse.json(results);
}
