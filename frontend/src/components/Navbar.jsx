import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                THE PARKZ ROMPIN
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              to="/contact"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Contact
            </Link>
            <Link
              to="/about"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 