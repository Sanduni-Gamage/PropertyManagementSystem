import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

type User = {
  id: string;
  role: string;
  email?: string;
};

type DecodedToken = {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string; // user id
  role: string;
  email?: string;
  exp: number; // expiration in seconds
};

export interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      const token = action.payload;
      localStorage.setItem("token", token);

      const decoded: DecodedToken = jwtDecode(token);

      state.token = token;
      state.user = {
        id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
        role: decoded.role,
        email: decoded.email,
      };
    },
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = null;
      state.user = null;
    },
    hydrateFromStorage: (state) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded: DecodedToken = jwtDecode(token);

        if (decoded.exp * 1000 > Date.now()) {
          state.token = token;
          state.user = {
            id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            role: decoded.role,
            email: decoded.email,
          };
        } else {
          localStorage.removeItem("token"); // expired
        }
      } catch {
        localStorage.removeItem("token"); // invalid
      }
    },
  },
});

export const { login, logout, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
