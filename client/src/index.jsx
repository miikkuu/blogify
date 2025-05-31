import React from "react"; 
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Checkng if Google Client ID is provided and valid
const hasValidGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
                              import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                              import.meta.env.VITE_GOOGLE_CLIENT_ID.length > 10;


                              

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {hasValidGoogleClientId ? (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

