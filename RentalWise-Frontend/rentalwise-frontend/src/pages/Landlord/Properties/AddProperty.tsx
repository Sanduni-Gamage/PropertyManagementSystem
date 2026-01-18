import { useState, useEffect } from 'react';
import PropertyStep1 from './PropertyStep1';
import PropertyStep2 from './PropertyStep2';
import PropertyStep3 from './PropertyStep3';
import PropertyStep4 from './PropertyStep4';

// Define the shape of all the form data collected across steps
export type MediaItem = {
  id: number;
  url: string;
  mediaType: 'image' | 'video';
};


export type PropertyFormData = {
  id?: number;
  // Step 1 fields
  address: string;
  suburbId: number | '';
  propertyType: number;
  availableDate: string;
  latitude?: number;    
  longitude?: number;
  // Step 2 fields
  name: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  features: number;
  petsAllowed: boolean;
  rentAmount: number;
  // Step 3 fields
  furnishings: string;
  maximumTenants: number;
  broadband: number;
  smokeAlarm: boolean;
  description: string;
  // Step 4 fields
  images: File[];
  video?: File | null;

  // For editing
  imageUrls?: string[];
  videoUrl?: string;

  //Needed for handling deletion of individual media
  media?: MediaItem[];
};

const emptyForm: PropertyFormData = {
  address: '',
  suburbId: 0,
  propertyType: 0,
  availableDate: '',
  latitude: 0,           
  longitude: 0,

  name: '',
  bedrooms: 0,
  bathrooms: 0,
  parkingSpaces: 0,
  features: 0,
  petsAllowed: false,
  rentAmount: 0,

  furnishings:'',
  maximumTenants: 0,
  broadband: 0,
  smokeAlarm: false,
  description:'',

  images: [],
  video: null,

  imageUrls: [],
  videoUrl: '',

  
};

type AddPropertyProps = {
  onSuccess?: () => void;
  onClose?: () => void;
  initialFormData?: Partial<PropertyFormData>;
};

export default function AddProperty({ onSuccess, onClose, initialFormData }: AddPropertyProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(emptyForm);

  useEffect(() => {
    if (initialFormData) {
      console.log("Received initialFormData:", initialFormData); //  check
      setFormData(prev => ({ ...prev, ...initialFormData }));
    }
  }, [initialFormData]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateForm = (update: Partial<PropertyFormData> | ((prev: PropertyFormData) => Partial<PropertyFormData>)) => {
    setFormData(prev =>
      typeof update === 'function' ? { ...prev, ...update(prev) } : { ...prev, ...update }
    );
  };
  

  const submitForm = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <>
      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-12 gap-6">
          {[1, 2, 3, 4].map((id, index) => {
            const labels = ['Basic Info', 'Details', 'Additional Info', 'Media Upload'];
            const isCompleted = step > id;
            const isActive = step === id;

            return (
              <div key={id} className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {isCompleted ? '✓' : id}
                </div>
                <span
                  className={`mt-2 text-sm sm:text-base font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {labels[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Steps */}
      {step === 1 && (
        <PropertyStep1 data={formData} onNext={nextStep} updateForm={updateForm} />
      )}
      {step === 2 && (
        <PropertyStep2 data={formData} onNext={nextStep} onBack={prevStep} updateForm={updateForm} />
      )}
      {step === 3 && (
        <PropertyStep3 data={formData} onNext={nextStep} onBack={prevStep} updateForm={updateForm} />
      )}
      {step === 4 && (
        <PropertyStep4 data={formData} onSubmit={submitForm} onBack={prevStep} updateForm={updateForm} />
      )}
    </>
  );
}
