import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setFilters } from '../slices/searchSlice';

const SortDropdown = () => {
  const dispatch = useDispatch();
  const filters = useSelector((state: RootState) => state.search);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilters({ sortBy: e.target.value }));
  };

  return (
    <select
      value={filters.sortBy}
      onChange={handleChange}
      className="px-3 py-2 bg-transparent rounded text-sm text-gray-700 hover:bg-gray-100 font-semibold border border-gray-400 focus:outline-none focus:ring-2 focus:border-blue-700"
    >
      <option value="latest">Latest Listings</option>
      <option value="price-asc">Lowest Price</option>
      <option value="price-desc">Highest Price</option>
    </select>
  );
};

export default SortDropdown;
