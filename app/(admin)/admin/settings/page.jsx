import React from 'react'
import SettingsForm from './_components/settings-form';

export const metadata = {
  title: "Settings | Vehix Admin",
  description: "Manage dealership working hours and admin users",
};
const SettingPage = () => {
  return (
    <div className='p-6'>
        <h1 className='text-2xl font-bold mb-6'>Settings</h1>
        <SettingsForm/>
    </div>
  )
}

export default SettingPage;
