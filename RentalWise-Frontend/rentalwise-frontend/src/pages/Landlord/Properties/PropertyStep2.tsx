import type { PropertyFormData } from './AddProperty';

type Props = {
  data: PropertyFormData;                               // Current form data passed from parent
  updateForm: (fields: Partial<PropertyFormData>) => void; // Function to update parent form state partially
  onNext: () => void;                                   // Callback to go to next step
  onBack: () => void;                                   // Callback to go back to previous step
};

// List of property features mapped to values matching C# backend enum flags (bitwise)
const featuresList = [
  { label: 'Garage', value: 1 },
  { label: 'Ensuite Bathroom', value: 2 },
  { label: 'Study', value: 4 },
  { label: 'Separate Toilet', value: 8 },
];

export default function PropertyStep2({ data, updateForm, onNext, onBack }: Props) {
  // Toggle feature selection using XOR (bitwise toggle)
  // If the feature is already selected, this removes it; otherwise adds it
  const toggleFeature = (value: number) => {
    const current = data.features || 0;
    const newFeatures = current ^ value; // XOR toggles the bit on/off
    updateForm({ features: newFeatures });
  };

  // Called when user clicks Next button to submit this step
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Name input */}
      <input
        type="text"
        placeholder="Property Name"
        value={data.name}
        onChange={(e) => updateForm({ name: e.target.value })}
        className="w-full border p-2 rounded"
        required
      />

      {/* Bedrooms, Bathrooms, Parking Spaces selectors */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-medium">Bedrooms</label>
          <select
            value={data.bedrooms}
            onChange={(e) => updateForm({ bedrooms: Number(e.target.value) })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Bathrooms</label>
          <select
            value={data.bathrooms}
            onChange={(e) => updateForm({ bathrooms: Number(e.target.value) })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Parking Spaces</label>
          <select
            value={data.parkingSpaces}
            onChange={(e) => updateForm({ parkingSpaces: Number(e.target.value) })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select</option>
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Property Features checkboxes */}
      <div>
        <label className="block mb-2 font-medium">Property Features</label>
        <div className="grid grid-cols-2 gap-2">
          {featuresList.map((feature) => (
            <label key={feature.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                // Check if feature bit is set in current features value
                checked={((data.features ?? 0) & feature.value) !== 0}
                onChange={() => toggleFeature(feature.value)}
                className="accent-blue-600"
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pets Allowed checkbox and Rent Amount input side-by-side */}
      <div className="flex items-center justify-between">
        <label className="font-medium flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.petsAllowed}
            onChange={(e) => updateForm({ petsAllowed: e.target.checked })}
            className="accent-green-600"
          />
          Pets Allowed
        </label>

        <div className="w-1/2">
          <label className="block mb-1 font-medium">Rent Amount (NZD)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g., 650.00"
            value={data.rentAmount}
            onChange={(e) => updateForm({ rentAmount: parseFloat(e.target.value) })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
      </div>

      {/* Navigation buttons: Back and Next */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </form>
  );
}
