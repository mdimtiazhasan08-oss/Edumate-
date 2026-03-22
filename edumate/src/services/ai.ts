import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, UserRoutine, RoutineDay } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateQuizFromImage = async (base64Images: string[], pdfUrl?: string, instruction?: string): Promise<QuizQuestion[]> => {
  const model = "gemini-flash-latest";
  const imageParts = base64Images.map(img => {
    const base64Data = img.split(",")[1] || img;
    return { inlineData: { data: base64Data, mimeType: "image/jpeg" } };
  });
  const textPart = { text: `Analyze the text in these images and the provided PDF link (if any) to generate a high-quality quiz for Bangladeshi students following the NCTB (National Curriculum and Textbook Board) standard.
    PDF Link: ${pdfUrl || "None"}
    Instruction: ${instruction || "Generate 5 high-quality MCQs."}
    
    CRITICAL: 
    1. The quiz MUST be in Bengali (বাংলা).
    2. Questions must be relevant to the Bangladeshi board curriculum (SSC/HSC/JSC).
    3. Math and Physics formulas should be clean and readable (use standard text notation, avoid extra characters).
    
    Return the output as a JSON array of objects with the following structure:
    {
      "question": "string (in Bengali)",
      "options": ["string (in Bengali)", "string (in Bengali)", "string (in Bengali)", "string (in Bengali)"],
      "correctAnswer": number (index 0-3),
      "explanation": "string (in Bengali)"
    }` };

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [...imageParts, textPart]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateRoutine = async (data: UserRoutine): Promise<RoutineDay[]> => {
  const model = "gemini-flash-latest";
  const prompt = `Create a balanced weekly study routine for a Bangladeshi student following the NCTB curriculum.
    School: ${data.schoolTime.start} to ${data.schoolTime.end}
    Tuitions: ${data.tuitionTime.map(t => `${t.start}-${t.end}`).join(", ")}
    Free time: ${data.freeTime}
    Study time: ${data.studyTime}
    Subjects: ${data.subjects.map(s => `${s.name} (${s.difficulty})`).join(", ")}
    Exam Date: ${data.examDate || "Not specified"}

    CRITICAL: 
    1. The routine tasks and day names MUST be in Bengali (বাংলা).
    2. Ensure difficult subjects get more time and there are enough breaks.
    3. Include time for prayer/rest as per Bangladeshi culture.

    Return a JSON array for 7 days (সোমবার to রবিবার). Each day should have a list of tasks with time, task name, and type.
    Types: study, break, school, tuition, free.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  task: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["study", "break", "school", "tuition", "free"] },
                  subject: { type: Type.STRING }
                },
                required: ["time", "task", "type"]
              }
            }
          },
          required: ["day", "tasks"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const solveDoubt = async (query: string, images?: string[]): Promise<string> => {
  const model = "gemini-flash-latest";
  const parts: any[] = [{ text: `You are an expert teacher from Bangladesh. Solve the following doubt step-by-step following the NCTB board standards.
    Explain clearly in Bengali (বাংলা). Use a friendly and encouraging tone.
    Ensure math and physics formulas are clean (avoid extra characters, use standard notation).
    Query: ${query}` }];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({ inlineData: { data: img, mimeType: "image/jpeg" } });
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
  });

  return response.text;
};

export const wellnessCounselor = async (message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> => {
  const model = "gemini-flash-latest";
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are a compassionate student wellness counselor. You provide emotional support, motivation, and practical advice for academic stress, focus, and personal growth. You are NOT a medical doctor. Your tone is like a supportive friend or mentor. Keep responses concise and empathetic. Respond in the language the user uses (Bengali or English).",
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
