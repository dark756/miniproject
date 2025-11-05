import { GoogleGenAI } from "@google/genai";


// export async function re_eval(questions, answers, iid, t) {
//     // console.log(answers)
//     const sub_questions_with_index = questions
//         .map((q, i) => ({ question: q, index: i }))
//         .filter(({ question }) => question.type === "subjective");


//     const sub_questions = questions.filter((e) => e.type === "subjective");
//     const correct_answers = sub_questions.map((e) => e.correct_answer)
//     // const candidate_answers = sub_questions_with_index.map(({ index }) => answers[index.toString()]);
//     const candidate_answers = sub_questions_with_index.map(({ index }) =>
//         answers[index.toString()] !== undefined ? answers[index.toString()] : ""
//     );

//     const api_key = process.env.API_KEY;
//     const ai = new GoogleGenAI({ apiKey: api_key });
//     const query = `im going to give 2 arrays, correct answers and candidate answers, i want you to compare them and return a floating point (upto 2 decimals between 0 and 1) score for how similar the candidates answer is to the correct answer, response should have an array of floating points with the same length as both input arrays: correct answers: ${correct_answers} candidate answers: ${candidate_answers}`;
//     const config = "DO NOT use markdown formatting or triple backticks for json text or any code text.ALSO DO NOT USE SINGLE \' OR DOUBLE QUOTES \" IN YOUR RESPONSE Return raw JSON array only. DO NOT ADD ```json BEFORE AND ```  AFTER THE CONTENT. generate scores between (inclusive) 0 and 1 (floating point upto 2 decimals) based on similarity of candidate anwswers to correct answers given in query such that 0.8 signifies that the candidates subjective answer is similar enough to the correct answer or matches its idea enough to be considered a correct answer. ";

//     console.log(candidate_answers)
//     return
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
//                 if (q.correct_answer.charAt(1) === answers[i].charAt(1))
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

//         db.collection("interviews").updateOne({ _id: new ObjectId(iid) }, { $set: { score, evalStatus: "scored" } })
//         return score;
//     } catch (err) {
//         console.error("Gemini API error:", err);
//         if (t > 2)
//             return null;
//         else {
//             re_eval(questions, answers, iid, t + 1)
//         }
//     }
// }





export async function re_eval(questions, answers, iid, t = 0) {
    const startTime = Date.now();
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
    //   await db.collection("interviews").updateOne(
    //     { _id: new ObjectId(iid) },
    //     { $set: { score: totalScore, evalStatus: "scored" } }
    //   );
      return { score: totalScore, answers: ret_ans, time:Date.now()- startTime };
    }
    console.log(candidateAnswers)

    const api_key = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: "AIzaSyB1VZiCRcWTRSzeUh8waCOwUiiUg_kbRCo" });
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

    // await db.collection("interviews").updateOne(
    //   { _id: new ObjectId(iid) },
    //   { $set: { score: totalScore, evalStatus: "scored" } }
    // );

    return { score: totalScore, answers: ret_ans, time:Date.now()- startTime};
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

const a = {
    '0':'mitochondria is the remental Static Regeneration ISR with a suitable cache for most frequently changing parts of the dashboa of the cell',
    '1':"nwe remental Static Regeneration ISR with a suitable cache for most frequently changing parts of the dashboaremental Static Regeneration ISR with a suitable cache for most frequently changing parts of the dashboawer",
    '2': '(c) Incremental Static Regeneration ISR with a suitable cache for most frequently changing parts of the dashboard.',
    '3': '(b) Utilize a recursive conditional type to deeply make parts of the criteria object optional, allowing nested optional properties.',
    '4': '(b) Implementing a Web Worker in the Next.js frontend to perform the computation client-side.'
}
const q = [
    {
        question: 'Imagine designing a high-traffic candidate interview system where real-time updates for interview schedules, status changes, and personalized dashboards are critical. Discuss how Next.js advanced features, beyond basic server-side rendering, would be leveraged to ensure optimal performance, scalability, and an exceptional developer and user experience. Specifically touch upon data fetching strategies, state management implications, and deployment considerations for such a system.',
        type: 'subjective',
        correct_answer: 'This system demands more than just SSR. For optimal performance and real-time updates, a hybrid approach leveraging Next.js capabilities would be crucial. Incremental Static Regeneration ISR could be used for frequently updated but not real-time critical pages like job listings or company profiles, ensuring quick load times while remaining fresh. Server-Side Rendering SSR or client-side fetching with SWR or React Query would be employed for highly dynamic user-specific dashboards displaying interview statuses, notifications, and scheduled appointments, ensuring data is always current. For real-time push notifications or live chat functionalities within the interview platform, Next.js API Routes could integrate with WebSockets or serverless functions, pushing updates to the client. Global state management solutions like Zustand or Jotai would be preferred for their lightweight nature and efficiency with React Server Components RSC if applicable, especially for user authentication and shared data across components. Deployment on platforms like Vercel would offer seamless CI/CD, automatic scaling, and edge network benefits, minimizing latency for users globally. This combined strategy maximizes performance, developer productivity, and user satisfaction in a demanding environment.'
    },
    {
        question: 'Consider a complex TypeScript codebase for the backend API of a candidate interview system that handles sensitive data, intricate business logic, and integrations with third-party services. Explain how advanced TypeScript features like conditional types, mapped types, and declaration merging could be strategically applied to enhance type safety, refactorability, and maintainability across the system. Provide a concrete example for at least two of these features in the context of API request/response transformations or data validation.',
        type: 'subjective',
        correct_answer: 'In a complex backend for a candidate interview system, advanced TypeScript features are invaluable for robust development. Conditional types are powerful for creating flexible types based on other types. For instance, an API request payload for a candidate update might vary by user role; a conditional type could precisely define the expected structure, ensuring compile-time type safety and preventing invalid updates. Mapped types excel at transforming existing types. Consider an API response that selectively includes sensitive candidate data based on permissions. A mapped type could take a base CandidateProfile type and generate a new type where sensitive fields are optional or excluded, crucial for data security and authorized exposure. Declaration merging can augment existing modules or interfaces, such as extending Express Request or Response interfaces with custom properties like currentUser or tenantId set by middleware. This provides strong typing for globally available properties without modifying third-party library definitions. Collectively, these features significantly reduce runtime errors, enhance code predictability, and make the system much easier to maintain, secure, and extend effectively.'
    },
    {
        question: 'For a Next.js-based candidate interview system, a critical requirement is to display a dynamic dashboard showing each candidate their upcoming interviews, application statuses, and personalized recommendations. This data updates frequently but does not require instant real-time websocket-level updates for every piece of information. Which Next.js data fetching strategy, combined with a suitable caching mechanism, would provide the best balance of freshness, performance, and scalability?',
        type: 'mcq',
        option_a: '(a) Server-Side Rendering SSR for every dashboard visit, ensuring absolute freshness.',
        option_b: '(b) Static Site Generation SSG with a revalidate option set to a very low interval (e.g., 10 seconds), combined with client-side fetching for highly dynamic components.',
        option_c: '(c) Incremental Static Regeneration ISR with a suitable revalidate interval, potentially combined with client-side data fetching for the most frequently changing parts of the dashboard.',
        option_d: '(d) Client-Side Rendering CSR exclusively for the entire dashboard, fetching all data on the browser.',
        correct_answer: '(c) Incremental Static Regeneration ISR with a suitable revalidate interval, potentially combined with client-side data fetching for the most frequently changing parts of the dashboard.'
    },
    {
        question: 'Consider a utility function in a TypeScript backend for a candidate interview system designed to filter a list of candidate profiles based on a set of dynamic criteria. The function signature is define: filterCandidates<T extends CandidateProfile>(candidates: T[], criteria: Partial<T>): T[]. To make this utility more robust, you want to allow criteria to include nested object properties or even custom comparison functions, without losing strong type checking. Which TypeScript pattern would best enable this advanced filtering capability while maintaining type safety?',
        type: 'mcq',
        option_a: '(a) Rely solely on Partial<T> and handle nested properties with optional chaining at runtime.',
        option_b: '(b) Utilize a recursive conditional type to deep-partial the criteria object, allowing nested optional properties.',
        option_c: '(c) Implement a custom generic type that uses keyof T and lookup types to enforce type safety on deeply nested paths in criteria.',
        option_d: '(d) Use declaration merging to augment the Partial<T> type, adding support for custom functions.',
        correct_answer: '(c) Implement a custom generic type that uses keyof T and lookup types to enforce type safety on deeply nested paths in criteria.'
    },
    {
        question: 'In a Next.js application for a candidate interview system, a background process needs to periodically aggregate interview feedback data, process it for sentiment analysis, and then update a summary dashboard. This process is computationally intensive and should not block the main event loop or user interface. Which JavaScript mechanism, when integrated into a Next.js API route or a dedicated serverless function, is most suitable for offloading this heavy computation?',
        type: 'mcq',
        option_a: '(a) Using setTimeout with a 0ms delay to defer the task to the next event loop cycle.',
        option_b: '(b) Implementing a Web Worker in the Next.js frontend to perform the computation client-side.',
        option_c: '(c) Leveraging Node.js worker threads within a Next.js API route or a dedicated serverless function.',
        option_d: '(d) Performing the computation directly within the Next.js API route handler, relying on Node.js non-blocking I/O.',
        correct_answer: '(c) Leveraging Node.js worker threads within a Next.js API route or a dedicated serverless function.'
    }
]
const iid = "690b0f13154668f9c8f897e7";
(async () => {
  const result = await re_eval(q, a, iid, 0);
  console.log(result)
//   if (result && result.answers) {
//     console.log(result.answers.map(e => e));
//   }
})();
