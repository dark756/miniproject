import express from "express";
const app = express.Router();
import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient } from "mongodb";
import { GoogleGenAI } from "@google/genai";


import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


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

app.get("/check-hist", VerifyCookies, async (req, res) => {
  const { username, email } = req.token;
  let iids;
  const db = await connectDB();
  if (username) {
    const re = await db.collection("users").findOne({ username }) ?? null
    iids = re.iids ?? null;
  }
  else if (email) {
    const re = await db.collection("users").findOne({ email }) ?? null
    iids = re.iids ?? null;
  }
  if (!iids) {
    iids = [];
  }
  return res.status(200).json({ iids })
})




app.get("/check-details", VerifyCookies, async (req, res) => {
  const db = await connectDB();
  if (req.token.username) {
    const { details } = await db.collection("users").findOne({ username: req.token.username })
    if (details === null || !details) {
      return res.status(200).json({
        detailsFound: false
      })
    }
    return res.status(200).json(
      {
        detailsFound: true,
        details
      }
    )
  }
  else if (req.token.email) {
    const { details } = db.collection("users").findOne({ email: req.token.email })
    if (details === null || !details) {
      return res.status(200).json({
        detailsFound: false
      })
    }
    return res.status(200).json(
      {
        detailsFound: true,
        details
      }
    )
  }

  return res.status(400).json({
    statusMessage: "user not found"
  })
});

export async function difficulty(user) {
  const education = user.details.education.length !== 0 ? user.details.education : null;
  const workex = user.details.workex.length !== 0 ? user.details.workex : null
  const certs = user.details.certifications.length !== 0 ? user.details.certifications : null
  const diff_query = `generate a number from 0 to 10 with upto 2 floating points which signifies the difficulty of interview questions a candidate should face based on the following information:
       education: ${education.map(e => `${e.degree} from ${e.institute} with ${e.cgpa} CGPA`).join(";\t")};
      ${certs ? `certifications: ${certs.map(e => `${e.name} from ${e.provider}`).join(";\t")}` : ""};
      ${workex ? `work experience: ${workex.map(e => `worked for ${e.company} as a ${e.role} for ${Math.round((new Date(e.end_date) - new Date(e.start_date)) / (24 * 60 * 60 * 1000))} days`).join(";\t")}` : ""}`
  const diff_config = "return a response only containing the floating point answer upto 2 floating points from 0-10 based on the query constrains";
  const api_key = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: api_key });
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: diff_query,
      config: {
        systemInstruction: diff_config,
      }
    });
    console.log(result.text);
    const diff = Number(result.text);
    try {
      const db = await connectDB();
      if (user.username) {
        db.collection("users").updateOne({ username: user.username }, { $set: { "details.diff": diff } })
      }
      else if (user.email) {
        db.collection("users").updateOne({ email: user.email }, { $set: { "details.diff": diff } })
      }
      else {
        console.log("couldnt save diff to mongo in difficulty() backend/routes/dash.js ")
      }
    }
    catch (er) {
      console.log("mongo error in difficulty function, backend/routes/dash.js")
    }
    return diff;
  }
  catch (er) {
    console.log("err in diff setting must be done again")
    return null;
  }
}

app.post("/update-details", VerifyCookies, async (req, res) => {
  const { payload } = req.body;
  let user = {
    details: payload
  }

  try {
    const db = await connectDB();
    if (req.token.username) {
      const username = req.token.username;
      user.username = username;
      db.collection("users").updateOne({ username }, { $set: { details: payload } })
    }
    else if (req.token.email) {
      const email = req.token.email;
      user.email = email;
      db.collection("users").updateOne({ email }, { $set: { details: payload } })
    }
    else {
      return res.status(400).json(
        {
          statusMessage: "failed to update changes to user bio"
        }
      )
    }
    difficulty(user);
    //fire and forget function

    return res.status(200).json(
      {
        statusMessage: "changes updated successfully"
      })
  }
  catch (er) {
    console.log("error in try catch block in update-details", er);
    return res.status(500).json(
      {
        statusMessage: "internal server error"
      }
    )
  }
});


export default app; 