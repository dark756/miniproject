import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import { difficulty } from "./dash.js"
import { VerifyCookies } from "./Verify_cookies.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const app = express.Router();


// let db;
// MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
//     .catch(err => console.error(err));
let db;

async function connectDB() {
    if (db) return db; // return existing DB if already connected
    const client = await MongoClient.connect(process.env.MONGO_URI);
    db = client.db();
    return db;
}

app.get("/generate/:id", VerifyCookies, async (req, res) => {
    const db = await connectDB();
    const id = Number(req.params.id) || 0;
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
    else if (req.token.email) {
        user = await db.collection("users").findOne({ email: req.token.email });
        auth = { type: "email" }
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
    let prompt = ""
    const lang = user.details.progLangs;
    const stack = user.details.tech;
    if (id < stack.length) {
        prompt = stack[id]
    }
    else {
        prompt = lang[id - stack.length]
    }
    let diff = Number(user.details.diff);
    if (!user.details.diff || user.details.diff === null) {
        diff = 5;
        difficulty(user)
    }
    console.log(prompt)
    const api_key = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: api_key });
    const config = "DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR answers however please use double quotes \" to make json strings in response. Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. create new non-repeating mcq question based on the query given. format for output: {\"question\":\"sample question text in one string\",\"type\":\"mcq\",\"option_a\":\"(a) sample option a text in one string\",\"option_b\":\"(b) sample option b text in one string\",\"option_c\":\"(c) sample option c text in one string\",\"option_d\":\"(d)  option d text in one string\",\"correct_answer\":\"(a/b/c/d) sample correct option a/b/c/d text in one string\"} and use the following format for subjective type questions: {\"question\":\"sample question text in one string\",\"type\":\"subjective\",\"correct_answer\":\"sample answer text in one string\"}. return all questions and answer objects in a json formattable array [{qa pair},{mcq pair},...]"
    const query = `generate ${subjective} subjective and ${mcq} mcq questions of ${diff} difficulty for a candidate interview system with a tech company related to ${prompt} without using any markdown formatting and strictly following instruction. Note: do not include \` backticks or quotes in any text under any circustances, ALSO NOTE: make sure correct_answer for subjective type questions are long and comprehensive enough(130-180***** words max) to be similar(similarity checked by llm) to any possible small concise correct answer given by candidate. ALSO make sure that questions are not long and opinionated`
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
        const db = await connectDB();
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
            correct_answer: q.correct_answer,
            question: q.question,
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
                { $set: { score: totalScore, answers: ret_ans, evalStatus: "scored" } }
            );
            return { score: totalScore, answers: ret_ans };
        }

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
            { $set: { score: totalScore, answers: ret_ans, evalStatus: "scored" } }
        );
        console.log(ret_ans)
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
    const iid = req.body.interviewID;
    const answers = req.body.answers
    console.log(iid)
    try {
        const db = await connectDB();
        const { email, username, questions } = await db.collection("interviews").findOneAndUpdate({ _id: new ObjectId(iid) }, { $set: { answers, submissionDate: new Date(), evalStatus: "submitted" } });
        console.log(email, username)
        if (username) {
            await db.collection("users").updateOne(
                { username },
                { $push: { iids: iid } }
            );
        }
        else if (email) {
            await db.collection("users").updateOne(
                { email },
                { $push: { iids: iid } }
            );
        }
        else {
            console.log("no user")
        }
        re_eval(questions, answers, iid, 0);
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
        const db = await connectDB();
        const id = req.params.id;
        const re = await db.collection("interviews").findOne({ _id: new ObjectId(id) }) ?? null
        if (re === null) {
            return res.status(404).json(
                {
                    statusMessage: "not found"
                }
            )
        }
        if (re.evalStatus === "scored") {
            return res.status(200).json(
                {
                    score: re.score,
                    answers: re.answers
                }
            )
        }
        else {
            return res.status(201).json(
                {
                    statusMessage: "waiting"
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



export default app;
