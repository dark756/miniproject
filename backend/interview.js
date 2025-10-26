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
    if(req.token.username)
    {
        const re=await db.collection("users").findOne({username:req.token.username});
        const auth={type:"username",re}
        console.log(re.details.education[0]);
        return res.json({hi:"bye"})
    }


    const lang="python";//fetch from details
    /*
    details? continue: fail
    - stack and langs 
    - slight mention of education and certs and workex to determine difficulty range
    - maybe remove remarks
    */
    const api_key=process.env.API_KEY;
    const config="DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. create new non-repeating mcq question based on the query given. format for output: {\"question\":\"sample question text in one string\",\"type\":\"mcq\",\"option_a\":\"(a) sample option a text in one string\",\"option_b\":\"(b) sample option b text in one string\",\"option_c\":\"(c) sample option c text in one string\",\"option_d\":\"(d)  option d text in one string\",\"correct_answer\":\"(a/b/c/d) sample correct option a/b/c/d text in one string\"} and use the following format for subjective type questions: {\"question\":\"sample question text in one string\",\"type\":\"subjective\",\"correct_answer\":\"sample answer text in one string\"}. return all questions and answer objects in a json formattable array [{qa pair},{mcq pair},...]"
    const query = `generate ${subjective} random difficulty subjective and ${mcq} mcq questions for an ai based candidate interview system with a tech company related to ${lang} programming language without using any markdown formatting and strictly following instruction. Note: do not include \` backticks in any text under any circustances`
    const ai = new GoogleGenAI({apiKey:api_key});
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
            username:req.token.username,
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