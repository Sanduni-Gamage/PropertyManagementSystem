import { FaBuilding, FaHome } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function RoleSelect() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <button
            className="absolute top-4 right-4 text-gray-700 hover:text-blue-700 transition-colors"
            onClick={() => navigate('/login')}
          >
            <MdClose size={24} />
          </button>
          
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Choose Your Role</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Select how you want to use our platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Landlord Card */}
            <div
              className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 sm:p-6 border-2 transition-all duration-500 transform ${
                hoveredCard === 'landlord' ? 'border-blue-500 scale-105 shadow-lg' : 'border-transparent'
              }`}
              onMouseEnter={() => setHoveredCard('landlord')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute -top-4 -right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 opacity-70" />
                  <div className="absolute -bottom-4 -left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 opacity-70" />
                  <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <FaBuilding className="text-white text-3xl sm:text-4xl" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Landlord</h3>
                <p className="text-gray-600 text-center mb-4 text-sm sm:text-base">List and manage your properties</p>
                <ul className="text-left text-gray-600 mb-6 space-y-2 text-sm sm:text-base">
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Manage multiple properties</li>
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Screen tenants easily</li>
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Collect rent online</li>
                </ul>
                <button
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => navigate('/register/landlord')}
                >
                  Register as Landlord
                </button>
              </div>
            </div>

            {/* Tenant Card */}
            <div
              className={`bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-5 sm:p-6 border-2 transition-all duration-500 transform ${
                hoveredCard === 'tenant' ? 'border-green-500 scale-105 shadow-lg' : 'border-transparent'
              }`}
              onMouseEnter={() => setHoveredCard('tenant')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute -top-4 -right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 opacity-70" />
                  <div className="absolute -bottom-4 -left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 opacity-70" />
                  <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                    <FaHome className="text-white text-3xl sm:text-4xl" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Tenant</h3>
                <p className="text-gray-600 text-center mb-4 text-sm sm:text-base">Find and rent your dream home</p>
                <ul className="text-left text-gray-600 mb-6 space-y-2 text-sm sm:text-base">
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Search thousands of listings</li>
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Schedule viewings online</li>
                  <li className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Apply for rentals instantly</li>
                </ul>
                <button
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => navigate('/register/tenant')}
                >
                  Register as Tenant
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-10 text-sm sm:text-base">
            <p className="text-gray-600">
              Already have an account?
              <button onClick={() => navigate('/login')} className="ml-2 text-blue-600 font-medium hover:underline">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
