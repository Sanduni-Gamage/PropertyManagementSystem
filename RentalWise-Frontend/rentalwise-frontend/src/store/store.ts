// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "../slices/searchSlice";
import authReducer from "../slices/authSlice"
import messagesReducer from "../slices/messagesSlice";
export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
    messages: messagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
