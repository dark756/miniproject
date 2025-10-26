import { GoogleGenAI } from "@google/genai";

async function main()
{
    console.log("program starts here")
    const ai = new GoogleGenAI({apiKey:"AIzaSyB1VZiCRcWTRSzeUh8waCOwUiiUg_kbRCo"});
        const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "what is the radius of earth approx in km",
    // config: {
    //   systemInstruction: config,
    // }
  });
  console.log(response.text)
}
main()