import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

//              nodemon server.js 

dotenv.config();
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());

let db;
MongoClient.connect(process.env.MONGO_URI).then(client => {db = client.db();})
.catch(err => console.error(err));

function verifyCookies(req,res,next)
{
  const token=req.cookies?.access_token;
  console.log(req.cookies?.access_token)
  if (!token)
  {
    console.log("hi")
    return res.status(400).json({status:"failure",statusMessage:"jwt not found"})
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("hi",err)
      return res.status(400).json({ message: "Invalid jwt" });
    }
    req.token = decoded; 
    next();
});
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query={username, password}
   try {
    const user = await db.collection("users").find(query).toArray();
            console.log(user)

    if (user.length !== 1) {
      return res.status(400).json({ statusMessage: "Username or password incorrect", status: "failure" });
    }
    const token = jwt.sign({ username: user[0].username, name:user[0].name }, process.env.JWT_SECRET, { expiresIn: "30min" });
  res.cookie("access_token", token, {
      httpOnly: true,  
      secure: false,    
      sameSite: "lax",
      path:"/",
      maxAge: 1000 * 60 * 30 
    });    
    res.json({ status:"success", "statusMessage":"login successful and cookie is set"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusMessage: "Internal server error" });
  }
});



app.get("/dashboard", verifyCookies, (req, res) => {
  res.json({ name: req.token.name, status:"success",statusMessage:"jwt verfified"});
});






















app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});