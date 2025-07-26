
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';
import React from 'react'
import { getSavedCars } from '../../../actions/car-listing';
import SavedCarsList from './_components/saved-cars-list';

export const metadata = {
  title: "Saved Cars | Vehix",
  description: "View your saved cars and favorites",
};

const SavedCarsPage =async () => {

     const {userId}=await auth();
     if(!userId){
        redirect('/sign-in?redirect=/saved-cars');
     }

      const savedCarsResult= await getSavedCars();
  return (
    <div className='container mx-auto px-4 py-12'>
         <h1 className='text-6xl mb-6 gradient-title'>Your Saved Cars</h1>
         <SavedCarsList initialData={savedCarsResult}/>
    </div>
  )
}

export default SavedCarsPage
