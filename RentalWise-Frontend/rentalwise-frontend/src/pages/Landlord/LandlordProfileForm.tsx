import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function LandlordProfileForm() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');
    const [suburb, setSuburb] = useState('');
    const [city, setCity] = useState('');
    const [postCode, setPostCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');


    useEffect(() => {
        // Optionally fetch current profile to prefill
        api.get('/Landlord').then(res => {
            const data = res.data;
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setGender(data.gender || '');
            setContactNumber(data.contactNumber || '');
            setAddress(data.address || '');
            setSuburb(data.suburb || '');
            setCity(data.city || '');
            setPostCode(data.postCode || '');
        })
        .catch(() => {
            setError('Failed to load profile information.');
        });
}, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const updateData = {
            firstName,
            lastName,
            gender,
            contactNumber,
            address,
            suburb,
            city,
            postCode
        };

        try {
            console.log('Sending update:', updateData); //  Debug log
            await api.put('/Landlord', updateData);
            setMessage('Profile updated successfully!');
        } catch (err: any) {
            if (err.response?.status === 400) {
                const serverError = err.response.data?.title || 'Validation failed.';
                setError(serverError);
            } else {
                setError('Error updating profile.');
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 bg-white shadow-lg rounded-xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Landlord Profile</h1>

            {message && <div className="mb-4 text-green-600 font-medium">{message}</div>}
            {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        value={contactNumber}
                        onChange={e => setContactNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                        placeholder="Phone Number"
                    />
                </div>

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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                    <input
                        type="text"
                        value={suburb}
                        onChange={e => setSuburb(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                        placeholder="Suburb"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                        placeholder="City"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Code</label>
                    <input
                        type="text"
                        value={postCode}
                        onChange={e => setPostCode(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                        placeholder="Post Code"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-base"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}
