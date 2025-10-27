import express from "express";
const app = express();
// import { VerifyCookies } from "./Verify_cookies.js";
import { MongoClient } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();


let db;
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
    .catch(err => console.error(err));

/*
SCHEMA
how will we store interview data
- 'interviews' collection in mongo
- interview id(use objectID generated) corresponding to user ID(email or username)
- format:

{
    objectID: 3ryuimlgfruy 
    email:?
    username:?
    date:
    questions:[{qno, q,   type,    answer(if mcq)}]
    answers:
        [
            {qno, ans:"something",eval:null/0/1/fuzzy,   type:mcq/subjective}
        ]
    evalStat:unanswered/pending/initiated/complete
    score:0-5

}
*/
 

function vc(req, res, next)
{
    req.token={username:"1"}
    next();//call verifycookies instead after testing is done
}

app.get("/",vc ,async (req,res) => {
    //load data from env
    const no_questions=Number(process.env.NO_QUESTIONS) || 5;
    const ratio=Number(process.env.RATIO) || 0.5;
    const mcq=Math.round(no_questions*ratio);
    const subjective=no_questions-mcq;
    //deets fetch
    let user;
    let auth;
    if(req.token.username)
    {
         user=await db.collection("users").findOne({username:req.token.username});
         auth={type:"username"}
    }
    if(req.token.email)
    {
         user=await db.collection("users").findOne({email:req.token.email});
         auth={type:"email"}
    }
    if(!user)
    {
        return res.status(400).json({
            statusMessage:"couldnt find user info"
        })
    }
    if(!user.details || user.details===null)
    {
        return res.status(400).json({
            statusMessage:"details not filled"
        })
    }
    const lang=user.details.progLangs;//fetch from details
    const stack=user.details.tech[0];
    const prompt=`the tech stack ${stack} mainly and also some questions based on ${lang.join(", ")}`
    const education=user.details.education.length!==0?user.details.education:null;
    const workex=user.details.workex.length!==0?user.details.workex:null
    const certs=user.details.certifications.length!==0?user.details.certifications:null
    // console.log((user.details))
    const diff_query=`generate a number from 0 to 10 with upto 2 floating points which signifies the difficulty of interview questions a candidate should face based on the following information:
     education: ${education.map(e=>  `${e.degree} from ${e.institute} with ${e.cgpa} CGPA`).join(";\t")};
    ${certs? `certifications: ${certs.map(e=>`${e.name} from ${e.provider}`).join(";\t")}`:""};
    ${workex? `work experience: ${workex.map(e=>`worked for ${e.company} as a ${e.role} for ${Math.round((new Date(e.end_date)- new Date(e.start_date))/(24*60*60*1000))} days`).join(";\t")}`:""}`
    const diff_config="return a response only containing the floating point answer upto 2 floating points from 0-10 based on the query constrains";
    const api_key=process.env.API_KEY;
    const ai = new GoogleGenAI({apiKey:api_key});
     try{
        const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: diff_query,
    config: {
      systemInstruction: diff_config,
    }
    });
    console.log(result.text);
    const diff=Number(result.text);
    console.log(typeof diff)
    return res.json({diff})//fire and forget for this******* move to dash.js when details are  uploaded
}   
catch(er)
{
    console.log(`gemini error: ${er}`)
    return res.status(500).json({
        statusMessage:"internal server error"
    })
}

     /*
    details? continue: fail
    - stack and langs 
    - slight mention of education and certs and workex to determine difficulty range
    - maybe remove remarks
    */
    const config="DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. create new non-repeating mcq question based on the query given. format for output: {\"question\":\"sample question text in one string\",\"type\":\"mcq\",\"option_a\":\"(a) sample option a text in one string\",\"option_b\":\"(b) sample option b text in one string\",\"option_c\":\"(c) sample option c text in one string\",\"option_d\":\"(d)  option d text in one string\",\"correct_answer\":\"(a/b/c/d) sample correct option a/b/c/d text in one string\"} and use the following format for subjective type questions: {\"question\":\"sample question text in one string\",\"type\":\"subjective\",\"correct_answer\":\"sample answer text in one string\"}. return all questions and answer objects in a json formattable array [{qa pair},{mcq pair},...]"
    const query = `generate ${subjective} subjective and ${mcq} mcq questions of ${diff} difficulty for a candidate interview system with a tech company related to ${prompt} programming languages without using any markdown formatting and strictly following instruction. Note: do not include \` backticks or quotes in any text under any circustances`
    try{
        const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      systemInstruction: config,
    }
  });
    console.log(result.text);
    const res_text=result.text;
    const questions=JSON.parse(res_text)
    return res.status(200).json(
        {
            questions,
            username:req.token.username,//add email alt
            interviewID:"xyz"//get from mongo
        }
    )
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json(
        {
            statusMessage:"internal server error"
        }
    )
  }

});




app.listen(8080, () => {
  console.log(`Server is running at http://localhost:8080`);
});




//  const gemini = new GoogleGenerativeAI(api_key);
//     const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

//     try {
//     const result = await model.generateContent({
//       contents: query,
//       generationConfig: {systemInstruction:config}
//     });