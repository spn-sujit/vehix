import React from "react";
import { getCarById } from "../../../../actions/car-listing";
import { notFound } from "next/navigation";
import TestDriveForm from "./_components/test-drive-form";
import { getAllTestDrives } from "../../../../actions/test-drive";

export async function generateMetadata() {
  return {
    title: `Book Test Drive | Vehiql`,
    description: `Schedule a test drive in few seconds`,
  };
}


const TestDrive = async ({ params }) => {
  const { id } = await params;
  const result = await getCarById(id);

  if (!result.success) {
    notFound();
  }

  const result1 = await getAllTestDrives(id);

  if (!result1?.success) {
    notFound();
  }
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Book a test Drive</h1>

      <TestDriveForm
        car={result.data}
        testDriveInfo={result.data.testDriveInfo}
        existingBookings={result1.existingBookings || []}
      />
    </div>
  );
};

export default TestDrive;
