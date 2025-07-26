'use server'
import { auth } from "@clerk/nextjs/server";
import { serializeCarData } from "../lib/helper";
import { revalidatePath } from "next/cache";
import { db } from "../lib/prisma";




export async function getCarFilters() {
  try {
    const makes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    });

    const bodyTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { bodyType: true },
      distinct: ["bodyType"],
      orderBy: { bodyType: "asc" },
    });

    const fuelTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { fuelType: true },
      distinct: ["fuelType"],
      orderBy: { fuelType: "asc" },
    });

    const transmissions = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { transmission: true },
      distinct: ["transmission"],
      orderBy: { transmission: "asc" },
    });

    const colors = await db.car.findMany({
      where:{status:'AVAILABLE'},
      select:{color:true},
      distinct:['color'],
      orderBy:{color:'asc'},
    });

    const priceAggregrations = await db.car.aggregate({
      where: { status: "AVAILABLE" },
      _min: { price: true },
      _max: { price: true },
    });

    return {
      success: true,
      data: {
        makes: makes.map((item) => item.make),
        bodyTypes: bodyTypes.map((item) => item.bodyType),
        fuelTypes: fuelTypes.map((item) => item.fuelType),
        transmissions: transmissions.map((item) => item.transmission),
        colors: colors.map((item)=>item.color),
        priceRange: {
          min: priceAggregrations._min.price
            ? parseFloat(priceAggregrations._min.price.toString())
            : 0,
          max: priceAggregrations._max.price
            ? parseFloat(priceAggregrations._max.price.toString())
            : 100000,
        },
      },
    };
  } catch (error) {
    throw new Error("Error fetching car filters:" + error.message);
  }
}

export async function getCars({
  search = "",
  make = "",
  bodyType = "",
  fuelType = "",
  transmission = "",
  color="",
  minPrice = 0,
  maxPrice = Number.MAX_SAFE_INTEGER,
  sortBy = "newest",
  page = 1,
  limit = 6,
}) {
  try {
    const { userId } = await auth();
    
    let dbUser = null;

    if (userId) {
      dbUser = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    }

    let where ={};
    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { transmission: { contains: search, mode: "insensitive" } },
        { fuelType: { contains: search, mode: "insensitive" } },
        { bodyType: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    if(make){
        where.make={equals:make,mode:'insensitive'}
    };
    if(bodyType){
        where.bodyType={equals:bodyType,mode:'insensitive'}
    }
    if(fuelType){
        where.fuelType={equals:fuelType,mode:'insensitive'}
    }
    if(transmission){
        where.transmission={equals:transmission,mode:'insensitive'}
    }
    if(color){
      where.color={equals:color,mode:'insensitive'}
    }
    where.price={
        gte:parseFloat(minPrice)||0,
    }

    if(maxPrice && maxPrice<Number.MAX_SAFE_INTEGER){
        where.price.lte=parseFloat(maxPrice);
    }

    const skip = (page-1)*limit;
     let orderBy={};
        switch(sortBy){
            case "priceAsc":
                orderBy={price:'asc'};
                break;
            
            case "priceDesc":
                orderBy={price:'desc'};
                break;

            case "newest":
                default:
                orderBy={createdAt:'desc'};
                break;
        };

        const totalCars= await db.car.count({where});

        const cars= await db.car.findMany({
             where,
             skip,
             take:limit,
             orderBy,
        });

        let wishlisted= new Set();

        if(dbUser){
            const savedCars= await db.userSavedCars.findMany({
               where:{userId: dbUser.id},
               select:{carId:true},
            });

            wishlisted=new Set(savedCars.map((saved)=>saved.carId));
        }
       
        const serializedCars= cars.map((car)=>serializeCarData(car,wishlisted.has(car.id)));
       
        return{
            success:true,
            data:serializedCars,
            pagination:{
            total:totalCars,
            page,
            limit,
            pages:Math.ceil(totalCars/limit),
            }
        };
    
  } catch (error) {
          throw new Error('Error fetching cars:'+error.message);
  }
}


export async function toggleSavedCar(carId) {
     try {
         const {userId}= await auth();
             if(!userId){
              throw new Error('Unauthorized');
             }
         const user = await db.user.findUnique({
          where:{clerkUserId:userId},
         });
         if(!user){
          throw new Error('User not found');
         }
         const car= await db.car.findUnique({
          where:{id:carId},
         });

         if(!car){
          return{
            success:false,
            error:"Car not found",
          };
         };

         const existingSave= await db.userSavedCars.findUnique({
          where:{
            userId_carId:{
              userId:user.id,
              carId,
            },
          }
         });

         if(existingSave){
          await db.userSavedCars.delete({
            where:{
              userId_carId:{
                userId:user.id,
                carId,
              },
            },
          });
           revalidatePath('/saved-cars');
         return{
          success:true,
          saved:false,
          message:'Car removed from favorites',
         }
         };

         await db.userSavedCars.create({
          data:{
            userId:user.id,
            carId,
          },
         });
        revalidatePath('/saved-cars');;
        return{
          success:true,
          saved:true,
          message:'Car added to favorites',
        };

     } catch (error) {
        throw new Error('Error toggling saved car:'+error.message);
     }
}


export async function getSavedCars() {
  
   try {
       
    const {userId}=await auth();
      
      if(!userId){
        return{
          success:false,
          error:'Unauthorized',
        
      }}
      const user= await db.user.findUnique({
        where:{clerkUserId:userId},
      });

      if(!user){
        return{
          success:false,
          error:'User not found',
        };
      }
       
       const savedCars= await db.userSavedCars.findMany({
          where:{userId:user.id},
          include:{
            car:true,
          },
          orderBy:{savedAt:'desc'}
        });
       const cars= savedCars.map((Car)=>serializeCarData(Car.car));

        return{
          success:true,
          data:cars,
        };
    
   } catch (error) {
      console.error('Error fetching saved cars:',error);
      return{
        success:false,
        error:error.message,
      };
   };
}


export async function getCarById(carId) {
   
  try {
      const {userId}=await auth();
      
      let dbUser=null;

      if(userId){
        dbUser = await db.user.findUnique({
          where:{clerkUserId:userId},
        });
      }

      const car = await db.car.findUnique({
        where:{id:carId},
      });

      if(!car){
        return{
          success:false,
          error:'Car not found',
        };
      }  

      let isWishlisted=false;
     
        if(dbUser){
          const savedCar= await db.userSavedCars.findUnique({
            where:{
              userId_carId:{
                userId:dbUser.id,
                carId,
              },
            },
          });
          isWishlisted= !!savedCar;
        }

         let userTestDrive =null;

    if(dbUser){
       const existingTestDrive= await db.testDriveBooking.findFirst({
       where:{
        carId,
        userId:dbUser.id,
        status:{in:['PENDING','CONFIRMED','COMPLETED']},
        
       },
     });


        if(existingTestDrive){
         userTestDrive={
          id:existingTestDrive.id,
          status:existingTestDrive.status,
          bookingDate:existingTestDrive.bookingDate.toISOString(),
         
         };
        
      }
    }
       
     

 
    
    const dealership = await db.dealershipInfo.findFirst({
      include:{
        workingHours:true,
      },
    });

    return{
      success:true,
      data:{
        ...serializeCarData(car,isWishlisted),
        testDriveInfo:{
          userTestDrive,
          dealership:dealership?
             {...dealership,
              createdAt:dealership.createdAt.toISOString(),
              updatedAt:dealership.updatedAt.toISOString(),
              workingHours:dealership.workingHours.map((hour)=>({...hour,
                                                                 createdAt:hour.createdAt.toISOString(),
                                                                 updatedAt:hour.updatedAt.toISOString(),
              })),

             }:
             null,
        },

      },
    };
    
      
  } catch (error) {
     throw new Error('Error fetching car detials: '+error.message);
  }


}
