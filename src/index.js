// require("dotenv").config({ path: "./env" });
import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})
connectDB();

// APPROACH ONE
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from 'express'
const app =express()

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    // If app is not able to communicate to Database
    app.on('error',(error)=>{
        console.log('Error: ',error)
        throw error
    })

    
    app.listen(process.env.PORT,()=>{
      console.log('====================================');
      console.log(`App is listening on port ${process.env.PORT}`);
      console.log('====================================');
    })
  } catch (error) {
    console.error("ERROR: ", error);
  }
})();

*/
