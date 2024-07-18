import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative mr-3 w-12 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center transition duration-300 focus:outline-none shadow"
    >
      <div
        className={`absolute left-1 top-1 bg-white dark:bg-gray-800 w-6 h-6 rounded-full transform transition-transform duration-500 ease-in-out flex items-center justify-center ${
          darkMode ? 'translate-x-4' : ''
        }`}
      >
        {darkMode ? (
          <Moon className="h-4 w-4 text-yellow-400" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;