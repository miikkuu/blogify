import { useContext } from "react";
import React from "react";
import { UserContext } from "../contexts/UserContext";
import { GoogleLogin } from "@react-oauth/google"; // Moved to top-level

// Check if Google Client ID is provided and valid
const hasValidGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
                               import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                               import.meta.env.VITE_GOOGLE_CLIENT_ID.length > 10;

export const GoogleLoginButton = (props) => {
  // If Google Client ID is not valid, don't render anything
  if (!hasValidGoogleClientId) {
    return null;
  }

  const { setUserInfo } = useContext(UserContext);

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse; // Extract the credential object
    const token = credential;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BACKEND_URL}/auth/google`,
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
