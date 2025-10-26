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
  const token = req.cookies?.access_token;
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
    //console.log(user)

    if (user.length !== 1) {
      return res.status(400).json({ statusMessage: "Username or password incorrect", status: "failure" });
    }
    const token = jwt.sign({ email: user[0].email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: 2 });
    const refresh_token = jwt.sign({ email: user[0].email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
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


app.post("/glogin", async (req, res) => {
  const info = req.body;
  //console.log(info);
  const { name, email } = info;
  try {
    const user = await db.collection("users").find({ email }).toArray();
    //console.log(user)

    if (user.length !== 1) {
      if (user.length === 0) {
        //add user
        const body = {
          name, email,
          role: 'user',
          password: null,
          username: null
        };
        db.collection("users").insertOne(body);
        const token = jwt.sign({ email, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: 2 });
        const refresh_token = jwt.sign({ email, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: "30d" });
        db.collection("users").updateOne({ email }, { $set: { refresh_token } });
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          //maxAge: 1000 * 60 * 30 
        });
        res.json({ role: "user", status: "success", statusMessage: "login successful and cookie is set" });

      }
      return res.status(400).json({ statusMessage: "invalid email address", status: "failure" });//add user here
    }
    const token = jwt.sign({ email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: 2 });
    const refresh_token = jwt.sign({email, username: user[0].username, name: user[0].name, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne({ email }, { $set: { refresh_token } });
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
  // console.log(req.token);
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

app.get("/check-username", async (req, res) => {
  const user = req.query.username;
  if (!user || user === "") {
    return res.status(200).json({
      available: null,
      message: "username is empty/not given"
    })
  }
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
  const { username, pass, name, email} = req.body;

  try {
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
    // const { username } = await db.collection("usernames").findOneAndUpdate(
    //   {},
    //   { $inc: { username: 1 } },
    //   { upsert: true, returnDocument: "after" }
    // );

    const body = {
      name, email, 
      role: 'user',
      password: pass,
      username
    };
    db.collection("users").insertOne(body);

    const token = jwt.sign({ email,username, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: 600 });
    const refresh_token = jwt.sign({ email, username, name, role: "user" }, process.env.JWT_SECRET, { expiresIn: "30d" });
    db.collection("users").updateOne({ username }, { $set: { refresh_token } });
    res.cookie("access_token", token, {
      httpOnly: true, 
      secure: false,
      sameSite: "lax",
      path: "/",
      // maxAge: 0
    });
    return res.status(200).json({ username, status: "success", statusMessage: "added user to db" });

  }
  catch (er) {
    console.log(er);
    return res.status(400).json({ statusMessage: `unknown error: ${er}`, status: "failure" });
  }
});


app.get("/check-details", verifyCookies, async (req, res) => {
        // console.log(`"${req.token.username}"`);
    if(req.token.username)
    {
      console.log("we have local auth");
      const {details}=await db.collection("users").findOne({username:req.token.username})
      // console.log(details?details:"hi");
      if(details===null || !details)
      {
        return res.status(200).json({
          detailsFound:false
        })
      }
      return res.status(200).json(
        {
          detailsFound:true,
          details
        }
      )
    }
    if(!req.token.username && req.token.email)
    {
      const {details}=db.collection("users").findOne({email:req.token.email})
      if(details===null|| !details)
      {
        return res.status(200).json({
          detailsFound:false
        })
      }
      return res.status(200).json(
        {
          detailsFound:true,
          details
        }
      )
    }

  return res.status(400).json({
    statusMessage:"user not found"
  })
});



app.post("/update-details", verifyCookies, async (req,res)=>{
const {payload}=req.body;
try{
if (req.token.username)
{
  //local
  const username=req.token.username;
  db.collection("users").updateOne({username},{$set:{details:payload}})
}
else if(req.token.email)
{
  const email=req.token.email;
  db.collection("users").updateOne({email},{$set:{details:payload}})
}
else
{
  return res.status(400).json(
    {
      statusMessage:"failed to update changes to user bio"
    }
  )
}
return res.status(200).json(
  {
    statusMessage:"changes updated successfully"
  })
}
catch(er)
{
  console.log("error in try catch block in update-details");
  return res.status(500).json(
    {
      statusMessage:"internal server error"
    }
  )
}
});











app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});