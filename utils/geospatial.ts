// --- TIER 1: GEOHASH INDEXING ---
// Base32 map for Geohash
const B32_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes a latitude and longitude into a geohash string.
 * @param latitude 
 * @param longitude 
 * @param precision Length of the geohash (default 10)
 */
export const encodeGeohash = (latitude: number, longitude: number, precision: number = 10): string => {
  let isEven = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  while (geohash.length < precision) {
    if (isEven) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude > lonMid) {
        ch |= (1 << (4 - bit));
        lonMin = lonMid;
      } else {
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        ch |= (1 << (4 - bit));
        latMin = latMid;
      } else {
        latMax = latMid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += B32_CHARS.charAt(ch);
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
};

// --- TIER 2: HAVERSINE REFINEMENT ---

/**
 * Calculates the Great Circle distance between two points using the Haversine formula.
 * Returns distance in Kilometers.
 * Formula: d = 2r * arcsin(sqrt(sin^2((lat2-lat1)/2) + cos(lat1)cos(lat2)sin^2((lon2-lon1)/2)))
 */
export const calculateHaversineDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.asin(Math.sqrt(a));
  
  return R * c;
};

/**
 * Applies "Point Blurring" by injecting random noise (jitter) to coordinates.
 * This ensures only "Area-level" proximity is visible for privacy.
 */
export const applyJitter = (lat: number, lng: number, intensity: number = 0.002): { lat: number; lng: number } => {
  const jitterLat = (Math.random() - 0.5) * intensity;
  const jitterLng = (Math.random() - 0.5) * intensity;
  return {
    lat: lat + jitterLat,
    lng: lng + jitterLng
  };
};

/**
 * Formats distance for display (e.g., "0.5 km" or "12 km")
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};
