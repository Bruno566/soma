import React, { useState } from 'react';
import { Player, SabotageType } from '../types';
import { 
  Trophy, 
  Skull, 
  Key, 
  Gift, 
  HelpCircle, 
  Copy, 
  Check, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  UserPlus, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { sounds } from '../services/audioService';

/* SETUP MODAL */
interface SetupModalProps {
  isOpen: boolean;
  onStart: (count: number, rounds: number, names: string[], initialBalance: number) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onStart }) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [roundLimit, setRoundLimit] = useState<number>(10);
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const [names, setNames] = useState<string[]>(['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4']);

  if (!isOpen) return null;

  const handleNameChange = (idx: number, val: string) => {
    const updated = [...names];
    updated[idx] = val;
    setNames(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    onStart(playerCount, roundLimit, names.slice(0, playerCount), initialBalance);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-6 relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/40 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-950/50">
            <Flame className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            SOMA OU <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">SABOTA</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure o número de jogadores, rodadas e saldo inicial.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              Número de Jogadores
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => { sounds.playClick(); setPlayerCount(count); }}
                  className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    playerCount === count
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {count} {count === 1 ? '(Solo/IA)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Quantidade de Rodadas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '5', val: 5 },
                { label: '10', val: 10 },
                { label: '15', val: 15 },
                { label: 'Sem Fim', val: 0 }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => { sounds.playClick(); setRoundLimit(opt.val); }}
                  className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                    roundLimit === opt.val
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
              Saldo Inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5000, 10000, 20000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { sounds.playClick(); setInitialBalance(val); }}
                  className={`py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    initialBalance === val
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-1 ring-emerald-400/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  R$ {val.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Nomes dos Participantes</span>
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-6">P{i + 1}</span>
                <input
                  type="text"
                  value={names[i] || `Jogador ${i + 1}`}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  placeholder={`Jogador ${i + 1}`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-rose-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-black text-sm tracking-wide shadow-lg shadow-indigo-600/30 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            ENTRAR NA ARENA
          </button>
        </form>
      </div>
    </div>
  );
};

/* SABOTAGE MODAL */
interface SabotageModalProps {
  isOpen: boolean;
  timeLeft: number;
  attacker: Player;
  players: Player[];
  onExecute: (targetId: number, type: SabotageType) => void;
  onClose: () => void;
}

export const SabotageModal: React.FC<SabotageModalProps> = ({
  isOpen,
  timeLeft,
  attacker,
  players,
  onExecute,
  onClose,
}) => {
  const eligibleTargets = players.filter((p) => p.id !== attacker.id && !p.bankrupt);
  const [selectedTargetId, setSelectedTargetId] = useState<number>(eligibleTargets[0]?.id || 0);
  const [selectedType, setSelectedType] = useState<SabotageType>('STEAL_20');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-rose-500/50 max-w-sm w-full p-6 rounded-3xl text-center relative shadow-2xl">
        <div className="absolute top-4 right-4 bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-black text-xs px-3 py-1 rounded-xl flex items-center gap-1">
          <span className="animate-ping w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
          <span>{timeLeft}s</span>
        </div>

        <div className="w-16 h-16 bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-950/50">
          <Skull className="w-8 h-8 text-rose-400" />
        </div>

        <h3 className="text-xl font-extrabold text-white">SABOTAR JOGADOR</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Oportunidade relâmpago! Escolha a vítima e o golpe tático.
        </p>

        <div className="space-y-3 text-left">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Selecione o Alvo</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {eligibleTargets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (R$ {p.balance.toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tipo de Sabotagem</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SabotageType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="STEAL_20">Roubar 20% do saldo da vítima</option>
              <option value="FORCE_ALL_IN">Forçar vítima a dar ALL-IN na próxima jogada</option>
              <option value="FEE_1000">Cobrar multa imediata de R$ 1.000,00</option>
              <option value="CURSE_NEXT_ROLL">Maldição dos Dados: Próximo rolamento perde 50% extra</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
            >
              CANCELAR
            </button>
            <button
              onClick={() => {
                sounds.playSabotageAlert();
                onExecute(selectedTargetId, selectedType);
              }}
              className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/40"
            >
              EXECUTAR GOLPE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* SABOTAGE SUFFERED NOTICE MODAL */
interface SabotageNoticeModalProps {
  notice: { attackerName: string; effectDesc: string } | null;
  onClose: () => void;
}

export const SabotageNoticeModal: React.FC<SabotageNoticeModalProps> = ({ notice, onClose }) => {
  if (!notice) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/50 max-w-sm w-full p-6 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">VOCÊ FOI SABOTADO!</h3>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-900/40 text-left space-y-2">
          <p className="text-xs font-bold text-rose-400">ATACADO POR: {notice.attackerName}</p>
          <p className="text-xs text-slate-300 leading-relaxed">{notice.effectDesc}</p>
        </div>

        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-rose-600/30"
        >
          SOFRER E CONTINUAR
        </button>
      </div>
    </div>
  );
};

/* SECRET CODE ALERT MODAL (WHEN GENERATED) */
interface SecretAlertModalProps {
  code: string | null;
  playerName: string;
  onClose: () => void;
}

export const SecretAlertModal: React.FC<SecretAlertModalProps> = ({ code, playerName, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!code) return null;

  // Safe clipboard copy supporting sandboxed iframe environment
  const handleCopy = async () => {
    sounds.playClick();
    let copiedSuccess = false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        copiedSuccess = true;
      } catch {
        // Permissions policy blocked clipboard.writeText; proceed to fallback
      }
    }

    if (!copiedSuccess) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copiedSuccess = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Silently continue
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-amber-500/40 max-w-sm w-full p-6 rounded-3xl text-center relative shadow-2xl">
        <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce">
          <Gift className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-xl font-black text-white">CÓDIGO SURPRESA!</h3>
        <p className="text-xs text-slate-300 mt-1">
          {playerName} sorteou um cupom místico! Você pode usá-lo ou guardar em segredo.
        </p>

        <div className="my-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
          <span className="font-mono font-black text-xl text-amber-400 tracking-widest">{code}</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
};

/* REDEEM CODE MODAL */
interface RedeemCodeModalProps {
  isOpen: boolean;
  onRedeem: (code: string) => { success: boolean; message: string };
  onClose: () => void;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({ isOpen, onRedeem, onClose }) => {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleRedeem = () => {
    sounds.playClick();
    const res = onRedeem(code.trim().toUpperCase());
    setFeedback(res);
    if (res.success) {
      sounds.playWin();
      setTimeout(() => {
        onClose();
        setCode('');
        setFeedback(null);
      }, 1600);
    } else {
      sounds.playLoss();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 max-w-sm w-full p-6 rounded-3xl relative shadow-2xl">
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Key className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Resgatar Código Secreto</h3>
          <p className="text-xs text-slate-400">Insira o código alfanumérico para aplicar o efeito à sua conta.</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EX: 7AX92B"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-mono font-bold text-amber-400 uppercase tracking-widest focus:outline-none focus:border-amber-500"
          />

          {feedback && (
            <p
              className={`text-xs text-center min-h-[18px] font-semibold ${
                feedback.success ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <button
            onClick={handleRedeem}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20"
          >
            VALIDAR CÓDIGO
          </button>
        </div>
      </div>
    </div>
  );
};

/* RULES MODAL */
interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-6 rounded-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Regras: Soma ou Sabota</h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Objetivo & Vitória
            </h4>
            <p>
              Seja o último sobrevivente após a falência de todos os adversários ou termine o limite de rodadas com o maior saldo acumulado!
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Tabela de Lucros (Modo Normal: Rodadas 1 a 4)
            </h4>
            <ul className="grid grid-cols-2 gap-1 text-[11px] font-mono mt-1 text-slate-300">
              <li>• Soma 12: <span className="text-emerald-400">+100%</span></li>
              <li>• Soma 11: <span className="text-emerald-400">+50%</span></li>
              <li>• Soma 10: <span className="text-emerald-400">+30%</span></li>
              <li>• Soma 9: <span className="text-emerald-400">+10%</span></li>
              <li>• Soma 8: <span className="text-slate-400">0% (Neutro)</span></li>
              <li>• Soma 7: <span className="text-rose-400">-10%</span></li>
              <li>• Soma 6: <span className="text-rose-400">-20%</span></li>
              <li>• Soma 5: <span className="text-rose-400">-35%</span></li>
              <li>• Soma 4: <span className="text-rose-400">-50%</span></li>
              <li>• Soma 3: <span className="text-rose-400">-75%</span></li>
              <li>• Soma 2: <span className="text-rose-500 font-bold">-100%</span></li>
            </ul>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-rose-900/40">
            <h4 className="font-bold text-rose-400 mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              Modo Pressão (Rodadas 5+)
            </h4>
            <p className="text-[11px] text-slate-400">
              A partir da 5ª rodada, os ganhos despencam e as punições são brutais: Soma 8 já vira perda de 20%, e abaixo de 4 é quase fatalidade!
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Sabotagens & Códigos
            </h4>
            <p className="text-[11px] text-slate-400">
              Em momentos imprevisíveis, um botão vermelho de 10 segundos permite roubar 20%, aplicar taxa de R$ 1.000 ou obrigar seu oponente a apostar ALL-IN na próxima jogada!
            </p>
          </div>
        </div>

        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
        >
          COMPREENDIDO
        </button>
      </div>
    </div>
  );
};

/* WINNER OVERLAY MODAL */
interface WinnerModalProps {
  winner: Player | null;
  reason: string;
  players: Player[];
  onPlayAgain: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ winner, reason, players, onPlayAgain }) => {
  if (!winner) return null;

  const sortedPlayers = [...players].sort((a, b) => b.balance - a.balance);

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/50 max-w-md w-full p-6 md:p-8 rounded-3xl text-center space-y-5 shadow-2xl relative">
        <div className="w-20 h-20 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <div>
          <span className="text-xs uppercase text-amber-400 font-extrabold tracking-widest block">
            Grande Campeão
          </span>
          <h2 className="text-3xl font-black text-white mt-1">{winner.name}</h2>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            R$ {winner.balance.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
          {reason}
        </div>

        {/* Podium list */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Classificação Geral
          </span>
          {sortedPlayers.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                  idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-amber-800 text-white'
                }`}>
                  {idx + 1}
                </span>
                <span className={`font-semibold ${p.bankrupt ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {p.name} {p.bankrupt ? '(Faliu)' : ''}
                </span>
              </div>
              <span className={`font-mono font-bold ${p.balance > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                R$ {p.balance.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { sounds.playClick(); onPlayAgain(); }}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-amber-500/20 active:scale-95 transform"
        >
          JOGAR NOVAMENTE
        </button>
      </div>
    </div>
  );
};
