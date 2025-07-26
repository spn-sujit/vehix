'use server'
import { request } from "@arcjet/next";
import { serializeCarData } from "../lib/helper";
import aj from "../lib/arcjet";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/prisma";
import { auth } from "@clerk/nextjs/server";


export async function getFeaturedCars(limit = 3) {
  try {
       
     const {userId} = await auth();
      
     let dbUser= null;
        if(userId){
      dbUser = await db.user.findUnique({
      where:{clerkUserId:userId}
     });
    }


       
    const cars = await db.car.findMany({
      where: {
        featured: true,
        status: "AVAILABLE",
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    let wishlisted = new Set();

    if(dbUser){
      const savedCars = await db.userSavedCars.findMany({
        where:{userId:dbUser.id},
        select:{carId:true},
      });
      wishlisted = new Set(savedCars.map((car)=>car.carId));
    }

     

    return cars.map((car) => serializeCarData(car,wishlisted.has(car.id)));
  } catch (error) {
    console.error('Error for fetching featured cars:',error.message);
    return [];
  }
};

async function fileToBase64(file) {
  if (!(file instanceof Blob)) {
    throw new Error("Invalid file type — must be a File or Blob.");
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
};

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
};

export async function processImageSearch(file) {
  try {
    //Rate limiting with Arcjet
    const req = await request();
    const decision = await aj.protect(req, {
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    // check if api key is available
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
You are an expert vehicle image analyzer. Analyze the provided car image and extract the following details:

1. "make" - The brand or manufacturer of the car (e.g., Toyota, BMW, Hyundai).
2. "bodyType" - The general category of the car's structure (e.g., SUV, Sedan, Hatchback, Coupe, Truck).
3. "color" - The most dominant visible color of the car (e.g., Red, Black, White, Blue).

Only include a guess **if you are not fully certain** but have a reasonable assumption. If a detail cannot be determined or reasonably guessed, return it as an empty string 

Respond with a **clean JSON object** in the following format:

{
  "make": "<brand or empty if unknown>",
  "bodyType": "<type or empty if unknown>",
  "color": "<color or empty if unknown>",
  "confidence": 0.0
}

- "confidence" should be a number between **0.0 and 1.0**, representing your overall confidence in the identification.
- Do **not** include any explanation or extra text. Return **only** the JSON object.
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
      try {
        const carDetails = JSON.parse(cleanedText);
        return{
            success:true,
            data:carDetails,
        };
        
      } catch (parseError) {
        console.error('Failed to parse AI response:',parseError);
        console.log('Raw response:',text);
        return{
            success:false,
            data:'Failed to parse AI response',
        };
      };

  } catch (error) {
    throw new Error('AI Search Error:'+error.message);
  }
}
