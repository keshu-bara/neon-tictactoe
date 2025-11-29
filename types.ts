export type Player = 'X' | 'O' | null;

export enum GameMode {
  PVP = 'PVP',
  AI = 'AI'
}

export interface GameState {
  board: Player[];
  xIsNext: boolean;
  winner: Player | 'Draw' | null;
  winningLine: number[] | null;
}

export interface AIMoveResponse {
  move: number;
  taunt: string;
}
