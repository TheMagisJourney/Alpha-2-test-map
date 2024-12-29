// Church data fetching service

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const BACKUP_API_URL = 'https://lz4.overpass-api.de/api/interpreter';
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

class ChurchService {
  constructor() {
    this.lastRequestTime = 0;
  }

  async fetchNearbyChurches(lat, lon, radius = 5000) {
    const query = `
      [out:json][timeout:25];
      (
        way["building"="church"]["denomination"="catholic"](around:${radius},${lat},${lon});
        relation["building"="church"]["denomination"="catholic"](around:${radius},${lat},${lon});
        node["amenity"="place_of_worship"]["denomination"="catholic"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    return this.makeRequestWithRetry(query);
  }

  async makeRequestWithRetry(query, retryCount = 3) {
    for (let i = 0; i < retryCount; i++) {
      try {
        // Implement rate limiting
        await this.waitForRateLimit();

        // Try primary API first
        try {
          return await this.makeRequest(OVERPASS_API_URL, query);
        } catch (error) {
          console.warn('Primary API failed, trying backup API:', error.message);
          return await this.makeRequest(BACKUP_API_URL, query);
        }
      } catch (error) {
        if (i === retryCount - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
      }
    }
  }

  async makeRequest(apiUrl, query) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return this.processChurchData(data);
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  processChurchData(data) {
    if (!data.elements || !Array.isArray(data.elements)) {
      throw new Error('Invalid data format received from API');
    }

    return data.elements.map(element => ({
      id: element.id,
      type: element.type,
      lat: element.lat || (element.center && element.center.lat),
      lon: element.lon || (element.center && element.center.lon),
      tags: element.tags || {},
      name: (element.tags && element.tags.name) || 'Unnamed Church'
    })).filter(church => church.lat && church.lon); // Ensure we have valid coordinates
  }
}

export default new ChurchService();