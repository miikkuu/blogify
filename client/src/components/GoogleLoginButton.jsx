import { useContext } from "react";
import React  from "react";
import { GoogleLogin } from "@react-oauth/google";
import { UserContext } from "../contexts/UserContext";
export const GoogleLoginButton = (props) => {

    const { setUserInfo ,darkModeCheck } = useContext(UserContext);
  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse; // Extract the credential object
    const token = credential;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BACKEND_URL}/gauth/google`,
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
