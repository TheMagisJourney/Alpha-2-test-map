import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to update map center when address changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

function App() {
  const [address, setAddress] = useState('');
  const [searchRange, setSearchRange] = useState(1000); // Default 1km radius
  const [churches, setChurches] = useState([]);
  const [selectedView, setSelectedView] = useState('map');
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to geocode address
  const geocodeAddress = async (address) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      if (response.data && response.data.length > 0) {
        return [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
      }
      throw new Error('Address not found');
    } catch (error) {
      throw new Error('Failed to geocode address');
    }
  };

  // Function to fetch churches
  const fetchChurches = async (lat, lon) => {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="christian"]
          (around:${searchRange},${lat},${lon});
        way["amenity"="place_of_worship"]["religion"="christian"]
          (around:${searchRange},${lat},${lon});
        relation["amenity"="place_of_worship"]["religion"="christian"]
          (around:${searchRange},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await axios.get(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );

      return response.data.elements.map(element => ({
        id: element.id,
        name: element.tags.name || 'Unknown Church',
        denomination: element.tags.denomination || 'Unknown Denomination',
        address: element.tags['addr:street'] || 'Address not available',
        lat: element.lat || element.center.lat,
        lon: element.lon || element.center.lon
      }));
    } catch (error) {
      throw new Error('Failed to fetch churches');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const coordinates = await geocodeAddress(address);
      setMapCenter(coordinates);
      const churchesData = await fetchChurches(...coordinates);
      setChurches(churchesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMap = () => (
    <div className="h-[600px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={mapCenter} />
        {churches.map(church => (
          <Marker
            key={church.id}
            position={[church.lat, church.lon]}
          >
            <Popup>
              <div className="church-details">
                <h3 className="font-semibold">{church.name}</h3>
                <p>Denomination: {church.denomination}</p>
                <p>Address: {church.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );

  const renderList = () => (
    <div className="space-y-4">
      {churches.map(church => (
        <div 
          key={church.id} 
          className={`p-4 rounded-lg border cursor-pointer transition-colors
            ${selectedChurch?.id === church.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setSelectedChurch(church)}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{church.name}</h3>
              <p className="text-gray-600 mt-1">{church.denomination}</p>
              <p className="text-gray-500 text-sm mt-2">
                <span className="mr-1">📍</span>
                {church.address}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Catholic Churches</h1>
        <p className="text-gray-600">Find and explore Catholic churches in your area</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Your Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your address"
              required
            />
          </div>
          <div className="md:w-48">
            <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
              Search Range (meters)
            </label>
            <select
              id="range"
              value={searchRange}
              onChange={(e) => setSearchRange(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="500">500m</option>
              <option value="1000">1km</option>
              <option value="2000">2km</option>
              <option value="5000">5km</option>
              <option value="10000">10km</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('map')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors
              ${selectedView === 'map' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="mr-2">🗺️</span>
            Map View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors
              ${selectedView === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="mr-2">📋</span>
            List View
          </button>
        </div>
      </div>

      {selectedChurch && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold">Selected Church</h4>
          <p className="text-sm text-gray-600">{selectedChurch.name} - {selectedChurch.address}</p>
        </div>
      )}

      {selectedView === 'map' ? renderMap() : renderList()}
    </div>
  );
}

export default App;