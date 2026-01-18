import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/services/api';
import ImageSlider from '../components/UI/ImageSlider';
import type { Property } from '../types/Property';
//import { useSearch } from '../context/SearchContext';
import SortDropdown from '../components/SortDropdown';
import MapWithProperties from '../components/MapWithProperties';
import { TbBed, TbBath, } from 'react-icons/tb';
import { MdOutlineDirectionsCar } from 'react-icons/md';
import { FaMapMarkedAlt} from "react-icons/fa";
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';


export default function RentalPropertyList() {
 // const { filters } = useSearch();
 const filters = useSelector((state: RootState) => state.search);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10; // fixed page size, can make configurable if you want
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedMarkerProperty, setSelectedMarkerProperty] = useState<Property | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [flyToCoordinates, setFlyToCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();
  
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build payload with pagination + filters
      const payload = {
        ...filters,
        pageNumber,
        pageSize,
      };
  
      // Clean null/empty values
      Object.keys(payload).forEach((key) => {
        const k = key as keyof typeof payload;
        if (payload[k] == null || payload[k] === '') {
          delete payload[k];
        }
      });
  
      // Use POST with JSON body instead of GET with query params
      const response = await api.post('/Properties/search', payload);
  
      setProperties(response.data.items);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  
    // Refetch properties whenever filters or page changes
    useEffect(() => {
      setPageNumber(1); // Reset to first page whenever filters change
    }, [filters]);
  
    useEffect(() => {
      fetchProperties();
    }, [filters, pageNumber]);

    const handleMarkerClick = (id: number) => {
      const selected = properties.find(p => p.id === id) || null;
      setSelectedMarkerProperty(selected);
    };
  
    const totalPages = Math.ceil(totalCount / pageSize);
  
    return (
      <div className="p-2">
        
  
        {loading && <p className="text-center mt-10">Loading properties...</p>}
  
        {error && <p className="text-center mt-10 text-red-600">{error}</p>}
  
        {!loading && !error && properties.length === 0 && (
          <p className="text-center mt-10 text-gray-500">No properties found.</p>
        )}
  
        {!loading && !error && properties.length > 0 && (
          <>
           
  
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
              {/* Map on the left */}
              <div className="hidden lg:block sticky top-20 h-[600px]">
              <MapWithProperties
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={setHoveredPropertyId}
                flyToCoordinates={flyToCoordinates}
                selectedMarkerProperty={selectedMarkerProperty}
                mapHeight="h-[600px]"
                mapWidth="w-full"
              />
              </div>
            
              {/* Right Side - Header + Cards */}
              <div className="flex flex-col space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-2xl font-semibold">
                    Rental Listings {filters.regionName} {filters.districtName} {filters.suburbNames}
                  </h1>
                  <div className="flex gap-4">
                    <SortDropdown />
                    <button
                      onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      {viewMode === 'card' ? 'List View' : 'Card View'}
                    </button>
                  </div>
                </div>
                           
                {/* Property Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map(property => (
                    <div
                      key={property.id}
                      onClick={() => navigate(`/properties/public/${property.id}`)}
                     onMouseEnter={() => setHoveredPropertyId(property.id)}
                     onMouseLeave={() => setHoveredPropertyId(null)}
                     className={`cursor-pointer border rounded-lg shadow hover:shadow-lg transition duration-200 ${
                     property.id === hoveredPropertyId ? 'shadow hover:shadow-lg transition duration-200' : ''
                      }`}
                      >
                      <ImageSlider
                        images={property.media.filter(m => m.mediaType === 'image').map(m => m.url)}
                        heightClass="h-48"
                      />
                      <div className="p-4 space-y-1">
                      <div className="flex justify-between items-center">
    <h2 className="text-lg font-semibold">{property.name}</h2>
    {property.latitude && property.longitude && (
      <button
        onClick={(e) =>{
          e.stopPropagation(); 
          setFlyToCoordinates({ lat: property.latitude!, lng: property.longitude! });
        }}
        className="text-blue-600 hover:text-blue-800 transition"
        title="View on Map"
      >
        <FaMapMarkedAlt className="text-xl" />
      </button>
    )}
  </div>

                        <p className="text-sm text-gray-600">
                          {property.address}
                        </p>
                       
                         {/* Features Row with Icons */}
                         <div className="flex justify-between items-center">
        <div className="flex gap-4 text-gray-700 font-semibold text-sm items-center">
          <span className="flex items-center gap-1">
            <TbBed className="text-lg" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <TbBath className="text-lg" /> {property.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <MdOutlineDirectionsCar className="text-lg" />{' '}
            {property.parkingSpaces}
          </span>
        </div>
        <p className="text-base text-gray-800 font-semibold">${property.rentAmount}</p>
        </div>
                        <p className="text-sm text-gray-600">
                          Available: {new Date(property.availableDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            ) : (
              <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-semibold">
            Rental Listings {filters.regionName} {filters.districtName} {filters.suburbNames}
          </h1>
          <div className="flex gap-4">
            <SortDropdown />
            <button
              onClick={() => setViewMode('card')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Card View
            </button>
          </div>
        </div>
              <div className="space-y-6">
                
                {properties.map(property => (
                  <div
                    key={property.id}
                    className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/properties/public/${property.id}`)}
                  >
                    <ImageSlider
                      images={property.media.filter(m => m.mediaType === 'image').map(m => m.url)}
                      heightClass="h-80"
                    />
                    <div className="p-4 sm:flex sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                      <div>
                        <h2 className="text-xl font-semibold text-blue-800">{property.name}</h2>
                        <p className="text-sm text-gray-600 mt-1">{property.address}, {property.suburb.name}</p>
                        <p className="text-sm text-blue-600 font-medium mt-1">${property.rentAmount}/week</p>
                        <div className="flex gap-4 text-sm text-gray-700 mt-2">
                          <span>{property.bedrooms} 🛏</span>
                          <span>{property.bathrooms} 🛁</span>
                          <span>{property.parkingSpaces} 🚗</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Available: {new Date(property.availableDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
  
            {/* Pagination Controls */}
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Prev
              </button>
  
              <span>
                Page {pageNumber} of {totalPages}
              </span>
  
              <button
                onClick={() => setPageNumber(p => Math.min(p + 1, totalPages))}
                disabled={pageNumber === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
  
        
      </div>
    );
  }