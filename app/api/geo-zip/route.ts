import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");

  if (!zip) return NextResponse.json({ error: "ZIP is required" }, { status: 400 });

  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);

  if (!res.ok) {
    return NextResponse.json({ error: "Invalid ZIP" }, { status: 404 });
  }

  const data = await res.json();
  const place = data.places[0];

  return NextResponse.json({
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
  });
}