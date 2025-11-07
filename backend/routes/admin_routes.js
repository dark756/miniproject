import express from "express";
import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const app = express.Router();

// let db;
// MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
//   .catch(err => console.error(err));
let db;

async function connectDB() {
  if (db) return db; // return existing DB if already connected
  const client = await MongoClient.connect(process.env.MONGO_URI);
  db = client.db();
  return db;
}

app.get("/get-users", VerifyCookies, async (req, res) => {
  if (req.token.role !== "admin") {
    return res.status(400).json({ statusMessage: "No access for user", status: "failure" });
  }
  try {
    const db = await connectDB();
    const users = await db.collection("users").find({ role: "user" }).toArray();
    res.json({ users, status: "success", statusMessage: "returned list of users" });
  }
  catch (er) {
    console.log(er);
    return res.status(400).json({ statusMessage: `unknown error: ${er}`, status: "failure" });
  }

})
app.post("/delete-user", VerifyCookies, async (req, res) => {
  if (req.token.role !== "admin") {
    return res.status(400).json({ statusMessage: "No access for user", status: "failure" });
  }
  const user = req.body.user;
  const { username, email } = user;
  const db = await connectDB();

  if (username) {
    db.collection("users").deleteOne({ username })
  }
  else if (email) {
    db.collection("users").deleteOne({ email })
  }
  else {
    return res.status(400).json({ statusMessage: "failed to find user" });
  }
  return res.status(200).json({
    statusMessage: "user deleted successfully"
  })
})


export default app;