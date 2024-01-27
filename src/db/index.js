import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


async function connectDB(){
    try {
    const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log('MONGODB connection error ',error);
        process.exit(1)
    }
}


export default connectDB