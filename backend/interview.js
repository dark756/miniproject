import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import { difficulty } from "./routes/dash.js"
// import { VerifyCookies } from "./Verify_cookies.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const app = express();
app.use(express.json());

let db;
MongoClient.connect(process.env.MONGO_URI).then(client => { db = client.db(); })
    .catch(err => console.error(err));

function VerifyCookies(req, res, next) {
    req.token = { username: "1" }
    next();//call verifycookies instead after testing is done
}

app.get("/generate", VerifyCookies, async (req, res) => {
    //load data from env
    const no_questions = Number(process.env.NO_QUESTIONS) || 5;
    const ratio = Number(process.env.RATIO) || 0.5;
    const mcq = Math.round(no_questions * ratio);
    const subjective = no_questions - mcq;
    //deets fetch
    let user;
    let auth;
    if (req.token.username) {
        user = await db.collection("users").findOne({ username: req.token.username });
        auth = { type: "username" }
    }
    if (req.token.email) {
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
    const query = `generate ${subjective} subjective and ${mcq} mcq questions of ${diff} difficulty for a candidate interview system with a tech company related to ${prompt} programming languages without using any markdown formatting and strictly following instruction. Note: do not include \` backticks or quotes in any text under any circustances, ALSO NOTE: make sure correct_answer in subjective type questions are long and comprehensive enough(150-200 words max) to be similar(similarity checked by llm) to any possible small concise correct answer given by candidate`
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
        //***********    remove answers from questions map before launch
        questions=questions.map(({correct_answer, ...rest})=>rest)
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


app.post("/submit", VerifyCookies, async (req, res) => {
    const iid = "690484d6d333e09619a893d3";//post
    // const ans = [
    //     "Real-time synchronization would use WebSockets, implemented with FastAPI Websockets on the backend and a client-side library like Socket.IO or pure WebSockets in Next.js. Authentication should utilize JWT tokens, with FastAPI security handling token creation and validation for both candidates and interviewers. Secure code execution environments can be achieved through isolated Docker containers or sandboxed environments for each code submission. A PostgreSQL database for user and interview data, Redis for session management and caching, and Nginx as a reverse proxy are also important components for a robust setup."
    //     , "To optimize performance, offload complex data transformations and external API calls to background tasks using a task queue like Celery or Dramatiq, allowing FastAPI to return responses quickly and preventing blocking. Utilize async/await for I/O-bound operations within FastAPI to maximize concurrency. Employ database indexing, connection pooling, and ORM optimizations for efficient data access. Implement caching with Redis for frequently accessed data to reduce database load. Use a load balancer to distribute requests across multiple FastAPI instances for horizontal scaling. Monitor system metrics like CPU usage, memory, and response times to identify and address bottlenecks proactively."
    //     , "c", "b", "a"
    // ]
    const ans=[//post
        "use try catch and console log errors with gracefully showing please try again to user",
        "Event loop starvation occurs when a long-running synchronous operation or a very large number of microtasks block the Node.js event loop preventing it from processing other incoming requests I/O callbacks or timers. This leads to unresponsiveness and high latency for other clients. Conditions include: CPU-bound synchronous operations like heavy data encryption complex calculations or large JSON parsing/stringifying on the main thread",
        "c","c","b"
    ]
    const answers = req.body.answers || ans || ['c', 'c', 'b', 'b', 'c']//ccbbc
    const interview = await db.collection("interviews").findOne({ _id: new ObjectId(iid) });
    const questions = interview.questions;
    const sub_questions_with_index = questions
        .map((q, i) => ({ question: q, index: i }))
        .filter(({ question }) => question.type === "subjective");

    const sub_questions = questions.filter((e) => e.type==="subjective");
    const correct_answers= sub_questions.map((e)=>e.correct_answer)
    const candidate_answers = sub_questions_with_index.map(({ index }) => answers[index]);
    if (!answers || !interview || answers.length !== questions.length ||sub_questions.length!==candidate_answers.length) {
        //idk
        console.log(questions);
        console.log(answers);
        return res.status(500).json({ statusMessage: "length mismatch" })
    }
    let marks=0;
    questions.map((q,i)=>{
        if (q.correct_answer.charAt(1)===answers[i])
            marks+=1;
    })
    const api_key = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: api_key });
    const query=`im going to give 2 arrays, correct answers and candidate answers, i want you to compare them and return a floating point (upto 2 decimals between 0 and 1) score for how similar the candidates answer is to the correct answer, response should have an array of floating points with the same length as both input arrays: correct answers: ${correct_answers} candidate answers: ${candidate_answers}`;
    const config="DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. generate scores between (inclusive) 0 and 1 (floating point upto 2 decimals) based on similarity of candidate anwswers to correct answers given in query such that 0.8 signifies that the candidates subjective answer is similar enough to the correct answer or matches its idea enough to be considered a correct answer. ";
    


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
        const llm_scores = JSON.parse(res_text)
        console.log(typeof llm_scores, llm_scores);
        llm_scores.forEach(e => {
            if(e>=Number(process.env.LLM_SIMILARITY))
            {
                marks+=1;
            }
        });
        db.collection("interviews").updateOne({_id:new ObjectId(iid)},{$set:{marks}})
        return res.status(200).json(
            {
                interviewID: iid,
                marks
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






    return res.json({ correct_answers, candidate_answers, marks });

});




//              "answers":["c", "c","b", "b", "c"]




app.listen(8080, () => {
    console.log(`Server is running at http://localhost:8080`);
});