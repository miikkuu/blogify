const getEnv = (key) => {
  if (import.meta.env.MODE === 'production') {
    // In production, prioritize window.env (from Nginx envsubst)
    if (typeof window !== 'undefined' && window.env && window.env[key]) {
      return window.env[key];
    }
    // Fallback to import.meta.env (less likely to be set in prod, but for robustness)
    if (import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } else {
    // In development, prioritize import.meta.env (from Vite .env files)
    if (import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    // Fallback to window.env (less likely in dev, but for extreme robustness)
    if (typeof window !== 'undefined' && window.env && window.env[key]) {
      return window.env[key];
    }
  }
  return undefined;
};

export const VITE_API_BACKEND_URL = getEnv('VITE_API_BACKEND_URL');
export const VITE_GOOGLE_CLIENT_ID = getEnv('VITE_GOOGLE_CLIENT_ID');