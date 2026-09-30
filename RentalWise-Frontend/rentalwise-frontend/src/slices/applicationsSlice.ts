import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/applications/applicationService";
import { describeApiError } from "../services/apiError";
import type { ApproveApplicationInput, RentalApplication } from "../types/RentalApplication";

interface ApplicationsState {
  /** Tenant's own applications, used by the Apply button to show current state. */
  mine: RentalApplication[];
  mineLoaded: boolean;
  mineLoading: boolean;

  /** Landlord's queue. */
  landlord: RentalApplication[];
  landlordLoading: boolean;

  /** Property id currently being applied for, so only that button shows a spinner. */
  applyingPropertyId: number | null;

  /** Application id currently being approved, declined or withdrawn. */
  decidingId: number | null;

  error: string | null;
}

const initialState: ApplicationsState = {
  mine: [],
  mineLoaded: false,
  mineLoading: false,
  landlord: [],
  landlordLoading: false,
  applyingPropertyId: null,
  decidingId: null,
  error: null,
};

export const loadMyApplications = createAsyncThunk<
  RentalApplication[],
  void,
  { rejectValue: string }
>("applications/loadMine", async (_, { rejectWithValue }) => {
  try {
    return await service.fetchMyApplications();
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not load your applications."));
  }
});

export const loadLandlordApplications = createAsyncThunk<
  RentalApplication[],
  void,
  { rejectValue: string }
>("applications/loadLandlord", async (_, { rejectWithValue }) => {
  try {
    return await service.fetchLandlordApplications();
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not load applications."));
  }
});

export const applyForProperty = createAsyncThunk<
  RentalApplication,
  { propertyId: number; message?: string },
  { rejectValue: string }
>("applications/apply", async ({ propertyId, message }, { rejectWithValue }) => {
  try {
    return await service.applyForProperty(propertyId, message);
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not submit your application."));
  }
});

export const approveApplication = createAsyncThunk<
  RentalApplication,
  { id: number; input?: ApproveApplicationInput },
  { rejectValue: string }
>("applications/approve", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await service.approveApplication(id, input ?? {});
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not offer the tenancy."));
  }
});

export const declineApplication = createAsyncThunk<
  RentalApplication,
  { id: number; note?: string },
  { rejectValue: string }
>("applications/decline", async ({ id, note }, { rejectWithValue }) => {
  try {
    return await service.declineApplication(id, note);
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not decline the application."));
  }
});

export const withdrawApplication = createAsyncThunk<
  RentalApplication,
  number,
  { rejectValue: string }
>("applications/withdraw", async (id, { rejectWithValue }) => {
  try {
    return await service.withdrawApplication(id);
  } catch (error) {
    return rejectWithValue(describeApiError(error, "Could not withdraw the application."));
  }
});

/** Replaces a row in place, or prepends it when it is new. */
function upsert(list: RentalApplication[], application: RentalApplication) {
  const index = list.findIndex((item) => item.id === application.id);
  if (index === -1) {
    list.unshift(application);
  } else {
    list[index] = application;
  }
}

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    clearApplicationsError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadMyApplications.pending, (state) => {
        state.mineLoading = true;
      })
      .addCase(loadMyApplications.fulfilled, (state, action) => {
        state.mineLoading = false;
        state.mineLoaded = true;
        state.mine = action.payload;
      })
      .addCase(loadMyApplications.rejected, (state) => {
        state.mineLoading = false;
        // Mark as loaded even on failure, so the Apply button does not retry on every render.
        state.mineLoaded = true;
      })

      .addCase(loadLandlordApplications.pending, (state) => {
        state.landlordLoading = true;
      })
      .addCase(loadLandlordApplications.fulfilled, (state, action) => {
        state.landlordLoading = false;
        state.landlord = action.payload;
      })
      .addCase(loadLandlordApplications.rejected, (state, action) => {
        state.landlordLoading = false;
        state.error = action.payload ?? "Could not load applications.";
      })

      .addCase(applyForProperty.pending, (state, action) => {
        state.applyingPropertyId = action.meta.arg.propertyId;
        state.error = null;
      })
      .addCase(applyForProperty.fulfilled, (state, action) => {
        state.applyingPropertyId = null;
        upsert(state.mine, action.payload);
      })
      .addCase(applyForProperty.rejected, (state, action) => {
        state.applyingPropertyId = null;
        state.error = action.payload ?? "Could not submit your application.";
      })

      .addCase(withdrawApplication.pending, (state, action) => {
        state.decidingId = action.meta.arg;
        state.error = null;
      })
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.decidingId = null;
        upsert(state.mine, action.payload);
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.decidingId = null;
        state.error = action.payload ?? "Could not withdraw the application.";
      })

      // Approve and decline share their shape, so they share their handling.
      .addMatcher(
        (action): action is ReturnType<typeof approveApplication.pending> =>
          approveApplication.pending.match(action) || declineApplication.pending.match(action),
        (state, action) => {
          state.decidingId = action.meta.arg.id;
          state.error = null;
        },
      )
      .addMatcher(
        (action): action is ReturnType<typeof approveApplication.fulfilled> =>
          approveApplication.fulfilled.match(action) || declineApplication.fulfilled.match(action),
        (state, action) => {
          state.decidingId = null;
          upsert(state.landlord, action.payload);
        },
      )
      .addMatcher(
        (action): action is ReturnType<typeof approveApplication.rejected> =>
          approveApplication.rejected.match(action) || declineApplication.rejected.match(action),
        (state, action) => {
          state.decidingId = null;
          state.error = action.payload ?? "That action could not be completed.";
        },
      );
  },
});

export const { clearApplicationsError } = applicationsSlice.actions;

export default applicationsSlice.reducer;
