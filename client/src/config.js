const config = {
  VITE_API_BACKEND_URL: window.env?.VITE_API_BACKEND_URL || import.meta.env.VITE_API_BACKEND_URL,
  VITE_GOOGLE_CLIENT_ID: window.env?.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID,
};
export default config;