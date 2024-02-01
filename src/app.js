import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// middlewares || configuaration
// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//   })
// );
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); //Read cookies or set cookies in browser securely.

// routes import
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
console.log("app");
export { app };
