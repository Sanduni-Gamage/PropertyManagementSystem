import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function TenantProfileForm() {
  // Form field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // UI feedback states
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch tenant profile on mount
  useEffect(() => {
    api.get('/Tenants')
      .then(res => {
        const data = res.data;
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setGender(data.gender || '');
        setPhoneNumber(data.phoneNumber || '');
        setAddress(data.address || '');
      })
      .catch(() => {
        setError('Failed to load profile information.');
      });
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.put('/Tenants', {
        firstName,
        lastName,
        gender,
        phoneNumber,
        address,
      });
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data?.title || 'Validation failed.');
      } else {
        setError('Error updating profile.');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-10 bg-white shadow-md rounded-xl mt-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center">Tenant Profile</h1>

      {message && <div className="mb-4 text-green-600 text-sm sm:text-base font-medium text-center">{message}</div>}
      {error && <div className="mb-4 text-red-600 text-sm sm:text-base font-medium text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
            placeholder="First Name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
            placeholder="Last Name"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="PreferNotToSay">Prefer not to say</option>
          </select>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
            placeholder="Phone Number"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
            placeholder="Address"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition duration-150 text-white py-3 rounded-lg font-medium text-base"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
