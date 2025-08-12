import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import jwt from "jsonwebtoken";

//              nodemon server.js 

dotenv.config();
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
let db;
MongoClient.connect(process.env.MONGO_URI).then(client => {db = client.db();})
.catch(err => console.error(err));


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query={username, password}
   try {
    const user = await db.collection("users").find(query).toArray();
            console.log(user)

    if (user.length !== 1) {
      return res.status(400).json({ statusMessage: "Username or password incorrect", status: "failure" });
    }
    const token = jwt.sign({ username: user[0].username }, process.env.JWT_SECRET, { expiresIn: "30min" });
    res.json({ token ,status:"success", "statusMessage":"login successful now frontend can set token from res.data.token"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusMessage: "Internal server error" });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});