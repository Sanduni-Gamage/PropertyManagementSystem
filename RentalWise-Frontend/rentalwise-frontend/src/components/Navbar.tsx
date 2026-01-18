import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { FiMenu, FiX } from 'react-icons/fi';
import SearchBar from './SearchBar';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../slices/authSlice';

interface DropdownItem {
  label: string;
  path: string;
  isButton?: boolean;
  roles?: string[];
}

export default function Navbar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isRentalPage = location.pathname === '/rental';
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const isAuthenticated = !!user;
  const userRole = user?.role || '';
  const userName = user?.email || 'Account';

  const baseDropdownItems: DropdownItem[] = [
    { label: 'Saved homes', path: 'saved-homes' },
    { label: 'Saved searches', path: 'saved-searches' },
    { label: 'Inbox', path: 'inbox' },
    { label: 'Manage tours', path: 'manage-tours', roles: ['Landlord'] },
    { label: 'Recently Viewed', path: 'recently-viewed' },
    { label: 'Your team', path: 'your-team', roles: ['Landlord'] },
    { label: 'Your home', path: 'your-home' },
    { label: 'Renter Hub', path: 'renter-hub', roles: ['Tenant'] },
    { label: 'Account settings', path: 'profile' },
    { label: 'Sign out', path: '', isButton: true },
  ];

  const dropdownItems: DropdownItem[] = baseDropdownItems
    .filter((item) => !item.roles || item.roles.includes(userRole))
    .map((item) => ({
      ...item,
      path: item.isButton || !userRole ? item.path : `/${userRole.toLowerCase()}/${item.path}`,
    }));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //mobile sidebar closes if the screen is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className={`w-full  ${isHomePage ? 'absolute top-0 left-0 z-50 bg-transparent' : 'bg-white shadow-sm'}  flex flex-col`}>
      <div className="px-4 md:px-8 py-6  flex items-center justify-between border-b border-white/30 relative bg-transparent md:bg-white">
        
        {isHomePage ?(
          <button
          className="block md:hidden text-white md:text-gray-700 text-2xl z-[100]"
          
          onClick={() => setMobileMenuOpen(true)}
        >
         <FiMenu/>
        </button>
        ):(<button
          className="block md:hidden text-blue-700 md:text-gray-700 text-2xl z-[100]"
          
          onClick={() => setMobileMenuOpen(true)}
        >
         <FiMenu/>
        </button>
      )}
          

        <div className="hidden md:flex gap-6 items-center text-lg font-medium ml-12 text-gray-700">
          <Link to="/agents" className="hover:text-blue-700">Buy</Link>
          <Link to="/rental" className="hover:text-blue-700">Rent</Link>
          <Link to="/loans" className="hover:text-blue-700">Sell</Link>
          <Link to="/homes" className="hover:text-blue-700">Agent</Link>
        </div>

        {/* Centered content (logo or mobile search bar) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full md:w-auto">
        {/* Desktop: Show logo always */}
          <div className="hidden md:block">
            <Link to="/" className="text-2xl font-bold text-blue-700">RentalWise</Link>
          </div>

        {/* Mobile: Show search bar only on rental page */}
         <div className="block md:hidden w-full px-12 text-center relative z-10">
            {isRentalPage ? (
              <div className="mb-10">
              <SearchBar />
              </div>
              ) : (
              <Link to="/" className="text-2xl font-bold text-white">RentalWise</Link>
              )}
        </div>
        </div>
        <div className="hidden md:flex gap-6 items-center text-lg font-medium mr-36 text-gray-700">
          <Link to="/landlord" className="hover:text-blue-700">Manage Rentals</Link>
          <Link to="/tours" className="hover:text-blue-700">Help</Link>
          
        </div>
        
        <div className={`absolute right-2 md:right-12 flex items-center text-base md:text-lg font-medium ${isHomePage ? 'text-white': 'text-blue-700'} md:text-gray-700`}>
          {!isAuthenticated ? (
            <Link to="/login" className="hover:text-blue-700">Sign In</Link>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center hover:text-blue-700"
              >
                {userName}
                <span className="ml-1">▾</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black border border-gray-200 rounded-md shadow-lg z-10">
                  {dropdownItems.map((item) =>
                    item.isButton ? (
                      <><hr></hr><button
                        key={item.label}
                        onClick={() => {
                          dispatch(logout()); // 🔐 calls AuthContext logout
                          setDropdownOpen(false);
                        } }
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {item.label}
                      </button></>
                    ) : (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          )}
          </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white text-black  p-6 flex flex-col space-y-5 overflow-auto">
          <div className="grid grid-cols-3" >
          <button
            className="self-start text-3xl text-gray-700 hover:text-blue-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiX />
          </button>
          
          <Link to="/" className="text-2xl font-bold text-center text-blue-700">RentalWise</Link>
          </div>
          <hr></hr>
          <Link to="/agents" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Buy</Link>
          <hr></hr>
          <Link to="/tours" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Rent</Link>
          <hr></hr>
          <Link to="/loans" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Sell</Link>
          <hr></hr>
          <Link to="/homes" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Homes</Link>
          <hr></hr>
          <Link to="/agents" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Agents</Link>
          <hr></hr>
          <Link to="/landlord" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Manage Rentals</Link>
          <hr></hr>
          <Link to="/loans" className="hover:text-blue-700 ml-2" onClick={() => setMobileMenuOpen(false)}>Loans</Link>
          <hr></hr>
        </div>
      )}
    </nav>
  );
}
