import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import { Player, GameMode, GameState } from './types';
import { getBestMove } from './services/geminiService';
import { X, Circle, RefreshCw, Cpu, Users, Download } from 'lucide-react';

// Helper to calculate winner
const calculateWinner = (squares: Player[]): { winner: NonNullable<Player>, line: number[] } | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a] as NonNullable<Player>, line: lines[i] };
    }
  }
  return null;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
    winningLine: null,
  });
  
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.AI);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiTaunt, setAiTaunt] = useState<string>("");
  const [scores, setScores] = useState({ X: 0, O: 0, Draw: 0 });
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Install Prompt Listener for PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  const handleReset = () => {
    setGameState({
      board: Array(9).fill(null),
      xIsNext: true,
      winner: null,
      winningLine: null,
    });
    setAiTaunt("");
    setIsAiThinking(false);
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    setScores({ X: 0, O: 0, Draw: 0 }); // Reset scores on mode change
    handleReset();
  };

  const handleClick = useCallback((i: number) => {
    if (gameState.winner || gameState.board[i] || isAiThinking) return;

    const newBoard = [...gameState.board];
    newBoard[i] = gameState.xIsNext ? 'X' : 'O';

    const winInfo = calculateWinner(newBoard);
    const isDraw = !winInfo && newBoard.every(square => square !== null);

    const newState: GameState = {
      board: newBoard,
      xIsNext: !gameState.xIsNext,
      winner: winInfo ? winInfo.winner : (isDraw ? 'Draw' : null),
      winningLine: winInfo ? winInfo.line : null,
    };

    setGameState(newState);

    if (winInfo) {
      setScores(prev => ({ ...prev, [winInfo.winner]: prev[winInfo.winner as keyof typeof prev] + 1 }));
    } else if (isDraw) {
      setScores(prev => ({ ...prev, Draw: prev.Draw + 1 }));
    }

  }, [gameState, isAiThinking]);

  // AI Turn Effect
  useEffect(() => {
    if (gameMode === GameMode.AI && !gameState.xIsNext && !gameState.winner) {
      const makeAiMove = async () => {
        setIsAiThinking(true);
        // Small delay for realism if API is too fast
        const startTime = Date.now();
        
        const { move, taunt } = await getBestMove(gameState.board);
        
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, 600 - elapsedTime);

        setTimeout(() => {
          setAiTaunt(taunt);
          handleClick(move);
          setIsAiThinking(false);
        }, remainingDelay);
      };

      makeAiMove();
    }
  }, [gameState.xIsNext, gameState.winner, gameMode, gameState.board, handleClick]);


  return (
    <div className="min-h-screen select-none flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      
      {/* Header */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-rose-400 drop-shadow-lg">
          NEON TIC-TAC-TOE
        </h1>
        <p className="text-gray-400 font-light text-sm tracking-widest uppercase">
          {gameMode === GameMode.AI ? 'Human vs AI' : 'Player vs Player'}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-gray-800/50 p-1 rounded-full mb-8 backdrop-blur-md border border-gray-700/50">
        <button
          onClick={() => handleModeChange(GameMode.AI)}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${
            gameMode === GameMode.AI 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Cpu size={16} /> AI Mode
        </button>
        <button
          onClick={() => handleModeChange(GameMode.PVP)}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${
            gameMode === GameMode.PVP 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users size={16} /> PvP Mode
        </button>
      </div>

      {/* Main Game Area */}
      <div className="relative">
        <Board 
          squares={gameState.board} 
          onClick={handleClick} 
          winningLine={gameState.winningLine}
          disabled={gameState.winner !== null || (gameMode === GameMode.AI && !gameState.xIsNext)}
        />
        
        {/* Loading Overlay */}
        {isAiThinking && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
             <div className="flex flex-col items-center gap-2 animate-pulse">
                <div className="h-3 w-3 bg-rose-500 rounded-full"></div>
                <span className="text-rose-400 font-bold text-xs tracking-widest">AI THINKING</span>
             </div>
          </div>
        )}
      </div>

      {/* Status & Messages */}
      <div className="h-16 mt-6 flex flex-col items-center justify-center w-full max-w-sm text-center">
        {gameState.winner ? (
          <div className="animate-bounce">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
              {gameState.winner === 'Draw' ? "IT'S A DRAW!" : `${gameState.winner} WINS!`}
            </h2>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xl font-bold">
              <span className="text-gray-400">Turn:</span>
              {gameState.xIsNext ? (
                <span className="text-cyan-400 flex items-center gap-1"><X size={20} /> Player X</span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1"><Circle size={18} /> Player O</span>
              )}
            </div>
            {gameMode === GameMode.AI && aiTaunt && !gameState.xIsNext && (
               <p className="text-xs text-rose-300/80 mt-1 italic">"{aiTaunt}"</p>
            )}
          </>
        )}
      </div>

      {/* Score Board */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-8">
        <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/30 flex flex-col items-center">
            <span className="text-cyan-400 font-bold text-lg">X</span>
            <span className="text-2xl font-black">{scores.X}</span>
        </div>
        <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/30 flex flex-col items-center">
            <span className="text-gray-400 font-bold text-lg">Draw</span>
            <span className="text-2xl font-black">{scores.Draw}</span>
        </div>
        <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/30 flex flex-col items-center">
            <span className="text-rose-400 font-bold text-lg">O</span>
            <span className="text-2xl font-black">{scores.O}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-full font-bold transition-all hover:shadow-lg active:transform active:scale-95 border border-gray-700"
        >
          <RefreshCw size={18} /> Reset Game
        </button>

        {installPrompt && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full font-bold transition-all shadow-lg active:transform active:scale-95 animate-pulse"
          >
            <Download size={18} /> Install App
          </button>
        )}
      </div>

    </div>
  );
};

export default App;