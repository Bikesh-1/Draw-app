import  express from "express";
import  Jwt  from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types"
import { prismaclient } from "@repo/db/client";
import bcrypt from "bcrypt-ts";

const app = express();
app.use(express.json());

app.post("/signup", async (req,res) =>{
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        console.log(parsedData.error);
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
    try{
       const user =  await prismaclient().user.create({
        data:{
            email:parsedData.data.email,
            //hashed pasword
            password: hashedPassword,
            name:parsedData.data.name
        }
    })
    res.json({
        userId: user.id
    })
    } catch (e: any) {
    return res.status(500).json({
        message: "Internal server error"
    });
}
    
})

app.post("/signin", async (req,res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }

    const user = await prismaclient().user.findUnique({
        where:{
            email:parsedData.data.email,
        }
    })

    if(!user){
        res.status(403).json({
            message:"Not authorized"
        })
        return;
    }
    const isPasswordValid = await bcrypt.compare(
        parsedData.data.password,
        user.password
    );
    if (!isPasswordValid) {
        return res.status(403).json({
            message: "Not authorized"
        });
    }

    
    const token = Jwt.sign({
        userId:user?.id
    },JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room",middleware, async (req,res)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }
    //@ts-ignore
    const userId = req.userId;

    try{
    const room = await prismaclient().room.create({
        data:{
            slug:parsedData.data.roomname,
            adminId:userId
        }
    })
    res.json({
        roomId:room.id
    })
    }
    catch(e){
        res.status(411).json({
            message:"Room already exists with this name"
        })
    }
})

app.get("/room/:roomId",(req,res) =>{
    const roomId = Number(req.params.roomId);
    const messages = prismaclient().chat.findMany({
        where:{
            id:roomId
        },
        orderBy:{
            id:"desc"
        },
        take:50
    });

    res.json({
        messages
    })
})

app.listen(3001);