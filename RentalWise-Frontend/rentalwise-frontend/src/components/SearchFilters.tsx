import { useEffect, useState } from 'react';
import { PropertyFeatures, PropertyTypes } from '../constants/propertyEnums';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
//import { useSearch } from '../context/SearchContext';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store'; // adjust path if needed
import { setFilters, resetFilters } from '../slices/searchSlice';

import {
  fetchRegions,
  fetchDistricts,
  fetchSuburbs,
} from '../services/locationService';

type Region = { id: number; name: string };
type District = { id: number; name: string };
type Suburb = { id: number; name: string };

export default function SearchFilters() {
  const [keyword, setKeyword] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedSuburbIds, setSelectedSuburbIds] = useState<number[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<number | null>(null);
  const [minRent, setMinRent] = useState<number | null>(null);
  const [maxRent, setMaxRent] = useState<number | null>(null);
  const [petsAllowed, setPetsAllowed] = useState<boolean | null>(null);
  const [moveInDate, setMoveInDate] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [regionName, setRegionName] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [suburbNames, setSuburbNames] = useState<string[]>([]);

  const filters = useSelector((state: RootState) => state.search);
const dispatch = useDispatch();
  
useEffect(() => {
  setSelectedRegionId(filters.regionId ?? null);
  setSelectedDistrictId(filters.districtId ?? null);
  setSelectedSuburbIds(filters.suburbIds ?? []);
  setRegionName(filters.regionName ?? null);
  setDistrictName(filters.districtName ?? null);
  setSuburbNames(filters.suburbNames ?? []);
}, [filters]);

  useEffect(() => {
    fetchRegions().then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    if (selectedRegionId !== null) {
      fetchDistricts(selectedRegionId).then(res => setDistricts(res.data));
      setSelectedDistrictId(null);
      setSuburbs([]);
      setSelectedSuburbIds([]);
    } else {
      setDistricts([]);
      setSuburbs([]);
      setSelectedDistrictId(null);
      setSelectedSuburbIds([]);
    }
  }, [selectedRegionId]);


  useEffect(() => {
    if (selectedDistrictId !== null) {
      fetchSuburbs(selectedDistrictId).then(res => setSuburbs(res.data));
      setSelectedSuburbIds([]);
    } else {
      setSuburbs([]);
      setSelectedSuburbIds([]);
    }
  }, [selectedDistrictId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-control')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleFeatureToggle = (value: number) => {
    setSelectedFeatures(prev =>
      prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
    );
  };

  const calculateFeatureValue = () =>
    selectedFeatures.reduce((acc, val) => acc | val, 0);

    const handleSearch = () => {
      const payload = {
        keyword,
        regionId: selectedRegionId,
        districtId: selectedDistrictId,
        suburbIds: selectedSuburbIds,
        propertyTypes: selectedPropertyTypes,
        propertyFeatures: selectedFeatures.length > 0 ? calculateFeatureValue() : null,
        bedrooms,
        bathrooms,
        parkingSpaces,
        minRent,
        maxRent,
        petsAllowed,
        moveInDate: moveInDate || null,
        regionName,
        districtName,
        suburbNames,
      };
      dispatch(setFilters(payload));

    };

  const handleReset = () => {
    setKeyword('');
    setSelectedRegionId(null);
    setSelectedDistrictId(null);
    setSelectedSuburbIds([]);
    setSelectedPropertyTypes([]);
    setSelectedFeatures([]);
    setBedrooms(null);
    setBathrooms(null);
    setParkingSpaces(null);
    setMinRent(null);
    setMaxRent(null);
    setPetsAllowed(null);
    setMoveInDate('');
    dispatch(resetFilters());

  };

  const toggleSelection = (
    id: number,
    selected: number[],
    setSelected: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setSelected((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((val) => val !== id)
        : [...prev, id];
  
      // Update suburb names to match selected ids
      const updatedNames = suburbs
        .filter((s) => updated.includes(s.id))
        .map((s) => s.name);
  
      setSuburbNames(updatedNames);
  
      return updated;
    });
  };

  const filterButtonClass = (isActive: boolean) =>
  `flex items-center gap-1 border px-4 py-2 h-9 rounded transition font-bold text-gray-800 ${
    isActive
    ? 'bg-blue-50 border-blue-500' 
    : 'bg-white hover:bg-gray-100 border-gray-400'
  }`;

  const filterdropdowntext = ()=> 'select select-bordered border border-gray-300 hover:border-blue-600 bg-gray-100 w-full mt-3 h-7';
  const clearText = ()=> 'text-sm text-blue-500 cursor-pointer mb-6';
  const applyButton = ()=> 'btn btn-primary w-full text-white text-center font-semibold bg-blue-600 h-9 rounded hover:bg-blue-800';
  const inputTextDesign = ()=> 'input input-bordered w-full border border-gray-300 h-10 bg-gray-50 hover:border-blue-600';

  console.log('Filters sent to backend:', {
    keyword,
    regionId: selectedRegionId,
    districtId: selectedDistrictId,
    suburbIds: selectedSuburbIds,
    propertyTypes: selectedPropertyTypes,
  });
  return (
    <>
    <hr></hr>
    <div className="bg-white shadow rounded h-18 p-4 w-full px-4  lg:px-16 mx-auto  relative">
      {/* Search Row */}
      <div className="flex flex-wrap gap-1 items-center justify-between relative">
        {/* Search Bar */}
        <div className="hidden md:block w-full  lg:max-w-xl ">
        <input
          type="text"
          placeholder="Address, neighborhood, city, or ZIP code"
          className="input input-bordered w-full px-4 h-8 border border-gray-400 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        </div>
        {/* Location Filter */}
        <div className="relative dropdown-control">
          <button className={filterButtonClass(activeDropdown === 'location')} onClick={() => toggleDropdown('location')}>Location
          <ChevronDownIcon
    className={`w-4 h-4 transition-transform duration-200 
      ${activeDropdown === 'location' ? 'rotate-180' : 'rotate-0'}`}
  />
          </button>
          {activeDropdown === 'location' && (
  <div className="absolute z-20 bg-white p-4 shadow rounded w-72 max-h-72 overflow-y-auto mt-2 space-y-3">

    {/* Region - single select */}
    <select
      className="select select-bordered w-full h-10"
      value={selectedRegionId ?? ''}
      onChange={(e) => {
        const id = e.target.value ? +e.target.value : null;
        setSelectedRegionId(id);
        const selectedRegion = regions.find((r) => r.id === id);
        setRegionName(selectedRegion?.name || null);
        setSelectedDistrictId(null); // reset district on region change
        setDistrictName(null);
        setSuburbs([]);
        setSelectedSuburbIds([]);
        setSuburbNames([]);
      }}
    >
      <option value="">Select Region</option>
      {regions.map((region) => (
        <option key={region.id} value={region.id}>
          {region.name}
        </option>
      ))}
    </select>

    {/* District - single select */}
    <select
      className="select select-bordered w-full h-10"
      value={selectedDistrictId ?? ''}
      onChange={(e) => {
        const id = e.target.value ? +e.target.value : null;
        setSelectedDistrictId(id);
        const selectedDistrict = districts.find((d) => d.id === id);
        setDistrictName(selectedDistrict?.name || null);
        setSelectedSuburbIds([]);
        setSuburbNames([]);
      }}
      disabled={!selectedRegionId}
    >
      <option value="">Select District</option>
      {districts.map((district) => (
        <option key={district.id} value={district.id}>
          {district.name}
        </option>
      ))}
    </select>

    {/* Suburbs - multiple selection using checkboxes */}
    {suburbs.length > 0 && (
      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
        <span className="block font-semibold mb-1">Suburbs</span>
        <div className="flex flex-col gap-2">
          {suburbs.map((suburb) => (
            <label key={suburb.id} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                
                checked={selectedSuburbIds.includes(suburb.id)}
                onChange={() =>
                  toggleSelection(suburb.id, selectedSuburbIds, setSelectedSuburbIds)
                }
                className="border h-5 w-5 hover:border-blue-600"
              />
              <span>{suburb.name}</span>
            </label>
            
          ))}
          
        </div>
      </div>
    )}
                     {/* Clear Text */}
    <div
      className={clearText()}
      onClick={() => {
        setSelectedRegionId(null);
        setSelectedDistrictId(null);
        setSelectedSuburbIds([]);
        handleReset();
      }}
    >
      Clear
    </div>

    {/* Apply Button */}
    <button
      className={applyButton()}
      onClick={() => {
        setActiveDropdown(null); // closes dropdown
        handleSearch(); // triggers the search
      }}
    >
      Apply
    </button>

            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="relative dropdown-control">
          <button className={filterButtonClass(activeDropdown === 'price')} onClick={() => toggleDropdown('price')}>Price
          <ChevronDownIcon
    className={`w-4 h-4 transition-transform duration-200 
      ${activeDropdown === 'price' ? 'rotate-180' : 'rotate-0'}`}
  />
          </button>
          {activeDropdown === 'price' && (
  <div className="absolute z-20 bg-white p-4 shadow rounded w-72 mt-2 space-y-2">
    <div className="grid grid-cols-2 gap-5">
      <div>
        <label className="text-base font-bold text-gray-800">Minimum</label>
        <select
          
          className={filterdropdowntext()}
          value={minRent ?? ''}
          
          onChange={(e) =>
            setMinRent(e.target.value ? +e.target.value : null)
          }
        >
          <option value="">Min Rent</option>
          {Array.from({ length: 50 }, (_, i) => 50 * (i + 1)).map((val) => (
            <option key={val} value={val}>
              ${val}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-base font-bold text-gray-800 ">Maximum</label>
        <select
          className={filterdropdowntext()}
          value={maxRent ?? ''}
          onChange={(e) =>
            setMaxRent(e.target.value ? +e.target.value : null)
          }
        >
          
          <option 
          className='text-gray-800'
          value="">Max Rent</option>
          
          {Array.from({ length: 50 }, (_, i) => 50 * (i + 1)).map((val) => (
            <option key={val} value={val}>
              ${val}
            </option>
          ))}
          
        </select>
      </div>
    </div>
            {/* Clear Text */}
    <div
      className={clearText()}
      onClick={() => {
        setMinRent(null);
        setMaxRent(null);
        handleReset();
      }}
    >
      Clear
    </div>

    {/* Apply Button */}
    <button
      className={applyButton()}
      onClick={() => {
        setActiveDropdown(null); // closes dropdown
        handleSearch(); // triggers the search
      }}
    >
      Apply
    </button>

  </div>
)}
        </div>
        
        <div className="hidden md:block">
{/* Beds & Baths */}
<div className="relative dropdown-control">
          <button className={filterButtonClass(activeDropdown === 'bedsBaths')} onClick={() => toggleDropdown('bedsBaths')}>Beds & Baths
          <ChevronDownIcon
    className={`w-4 h-4 transition-transform duration-200 
      ${activeDropdown === 'bedsBaths' ? 'rotate-180' : 'rotate-0'}`}
  />
          </button>
          {activeDropdown === 'bedsBaths' && (
    <div className="absolute z-20 bg-white p-4 shadow rounded w-96 mt-2 space-y-3">
      {/* Bedrooms */}
      <div>
        <span className="font-semibold block mb-1">Bedrooms</span>
        <div className="flex flex-wrap gap-2">
          {[null, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={`bed-${n}`}
              onClick={() => setBedrooms(n)}
              className={`px-3 py-1 rounded border text-base w-14 h-12 transition ${
                bedrooms === n
                  ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              {n === null ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bathrooms */}
      <div>
        <span className="font-semibold block mb-1">Bathrooms</span>
        <div className="flex flex-wrap gap-2">
          {[null, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={`bath-${n}`}
              onClick={() => setBathrooms(n)}
              className={`px-3 py-1 rounded border text-base w-14 h-12 transition ${
                bathrooms === n
                  ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              {n === null ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>
       {/* Clear & Apply */}
       <div>
        <div
          className={clearText()}
          onClick={() => {
            setBedrooms(null);
            setBathrooms(null);
            handleReset(); // refresh
            setActiveDropdown(null);
          }}
        >
          Clear
        </div>
        <button
          onClick={() => {
            handleSearch(); // apply
            setActiveDropdown(null);
          }}
          className={applyButton()}
        >
          Apply
        </button>
      </div>
    </div>
  )}
        </div>

        </div>

        <div className="hidden md:block">
        {/* Home Type Filter */}
        <div className="relative dropdown-control">
  <button
    className={filterButtonClass(activeDropdown === 'homeType')}
    onClick={() => toggleDropdown('homeType')}
  >
    Home Type
    <ChevronDownIcon
      className={`w-4 h-4 transition-transform duration-200 
        ${activeDropdown === 'homeType' ? 'rotate-180' : 'rotate-0'}`}
    />
  </button>

  {activeDropdown === 'homeType' && (
  <div className="absolute z-20 bg-white p-4 shadow rounded w-64 mt-2 space-y-3 max-h-72 overflow-y-auto">
    <div className="flex flex-col gap-2">
      {PropertyTypes.map((pt) => (
        <label key={pt.value} className="flex items-center gap-2">
          <input
            type="checkbox"
            className="border h-5 w-5 hover:border-blue-600"
            checked={selectedPropertyTypes.includes(pt.value)}
            onChange={() =>
              toggleSelection(pt.value, selectedPropertyTypes, setSelectedPropertyTypes)
            }
          />
          <span>{pt.label}</span>
        </label>
      ))}
    </div>

      {/* Clear & Apply */}
      <div>
        <div
          className={clearText()}
          onClick={() => {
            setSelectedPropertyTypes([]);
            handleReset(); // Refresh listings
            setActiveDropdown(null);
          }}
        >
          Clear
        </div>
        <button
          onClick={() => {
            handleSearch(); // Apply filters
            setActiveDropdown(null);
          }}
          className={applyButton()}
        >
          Apply
        </button>
      </div>
    </div>
  )}
</div>
</div>  
        
       {/* More Filters Dropdown */}
<div className="relative dropdown-control">
  <button
    className={filterButtonClass(activeDropdown === 'more')}
    onClick={() => toggleDropdown('more')}
  >
    More
    <ChevronDownIcon
      className={`w-4 h-4 transition-transform duration-200 
        ${activeDropdown === 'more' ? 'rotate-180' : 'rotate-0'}`}
    />
  </button>

  {activeDropdown === 'more' && (
    <div
    className={`
    z-50 mt-2 p-4 shadow-lg space-y-4 max-h-[75vh] overflow-y-auto 
    bg-white rounded 
    fixed inset-x-0  mx-2
    md:absolute md:right-0 md:left-auto md:top-auto md:w-96 md:mx-0
  `}
  >

      {/* Mobile-only Beds & Baths */}
<div className="block md:hidden">
  <div className="border-t pt-4 mt-4">
    <span className="font-bold text-gray-700 block mb-2">Bedrooms</span>
    <div className="flex flex-wrap gap-2 mb-4">
      {[null, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={`bed-${n}`}
          onClick={() => setBedrooms(n)}
          className={`px-3 py-1 rounded border text-base w-14 h-10 transition ${
            bedrooms === n
              ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
              : 'bg-white border-gray-300 hover:bg-gray-100'
          }`}
        >
          {n === null ? 'Any' : `${n}+`}
        </button>
      ))}
    </div>

    <span className="font-bold text-gray-700 block mb-2">Bathrooms</span>
    <div className="flex flex-wrap gap-2">
      {[null, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={`bath-${n}`}
          onClick={() => setBathrooms(n)}
          className={`px-3 py-1 rounded border text-base w-14 h-10 transition ${
            bathrooms === n
              ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
              : 'bg-white border-gray-300 hover:bg-gray-100'
          }`}
        >
          {n === null ? 'Any' : `${n}+`}
        </button>
      ))}
    </div>
  </div>
</div>

{/* Mobile-only Home Type */}
<div className="block md:hidden border-t pt-4 mt-4">
  <span className="font-bold text-gray-700 block mb-2">Home Type</span>
  <div className="flex flex-col gap-2">
    {PropertyTypes.map((pt) => (
      <label key={pt.value} className="flex items-center gap-2">
        <input
          type="checkbox"
          className="border h-5 w-5 hover:border-blue-600"
          checked={selectedPropertyTypes.includes(pt.value)}
          onChange={() =>
            toggleSelection(pt.value, selectedPropertyTypes, setSelectedPropertyTypes)
          }
        />
        <span>{pt.label}</span>
      </label>
    ))}
  </div>
</div>

      
      {/* Move-in Date */}
      <div>
        <label className="block font-semibold mb-1">Move-in Date</label>
        <input
          type="date"
          className={inputTextDesign()}
          placeholder="MM/DD/YYYY"
          value={moveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
        />
      </div>

      {/* Car Parks */}
      <div>
        <label className="block font-semibold mb-1">Car Parks</label>
        <div className="flex flex-wrap gap-2">
          {[null, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={`park-${n}`}
              onClick={() => setParkingSpaces(n)}
              className={`px-3 py-1 rounded border text-base w-14 h-12 transition ${
                parkingSpaces === n
                  ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              {n === null ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block font-semibold mb-1">Features</label>
        <div className="flex flex-col gap-2 mt-1">
          {PropertyFeatures.map((f) => (
            <label key={f.value} className="flex items-center gap-2 text-base">
              <input
                type="checkbox"
                className="border h-5 w-5 hover:border-blue-600"
                checked={selectedFeatures.includes(f.value)}
                onChange={() => handleFeatureToggle(f.value)}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pets OK */}
      <div className="flex items-center justify-between">
  <span className="font-semibold">Pets OK</span>
  <label className="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only"
      checked={petsAllowed === true}
      onChange={() =>
        setPetsAllowed((prev) => (prev === true ? null : true))
      }
    />
    <div className={`w-11 h-6 bg-gray-300 rounded-full relative transition ${petsAllowed === true ? ' bg-blue-500': 'bg-gray-300'}`}
    >
      <div
        className={`absolute left-0 top-0 h-6 w-6 bg-white border rounded-full shadow transform transition
          ${petsAllowed === true ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </div>
  </label>
</div>

{/* Clear & Apply */}
<div>
        <div
          className={clearText()}
          onClick={() => {
            setMoveInDate('');
            setParkingSpaces(null);
            setSelectedFeatures([]);
            handleReset(); // Refresh listings
            setActiveDropdown(null);
          }}
        >
          Clear
        </div>
        <button
          onClick={() => {
            handleSearch(); // Apply filters
            setActiveDropdown(null);
          }}
          className={applyButton()}
        >
          Apply
        </button>
      </div>

    </div>
  )}
  
</div>

    <div className="flex justify-end gap-4 pt-2">
      <button className="btn btn-outline" onClick={handleReset}>Reset</button>
      <button className="btn btn-primary" onClick={handleSearch}>Search</button>
    </div>
  </div>

    </div>
    <hr></hr>
    </>
  );
}