// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "../slices/searchSlice";
import authReducer from "../slices/authSlice"
import messagesReducer from "../slices/messagesSlice";
import maintenanceReducer from "../slices/maintenanceSlice";
import applicationsReducer from "../slices/applicationsSlice";
export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
    messages: messagesReducer,
    maintenance: maintenanceReducer,
    applications: applicationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
