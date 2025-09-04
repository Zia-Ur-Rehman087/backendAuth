import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.get("/", (req, res) => {
  res.send("welcome to backend camp!");
});
// basic configurations
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// cors configuratiosn

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// import the routes

import healthCheckRouter from "./routes/healthcheck-routes.js";
import authRouter from "./routes/auth-route.js";
app.use("/api/v1/auth/", authRouter);

app.get("/", (req, res) => {
  console.log("welcome to the backend camp.");
});

export default app;
