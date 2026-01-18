import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';


export default function DashboardLayout() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', to: '/landlord' },
    { label: 'My Properties', to: '/landlord/properties' },
    { label: 'Tenants', to: '/landlord/tenants' },
    { label: 'Leases', to: '/landlord/leases' },
    { label: 'Settings', to: '/landlord/settings' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-md px-4 py-3 flex justify-between items-center">
        <button
          className="text-2xl text-blue-600 z-50"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>
        <h2 className="text-lg font-bold text-blue-600 mx-auto">RentalWise</h2>
        <div className="w-6" />
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 bg-white shadow-md p-6">
        <h2 className="text-xl font-bold mb-3 text-blue-600">RentalWise</h2>
        <h3 className="text-base font-bold mb-9 text-blue-600">Rental Manager</h3>
        <nav className="space-y-4 text-gray-700 text-sm">
          {menuItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="block hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-40">
          <div className="w-full bg-white h-full shadow-lg p-6">
            <h3 className="text-lg font-bold text-blue-600 text-center mb-6">Rental Manager</h3>
            <nav className="space-y-4 text-left text-gray-700 text-base">
              {menuItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block hover:text-blue-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="hidden md:block mb-4 text-sm text-gray-600">
          Logged in as: <strong>{user?.email}</strong>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
