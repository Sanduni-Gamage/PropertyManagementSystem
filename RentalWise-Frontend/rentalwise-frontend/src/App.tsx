import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import HomePage from './pages/Home';
import Login from './pages/Login';
import RoleSelect from './pages/RoleSelect';
import RegisterLandlord from './pages/Landlord/RegisterLandlord';
import RegisterTenant from './pages/Tenant/RegisterTenant';
import LandlordDashboardHome from './pages/Landlord/Dashboard';
import TenantDashboard from './pages/Tenant/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import TenantProfileForm from './pages/Tenant/TenantProfileForm';
import LandlordProfileForm from './pages/Landlord/LandlordProfileForm';
import BannerwithSearchSection from './components/BannerwithSearch';
import LandlordDashboardLayout from './pages/Landlord/DashboardLayout';
import AddProperty from './pages/Landlord/Properties/AddProperty';
import LandlordPropertyList from './pages/Landlord/Properties/LandlordPropertyList';
import LandlordPropertyDetails from './pages/Landlord/Properties/LandlordPropertyDetails';
import RentalPage from './pages/RentalPage';
import RentalPropertyDetails from './pages/RentalPropertyDetails';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import './App.css'

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const hideNavbarRoutes = ['/login', '/register', '/register/landlord', '/register/tenant', '/landlord'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {isHomePage && <BannerwithSearchSection />}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RoleSelect />} />
        <Route path="/rental" element={<RentalPage/>} />
        <Route path="/properties/public/:id" element={<RentalPropertyDetails/>} />
        
        
        <Route path="/register/landlord" element={<RegisterLandlord />} />
        <Route path="/register/tenant" element={<RegisterTenant />} />
        <Route path="/landlord"
               element={
                        <PrivateRoute requiredRole="landlord">
                        <LandlordDashboardLayout />
                        </PrivateRoute>
                       }
>
  {/* Index route - main dashboard */}
  <Route index element={<PrivateRoute requiredRole="landlord">
    <LandlordDashboardHome />
    </PrivateRoute>} />

  {/* nested pages like these: */}
   <Route path="addproperties" element={<PrivateRoute requiredRole="landlord">
   <AddProperty />
   </PrivateRoute>} /> 

   <Route path="properties" element={<PrivateRoute requiredRole="landlord">
   <LandlordPropertyList />
   </PrivateRoute>} /> 

   <Route path="properties/:id" element={<PrivateRoute requiredRole="landlord">
   <LandlordPropertyDetails />
   </PrivateRoute>} /> 
  
  </Route>
        <Route path="/tenant/dashboard" element={<PrivateRoute requiredRole="tenant">
          <TenantDashboard />
        </PrivateRoute>} />
        <Route path="/tenant/profile" element={<PrivateRoute requiredRole="tenant">
          <TenantProfileForm />
        </PrivateRoute>} />
        <Route path="/landlord/profile" element={<PrivateRoute requiredRole="landlord">
          <LandlordProfileForm />
        </PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* ToastContainer should be rendered at root level */}
      <ToastContainer position="top-center" autoClose={4000} hideProgressBar />
    </>
  );
}

export default App
