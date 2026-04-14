import  express from "express";
import  Jwt  from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types"
const app = express();
import { prismaclient } from "@repo/db/client";

app.use(express.json());

app.post("/signup", async (req,res) =>{
    //db call 
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }
    try{
       const user =  await prismaclient().user.create({
        data:{
            email:parsedData.data?.username,
            password: parsedData.data.password,
            name:parsedData.data.name
        }
    })
    res.json({
        userId: user.id
    })
    } catch(e){
        res.status(411).json({
            message:"User Already exists with this username"
        })
    }
    
})

app.post("/signin",(req,res)=>{
    const data = SigninSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }


    const userId = 1;
    const token = Jwt.sign({
        userId
    },JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room",middleware,(req,res)=>{
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incoorect Inputs"
        })
        return;
    }

    res.json({
        roomId:123
    })
})

app.listen(3001);