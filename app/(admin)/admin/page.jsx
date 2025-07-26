import React from 'react'
import { getDashboardData } from '../../../actions/admin';
import Dashboard from './_components/dashboard';

export const metadata = {
  title: "Dashboard | Vehix Admin",
  description: "Admin dashboard for Vehix car marketplace",
};

const AdminPage = async() => {

  const dashboardData = await getDashboardData();
  return (
    <div className='p-6'>
       <h1 className='text-2xl font-bold mb-6'>Dashboard</h1>
       <Dashboard initialData={dashboardData}/>
    </div>
  )
}

export default AdminPage
