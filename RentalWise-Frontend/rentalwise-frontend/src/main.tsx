import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux'; // Redux Provider
import { store } from "./store/store";  // Redux store
import { hydrateFromStorage } from "./slices/authSlice.ts";
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

store.dispatch(hydrateFromStorage()); // Hydrate Redux auth state before app mounts
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    
    <Provider store={store}>
    
      <App />
      
      </Provider>
      
    </BrowserRouter>
  </React.StrictMode>,
);