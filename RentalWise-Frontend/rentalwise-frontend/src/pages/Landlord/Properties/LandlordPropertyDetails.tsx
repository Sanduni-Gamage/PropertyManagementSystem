import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { IoIosArrowBack } from 'react-icons/io';
import PropertyMediaGallery from '../../../components/UI/PropertMediaGallery';
import MapWithProperties from '../../../components/MapWithProperties';
import type { Property } from '../../../types/Property';
import { TbBath, TbBed, TbCalendar, TbCar, TbDog, TbHome, TbAlarmSmoke, TbSofa } from 'react-icons/tb';

const featureMap = {
  1: 'Garage',
  2: 'Ensuite Bathroom',
  4: 'Study Area',
  8: 'Seperate Toilet',
};

const propertyTypeMap: Record<number, string> = {
    0: 'Apartment',
    1: 'Car Park',
    2: 'House',
    3: 'Townhouse',
    4: 'Unit',
  };

  const broadbandMap ={
    1: 'Fibre',
    2: 'ADSL',
    4: 'VDSL',
    8: 'Wireless',
  }
  
  
export default function LandlordPropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 300; 

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/Properties/${id}`);
        setProperty(response.data);
      } catch (err) {
        console.error('Failed to fetch property:', err);
        navigate('/landlord/properties');
      }
    };

    fetchDetails();
  }, [id, navigate]);

  if (!property) return <p className="text-center mt-10">Loading property details...</p>;

  const activeFeatures = Object.entries(featureMap)
    .filter(([value]) => (property.features & Number(value)) !== 0)
    .map(([_, label]) => label);

    const activeBroadband = Object.entries(broadbandMap)
    .filter(([value]) => (property.broadband & Number(value)) !== 0)
    .map(([_, label]) => label);


  //description see more function
  const truncated = property.description.substring(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const isLong = property.description.length > MAX_LENGTH;
  const displayText =
  expanded || !isLong
    ? property.description
    : truncated.substring(0, lastSpace) + "...";

  return (
    <>
    <div className="max-w-[1400px] mx-auto p-6">
      
      <button
  onClick={() => navigate(-1)}
  className="flex items-center gap-1 text-gray-800 hover:underline mb-4 "
>
  <IoIosArrowBack className="text-3xl" />
  Back to My Properties
</button>

<div className="mb-6">
      <PropertyMediaGallery media={property.media as { url: string; mediaType: 'image' | 'video' }[]} />
      
      </div>

      <h1 className="text-gray-700 text-3xl font-bold">{property.name}</h1>
      <p className="text-gray-700 mb-3">
        {property.address}, {property.suburb.name}
      </p>
      <h2 className="text-gray-700 font-bold text-2xl mb-6">
        ${property.rentAmount} per week
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 text-lg text-gray-700 border border-gray-200 rounded-md shadow-sm overflow-hidden bg-white">
      <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbHome className="text-gray-600" />
    <span><strong>Type:</strong> {propertyTypeMap[property.propertyType] || 'Unknown'}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbBed className="text-gray-600" />
    <span><strong>Bedrooms:</strong> {property.bedrooms}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbBath className="text-gray-600" />
    <span><strong>Bathrooms:</strong> {property.bathrooms}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbCalendar className="text-gray-600" />
    <span><strong>Available:</strong> {new Date(property.availableDate).toLocaleDateString()}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbSofa className="text-gray-600" />
    <span><strong>Furnishing:</strong> {property.furnishings === "None" ? 'No' : 'Yes'}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbCar className="text-gray-600" />
    <span><strong>Parking:</strong> {property.parkingSpaces}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbCalendar className="text-gray-600" />
    <span><strong>Maximum Tenants:</strong> {property.maximumTenants}</span>
  </div>
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbDog className="text-gray-600" />
    <span><strong>Pets Allowed:</strong> {property.petsAllowed ? 'Yes' : 'No'}</span>
  </div>
  
  <div className="p-4 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2">
    <TbAlarmSmoke className="text-gray-600" />
    <span><strong>Smoke Alarm:</strong> {property.smokeAlarm ? 'Yes' : 'No'}</span>
  </div>
  
</div>

      <div className="mt-6">
        

        <div className="text-lg text-gray-600 mt-6">
  {displayText}
  {isLong && (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="ml-2 text-blue-600 hover:underline font-medium"
    >
      {expanded ? "See less" : "See more"}
    </button>
  )}
</div>

{/* --- Features --- */}
<hr className="mt-6 border border-gray-300"></hr>
        <h3 className="text-gray-700 p-1 font-semibold text-xl mt-6 border bg-gray-200 ">Other Features</h3>
        {activeFeatures.length > 0 ? (
          <ul className="list-disc list-inside mt-4 text-lg text-gray-600">
            {activeFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-gray-500">No extra features added.</p>
        )}
      

      {/* --- Furnishing --- */}
      <h3 className="text-gray-700 p-1 border bg-gray-200 font-semibold text-xl mt-4">Furnishing Details</h3>
      {property.furnishings !== "None" ? (
        <div className="text-lg text-gray-600 mt-4">
        {property.furnishings}
        </div>       
               ) : (
                <div className="text-lg text-gray-600">
                No Furnishing Details available
                </div>  
      )}
      
       {/* --- Broadband --- */}
      <h3 className="text-gray-700 p-1 border bg-gray-200 font-semibold text-xl mt-6">Broadband</h3>
      {activeBroadband.length > 0 ? (
        <ul className="list-disc list-inside mt-4 text-lg text-gray-600">
          {activeBroadband.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      ): (
        <p className="text-lg text-gray-500">No Broadband Services Added</p>
    )}
      </div>

{/* --- Map Section --- */}
      {property.latitude && property.longitude && (
  <div className="mt-6">
    <h3 className="text-gray-700 p-1 border bg-gray-200 font-semibold text-xl mb-3">Map</h3>
    
    <MapWithProperties
              properties={[property]} // only this property
              selectedPropertyId={property.id} // highlight the single marker
              hoveredPropertyId={null} // no hover in details
              onMarkerClick={() => { } } // not needed here
              onMarkerHover={() => { } } // not needed here
              flyToCoordinates={{ lat: property.latitude, lng: property.longitude }} selectedMarkerProperty={null}  
              mapHeight="h-[300px]"   // Tailwind height class
              mapWidth="w-full"  />
  
   {/*  Direction button  */}
   <div className="mt-3 text-right">
      <a
        href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
      >
        View in Google Maps
      </a>
    </div>
  </div>
)}

    </div>
    </>
  );
}
