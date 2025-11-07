import express from "express";
import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const app = express.Router();


// let db;
// MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
//   .catch(err => console.error(err));
let db;

async function connectDB() {
  if (db) return db;
  
  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  await client.connect(); // Explicit connect call
  db = client.db();
  return db;
}


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query = { username, password }
  try {
    const db = await connectDB();
    const user = await db.collection("users").find(query).toArray();
    if (user.length !== 1) {
      return res.status(400).json({ statusMessage: "Username or password incorrect", status: "failure" });
    }
    const token = jwt.sign({ email: user[0].email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: 3600 });
    const refresh_token = jwt.sign({ email: user[0].email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne(query, { $set: { refresh_token } });
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.json({ role: user[0].role, status: "success", statusMessage: "login successful and cookie is set" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusMessage: "Internal server error" });
  }
});

app.post("/glogin", async (req, res) => {
  const info = req.body;
  const { name, email } = info;
  try {
    const db = await connectDB();
    const user = await db.collection("users").find({ email }).toArray();
    if (user.length !== 1) {
      if (user.length === 0) {
        const body = {
          name, email,
          role: 'user',
          password: null,
          username: null
        };
        db.collection("users").insertOne(body);
        const token = jwt.sign({ email, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: 3600 });
        const refresh_token = jwt.sign({ email, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: "30d" });
        db.collection("users").updateOne({ email }, { $set: { refresh_token } });
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
        });
        res.json({ role: "user", status: "success", statusMessage: "login successful and cookie is set" });

      }
      return res.status(400).json({ statusMessage: "invalid email address", status: "failure" });//add user here
    }
    const token = jwt.sign({ email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: 3600 });
    const refresh_token = jwt.sign({ email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne({ email }, { $set: { refresh_token } });
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.json({ role: user[0].role, status: "success", statusMessage: "login successful and cookie is set" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusMessage: "Internal server error" });
  }
});



app.get("/token", VerifyCookies, (req, res) => {
  res.json({ name: req.token.name, role: req.token.role, status: "success", statusMessage: "jwt verfified" });
});


app.get("/refresh", async (req, res) => {
  console.log("initiated refresh");
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const { username } = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      const db = await connectDB();
      const user = await db.collection("users").find({ username }).toArray();
      if (user.length === 1) {
        const refresh_token = user[0].refresh_token
        const { iat, exp, ...refresh_data } = jwt.verify(refresh_token, process.env.JWT_SECRET);
        const token = jwt.sign(refresh_data, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
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


app.get("/logout", (req, res) => {

  res.cookie("access_token", {}, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0
  });
  res.json({ status: "success", statusMessage: "token erased" });
});


app.get("/check-username", async (req, res) => {
  const user = req.query.username;
  if (!user || user === "") {
    return res.status(200).json({
      available: null,
      message: "username is empty/not given"
    })
  }
  const db = await connectDB();

  const users = await db.collection("users").find({ username: user }).toArray();
  if (users.length === 0) {
    return res.status(200).json({
      available: true,
      message: "username is available"
    })
  }

  return res.status(200).json({
    available: false,
    message: "username is not available"
  })
});


app.post("/add-user", async (req, res) => {
  const { username, pass, name, email } = req.body;

  try {
    const db = await connectDB();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "failure",
        statusMessage: "Email already exists"
      });
    }
    const existingUsername = await db.collection("users").findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        status: "failure",
        statusMessage: "username already exists"
      });
    }

    const body = {
      name, email,
      role: 'user',
      password: pass,
      username
    };
    db.collection("users").insertOne(body);

    const token = jwt.sign({ email, username, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: 3600 });
    const refresh_token = jwt.sign({ email, username, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne({ username }, { $set: { refresh_token } });
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    return res.status(200).json({ username, status: "success", statusMessage: "added user to db" });

  }
  catch (er) {
    console.log(er);
    return res.status(400).json({ statusMessage: `unknown error: ${er}`, status: "failure" });
  }
});

export default app;