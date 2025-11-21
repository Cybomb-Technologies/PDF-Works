import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove admin login info from localStorage
    localStorage.removeItem('pdfpro_admin');
    localStorage.removeItem('pdfpro_admin_token'); // optional, if using token

    // Redirect to home page
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">Admin Dashboard</h1>
      <div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
