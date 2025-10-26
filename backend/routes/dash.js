import express from "express";
const app = express.Router();
import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();


let db;
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
  .catch(err => console.error(err));



app.get("/check-details", VerifyCookies, async (req, res) => {
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



app.post("/update-details", VerifyCookies, async (req,res)=>{
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




export default app; 