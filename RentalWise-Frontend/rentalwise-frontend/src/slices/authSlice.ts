import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

type User = {
  id: string;
  role: string;
  email?: string;
  /**
   * Comes from the tenant or landlord profile, not the token - the profile is filled in
   * after registration, so a name baked into the JWT would be stale until the next login.
   * Undefined until that profile has been fetched, or if it has no name on it.
   */
  firstName?: string;
};

// The API issues ClaimTypes.* claims, which serialise to these long URIs. Only `role` also
// appears in short form, because AuthService adds a flat duplicate of it; email does not,
// so reading `decoded.email` alone always yielded undefined.
const NAME_ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

type DecodedToken = {
  [NAME_ID_CLAIM]: string; // user id
  [EMAIL_CLAIM]?: string;
  role: string;
  email?: string; // short form, if a flat claim is ever added server-side
  exp: number; // expiration in seconds
};

/** Prefers the short claim so a future server-side flat claim just works. */
function emailFrom(decoded: DecodedToken): string | undefined {
  return decoded.email ?? decoded[EMAIL_CLAIM];
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

/**
 * Fetches the signed-in user's first name from their profile.
 *
 * Resolves to null rather than rejecting when there is no profile yet (the endpoint 404s
 * until the profile form is filled in), so a new account simply falls back to its email
 * instead of surfacing an error in the navbar.
 */
export const loadProfileName = createAsyncThunk<string | null, void>(
  "auth/loadProfileName",
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.token || !auth.user) return null;

    const role = auth.user.role.toLowerCase();
    const url = role === "landlord" ? "/landlord" : role === "tenant" ? "/tenants" : null;
    if (!url) return null;

    try {
      const response = await api.get<{ firstName?: string | null }>(url);
      return response.data?.firstName?.trim() || null;
    } catch {
      return null;
    }
  },
);

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
        id: decoded[NAME_ID_CLAIM],
        role: decoded.role,
        email: emailFrom(decoded),
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
            id: decoded[NAME_ID_CLAIM],
            role: decoded.role,
            email: emailFrom(decoded),
          };
        } else {
          localStorage.removeItem("token"); // expired
        }
      } catch {
        localStorage.removeItem("token"); // invalid
      }
    },
  },
  extraReducers(builder) {
    builder.addCase(loadProfileName.fulfilled, (state, action) => {
      if (state.user) {
        state.user.firstName = action.payload ?? undefined;
      }
    });
  },
});

export const { login, logout, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
