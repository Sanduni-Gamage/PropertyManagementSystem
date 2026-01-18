export const fetchCoordinates = async (address: string) => {
    const API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json`;
  
    const response = await fetch(url);
    const data = await response.json();
  
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  
    throw new Error('Coordinates not found for address');
  };
  