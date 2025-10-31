import express from "express";
import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const app = express.Router();

let db;
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
  .catch(err => console.error(err));


app.get("/get-users", VerifyCookies, async (req, res) => {
  if (req.token.role !== "admin") {
    return res.status(400).json({ statusMessage: "No access for user", status: "failure" });
  }
  try {
    const users = await db.collection("users").find({ role: "user" }).toArray();
    res.json({ users, status: "success", statusMessage: "returned list of users" });
  }
  catch (er) {
    console.log(er);
    return res.status(400).json({ statusMessage: `unknown error: ${er}`, status: "failure" });
  }

})


export default app;