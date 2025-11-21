import React from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import AdminPage from '../../components/AdminPage'; // Your stats & users table

const Dashboard = () => {
  return (
    <AdminLayout>
      <AdminPage />
    </AdminLayout>
  );
};

export default Dashboard;
