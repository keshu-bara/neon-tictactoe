import React from 'react';
import { Player } from '../types';

interface SquareProps {
  value: Player;
  onClick: () => void;
  isWinningSquare: boolean;
  disabled: boolean;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare, disabled }) => {
  let textColor = '';
  if (value === 'X') textColor = 'text-cyan-400 neon-text-blue';
  if (value === 'O') textColor = 'text-rose-400 neon-text-pink';

  const baseClasses = "h-24 w-24 sm:h-32 sm:w-32 rounded-xl text-5xl sm:text-6xl font-black flex items-center justify-center transition-all duration-200 ease-out transform";
  const interactClasses = !value && !disabled ? "hover:bg-gray-800 cursor-pointer hover:scale-105 active:scale-95" : "cursor-default";
  const bgClasses = isWinningSquare 
    ? (value === 'X' ? 'bg-cyan-900/30 ring-4 ring-cyan-500/50' : 'bg-rose-900/30 ring-4 ring-rose-500/50')
    : "bg-gray-800/50 shadow-inner border border-gray-700/50";

  return (
    <button
      className={`${baseClasses} ${interactClasses} ${bgClasses} ${textColor}`}
      onClick={onClick}
      disabled={disabled || value !== null}
    >
      <span className={value ? "scale-100 opacity-100 transition-all duration-300" : "scale-0 opacity-0"}>
        {value}
      </span>
    </button>
  );
};

export default Square;
