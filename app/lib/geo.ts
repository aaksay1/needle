export async function getLatLonFromZip(zip: string) {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;

    const data = await res.json();

    const place = data.places?.[0];
    if (!place) return null;

    return {
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude)
    };
}