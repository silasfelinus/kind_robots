// /utils/astrology/cities.ts
//
// A small offline birthplace list so a chart needs no geocoding service.
// Anywhere else can be entered as latitude, longitude and IANA time zone.

export type BirthCity = {
  id: string
  name: string
  latitude: number
  longitude: number
  timeZone: string
}

const city = (
  name: string,
  latitude: number,
  longitude: number,
  timeZone: string,
): BirthCity => ({
  id: name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  name,
  latitude,
  longitude,
  timeZone,
})

export const BIRTH_CITIES: BirthCity[] = [
  city('Arcata, CA, USA', 40.8665, -124.0828, 'America/Los_Angeles'),
  city('Eureka, CA, USA', 40.8021, -124.1637, 'America/Los_Angeles'),
  city('Redding, CA, USA', 40.5865, -122.3917, 'America/Los_Angeles'),
  city('Sacramento, CA, USA', 38.5816, -121.4944, 'America/Los_Angeles'),
  city('Santa Rosa, CA, USA', 38.4405, -122.7144, 'America/Los_Angeles'),
  city('San Francisco, CA, USA', 37.7749, -122.4194, 'America/Los_Angeles'),
  city('Oakland, CA, USA', 37.8044, -122.2712, 'America/Los_Angeles'),
  city('San Jose, CA, USA', 37.3382, -121.8863, 'America/Los_Angeles'),
  city('Los Angeles, CA, USA', 34.0522, -118.2437, 'America/Los_Angeles'),
  city('San Diego, CA, USA', 32.7157, -117.1611, 'America/Los_Angeles'),
  city('Portland, OR, USA', 45.5152, -122.6784, 'America/Los_Angeles'),
  city('Seattle, WA, USA', 47.6062, -122.3321, 'America/Los_Angeles'),
  city('Reno, NV, USA', 39.5296, -119.8138, 'America/Los_Angeles'),
  city('Las Vegas, NV, USA', 36.1699, -115.1398, 'America/Los_Angeles'),
  city('Phoenix, AZ, USA', 33.4484, -112.074, 'America/Phoenix'),
  city('Denver, CO, USA', 39.7392, -104.9903, 'America/Denver'),
  city('Salt Lake City, UT, USA', 40.7608, -111.891, 'America/Denver'),
  city('Austin, TX, USA', 30.2672, -97.7431, 'America/Chicago'),
  city('Dallas, TX, USA', 32.7767, -96.797, 'America/Chicago'),
  city('Houston, TX, USA', 29.7604, -95.3698, 'America/Chicago'),
  city('Chicago, IL, USA', 41.8781, -87.6298, 'America/Chicago'),
  city('Minneapolis, MN, USA', 44.9778, -93.265, 'America/Chicago'),
  city('New Orleans, LA, USA', 29.9511, -90.0715, 'America/Chicago'),
  city('Atlanta, GA, USA', 33.749, -84.388, 'America/New_York'),
  city('Miami, FL, USA', 25.7617, -80.1918, 'America/New_York'),
  city('Detroit, MI, USA', 42.3314, -83.0458, 'America/Detroit'),
  city('Washington, DC, USA', 38.9072, -77.0369, 'America/New_York'),
  city('Philadelphia, PA, USA', 39.9526, -75.1652, 'America/New_York'),
  city('New York, NY, USA', 40.7128, -74.006, 'America/New_York'),
  city('Boston, MA, USA', 42.3601, -71.0589, 'America/New_York'),
  city('Anchorage, AK, USA', 61.2181, -149.9003, 'America/Anchorage'),
  city('Honolulu, HI, USA', 21.3069, -157.8583, 'Pacific/Honolulu'),
  city('Vancouver, Canada', 49.2827, -123.1207, 'America/Vancouver'),
  city('Toronto, Canada', 43.6532, -79.3832, 'America/Toronto'),
  city('Montreal, Canada', 45.5017, -73.5673, 'America/Toronto'),
  city('Mexico City, Mexico', 19.4326, -99.1332, 'America/Mexico_City'),
  city('Havana, Cuba', 23.1136, -82.3666, 'America/Havana'),
  city('Bogotá, Colombia', 4.711, -74.0721, 'America/Bogota'),
  city('Lima, Peru', -12.0464, -77.0428, 'America/Lima'),
  city('São Paulo, Brazil', -23.5505, -46.6333, 'America/Sao_Paulo'),
  city(
    'Buenos Aires, Argentina',
    -34.6037,
    -58.3816,
    'America/Argentina/Buenos_Aires',
  ),
  city('London, UK', 51.5074, -0.1278, 'Europe/London'),
  city('Dublin, Ireland', 53.3498, -6.2603, 'Europe/Dublin'),
  city('Edinburgh, UK', 55.9533, -3.1883, 'Europe/London'),
  city('Paris, France', 48.8566, 2.3522, 'Europe/Paris'),
  city('Amsterdam, Netherlands', 52.3676, 4.9041, 'Europe/Amsterdam'),
  city('Berlin, Germany', 52.52, 13.405, 'Europe/Berlin'),
  city('Madrid, Spain', 40.4168, -3.7038, 'Europe/Madrid'),
  city('Barcelona, Spain', 41.3874, 2.1686, 'Europe/Madrid'),
  city('Lisbon, Portugal', 38.7223, -9.1393, 'Europe/Lisbon'),
  city('Rome, Italy', 41.9028, 12.4964, 'Europe/Rome'),
  city('Venice, Italy', 45.4408, 12.3155, 'Europe/Rome'),
  city('Vienna, Austria', 48.2082, 16.3738, 'Europe/Vienna'),
  city('Prague, Czechia', 50.0755, 14.4378, 'Europe/Prague'),
  city('Stockholm, Sweden', 59.3293, 18.0686, 'Europe/Stockholm'),
  city('Athens, Greece', 37.9838, 23.7275, 'Europe/Athens'),
  city('Istanbul, Türkiye', 41.0082, 28.9784, 'Europe/Istanbul'),
  city('Moscow, Russia', 55.7558, 37.6173, 'Europe/Moscow'),
  city('Cairo, Egypt', 30.0444, 31.2357, 'Africa/Cairo'),
  city('Lagos, Nigeria', 6.5244, 3.3792, 'Africa/Lagos'),
  city('Nairobi, Kenya', -1.2921, 36.8219, 'Africa/Nairobi'),
  city('Johannesburg, South Africa', -26.2041, 28.0473, 'Africa/Johannesburg'),
  city('Tel Aviv, Israel', 32.0853, 34.7818, 'Asia/Jerusalem'),
  city('Dubai, UAE', 25.2048, 55.2708, 'Asia/Dubai'),
  city('Mumbai, India', 19.076, 72.8777, 'Asia/Kolkata'),
  city('Delhi, India', 28.7041, 77.1025, 'Asia/Kolkata'),
  city('Bangkok, Thailand', 13.7563, 100.5018, 'Asia/Bangkok'),
  city('Singapore', 1.3521, 103.8198, 'Asia/Singapore'),
  city('Manila, Philippines', 14.5995, 120.9842, 'Asia/Manila'),
  city('Hong Kong', 22.3193, 114.1694, 'Asia/Hong_Kong'),
  city('Beijing, China', 39.9042, 116.4074, 'Asia/Shanghai'),
  city('Shanghai, China', 31.2304, 121.4737, 'Asia/Shanghai'),
  city('Taipei, Taiwan', 25.033, 121.5654, 'Asia/Taipei'),
  city('Seoul, South Korea', 37.5665, 126.978, 'Asia/Seoul'),
  city('Tokyo, Japan', 35.6762, 139.6503, 'Asia/Tokyo'),
  city('Sydney, Australia', -33.8688, 151.2093, 'Australia/Sydney'),
  city('Melbourne, Australia', -37.8136, 144.9631, 'Australia/Melbourne'),
  city('Auckland, New Zealand', -36.8485, 174.7633, 'Pacific/Auckland'),
]

export function cityById(id: string): BirthCity | null {
  return BIRTH_CITIES.find((entry) => entry.id === id) ?? null
}
