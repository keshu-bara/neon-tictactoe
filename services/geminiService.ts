import { GoogleGenAI, Type } from "@google/genai";
import { Player, AIMoveResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getBestMove = async (board: Player[]): Promise<AIMoveResponse> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning random move.");
    return getFallbackMove(board);
  }

  try {
    const prompt = `
      You are playing a game of Tic-Tac-Toe. You are player 'O'. 
      The board is a 1D array of length 9. 
      0 is top-left, 1 is top-center, 2 is top-right, etc.
      Current board state: ${JSON.stringify(board)}.
      'X' is the opponent. 'O' is you. null is empty.
      
      Your goal is to win. If you cannot win immediately, block the opponent from winning. 
      If neither, play the optimal strategic move (center, corners, etc.).
      
      Return a JSON object with:
      1. 'move': The index (0-8) of the square you want to play. It MUST be a currently null square.
      2. 'taunt': A very short, witty, hypercasual game style phrase (max 5 words) reacting to the game state (e.g., "Blocked you!", "My turn!", "Too easy.").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.INTEGER, description: "The index of the move (0-8)" },
            taunt: { type: Type.STRING, description: "A short witty phrase" }
          },
          required: ["move", "taunt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AIMoveResponse;
    
    // Validate move
    if (board[result.move] !== null) {
      console.warn("AI attempted invalid move, using fallback.");
      return getFallbackMove(board);
    }

    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackMove(board);
  }
};

const getFallbackMove = (board: Player[]): AIMoveResponse => {
  const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
  const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  return {
    move: randomMove,
    taunt: "Thinking hard..."
  };
};
