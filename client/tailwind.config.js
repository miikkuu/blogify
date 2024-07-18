module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#121212', // Even darker background
          800: '#1e1e1e', // Darker background for components
          700: '#2d2d2d', // Slightly lighter for contrast
          // ... other shades
        }
      }
    },
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}