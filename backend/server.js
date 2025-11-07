import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import auth from "./routes/auth.js"
import dash from "./routes/dash.js"
import admin from "./routes/admin_routes.js"
import interview from "./routes/interview.js"

dotenv.config({ path: ".env.local" });
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use("/", auth);
app.use("/", dash);
app.use("/", admin);
app.use("/", interview)


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.JWT_SECRET}`);
});