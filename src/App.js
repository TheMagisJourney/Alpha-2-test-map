import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

function App() {
  const [churches, setChurches] = useState([]);
  const [selectedView, setSelectedView] = useState('map'); // 'map' or 'list'

  useEffect(() => {
    // Fetch nearby churches using Overpass API
    const fetchChurches = async () => {
      try {
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="place_of_worship"]["religion"="christian"]({{bbox}});
            way["amenity"="place_of_worship"]["religion"="christian"]({{bbox}});
            relation["amenity"="place_of_worship"]["religion"="christian"]({{bbox}});
          );
          out body;
          >;
          out skel qt;
        `;

        const response = await axios.get(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
        );

        const churchData = response.data.elements.map(element => ({
          id: element.id,
          name: element.tags.name || 'Unknown Church',
          denomination: element.tags.denomination || 'Unknown Denomination',
          address: element.tags['addr:street'] || 'Address not available',
          lat: element.lat,
          lon: element.lon
        }));

        setChurches(churchData);
      } catch (error) {
        console.error('Error fetching church data:', error);
      }
    };

    fetchChurches();
  }, []);

  const renderMap = () => (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {churches.map(church => (
        <Marker
          key={church.id}
          position={[church.lat, church.lon]}
        >
          <Popup>
            <div className="church-details">
              <h3>{church.name}</h3>
              <p>Denomination: {church.denomination}</p>
              <p>Address: {church.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );

  const renderList = () => (
    <div className="church-list">
      {churches.map(church => (
        <div key={church.id} className="church-item">
          <h3>{church.name}</h3>
          <p>Denomination: {church.denomination}</p>
          <p>Address: {church.address}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="App">
      <div className="view-toggle">
        <button
          onClick={() => setSelectedView('map')}
          className={selectedView === 'map' ? 'active' : ''}
        >
          Map View
        </button>
        <button
          onClick={() => setSelectedView('list')}
          className={selectedView === 'list' ? 'active' : ''}
        >
          List View
        </button>
      </div>
      {selectedView === 'map' ? renderMap() : renderList()}
    </div>
  );
}

export default App;