import React from 'react';
import { GameLog } from '../types';
import { History, X, Dices, Skull, Key, Sparkles } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  logs: GameLog[];
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, logs, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-slate-900 border-l border-slate-700/80 w-full max-w-sm h-full p-5 flex flex-col justify-between shadow-2xl animate-fadeIn">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Histórico da Partida</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[75vh] pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum lance registrado ainda. Role os dados para começar!
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      {log.type === 'sabotage' ? (
                        <Skull className="w-3.5 h-3.5 text-rose-400" />
                      ) : log.type === 'code' ? (
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                      ) : log.type === 'ai' ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Dices className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      {log.playerName}
                    </span>
                    <span>R{log.round} • {log.timestamp}</span>
                  </div>

                  {log.type === 'roll' && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono text-slate-300">
                        Dados [{log.dice[0]}+{log.dice[1]}] = <strong className="text-white">{log.sum}</strong>
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          log.change > 0
                            ? 'text-emerald-400'
                            : log.change < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {log.change > 0 ? `+R$ ${log.change}` : log.change < 0 ? `-R$ ${Math.abs(log.change)}` : 'R$ 0'}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 italic">
                    {log.resultMessage}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
        >
          FECHAR
        </button>
      </div>
    </div>
  );
};
