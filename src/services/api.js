import axios from 'axios';

// Configure axios instance for Overpass API
const overpassAPI = axios.create({
  baseURL: 'https://overpass-api.de/api/',
  timeout: 30000,
});

// Configure axios instance for Nominatim API
const nominatimAPI = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org/',
  timeout: 10000,
  headers: {
    'User-Agent': 'Catholic-Church-Map/1.0',
  },
});

// Implement exponential backoff for retries
const fetchWithRetry = async (apiFn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const geocodeAddress = async (address) => {
  try {
    const response = await fetchWithRetry(() =>
      nominatimAPI.get('search', {
        params: {
          format: 'json',
          q: address,
          limit: 1,
        },
      })
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('Address not found. Please try a different address or format.');
    }

    return [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 429:
          throw new Error('Too many requests. Please try again in a few minutes.');
        case 503:
          throw new Error('Geocoding service temporarily unavailable. Please try again later.');
        default:
          throw new Error('Failed to geocode address. Please check the address and try again.');
      }
    }
    throw error;
  }
};

export const fetchChurches = async (lat, lon, radius) => {
  const query = `
    [out:json][timeout:60];
    (
      way["building"="church"]["denomination"="catholic"](around:${radius},${lat},${lon});
      relation["building"="church"]["denomination"="catholic"](around:${radius},${lat},${lon});
      node["building"="church"]["denomination"="catholic"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="christian"]["denomination"="catholic"](around:${radius},${lat},${lon});
      relation["amenity"="place_of_worship"]["religion"="christian"]["denomination"="catholic"](around:${radius},${lat},${lon});
      node["amenity"="place_of_worship"]["religion"="christian"]["denomination"="catholic"](around:${radius},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetchWithRetry(() =>
      overpassAPI.post('interpreter', query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );

    if (!response.data || !response.data.elements) {
      throw new Error('No church data found in the response');
    }

    return response.data.elements.map(element => ({
      id: element.id,
      name: element.tags?.name || 'Unnamed Catholic Church',
      denomination: element.tags?.denomination || 'Catholic',
      address: formatAddress(element.tags),
      lat: element.lat || element.center?.lat,
      lon: element.lon || element.center?.lon,
      website: element.tags?.website || null,
      phone: element.tags?.phone || null,
      massSchedule: element.tags?.['service:schedule'] || null,
    }));
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 504:
          throw new Error('Search timeout. Please try a smaller search radius.');
        case 400:
          throw new Error('Invalid search parameters. Please check your input.');
        default:
          throw new Error(`Failed to fetch churches: ${error.response.status}`);
      }
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Failed to fetch churches. Please try again later.');
  }
};

const formatAddress = (tags) => {
  if (!tags) return 'Address not available';
  
  const components = [];
  if (tags['addr:street']) {
    components.push(tags['addr:housenumber'] 
      ? `${tags['addr:street']} ${tags['addr:housenumber']}`
      : tags['addr:street']);
  }
  if (tags['addr:city']) components.push(tags['addr:city']);
  if (tags['addr:postcode']) components.push(tags['addr:postcode']);
  
  return components.length > 0 ? components.join(', ') : 'Address not available';
};