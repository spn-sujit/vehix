import { currentUser } from "@clerk/nextjs/server"
import { db } from "./prisma";

export const checkUser = async () => {
    const user = await currentUser();
    if(!user){
        return null;
    }
    try {

        const loggedInUser = await db.user.findUnique({
            where:{
                clerkUserId: user.id,
            },
        });
        if(loggedInUser){
            return loggedInUser;
        }
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

        
    if (loggedInUser) {

      await db.user.update({
        where: {
          clerkUserId: user.id,
        },
        data: {
          name: fullName,
          imageUrl: user.imageUrl,
        },
      });
      return loggedInUser;
    }
     
        const newUser = await db.user.create({
            data:{
                clerkUserId: user.id,
                name:`${user.firstName} ${user.lastName}`,
                imageUrl : user.imageUrl,
                email : user.emailAddresses[0].emailAddress,
            },
        });
        return newUser;
        
    } catch (error) {
        console.log(error.message);
    }
}