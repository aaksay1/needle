export async function isValidZip(zip: string) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    return res.ok; // true if ZIP exists, false otherwise
  } catch (err) {
    console.error("ZIP validation error:", err);
    return false;
  }
}