import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import AddProperty from './AddProperty';
import PopModal from '../../../components/UI/PopModal';
import ImageSlider from '../../../components/UI/ImageSlider';
import { convertToFormFormat } from '../../../utils/convertToFormFormat';
import type { Property } from '../../../types/Property';
import { toast } from 'react-toastify';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { TbBed, TbBath, } from 'react-icons/tb';
import { MdOutlineDirectionsCar } from 'react-icons/md';

export default function LandlordPropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10; // fixed page size, can make configurable if you want
  const [totalCount, setTotalCount] = useState(0);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();
  
  const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/Properties/my', {
          params: { pageNumber, pageSize },
        });
        setProperties(response.data.items);
        setTotalCount(response.data.totalCount);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
 useEffect(() => {
    fetchProperties();
  }, [pageNumber]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
      <h1 className="text-3xl font-semibold mb-6">Your Properties</h1>
      <button
        onClick={() => setShowAddProperty(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        + Add Property
      </button>
      </div>

      {loading && <p className="text-center mt-10">Loading properties...</p>}

      {error && (
        <p className="text-center mt-10 text-red-600">{error}</p>
      )}

      {!loading && !error && properties.length === 0 && (
        <p className="text-center mt-10 text-gray-500">No properties found.</p>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
        <div className="flex justify-end mb-4">
  <button
    onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
  >
    {viewMode === 'card' ? 'List View' : 'Card View'}
  </button>
</div>
{viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/landlord/properties/${property.id}`)}
                className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition duration-200"
              >
                <ImageSlider
  images={property.media.filter(m => m.mediaType === 'image').map(m => m.url)}
  heightClass="h-48"
/>
                <div className="p-4 space-y-1">
                  <h2 className="text-lg font-semibold">{property.name}</h2>
                  <button
    className="text-sm text-blue-500 hover:text-blue-800 transition duration-200"
    onClick={(e) => {
      e.stopPropagation();
      setEditingProperty(property);
      setShowAddProperty(true);
    }}
  >
    <FaEdit className="h-6 w-6" />
    
  </button>
  <button
  className="text-sm text-red-500 hover:text-red-800 transition duration-200"
  onClick={(e) => {
    e.stopPropagation();
    setPropertyToDelete(property); // Trigger confirmation modal
  }}
>
<MdDelete className="h-6 w-6" />
</button>
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
) : (
  <div className="space-y-6">
  {properties.map((property) => (
    <div
      key={property.id}
      className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
      onClick={() => navigate(`/landlord/properties/${property.id}`)}
    >
      {/* Image Section */}
      <ImageSlider
  images={property.media.filter(m => m.mediaType === 'image').map(m => m.url)}
  heightClass="h-96"
/>

      {/* Details Section */}
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

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            className="text-blue-500 hover:text-blue-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              setEditingProperty(property);
              setShowAddProperty(true);
            }}
          >
            <FaEdit className="h-5 w-5" />
          </button>
          <button
            className="text-red-500 hover:text-red-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              setPropertyToDelete(property);
            }}
          >
            <MdDelete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

)}
          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
              disabled={pageNumber === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span>
              Page {pageNumber} of {totalPages}
            </span>

            <button
              onClick={() => setPageNumber((p) => Math.min(p + 1, totalPages))}
              disabled={pageNumber === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Full-screen Drawer */}
      <PopModal
  isOpen={showAddProperty}
  onClose={() =>{ 
    setShowAddProperty(false)
    
    setEditingProperty(null); // reset on close
  }}
  title={editingProperty ? 'Edit Property' : 'Add New Property'}
>
{showAddProperty && ( <AddProperty
    onSuccess={() => {
      setShowAddProperty(false);
      setEditingProperty(null); // reset on success
      fetchProperties();; // Refresh the list
    }}
    onClose={() => {
      setShowAddProperty(false);
      setEditingProperty(null);
    }}
    initialFormData={
      editingProperty ? convertToFormFormat(editingProperty) : undefined
    }
  />
  )}
</PopModal>

<PopModal
  isOpen={propertyToDelete !== null}
  onClose={() => setPropertyToDelete(null)}
  title="Confirm Deletion"
>
  <div className="text-center">
    <p className="mb-4 text-gray-700">
      Are you sure you want to delete <strong>{propertyToDelete?.name}</strong>?<br />
      This action cannot be undone.
    </p>
    <div className="flex justify-center gap-4 mt-6">
      <button
        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        onClick={() => setPropertyToDelete(null)}
      >
        Cancel
      </button>
      <button
        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        onClick={async () => {
          if (!propertyToDelete) return;

          try {
            await api.delete(`/Properties/${propertyToDelete.id}`);
            toast.success('Property deleted successfully');
            setPropertyToDelete(null);
            // Refresh properties after delete
            setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
          } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete property. Please try again.");
          }
        }}
      >
        Yes, Delete
      </button>
    </div>
  </div>
</PopModal>

    </div>
  );
}
