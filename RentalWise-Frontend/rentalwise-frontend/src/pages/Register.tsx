import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { login } from "../slices/authSlice"

interface RegisterProps {
  role: 'Landlord' | 'Tenant';
}

function SocialLoginButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
      <span className="text-xl mr-2">{icon}</span>
      {label}
    </button>
  );
}

export default function Register({ role }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post(`/Auth/register/${role}`, {
        email,
        password,
      });

      const token = response.data.token;
      if (!token || typeof token !== 'string') {
        setError('Invalid token received from server');
        return;
      }

       // Save token + update Redux state
       localStorage.setItem("token", token);
       dispatch(login(token));

      // Navigate based on role
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'landlord') navigate('/landlord/dashboard');
      else if (normalizedRole === 'tenant') navigate('/tenant/dashboard');
      else navigate('/');
    } catch (err) {
      console.error(err);
      setError('Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Form Section */}
      <div className="w-full md:w-1/3 flex justify-center items-center px-6 py-12">
        <div className="max-w-md w-full mt-0 p-6">
          <Link to="/" className="text-2xl font-bold text-blue-700">RentalWise</Link>
          <h1 className="text-2xl font-bold mt-3 mb-8 text-left">Register as a {role}</h1>
          {error && <div className="text-red-600 mb-4 text-center">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black"
                placeholder="Email Address"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-base"
            >
              Register
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <hr className="w-full border-t border-gray-300" />
            <span className="absolute bg-white px-2 text-sm text-gray-600">OR</span>
          </div>

          <div className="mt-6 space-y-3">
            <SocialLoginButton label="Continue with Google" icon={<FcGoogle />} />
            <SocialLoginButton label="Continue with Facebook" icon={<FaFacebook color="#1877F2" />} />
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            By submitting, I accept RentalWise's <a href="#" className="text-blue-600 hover:underline">terms of use</a>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Image Section */}
      <div className="w-full md:w-2/3 hidden md:block">
        <img
          src="/images/login-side.jpg"
          alt="Welcome to RentalWise"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
