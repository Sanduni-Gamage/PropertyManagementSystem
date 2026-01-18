import { useState, useEffect } from 'react';
import type { PropertyFormData } from './AddProperty';
import api from '../../../services/api';
import { fetchCoordinates } from '../../../utils/geocoding';
import axios from 'axios';

type Props = {
  data: PropertyFormData;                          // Current form data from parent
  updateForm: (fields: Partial<PropertyFormData>) => void;  // Function to update form state in parent
  onNext: () => void;                              // Callback to move to next step
};

// Type representing a suggestion from LocationIQ autocomplete API
type Suggestion = {
  display_name: string;  // Full formatted address
  address: {
    suburb?: string;     // Suburb or neighborhood or city extracted from address details
    neighbourhood?: string;
    city?: string;
  };
};

// Map property type enum (number) to string names shown in dropdown
const propertyTypeMap: { [key: number]: string } = {
  0: 'Apartment',
  1: 'CarPark',
  2: 'House',
  3: 'Townhouse',
  4: 'Unit',
};

// Reverse map from string dropdown values back to enum numbers
const reversePropertyTypeMap: { [key: string]: number } = {
  Apartment: 0,
  CarPark: 1,
  House: 2,
  Townhouse: 3,
  Unit: 4,
};

export default function PropertyStep1({ data, updateForm, onNext }: Props) {
  // Controlled input state for address search query
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(data.address || '');
  }, [data.address]);

  // List of autocomplete suggestions from LocationIQ
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Store detected suburb name to display for user confirmation
  const [suburbName, setSuburbName] = useState('');

  // Called on every change to the address input box
  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text) {
      setSuggestions([]);
      return;
    }

    try {
      // Call LocationIQ autocomplete API to get address suggestions
      const res = await axios.get('https://api.locationiq.com/v1/autocomplete', {
        params: {
          key: import.meta.env.VITE_LOCATIONIQ_API_KEY, // Your LocationIQ API key from env
          q: text,
          countrycodes: 'nz',    // Limit to New Zealand addresses
          limit: 5,             // Max 5 suggestions
          addressdetails: 1,    // Return detailed address components
        },
      });

      setSuggestions(res.data);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  // Called when user clicks one of the address suggestions
  const handleSelect = async (suggestion: Suggestion) => {
    // Full formatted address string
    const fullAddress = suggestion.display_name;

    // Try to extract suburb or fallback to neighborhood or city
    const suburb =
      suggestion.address.suburb ||
      suggestion.address.neighbourhood ||
      suggestion.address.city ||
      '';

    // Update the input box with the selected full address and clear suggestions dropdown
    setQuery(fullAddress);
    setSuggestions([]);

    // Update parent's form data with the selected address string
    updateForm({ address: fullAddress });

    // If suburb detected, update local state and fetch suburb ID from backend
    if (suburb) {
      setSuburbName(suburb);
      try {
        // Call your backend to get suburb ID by name
        const response = await api.get(`/locations/suburbs/search?name=${encodeURIComponent(suburb)}`);
        if (response.data?.id) {
          // Update parent's form data with matched suburbId
          updateForm({ suburbId: response.data.id });
        }
      } catch (err) {
        console.error('Suburb match failed:', err);
      }
    }

    // Get coordinates and update form
  try {
    const coords = await fetchCoordinates(fullAddress);
    updateForm({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch (err) {
    console.error('Geocoding failed:', err);
  }
  };

  // Called when user clicks "Next" button to submit this step
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to next step in parent
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {/* Address input */}
      <label className="block font-medium">Address</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Start typing NZ address..."
        required
      />

      {/* Dropdown of autocomplete suggestions */}
      {suggestions.length > 0 && (
        <ul className="absolute bg-white z-10 border rounded shadow w-full max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
      {/* Property Type dropdown */}
      <label className="block font-medium">Property Type</label>
      <select
        name="propertyType"
        value={propertyTypeMap[data.propertyType] || ''}
        onChange={(e) => updateForm({ propertyType: reversePropertyTypeMap[e.target.value] })}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Property Type</option>
        {Object.entries(reversePropertyTypeMap).map(([name, value]) => (
          <option key={value} value={name}>
            {name}
          </option>
        ))}
      </select>
      </div>

      {/* Available date input */}
      <div>
      <label className="block font-medium">Available Date</label>
      <input
        type="date"
        name="availableDate"
        value={data.availableDate}
        onChange={(e) => updateForm({ availableDate: e.target.value })}
        className="w-full border p-2 rounded"
        required
      />
</div>
</div>

      {/* Show detected suburb below inputs */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        {suburbName && <span>Detected suburb: {suburbName}</span>}
      </div>

      {/* Next button to go to Step 2 */}
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Next
        </button>
      </div>
    </form>
  );
}
