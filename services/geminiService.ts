import { GoogleGenAI, Type } from "@google/genai";
import { Exam, Question, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates an exam based on topic and difficulty.
 */
export const generateExam = async (topic: string, difficulty: string, questionCount: number = 5): Promise<Omit<Exam, 'id' | 'createdAt'>> => {
  const prompt = `Create a ${difficulty} difficulty exam about "${topic}" with ${questionCount} questions. 
  Include a mix of Multiple Choice and True/False questions.
  Return a JSON object with a title, subject, duration recommendation, and the list of questions.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["type", "text", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "subject", "questions", "durationMinutes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from AI");
    
    const data = JSON.parse(text);
    
    // Post-process to ensure IDs exist
    data.questions = data.questions.map((q: any, idx: number) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`,
      // Ensure options exist for True/False if not provided
      options: q.type === QuestionType.TRUE_FALSE ? ['True', 'False'] : q.options
    }));

    return data;
  } catch (error) {
    console.error("Exam generation failed", error);
    throw error;
  }
};

/**
 * Generates feedback for an exam result.
 */
export const generateExamFeedback = async (examTitle: string, score: number, weakAreas: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `The student took an exam on "${examTitle}" and scored ${score}%. 
            The questions they missed involved: ${weakAreas}.
            Provide a short, constructive paragraph (max 3 sentences) giving feedback and study tips.`,
        });
        return response.text || "Good effort!";
    } catch (e) {
        return "Feedback unavailable.";
    }
}
