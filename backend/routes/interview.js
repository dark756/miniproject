import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import { difficulty } from "./dash.js"
import { VerifyCookies } from "./Verify_cookies.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// const app = express();
// app.use(express.json());
const app = express.Router();


let db;
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
    .catch(err => console.error(err));

// function VerifyCookies(req, res, next) {
//     req.token = { username: "1" }
//     next();
// }

app.get("/gen", VerifyCookies, async (req, res) => {
    //load faceID stat from cookies
    const no_questions = Number(process.env.NO_QUESTIONS) || 5;
    const ratio = Number(process.env.RATIO) || 0.5;
    const mcq = Math.round(no_questions * ratio);
    const subjective = no_questions - mcq;
    let user;
    let auth;
    if (req.token.username) {
        user = await db.collection("users").findOne({ username: req.token.username });
        auth = { type: "username" }
    }
    if (req.token.email) {
        user = await db.collection("users").findOne({ email: req.token.email });
        auth = { type: "email" }//debug
    }
    if (!user) {
        return res.status(400).json({
            statusMessage: "couldnt find user info"
        })
    }
    if (!user.details || user.details === null) {
        return res.status(400).json({
            statusMessage: "details not filled"
        })
    }
    const lang = user.details.progLangs;//fetch from details
    const stack = user.details.tech[0];
    const prompt = `the tech stack ${stack} mainly and also some questions based on ${lang.join(", ")}`
    let diff = Number(user.details.diff);
    if (!user.details.diff || user.details.diff === null) {
        diff = await difficulty(user);//moved diff generation to fire and forget async function called on details update
        if (!diff || diff === null) {
            console.log(diff);
            return res.status(500).json({
                statusMessage: "internal server error"
            })
        }
    }
    const api_key = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: api_key });
    const config = "DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR answers however please use double quotes \" to make json strings in response. Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. create new non-repeating mcq question based on the query given. format for output: {\"question\":\"sample question text in one string\",\"type\":\"mcq\",\"option_a\":\"(a) sample option a text in one string\",\"option_b\":\"(b) sample option b text in one string\",\"option_c\":\"(c) sample option c text in one string\",\"option_d\":\"(d)  option d text in one string\",\"correct_answer\":\"(a/b/c/d) sample correct option a/b/c/d text in one string\"} and use the following format for subjective type questions: {\"question\":\"sample question text in one string\",\"type\":\"subjective\",\"correct_answer\":\"sample answer text in one string\"}. return all questions and answer objects in a json formattable array [{qa pair},{mcq pair},...]"
    const query = `generate ${subjective} subjective and ${mcq} mcq questions of ${diff} difficulty for a candidate interview system with a tech company related to ${prompt} programming languages without using any markdown formatting and strictly following instruction. Note: do not include \` backticks or quotes in any text under any circustances, ALSO NOTE: make sure correct_answer in subjective type questions are long and comprehensive enough(130-180***** words max) to be similar(similarity checked by llm) to any possible small concise correct answer given by candidate`
    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                systemInstruction: config,
            }
        });
        console.log(result.text);
        const res_text = result.text;
        let questions = JSON.parse(res_text)
        const { insertedId: id } = await db.collection("interviews").insertOne({
            generationDate: new Date,
            questions,
            evalStatus: "unanswered",
            [auth.type]: user.username

        })
        console.log(id)
        questions = questions.map(({ correct_answer, ...rest }) => rest)
        return res.status(200).json(
            {
                questions,
                interviewID: id,
            }
        )
    } catch (err) {
        console.error("Gemini API error:", err);
        return res.status(500).json(
            {
                statusMessage: "internal server error"
            }
        )
    }

});



export async function re_eval(questions, answers, iid, t = 0) {
  try {
    const subQuestionsWithIndex = questions
      .map((q, i) => ({ question: q, index: i }))
      .filter(({ question }) => question.type === "subjective");

    const correctAnswers = subQuestionsWithIndex.map(({ question }) => question.correct_answer);

    const candidateAnswers = subQuestionsWithIndex.map(({ index }) =>
      answers[index.toString()] !== undefined ? answers[index.toString()] : ""
    );

const hasAllSubjectivesUnanswered = candidateAnswers.every(ans => !ans || ans.trim() === "");
    let ret_ans = questions.map((q, i) => ({
      answer: answers[i.toString()] || "",
      type: q.type,
      marks: 0
    }));

    questions.forEach((q, i) => {
      if (q.type === "mcq") {
        if (q.correct_answer.charAt(1) === (answers[i.toString()]?.charAt(1) || "")) {
          ret_ans[i].marks = 1;
        }
      }
    });

    if (hasAllSubjectivesUnanswered) {
        console.log("skips")
      const totalScore = ret_ans.reduce((acc, cur) => acc + cur.marks, 0);
      await db.collection("interviews").updateOne(
        { _id: new ObjectId(iid) },
        { $set: { score: totalScore, evalStatus: "scored" } }
      );
      return { score: totalScore, answers: ret_ans };
    }
    console.log(candidateAnswers)

    const api_key = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: api_key });
    const query = `im going to give 2 arrays, correct answers and candidate answers, i want you to compare them and return a floating point (upto 2 decimals between 0 and 1) score for how similar the candidates answer is to the correct answer, response should have an array of floating points with the same length as both input arrays: correct answers: ${correctAnswers} candidate answers: ${candidateAnswers}`;
    const config = "DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE ' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ``````  AFTER THE CONTENT. generate scores between (inclusive) 0 and 1 (floating point upto 2 decimals) based on similarity of candidate answers to correct answers given in query such that 0.8 signifies that the candidates subjective answer is similar enough to the correct answer or matches its idea enough to be considered a correct answer.";

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: { systemInstruction: config }
    });

    const llmScores = JSON.parse(result.text);

    let llmIndex = 0;
    questions.forEach((q, i) => {
      if (q.type === "subjective") {
        if (llmScores[llmIndex] >= parseFloat(process.env.LLM_SIMILARITY || "0.8")) {
          ret_ans[i].marks = 1;
        }
        llmIndex++;
      }
    });

    const totalScore = ret_ans.reduce((acc, cur) => acc + cur.marks, 0);

    await db.collection("interviews").updateOne(
      { _id: new ObjectId(iid) },
      { $set: { score: totalScore, evalStatus: "scored" } }
    );

    return { score: totalScore, answers: ret_ans };
  } catch (err) {
    console.error("Gemini API error:", err);
    if (t > 2) {
      return null;
    } else {
      re_eval(questions, answers, iid, t + 1);
    }
    return;
  }
}


app.post("/submit", VerifyCookies, async (req, res) => {
    const iid = req.body.interviewID ;
    const answers = req.body.answers
    try {
        const { questions } = await db.collection("interviews").findOneAndUpdate({ _id: new ObjectId(iid) }, { $set: { answers, submissionDate: new Date(), evalStatus: "submitted" } });
        re_eval(questions, answers, iid,0);
        return res.status(200).json(
            {
                statusMessage: "submitted answers successfully"
            }
        )
    }
    catch (er) {
        console.log(er)
        return res.status(500).json(
            {
                statusMessage: "internal server error"
            }
        )
    }
});


app.get("/score/:id", VerifyCookies, async (req, res) => {
    try {
        const id = req.params.id;
        const re = await db.collection("interviews").findOne({ _id: new ObjectId(id) })
        if(re.evalStatus==="scored"){
            return res.status(200).json(
                {
                    score:re.score
                }
            )
        }
        else
        {
            return res.status(201).json(
                {
                    statusMessage:"waiting"
                }
            )
        }

    }
    catch (er) {
        console.log(er);
        return res.status(500).json(
            {
                statusMessage: "internal server error"
            }
        )
    }
})




// app.post("/submit", VerifyCookies, async (req, res) => {
//     const iid = req.body.interviewID||"690349a0fe4138e896a1575f";//post
//     const answers = req.body.answers //ccbbc
//     const interview = await db.collection("interviews").findOne({ _id: new ObjectId(iid) });
//     const questions = interview.questions;
//     const sub_questions_with_index = questions
//         .map((q, i) => ({ question: q, index: i }))
//         .filter(({ question }) => question.type === "subjective");

//     const sub_questions = questions.filter((e) => e.type === "subjective");
//     const correct_answers = sub_questions.map((e) => e.correct_answer)
//     const candidate_answers = sub_questions_with_index.map(({ index }) => answers[index]);
//     if (!answers || !interview || answers.length !== questions.length || sub_questions.length !== candidate_answers.length) {
//         //idk
//         console.log(questions);
//         console.log(answers);
//         return res.status(500).json({ statusMessage: "length mismatch" })
//     }

//     const api_key = process.env.API_KEY;
//     const ai = new GoogleGenAI({ apiKey: api_key });
//     const query = `im going to give 2 arrays, correct answers and candidate answers, i want you to compare them and return a floating point (upto 2 decimals between 0 and 1) score for how similar the candidates answer is to the correct answer, response should have an array of floating points with the same length as both input arrays: correct answers: ${correct_answers} candidate answers: ${candidate_answers}`;
//     const config = "DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. generate scores between (inclusive) 0 and 1 (floating point upto 2 decimals) based on similarity of candidate anwswers to correct answers given in query such that 0.8 signifies that the candidates subjective answer is similar enough to the correct answer or matches its idea enough to be considered a correct answer. ";

//     try {
//         const result = await ai.models.generateContent({
//             model: "gemini-2.5-flash",
//             contents: query,
//             config: {
//                 systemInstruction: config,
//             }
//         });
//         console.log(result.text);
//         const res_text = result.text;
//         const llm_scores = JSON.parse(res_text)
//         console.log(typeof llm_scores, llm_scores);
//         let llm_index = 0;
//         let ret_ans = [];
//         questions.map((q, i) => {
//             if (q.type === "mcq") {
//                 if (q.correct_answer.charAt(1) === answers[i])
//                     ret_ans.push({ answer: answers[i], type: "mcq", marks: 1 })
//                 else
//                     ret_ans.push({ answer: answers[i], type: "mcq", marks: 0 })
//             }
//             else if (q.type === "subjective" && llm_index < llm_scores.length) {
//                 //sub
//                 if (llm_scores[llm_index] > process.env.LLM_SIMILARITY)
//                     ret_ans.push({ answer: answers[i], type: "subjective", marks: 1 })
//                 else
//                     ret_ans.push({ answer: answers[i], type: "subjective", marks: 0 })
//                 llm_index++;
//             }
//         })
//         const score = ret_ans.reduce((acc, e) => acc + e.marks, 0);

//         db.collection("interviews").updateOne({ _id: new ObjectId(iid) }, { $set: { score, candidate_answers: ret_ans, submissionDate:new Date, evalStatus:"scored" } })//add answers
//         return res.status(200).json(
//             {
//                 interviewID: iid,
//                 score
//             }
//         )
//     } catch (err) {
//         console.error("Gemini API error:", err);
//         db.collection("interviews").updateOne({ _id: new ObjectId(iid) }, { $set: {  candidate_answers:answers, submissionDate:new Date, evalStatus:"initiated" } })
//         re_eval(iid);
//         return res.status(500).json(
//             {
//                 statusMessage: "internal server error"
//             }
//         )
//     }
// });


//send iid and scores as a list to users db, and get it when loading dash for interview hist



app.get("/generate", (req, res)=>{
  res.status(200).json({
    "interviewID": "690b0f13154668f9c8f897e7",
  "questions": [
    {
      "question": "Imagine designing a high-traffic candidate interview system. What are the key scalability and deployment considerations for such a system.",
      "type": "subjective"
    },
    {
      "question": "Consider a complex TypeScript codebase for the backend. How do you ensure maintainability with request/response transformations or data validation.",
      "type": "subjective"
    },
    {
      "question": "For a Next.js-based candidate interview system, a balance of freshness, performance, and scalability?",
      "type": "mcq",
      "option_a": "(a) Server-Side Rendering SSR for every dashboard visit, ensuring absolute freshness.",
      "option_b": "(b) Static Site Generation SSG with a revalidate option and client-side fetching for highly dynamic components.",
      "option_c": "(c) Incremental Static Regeneration ISR with a suitable cache for most frequently changing parts of the dashboard.",
      "option_d": "(d) Using pure client-side rendering for highest scalability."
    },
    {
      "question": "Consider a utility function in a TypeScript backend that needs deep filtering capability while maintaining type safety?",
      "type": "mcq",
      "option_a": "(a) Rely solely on Partial<T> and handle nested properties with optional chaining at runtime.",
      "option_b": "(b) Utilize a recursive conditional type to deeply make parts of the criteria object optional, allowing nested optional properties.",
      "option_c": "(c) Implement a custom generic type that uses keyof and conditional types to enforce type safety on deeply nested paths in criteria.",
      "option_d": "(d) Use 'any' type for maximum flexibility."
    },
    {
      "question": "In a Next.js application for a candidate interview system, what is most suitable for offloading this heavy computation?",
      "type": "mcq",
      "option_a": "(a) Using setTimeout with a 0ms delay to defer the task to the next event loop cycle.",
      "option_b": "(b) Implementing a Web Worker in the Next.js frontend to perform the computation client-side.",
      "option_c": "(c) Leveraging Node.js worker threads within a Next.js API route or a dedicated serverless function.",
      "option_d": "(d) Running the computation synchronously on the main thread."
    }
  ]
  })
})



export default app;

// app.listen(8080, () => {
//     console.log(`Server is running at http://localhost:8080`);
// });