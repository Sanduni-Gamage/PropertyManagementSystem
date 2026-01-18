// src/components/SearchBar.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setFilters } from '../slices/searchSlice'; 
import { IoSearch } from "react-icons/io5";

export default function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault(); // Prevent page reload on form submit

    dispatch(setFilters({ keyword }));
    // Navigate to rental listings page or wherever results should show
    navigate('/rental');
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10 px-4">
      <form onSubmit={handleSearch}>
      <div className="flex items-center shadow-lg rounded overflow-hidden border border-gray-300  hover:border-blue-700">
        <input
          type="text"
          className="flex-1 px-4 py-3 text-base text-black focus:outline-none"
          placeholder="Search by address, city, or ZIP"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        >
            </input>
        <button
          type="submit"
          className="text-gray-700 hover:bg-gray-100 h-12 w-12 bg-white flex items-center"
        >
          <IoSearch className="h-6 w-6 flex-1 px-4"/>
        </button>
       
      </div>
      </form>
    </div>
  );
}
