import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
     <div className="flex-1 flex flex-col ml-64 pl-4"> {/* 256px + 16px = 272px */}
        <Header />
        <main className="p-6 bg-gray-50 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;