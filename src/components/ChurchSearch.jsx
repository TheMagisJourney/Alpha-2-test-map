import React, { useState } from 'react';
import churchService from '../services/churchService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ChurchSearch = ({ onChurchesFound, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchChurches = async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      const churches = await churchService.fetchNearbyChurches(lat, lon);
      onChurchesFound(churches);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    if (error.message.includes('timeout')) {
      return 'The search took too long. Please try again or search in a smaller area.';
    }
    if (error.message.includes('rate limit')) {
      return 'Too many searches too quickly. Please wait a moment and try again.';
    }
    return 'Unable to find churches. Please check your connection and try again.';
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Rest of your search UI components */}
      
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default ChurchSearch;