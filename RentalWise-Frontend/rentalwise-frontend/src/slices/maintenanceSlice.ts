import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import * as service from "../services/maintenance/maintenanceService";
import { DuplicateRequestError } from "../services/maintenance/maintenanceService";
import type {
  CreateMaintenanceRequest,
  MaintenanceRequestDetail,
  MaintenanceRequestSummary,
  TenantProperty,
  TriageMessage,
  TriageResult,
} from "../types/Maintenance";

/**
 * Agent conversation state.
 *
 * The triage transcript lives here rather than on the server: each triage call sends the
 * whole short conversation, which keeps the API stateless and makes a refresh a clean
 * restart rather than a half-finished session.
 */
interface MaintenanceState {
  properties: TenantProperty[];
  propertiesLoading: boolean;

  selectedPropertyId: number | null;

  /** The conversation so far, replayed to the agent on each triage call. */
  transcript: TriageMessage[];

  triage: TriageResult | null;
  triageLoading: boolean;
  triageError: string | null;

  submitting: boolean;
  submitError: string | null;

  /** Set when the server refused a near-duplicate; drives the "report anyway" prompt. */
  duplicateBlock: { message: string; existingRequestId: number } | null;

  lastCreated: { id: number; wasExisting: boolean; verified: boolean } | null;

  requests: MaintenanceRequestSummary[];
  requestsLoading: boolean;

  /** The request currently opened from a list, with its full detail and timeline. */
  selectedRequest: MaintenanceRequestDetail | null;
  selectedLoading: boolean;
  /** Id being status-changed, so only that row shows as busy. */
  statusUpdatingId: number | null;
}

const initialState: MaintenanceState = {
  properties: [],
  propertiesLoading: false,
  selectedPropertyId: null,
  transcript: [],
  triage: null,
  triageLoading: false,
  triageError: null,
  submitting: false,
  submitError: null,
  duplicateBlock: null,
  lastCreated: null,
  requests: [],
  requestsLoading: false,
  selectedRequest: null,
  selectedLoading: false,
  statusUpdatingId: null,
};

export const loadMyProperties = createAsyncThunk(
  "maintenance/loadMyProperties",
  async (_, { rejectWithValue }) => {
    try {
      return await service.fetchMyProperties();
    } catch (error) {
      return rejectWithValue(service.describeApiError(error, "Could not load your properties."));
    }
  },
);

export const loadRequests = createAsyncThunk(
  "maintenance/loadRequests",
  async (_, { rejectWithValue }) => {
    try {
      return await service.fetchRequests();
    } catch (error) {
      return rejectWithValue(service.describeApiError(error, "Could not load your requests."));
    }
  },
);

/** Full detail for one request, including the agent trace and audit timeline. */
export const loadRequestDetail = createAsyncThunk<
  MaintenanceRequestDetail,
  number,
  { rejectValue: string }
>("maintenance/loadRequestDetail", async (id, { rejectWithValue }) => {
  try {
    return await service.fetchRequest(id);
  } catch (error) {
    return rejectWithValue(service.describeApiError(error, "Could not load that request."));
  }
});

/** Landlord moves a request along its lifecycle. */
export const changeRequestStatus = createAsyncThunk<
  MaintenanceRequestDetail,
  { id: number; status: number },
  { rejectValue: string }
>("maintenance/changeRequestStatus", async ({ id, status }, { rejectWithValue, dispatch }) => {
  try {
    const updated = await service.updateRequestStatus(id, status);
    // Keep the list in step with the detail pane.
    void dispatch(loadRequests());
    return updated;
  } catch (error) {
    return rejectWithValue(service.describeApiError(error, "Could not update the status."));
  }
});

/**
 * Sends the tenant's latest message plus the existing transcript to the agent.
 * The message is appended to the transcript by the reducer before the call, so the
 * conversation the agent sees matches what is on screen.
 */
export const runTriage = createAsyncThunk<
  TriageResult,
  { propertyId: number; message: string },
  { state: { maintenance: MaintenanceState }; rejectValue: string }
>("maintenance/runTriage", async ({ propertyId, message }, { getState, rejectWithValue }) => {
  const existing = getState().maintenance.transcript;
  const messages: TriageMessage[] = [...existing, { role: "tenant", content: message }];

  try {
    return await service.triageIssue(propertyId, messages);
  } catch (error) {
    return rejectWithValue(service.describeApiError(error, "The assessment could not be completed."));
  }
});

export const submitRequest = createAsyncThunk<
  { id: number; wasExisting: boolean; verified: boolean },
  CreateMaintenanceRequest,
  { rejectValue: string }
>("maintenance/submitRequest", async (payload, { rejectWithValue, dispatch }) => {
  try {
    const result = await service.createRequest(payload);

    // Refresh the list so the new request is visible without a manual reload.
    void dispatch(loadRequests());

    return {
      id: result.request.id,
      wasExisting: result.wasExistingRequest,
      verified: result.verifiedInDatabase,
    };
  } catch (error) {
    if (error instanceof DuplicateRequestError) {
      // Not a failure as such: the tenant is being asked to confirm.
      return rejectWithValue(`DUPLICATE:${error.existingRequestId}:${error.message}`);
    }
    return rejectWithValue(service.describeApiError(error, "The request could not be submitted."));
  }
});

const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState,
  reducers: {
    selectProperty(state, action: PayloadAction<number | null>) {
      if (state.selectedPropertyId === action.payload) return;

      // Changing property invalidates the whole conversation: the agent's assessment was
      // about a different place.
      state.selectedPropertyId = action.payload;
      state.transcript = [];
      state.triage = null;
      state.triageError = null;
      state.duplicateBlock = null;
      state.lastCreated = null;
      state.submitError = null;
    },

    /** Appends the tenant's message locally so it renders immediately. */
    appendTenantMessage(state, action: PayloadAction<string>) {
      state.transcript.push({ role: "tenant", content: action.payload });
    },

    clearConversation(state) {
      state.transcript = [];
      state.triage = null;
      state.triageError = null;
      state.duplicateBlock = null;
      state.lastCreated = null;
      state.submitError = null;
    },

    dismissDuplicateBlock(state) {
      state.duplicateBlock = null;
    },

    closeRequestDetail(state) {
      state.selectedRequest = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadMyProperties.pending, (state) => {
        state.propertiesLoading = true;
      })
      .addCase(loadMyProperties.fulfilled, (state, action) => {
        state.propertiesLoading = false;
        state.properties = action.payload;

        // Pre-select when there is only one tenancy, which is the common case.
        if (state.selectedPropertyId === null && action.payload.length === 1) {
          state.selectedPropertyId = action.payload[0].propertyId;
        }
      })
      .addCase(loadMyProperties.rejected, (state) => {
        state.propertiesLoading = false;
        state.properties = [];
      })

      .addCase(loadRequests.pending, (state) => {
        state.requestsLoading = true;
      })
      .addCase(loadRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requests = action.payload;
      })
      .addCase(loadRequests.rejected, (state) => {
        state.requestsLoading = false;
      })

      .addCase(loadRequestDetail.pending, (state) => {
        state.selectedLoading = true;
      })
      .addCase(loadRequestDetail.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedRequest = action.payload;
      })
      .addCase(loadRequestDetail.rejected, (state) => {
        state.selectedLoading = false;
        state.selectedRequest = null;
      })

      .addCase(changeRequestStatus.pending, (state, action) => {
        state.statusUpdatingId = action.meta.arg.id;
      })
      .addCase(changeRequestStatus.fulfilled, (state, action) => {
        state.statusUpdatingId = null;
        state.selectedRequest = action.payload;
      })
      .addCase(changeRequestStatus.rejected, (state) => {
        state.statusUpdatingId = null;
      })

      .addCase(runTriage.pending, (state) => {
        state.triageLoading = true;
        state.triageError = null;
        state.duplicateBlock = null;
      })
      .addCase(runTriage.fulfilled, (state, action) => {
        state.triageLoading = false;
        state.triage = action.payload;

        // Record what the agent said so the next turn has the full conversation.
        const agentReply = action.payload.needsMoreInfo
          ? action.payload.followUpQuestions.join(" ")
          : action.payload.summary;

        if (agentReply) {
          state.transcript.push({ role: "agent", content: agentReply });
        }
      })
      .addCase(runTriage.rejected, (state, action) => {
        state.triageLoading = false;
        state.triageError = action.payload ?? "The assessment could not be completed.";
      })

      .addCase(submitRequest.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
        state.duplicateBlock = null;
      })
      .addCase(submitRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.lastCreated = action.payload;
      })
      .addCase(submitRequest.rejected, (state, action) => {
        state.submitting = false;

        const payload = action.payload ?? "The request could not be submitted.";

        if (payload.startsWith("DUPLICATE:")) {
          const [, id, ...rest] = payload.split(":");
          state.duplicateBlock = {
            existingRequestId: Number(id),
            message: rest.join(":"),
          };
          return;
        }

        state.submitError = payload;
      });
  },
});

export const {
  selectProperty,
  appendTenantMessage,
  clearConversation,
  dismissDuplicateBlock,
  closeRequestDetail,
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
