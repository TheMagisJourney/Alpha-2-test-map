import React, { useState } from 'react';

// Mock church data since we can't make external API calls in this environment
const mockChurches = [
  {
    id: 1,
    name: "St. Mary's Cathedral",
    denomination: "Roman Catholic",
    address: "123 Main St",
    lat: 40.7128,
    lon: -74.0060
  },
  {
    id: 2,
    name: "St. Patrick's Church",
    denomination: "Roman Catholic",
    address: "456 Church Ave",
    lat: 40.7589,
    lon: -73.9851
  },
  {
    id: 3,
    name: "Holy Trinity Church",
    denomination: "Roman Catholic",
    address: "789 Trinity Blvd",
    lat: 40.7549,
    lon: -73.9840
  }
];

const App = () => {
  const [selectedView, setSelectedView] = useState('list');
  const [selectedChurch, setSelectedChurch] = useState(null);

  const renderMap = () => (
    <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📍</div>
        <p className="text-gray-500">Map view would display here with church markers</p>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-4">
      {mockChurches.map(church => (
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
};

export default App;