import type { PropertyFormData } from './AddProperty';

type Props = {
  data: PropertyFormData;                               // Current form data passed from parent
  updateForm: (fields: Partial<PropertyFormData>) => void; // Function to update parent form state partially
  onNext: () => void;                                   // Callback to go to next step
  onBack: () => void;                                   // Callback to go back to previous step
};

// List of property features mapped to values matching C# backend enum flags (bitwise)
const broadbandList = [
  { label: 'Fibre', value: 1 },
  { label: 'ADSL', value: 2 },
  { label: 'VDSL', value: 4 },
  { label: 'Wireless', value: 8 },
];

export default function PropertyStep3({ data, updateForm, onNext, onBack }: Props) {
  // Toggle feature selection using XOR (bitwise toggle)
  // If the feature is already selected, this removes it; otherwise adds it
  const toggleBroadband = (value: number) => {
    const current = data.broadband || 0;
    const newBroadbandTypes = current ^ value; // XOR toggles the bit on/off
    updateForm({ broadband: newBroadbandTypes });
  };

  // Called when user clicks Next button to submit this step
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
     {/* Furnishings input */}
<div>
  <label className="block font-medium mb-2">Is the property furnished?</label>
  <div className="flex gap-4 mb-4">
    <button
      type="button"
      className={`px-4 py-2 rounded border ${data.furnishings === "None" ? "bg-blue-600 text-white" : "bg-white"}`}
      onClick={() => updateForm({ furnishings: "None" })}
    >
      No
    </button>
    <button
      type="button"
      className={`px-4 py-2 rounded border ${data.furnishings !== "None" ? "bg-blue-600 text-white" : "bg-white"}`}
      onClick={() => {
        // If user says Yes, but no details entered yet → set to empty string so we know it's furnished
        updateForm({ furnishings: data.furnishings === "None" ? "" : data.furnishings });
      }}
    >
      Yes
    </button>
  </div>

  {/* Only show details input if "Yes" */}
  {data.furnishings !== "None" && (
    <input
      type="text"
      placeholder="Furnishing details (e.g. Sofa, Bed, Dining Table)"
      value={data.furnishings}
      onChange={(e) => updateForm({ furnishings: e.target.value })}
      className="w-full border p-2 rounded"
    />
  )}
</div>


      
      <div className="grid grid-cols-3 gap-4">
        {/* Maximum Tenants */}
        <div>
          <label className="block mb-1 font-medium">Maximum Tenants</label>
          <select
            value={data.maximumTenants}
            onChange={(e) => updateForm({ maximumTenants: Number(e.target.value) })}
            className="w-full border p-2 rounded"
            
          >
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Broadband checkboxes */}
      <div>
        <label className="block mb-2 font-medium">Broadband Types</label>
        <div className="grid grid-cols-2 gap-2">
          {broadbandList.map((broadbandtype) => (
            <label key={broadbandtype.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                // Check if feature bit is set in current features value
                checked={((data.broadband ?? 0) & broadbandtype.value) !== 0}
                onChange={() => toggleBroadband(broadbandtype.value)}
                className="accent-blue-600"
              />
              <span>{broadbandtype.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Smoke Alarm */}
      <div className="flex items-center justify-between">
        <label className="font-medium flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.smokeAlarm}
            onChange={(e) => updateForm({ smokeAlarm: e.target.checked })}
            className="accent-green-600"
          />
          Smoke Alarm
        </label>

        
      </div>
        
      </div>

      {/* Description */}
      <label className="block font-medium">Property Description</label>
      <input
        type="text"
        placeholder="Add a breif description about the property"
        value={data.description}
        onChange={(e) => updateForm({ description: e.target.value })}
        className="w-full border p-2 rounded"
        
      />
     

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
