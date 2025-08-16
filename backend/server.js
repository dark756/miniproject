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
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
  .catch(err => console.error(err));

function verifyCookies(req, res, next) {
  const token = req.cookies?.access_token ;
  if (!token) {
    console.log("No token found from backend")
    return res.status(400).json({ status: "failure", statusMessage: "jwt not found" })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.token = decoded;
    next();
  }
  catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log("expired token, try to refresh...");
      return res.status(404).json({ statusMessage: "expired jwt", status: "failure" });
    }
    console.log("error in verifying token: ", err)
    return res.status(400).json({ status: "failure", statusMessage: "Invalid jwt" });
  }
}
app.get("/refresh", async (req, res) => {
  console.log("initiated refresh");
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const { username } = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      const user = await db.collection("users").find({ username }).toArray();
      if (user.length === 1) {
        const refresh_token = user[0].refresh_token
        const { iat, exp, ...refresh_data } = jwt.verify(refresh_token, process.env.JWT_SECRET);
        const token = jwt.sign(refresh_data, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          //maxAge: 1000 * 60 * 30 
        });
        return res.status(200).json({ name: refresh_data.name, role: refresh_data.role, status: "success", statusMessage: "refresh successful and cookie is set" });
      }
    }
    catch (err) {
      console.log(err);
      return res.status(400).json({ status: "failure", statusMessage: `refresh failed error: ${err}` });
    }
  }
  return res.status(400).json({ status: "failure", statusMessage: `refresh failed ` });
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query = { username, password }
  try {
    const user = await db.collection("users").find(query).toArray();
    console.log(user)

    if (user.length !== 1) {
      return res.status(400).json({ statusMessage: "Username or password incorrect", status: "failure" });
    }
    const token = jwt.sign({ username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: 2 });
    const refresh_token = jwt.sign({ username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne(query, { $set: { refresh_token } });
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      //maxAge: 1000 * 60 * 30 
    });
    res.json({ role: user[0].role, status: "success", statusMessage: "login successful and cookie is set" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusMessage: "Internal server error" });
  }
});

app.get("/token", verifyCookies, (req, res) => {
  console.log(req.token);
  res.json({ name: req.token.name, role: req.token.role, status: "success", statusMessage: "jwt verfified" });
});

app.get("/get-users", verifyCookies, async (req, res) => {
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


app.get("/logout", (req, res) => {

  res.cookie("access_token", {}, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  res.json({ status: "success", statusMessage: "token erased" });
});

app.post("/add-user", verifyCookies, async (req, res) => {
  const { name, email, dob, jobrole } = req.body;

  try {
    const { username } = await db.collection("usernames").findOneAndUpdate(
      {},
      { $inc: { username: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    const body = {
      name, email, DOB: dob, jobrole,
      role: 'user',
      password: 'admin',
      username
    };
    db.collection("users").insertOne(body);
    res.json({ password: 'admin', username, status: "success", statusMessage: "added user to db" });
  }
  catch (er) {
    console.log(er);
    return res.status(400).json({ statusMessage: `unknown error: ${er}`, status: "failure" });
  }
});



















app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});