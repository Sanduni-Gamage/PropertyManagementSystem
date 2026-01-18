import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store"; // use real context
import { logout } from "../slices/authSlice"
import { jwtDecode } from "jwt-decode";
import type { JSX } from 'react';

interface Props {
  children: JSX.Element;
  requiredRole: 'landlord' | 'tenant';
}

type DecodedToken = {
  exp: number;
  role: string;
};

export default function PrivateRoute({ children, requiredRole }: Props) {
 
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const location = useLocation();

  if (!token || !user) {
    // Not logged in → redirect to login and preserve path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded: DecodedToken = jwtDecode(token);

    // Check if expired
    if (decoded.exp * 1000 < Date.now()) {
      dispatch(logout());
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch (err) {
    console.error("Invalid token", err);
    dispatch(logout());
    return <Navigate to="/login" replace />;
  }

  //  Role validation
  if (user.role.toLowerCase() !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}