import { useContext } from "react";
import React from "react";
import { UserContext } from "../contexts/UserContext";
import { GoogleLogin } from "@react-oauth/google";
import { VITE_API_BACKEND_URL, VITE_GOOGLE_CLIENT_ID } from '../utils/env';

// Check if Google Client ID is provided and valid
const hasValidGoogleClientId = VITE_GOOGLE_CLIENT_ID &&
                               VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                               VITE_GOOGLE_CLIENT_ID.length > 10;
  
export const GoogleLoginButton = (props) => {
  // If Google Client ID is not valid, don't render anything
  if (!hasValidGoogleClientId) {
    return null;
  }

  const { setUserInfo } = useContext(UserContext);

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    const token = credential;
    try {
      const response = await fetch(
        `${VITE_API_BACKEND_URL}/gauth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const userInfo = await response.json();
        setUserInfo(userInfo);
      } else {
        console.error("Google login failed");
      }
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        console.log("Login Failed");
      }}
      useOneTap={true}
      {...props}
    />
  );
};
