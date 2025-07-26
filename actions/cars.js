"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { createClient } from "../lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { setTimeout as delay } from "node:timers/promises";
import { serializeCarData } from "../lib/helper";



async function fileToBase64(file) {
  if (!(file instanceof Blob)) {
    throw new Error("Invalid file type — must be a File or Blob.");
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

// Helper: retry wrapper for Gemini calls
async function generateWithRetry(model, imagePart, prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent([imagePart, prompt]);
    } catch (error) {
      if (error.message.includes("503") && i < maxRetries - 1) {
        console.warn(
          `Gemini is overloaded. Retrying ${i + 1}/${maxRetries}...`
        );
        await delay(2000); // 2 seconds backoff
      } else {
        throw error;
      }
    }
  }
}

export async function processCarImageWithAI(file) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API Key is not configured");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Image = await fileToBase64(file);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };
    const prompt = `
You are a professional car listing assistant.

Analyze this car image and extract these fields:
- make (manufacturer)
- model
- year (approximate if unsure, realistic best guess)
- color
- bodyType (must match exactly one of these: SUV, Sedan, Hatchback, Convertible, Coupe, Wagon, Pickup)
- mileage (approximate, realistic best guess, must be a positive integer — never zero unless truly unknown)
- fuelType (must match exactly one of these: Petrol, Diesel, Electric, Hybrid, Plug-in Hybrid)
- transmission (must match exactly one of these: Automatic, Manual, Semi-Automatic)
- price (realistic market estimate in your region, even if approximate — must be a positive integer)
- description (Write a natural-sounding, 2-3 sentence listing description. Include the make, model, body type, color, condition, mileage, fuel type, and any notable features. The description must be at least 20 words and feel like a genuine used car listing.)
- confidence (0-1)

STRICT RULES:
1. Always respond ONLY with a valid JSON object. No explanations, markdown, or extra text.
2. Never leave any field empty, null, or undefined.
3. For number fields like mileage, price, and year, always provide your best realistic guess — never use zero unless truly impossible.
4. fuelType must be exactly one of [Petrol, Diesel, Electric, Hybrid, Plug-in Hybrid] — with correct capitalization.
5. transmission must be exactly one of [Automatic, Manual, Semi-Automatic] — with correct capitalization.
6. bodyType must be exactly one of [SUV, Sedan, Hatchback, Convertible, Coupe, Wagon, Pickup] — with correct capitalization.
7. description must be at least 20 words.
8. Ensure all spelling and capitalization match the allowed options exactly.

Example format:
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2018,
  "color": "Red",
  "bodyType": "Sedan",
  "price": 18000,
  "mileage": 45000,
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "description": "This Red Toyota Camry Sedan is in excellent condition with approximately 45,000 miles. It runs on Petrol and has an Automatic transmission, offering a smooth and comfortable ride. Well-maintained and perfect for city or highway driving.",
  "confidence": 0.85
}


`;

    const result = await generateWithRetry(model, imagePart, prompt);
    const response = result.response;
    const text = response.text();

    const rawText = text.trim();
    let cleanedText = rawText;
    if (rawText.startsWith("```")) {
      cleanedText = rawText
        .replace(/```(?:json)?\n?/g, "")
        .replace(/```$/, "")
        .trim();
    }

    let carDetails;
    try {
      try {
        carDetails = JSON.parse(cleanedText);
      } catch (error) {
        const jsonMatch = rawText.match(/{[\s\S]*}/);
        if (jsonMatch) {
          carDetails = JSON.parse(jsonMatch[0]);
        } else {
          console.error("Gemini raw response:", rawText);
          throw new Error("Failed to parse Gemini response as valid JSON");
        }
      }
     

      const requiredFields = [
        "make",
        "model",
        "year",
        "color",
        "bodyType",
        "price",
        "mileage",
        "fuelType",
        "transmission",
        "description",
        "confidence",
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          !(field in carDetails) ||
          carDetails[field] === null ||
          carDetails[field] === undefined
      );

      if (missingFields.length > 0) {
        throw new Error(
          `AI response missing required fields :${missingFields.join(", ")}`
        );
      }
      return {
        success: true,
        data: {
          ...carDetails,
          price: carDetails.price.toString(),
          mileage: carDetails.mileage.toString(),
        },
      };
    } catch (error) {
      console.log("Failed to parse AI response:", error);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    throw new Error("Gemini API error " + error.message);
  }
}

export async function addCar({ carData, images }) {
  try {
    const { userId } = await auth();

    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const carId = uuidv4();
    const folderPath = `cars/${carId}`;

    const cookiestore = await cookies();

    const supabase = createClient(cookiestore);

    const imageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];

      // Skip if image data is not valid
      if (!base64Data || !base64Data.startsWith("data:image/")) {
        console.warn("Skipping invalid image data");
        continue;
      }

      // Extract the base64 part (remove the data:image/xyz;base64, prefix)
      const base64 = base64Data.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      // Determine file extension from the data URL
      const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
      const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("cars-images")
        .upload(filePath, imageBuffer, {
          contentType: `image/${fileExtension}`,
        });
      if (error) {
        console.log("Error uploading image:", error);
        throw new Error(`Failed to upload image :${error.message}`);
      }
      // Get the public URL for the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cars-images/${filePath}`; // disable cache in config

      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uploaded");
    }

    const car = await db.car.create({
      data: {
        id: carId, // Use the same ID we used for the folder
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        color: carData.color,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        bodyType: carData.bodyType,
        seats: carData.seats,
        description: carData.description,
        status: carData.status,
        featured: carData.featured,
        images: imageUrls, // Store the array of image URLs
      },
    });
    revalidatePath("/admin/cars");

    return {
      success: true,
    };
  } catch (error) {
    throw new Error("Error adding car:" + error.message);
  }
}

export async function  getCars(search=""){
  try {

    const {userId} = await auth();
    if(!userId){
      throw new Error('Unauthorized');
    }
    const user = await db.user.findUnique({
        where:{clerkUserId: userId},
      });
    if(!user){
      throw  new Error("User not found");
    }
    let where={};
    if(search){
      where.OR=[
         {make : {contains : search , mode: 'insensitive'}},
         {model : {contains: search , mode :'insensitive'}},
         {color:{contains:search , mode : 'insensitive'}},
         {bodyType:{contains:search , mode : 'insensitive'}},
         {fuelType:{contains:search , mode : 'insensitive'}},
         {transmission:{contains:search , mode : 'insensitive'}},

      ]; 
    }
    const cars = await db.car.findMany({
      where, 
      orderBy:{createdAt:"desc"},
    });
    const serializedCars = cars.map(car=> serializeCarData(car));

    return {
      success:true,
      data:serializedCars,
    }
    
  } catch (error) {
    return{
      success:false,
      error:error.message,
    };
  };

};

export async function deleteCar(id) {
try {

    const {userId}=await auth();
  if(!userId) throw new Error('Unauthorized');
  
  const user= await db.user.findUnique({
    where:{clerkUserId:userId}
  });
  if(!user) throw new Error('User not found');

  const car = await db.car.findUnique({
    where: {id},
    select:{images:true},
  });
  if(!car){
    return {
      success:false,
      error:'Car not found',
    };
  };

  await db.car.delete({
    where:{id}
  });
  try {

    const cookiestore = await cookies();
    const  supabase = createClient(cookiestore);

    const  filePaths = car.images.map((imageUrl)=>{
       const url = new URL(imageUrl);
       const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
       return pathMatch? pathMatch[1]:null;
    }).filter(Boolean);
    
    if(filePaths.length>0){
      const {error}= await supabase.storage.from('cars-images').remove(filePaths);

      if(error){
        console.log('Error deleting Images',error);
      }
    }
  } catch (storageError) {
     console.error('Error with storage operations: ',storageError);
  }
  revalidatePath('/admin/cars');
  return {
    success:true
  }
  
} catch (error) {
  console.error('Error deleting car:',error);
  return{
    success:false,
    error:error.message,
  };
}

}

export async function updateCarStatus(id,{status,featured}) {
  try {
    const {userId}=await auth();
    if(!userId){
      throw new Error('Unauthorized');
    }
    const user = await db.user.findUnique({
      where:{clerkUserId:userId},
    });
    
    if(!user){
      throw new Error('User not found');
    }
   
    const updateData= {};
    if(status  !== undefined){
      updateData.status= status;
    }
    if(featured!==undefined){
      updateData.featured = featured;
    }

    await db.car.update({
      where:{id},
      data:updateData,
    });
     revalidatePath("/admin/cars");

    
     return{
      success:true,
     };
  } catch (error) {
    console.error('Error updating car status: ',error);
    return{
      success:false,
      error:error.message,
    };
  }
}
