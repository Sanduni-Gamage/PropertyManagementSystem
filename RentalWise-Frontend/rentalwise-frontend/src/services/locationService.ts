import api from './api';

export const fetchRegions = () => api.get('/Locations/regions');
export const fetchDistricts = (regionId: number) => api.get(`/Locations/regions/${regionId}/districts`);
export const fetchSuburbs = (districtId: number) => api.get(`/Locations/districts/${districtId}/suburbs`);
