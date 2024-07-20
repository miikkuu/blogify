import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const prefersDarkMode = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(prefersDarkMode);
    document.documentElement.classList.toggle('dark', prefersDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.theme = newDarkMode ? 'dark' : 'light';
  };

  const buttonClass = 'relative mr-4 w-8 sm:w-12 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center transition duration-300 focus:outline-none shadow';
  const divClass = `absolute left-1 top-1 bg-white dark:bg-gray-800 w-6 h-6 rounded-full transform transition-transform duration-500 ease-in-out flex items-center justify-center ${darkMode ? 'translate-x-0 sm:translate-x-4' : ''}`;

  return (
    <button onClick={toggleDarkMode} className={buttonClass}>
      <div className={divClass}>
        {darkMode ? <Moon className="h-4 w-4 text-yellow-400" /> : <Sun className="h-4 w-4 text-yellow-500" />}
      </div>
    </button>
  );
};

export default DarkModeToggle;
