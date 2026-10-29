import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, SabotageType, SecretEffect, RollOutcome, GameLog } from './types';
import { Dice3D } from './components/Dice3D';
import {
  SetupModal,
  SabotageModal,
  SabotageNoticeModal,
  SecretAlertModal,
  RedeemCodeModal,
  RulesModal,
  WinnerModal,
} from './components/Modals';
import { HistoryDrawer } from './components/HistoryDrawer';
import { sounds } from './services/audioService';
import { getGameCommentary, getSabotageRoast } from './services/geminiService';
import {
  Dices,
  Flame,
  HelpCircle,
  Key,
  Skull,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  History as HistoryIcon,
  RotateCcw,
  Percent,
} from 'lucide-react';

// Exact rotations that bring each numbered face to the front (Z+):
// Face 1: Front  -> X: 0, Y: 0
// Face 2: Right  -> X: 0, Y: -90
// Face 3: Back   -> X: 0, Y: 180
// Face 4: Left   -> X: 0, Y: 90
// Face 5: Top    -> X: -90, Y: 0
// Face 6: Bottom -> X: 90, Y: 0
const TARGET_FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 0, y: 180 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

const PLAYER_COLORS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
];

export const App: React.FC = () => {
  // Game Configuration State
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [maxRounds, setMaxRounds] = useState<number>(10);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

  // Dice State
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 4]);
  const [diceRotations1, setDiceRotations1] = useState<{ x: number; y: number }>(TARGET_FACE_ROTATIONS[3]);
  const [diceRotations2, setDiceRotations2] = useState<{ x: number; y: number }>(TARGET_FACE_ROTATIONS[4]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceSum, setDiceSum] = useState<number | null>(7);

  // Keep track of total tumble cycles to continuously spin forward
  const rollCycleCount = useRef<number>(0);

  // Betting & Turn State
  const [betAmount, setBetAmount] = useState<number>(2500);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [resultBadge, setResultBadge] = useState<{ text: string; isGain: boolean } | null>(null);
  const [isCursed, setIsCursed] = useState<boolean>(false);

  // AI Host & Logs
  const [aiSpeech, setAiSpeech] = useState<string>(
    'Bem-vindos ao Soma ou Sabota! Escolha sua aposta com sabedoria, ou a casa devorará seus trocados!'
  );
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Sabotage State
  const [sabotageAvailable, setSabotageAvailable] = useState<boolean>(false);
  const [sabotageTimeLeft, setSabotageTimeLeft] = useState<number>(10);
  const [isSabotageModalOpen, setIsSabotageModalOpen] = useState<boolean>(false);
  const sabotageTimerRef = useRef<number | null>(null);

  // Secret Codes State
  const [activeCodes, setActiveCodes] = useState<Record<string, SecretEffect>>({});
  const [generatedSecretCode, setGeneratedSecretCode] = useState<string | null>(null);
  const [isRedeemOpen, setIsRedeemOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // End Game State
  const [winner, setWinner] = useState<Player | null>(null);
  const [winnerReason, setWinnerReason] = useState<string>('');

  // Audio Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const currentPlayer = players[currentPlayerIndex] || null;
  const isPressureMode = currentRound >= 5;

  // Initialize or Reset Game
  const handleStartGame = (count: number, rounds: number, names: string[], initialBalance: number) => {
    const newPlayers: Player[] = names.map((name, idx) => ({
      id: idx + 1,
      name: name || `Jogador ${idx + 1}`,
      balance: initialBalance,
      initialBalance: initialBalance,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      avatarBg: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      forcedAllIn: false,
      bankrupt: false,
      isAi: count === 1 && idx === 1,
      sabotagesUsed: 0,
      sabotagesSuffered: 0,
      pendingSabotageNotice: null,
    }));

    setPlayers(newPlayers);
    setMaxRounds(rounds);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setBetAmount(Math.min(2500, initialBalance));
    setDiceValues([1, 1]);
    setDiceRotations1(TARGET_FACE_ROTATIONS[1]);
    setDiceRotations2(TARGET_FACE_ROTATIONS[1]);
    rollCycleCount.current = 0;
    setDiceSum(2);
    setResultBadge(null);
    setHasRolledThisTurn(false);
    setWinner(null);
    setGameLogs([]);
    setIsSetupOpen(false);
    setAiSpeech('Que comecem os jogos! Os dados estão prontos na mesa.');
    triggerSabotageChance(newPlayers);
  };

  // Sabotage chance evaluation
  const triggerSabotageChance = useCallback((playerList: Player[]) => {
    if (sabotageTimerRef.current) {
      window.clearInterval(sabotageTimerRef.current);
      sabotageTimerRef.current = null;
    }

    const aliveCount = playerList.filter((p) => !p.bankrupt).length;
    // ~15% chance for sabotage alert if at least 2 players alive
    const roll = Math.random();
    if (aliveCount > 1 && roll < 0.18) {
      setSabotageAvailable(true);
      setSabotageTimeLeft(10);
      sounds.playSabotageAlert();

      sabotageTimerRef.current = window.setInterval(() => {
        setSabotageTimeLeft((prev) => {
          if (prev <= 1) {
            if (sabotageTimerRef.current) window.clearInterval(sabotageTimerRef.current);
            setSabotageAvailable(false);
            setIsSabotageModalOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSabotageAvailable(false);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sabotageTimerRef.current) {
        window.clearInterval(sabotageTimerRef.current);
      }
    };
  }, []);

  // Set bet percentage shortcut
  const handleSetBetPercent = (pct: number) => {
    if (!currentPlayer || currentPlayer.forcedAllIn || isRolling) return;
    sounds.playClick();
    const newBet = Math.max(1, Math.floor(currentPlayer.balance * pct));
    setBetAmount(newBet);
  };

  // Outcome math
  const calculateOutcome = (sum: number, bet: number): RollOutcome => {
    if (isPressureMode) {
      switch (sum) {
        case 12: return { change: Math.floor(bet * 0.75), percentageText: '+75%', message: 'SOMA 12: +75% (PRESSÃO)', isGain: true, isNeutral: false };
        case 11: return { change: Math.floor(bet * 0.30), percentageText: '+30%', message: 'SOMA 11: +30% (PRESSÃO)', isGain: true, isNeutral: false };
        case 10: return { change: Math.floor(bet * 0.15), percentageText: '+15%', message: 'SOMA 10: +15% (PRESSÃO)', isGain: true, isNeutral: false };
        case 9:  return { change: 0, percentageText: '0%', message: 'SOMA 9: EMPATE (PRESSÃO)', isGain: false, isNeutral: true };
        case 8:  return { change: -Math.floor(bet * 0.20), percentageText: '-20%', message: 'SOMA 8: -20% (PRESSÃO)', isGain: false, isNeutral: false };
        case 7:  return { change: -Math.floor(bet * 0.35), percentageText: '-35%', message: 'SOMA 7: -35% (PRESSÃO)', isGain: false, isNeutral: false };
        case 6:  return { change: -Math.floor(bet * 0.50), percentageText: '-50%', message: 'SOMA 6: -50% (PRESSÃO)', isGain: false, isNeutral: false };
        case 5:  return { change: -Math.floor(bet * 0.70), percentageText: '-70%', message: 'SOMA 5: -70% (PRESSÃO)', isGain: false, isNeutral: false };
        case 4:  return { change: -Math.floor(bet * 0.85), percentageText: '-85%', message: 'SOMA 4: -85% (PRESSÃO)', isGain: false, isNeutral: false };
        case 3:  return { change: -bet, percentageText: '-100%', message: 'SOMA 3: PERDA TOTAL (-100%)!', isGain: false, isNeutral: false };
        case 2:  return { change: -bet, percentageText: '-100%', message: 'SOMA 2: PERDA TOTAL (-100%)!', isGain: false, isNeutral: false };
        default: return { change: 0, percentageText: '0%', message: 'Empate', isGain: false, isNeutral: true };
      }
    } else {
      switch (sum) {
        case 12: return { change: Math.floor(bet * 1.0), percentageText: '+100%', message: 'SOMA 12: +100%!', isGain: true, isNeutral: false };
        case 11: return { change: Math.floor(bet * 0.5), percentageText: '+50%', message: 'SOMA 11: +50%!', isGain: true, isNeutral: false };
        case 10: return { change: Math.floor(bet * 0.3), percentageText: '+30%', message: 'SOMA 10: +30%!', isGain: true, isNeutral: false };
        case 9:  return { change: Math.floor(bet * 0.1), percentageText: '+10%', message: 'SOMA 9: +10%!', isGain: true, isNeutral: false };
        case 8:  return { change: 0, percentageText: '0%', message: 'SOMA 8: EMPATE NEUTRO', isGain: false, isNeutral: true };
        case 7:  return { change: -Math.floor(bet * 0.1), percentageText: '-10%', message: 'SOMA 7: -10%', isGain: false, isNeutral: false };
        case 6:  return { change: -Math.floor(bet * 0.2), percentageText: '-20%', message: 'SOMA 6: -20%', isGain: false, isNeutral: false };
        case 5:  return { change: -Math.floor(bet * 0.35), percentageText: '-35%', message: 'SOMA 5: -35%', isGain: false, isNeutral: false };
        case 4:  return { change: -Math.floor(bet * 0.5), percentageText: '-50%', message: 'SOMA 4: -50%', isGain: false, isNeutral: false };
        case 3:  return { change: -Math.floor(bet * 0.75), percentageText: '-75%', message: 'SOMA 3: -75%', isGain: false, isNeutral: false };
        case 2:  return { change: -bet, percentageText: '-100%', message: 'SOMA 2: PERDA TOTAL (-100%)!', isGain: false, isNeutral: false };
        default: return { change: 0, percentageText: '0%', message: 'Empate', isGain: false, isNeutral: true };
      }
    }
  };

  // Roll the dice
  const handleRollDice = () => {
    if (isRolling || hasRolledThisTurn || !currentPlayer) return;

    const actualBet = currentPlayer.forcedAllIn ? currentPlayer.balance : betAmount;
    if (actualBet <= 0 || actualBet > currentPlayer.balance) {
      alert('Valor de aposta inválido!');
      return;
    }

    setIsRolling(true);
    sounds.playDiceRattle();

    // Disable active sabotage during roll
    if (sabotageTimerRef.current) {
      window.clearInterval(sabotageTimerRef.current);
    }
    setSabotageAvailable(false);

    // Pick random face 1 to 6
    const val1 = Math.floor(Math.random() * 6) + 1;
    const val2 = Math.floor(Math.random() * 6) + 1;
    const sum = val1 + val2;

    const targetRot1 = TARGET_FACE_ROTATIONS[val1];
    const targetRot2 = TARGET_FACE_ROTATIONS[val2];

    rollCycleCount.current += 1;
    // Multiples of 360 ensure smooth continuous revolutions before locking on target face
    const spinBase = rollCycleCount.current * 720;

    setDiceRotations1({
      x: spinBase + targetRot1.x,
      y: spinBase + targetRot1.y,
    });
    setDiceRotations2({
      x: spinBase + 360 + targetRot2.x,
      y: spinBase + 360 + targetRot2.y,
    });

    setTimeout(() => {
      setDiceValues([val1, val2]);
      setDiceSum(sum);
      setIsRolling(false);
      setHasRolledThisTurn(true);

      let outcome = calculateOutcome(sum, actualBet);

      // Check if player was cursed
      if (isCursed && !outcome.isGain) {
        outcome = {
          ...outcome,
          change: Math.floor(outcome.change * 1.5),
          message: `${outcome.message} (MALDIÇÃO +50% PERDA!)`,
        };
        setIsCursed(false);
      }

      const updatedBalance = Math.max(0, currentPlayer.balance + outcome.change);
      const isBankrupt = updatedBalance <= 0;

      if (outcome.isGain) {
        sounds.playWin();
      } else if (isBankrupt) {
        sounds.playSiren();
      } else {
        sounds.playLoss();
      }

      setResultBadge({
        text: outcome.message,
        isGain: outcome.isGain,
      });

      // Update player balance and bankruptcy
      const updatedPlayers = players.map((p, idx) => {
        if (idx === currentPlayerIndex) {
          return {
            ...p,
            balance: updatedBalance,
            bankrupt: isBankrupt,
            forcedAllIn: false,
          };
        }
        return p;
      });

      setPlayers(updatedPlayers);

      // Add to log
      const newLog: GameLog = {
        id: Math.random().toString(36).substring(7),
        round: currentRound,
        playerName: currentPlayer.name,
        sum,
        dice: [val1, val2],
        bet: actualBet,
        change: outcome.change,
        resultMessage: outcome.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'roll',
      };
      setGameLogs((prev) => [newLog, ...prev]);

      // Check if this roll eliminated everyone else
      const remainingSurvivors = updatedPlayers.filter((p) => p.balance > 0);
      if (remainingSurvivors.length <= 1 && updatedPlayers.length > 1) {
        setWinner(remainingSurvivors[0] || currentPlayer);
        setWinnerReason('Último Sobrevivente: Todos os rivais faliram!');
        sounds.playWin();
      }

      // Trigger Gemini commentary
      setAiLoading(true);
      getGameCommentary({
        playerName: currentPlayer.name,
        round: currentRound,
        sum,
        bet: actualBet,
        change: outcome.change,
        isGain: outcome.isGain,
        balance: updatedBalance,
        isPressureMode,
      }).then((comment) => {
        setAiSpeech(comment);
        setAiLoading(false);
      });

      // Surprise Secret Code Drop (25% chance)
      if (Math.random() < 0.25) {
        triggerRandomSecretCode(currentPlayer.name);
      }
    }, 1450);
  };

  // Generate random secret code
  const triggerRandomSecretCode = (pName: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const effects: SecretEffect[] = [
      { type: 'MULT_GAIN', val: 2, desc: 'BÔNUS MÁGICO: Seu saldo foi DUPLICADO!', badge: '2X SALDO' },
      { type: 'FIXED_GAIN', val: 3000, desc: 'TESOURO: +R$ 3.000,00 na sua conta!', badge: '+R$ 3.000' },
      { type: 'FIXED_LOSS', val: 1500, desc: 'TAXA SURPRESA: -R$ 1.500,00 confiscados!', badge: '-R$ 1.500' },
      { type: 'PERCENT_LOSS', val: 0.35, desc: 'GOLPE DE AZAR: Perdeu 35% do patrimônio!', badge: '-35%' },
    ];
    const pickedEffect = effects[Math.floor(Math.random() * effects.length)];

    setActiveCodes((prev) => ({ ...prev, [code]: pickedEffect }));
    setGeneratedSecretCode(code);
  };

  // Execute Sabotage
  const handleExecuteSabotage = (targetId: number, type: SabotageType) => {
    if (!currentPlayer) return;

    const target = players.find((p) => p.id === targetId);
    if (!target) return;

    let desc = '';
    let updatedTarget = { ...target };
    let updatedAttacker = { ...currentPlayer, sabotagesUsed: currentPlayer.sabotagesUsed + 1 };

    if (type === 'STEAL_20') {
      const stolen = Math.floor(target.balance * 0.2);
      updatedTarget.balance -= stolen;
      updatedAttacker.balance += stolen;
      desc = `Roubou R$ ${stolen.toLocaleString('pt-BR')} do seu saldo!`;
    } else if (type === 'FORCE_ALL_IN') {
      updatedTarget.forcedAllIn = true;
      desc = `Forçou você a dar ALL-IN na sua próxima jogada!`;
    } else if (type === 'FEE_1000') {
      const fee = Math.min(1000, target.balance);
      updatedTarget.balance -= fee;
      desc = `Cobrou uma multa imediata de R$ 1.000,00 do seu saldo!`;
    } else if (type === 'CURSE_NEXT_ROLL') {
      setIsCursed(true);
      desc = `Lançou a Maldição dos Dados! Qualquer perda na sua próxima rodada será 50% mais destrutiva!`;
    }

    updatedTarget.sabotagesSuffered += 1;
    updatedTarget.pendingSabotageNotice = {
      attackerName: currentPlayer.name,
      effectDesc: desc,
    };

    const newPlayers = players.map((p) => {
      if (p.id === updatedAttacker.id) return updatedAttacker;
      if (p.id === updatedTarget.id) return updatedTarget;
      return p;
    });

    setPlayers(newPlayers);
    setIsSabotageModalOpen(false);
    setSabotageAvailable(false);

    // AI roast commentary
    getSabotageRoast(currentPlayer.name, target.name, desc).then((roast) => {
      setAiSpeech(roast);
    });

    // Add log
    setGameLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        round: currentRound,
        playerName: currentPlayer.name,
        sum: 0,
        dice: [0, 0],
        bet: 0,
        change: 0,
        resultMessage: `SABOTOU ${target.name}: ${desc}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'sabotage',
      },
      ...prev,
    ]);
  };

  // Redeem code handler
  const handleRedeemCode = (codeStr: string): { success: boolean; message: string } => {
    if (!activeCodes[codeStr] || !currentPlayer) {
      return { success: false, message: 'Código inexistente ou já utilizado!' };
    }

    const effect = activeCodes[codeStr];
    const newActive = { ...activeCodes };
    delete newActive[codeStr];
    setActiveCodes(newActive);

    let newBalance = currentPlayer.balance;
    if (effect.type === 'MULT_GAIN') newBalance = currentPlayer.balance * effect.val;
    else if (effect.type === 'FIXED_GAIN') newBalance = currentPlayer.balance + effect.val;
    else if (effect.type === 'FIXED_LOSS') newBalance = Math.max(0, currentPlayer.balance - effect.val);
    else if (effect.type === 'PERCENT_LOSS') newBalance = Math.floor(currentPlayer.balance * (1 - effect.val));

    const updatedPlayers = players.map((p, idx) => {
      if (idx === currentPlayerIndex) {
        return {
          ...p,
          balance: newBalance,
          bankrupt: newBalance <= 0,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);

    setGameLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        round: currentRound,
        playerName: currentPlayer.name,
        sum: 0,
        dice: [0, 0],
        bet: 0,
        change: newBalance - currentPlayer.balance,
        resultMessage: `RESGATOU CÓDIGO [${codeStr}]: ${effect.desc}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'code',
      },
      ...prev,
    ]);

    return { success: true, message: `SUCESSO! ${effect.desc}` };
  };

  // Next Turn
  const handleNextTurn = () => {
    sounds.playClick();

    // Check survival condition (all rivals bankrupt)
    const survivors = players.filter((p) => p.balance > 0);
    if (survivors.length <= 1 && players.length > 1) {
      const winnerPlayer = survivors[0] || players[0];
      setWinner(winnerPlayer);
      setWinnerReason('Último Sobrevivente: Todos os outros concorrentes faliram!');
      sounds.playWin();
      return;
    }

    let nextIdx = (currentPlayerIndex + 1) % players.length;
    let newRound = currentRound;

    // Completed full cycle of players
    if (nextIdx === 0) {
      newRound += 1;
      setCurrentRound(newRound);

      // Check max rounds condition
      if (maxRounds > 0 && newRound > maxRounds) {
        const sorted = [...players].sort((a, b) => b.balance - a.balance);
        setWinner(sorted[0]);
        setWinnerReason(`Fim das ${maxRounds} rodadas! Maior patrimônio acumulado na mesa!`);
        sounds.playWin();
        return;
      }
    }

    // Skip bankrupt players
    let loopCount = 0;
    while (players[nextIdx]?.balance <= 0 && loopCount < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      if (nextIdx === 0) {
        newRound += 1;
        setCurrentRound(newRound);
      }
      loopCount++;
    }

    setCurrentPlayerIndex(nextIdx);
    setHasRolledThisTurn(false);
    setResultBadge(null);

    const nextPlayer = players[nextIdx];
    if (nextPlayer) {
      const recommendedBet = nextPlayer.forcedAllIn
        ? nextPlayer.balance
        : Math.min(betAmount, nextPlayer.balance);
      setBetAmount(recommendedBet > 0 ? recommendedBet : 100);

      // Random chance for sabotage next turn
      triggerSabotageChance(players);
    }
  };

  // Dismiss pending notice for current player
  const handleDismissNotice = () => {
    if (!currentPlayer) return;
    const updated = players.map((p, idx) => {
      if (idx === currentPlayerIndex) {
        return { ...p, pendingSabotageNotice: null };
      }
      return p;
    });
    setPlayers(updated);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 md:p-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <header className="w-full flex justify-between items-center mb-6 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-rose-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/30">
            <Dices className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-wide">
                SOMA OU <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">SABOTA</span>
              </h1>
              {isPressureMode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <Flame className="w-3 h-3 text-rose-500" />
                  Modo Pressão
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {maxRounds > 0 ? `Rodada ${currentRound} de ${maxRounds}` : `Rodada ${currentRound} (Sem Limite)`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => { sounds.playClick(); setIsHistoryOpen(true); }}
            title="Histórico"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <HistoryIcon className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Histórico</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setIsRedeemOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            <span>Código</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setIsRulesOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Regras</span>
          </button>
        </div>
      </header>

      {/* AI COMMENTATOR BANNER */}
      <div className="w-full mb-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 text-indigo-400">
          <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">
              Voz do Cassino • Narrador IA
            </span>
            {aiLoading && <span className="text-[10px] text-slate-500 italic">formulando resposta...</span>}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium italic mt-0.5">
            "{aiSpeech}"
          </p>
        </div>
      </div>

      {/* MAIN ARENA - NOT using overflow-hidden on 3D parent */}
      <main className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-start">
        {/* DICE DISPLAY (LEFT PANEL) */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl flex flex-col items-center justify-between min-h-[460px] relative shadow-2xl">
          {/* Active Player Status Bar */}
          <div className="w-full flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800 mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-11 h-11 rounded-2xl ${
                  currentPlayer?.avatarBg || 'bg-indigo-600'
                } flex items-center justify-center font-black text-white shadow-lg ring-2 ring-white/10`}
              >
                P{currentPlayer?.id || 1}
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-black tracking-wider block">
                  Vez da Jogada
                </span>
                <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                  {currentPlayer?.name || 'Carregando...'}
                  {currentPlayer?.forcedAllIn && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      ALL-IN OBRIGATÓRIO!
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-black tracking-wider block">
                Saldo Atual
              </span>
              <div className="font-mono font-black text-lg sm:text-xl text-emerald-400">
                R$ {(currentPlayer?.balance || 0).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Result Badge */}
          <div className="min-h-[34px] flex items-center justify-center mb-2">
            {resultBadge ? (
              <div
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-lg transition-all ${
                  resultBadge.isGain
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}
              >
                {resultBadge.text}
              </div>
            ) : (
              <div className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                {isRolling ? 'Dados no ar...' : 'Aguardando Lançamento...'}
              </div>
            )}
          </div>

          {/* 3D DICE SECTION */}
          <div className="w-full flex items-center justify-center space-x-8 sm:space-x-14 my-4 py-2">
            <Dice3D
              diceId="dice1"
              value={diceValues[0]}
              rotations={diceRotations1}
              rolling={isRolling}
              label="Dado 1"
            />
            <Dice3D
              diceId="dice2"
              value={diceValues[1]}
              rotations={diceRotations2}
              rolling={isRolling}
              label="Dado 2"
            />
          </div>

          {/* Sum Display */}
          <div className="text-center mt-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block">
              Soma dos Dados
            </span>
            <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight">
              {diceSum !== null ? diceSum : '--'}
            </span>
          </div>

          {/* Players Strip at bottom */}
          <div className="w-full mt-6 pt-4 border-t border-slate-800 flex items-center justify-around gap-2">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center border transition-all ${
                  idx === currentPlayerIndex
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                    : p.bankrupt
                    ? 'bg-slate-950/40 border-slate-900 opacity-40 line-through text-slate-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold truncate">{p.name}</div>
                <div className="font-mono text-[11px] font-black text-emerald-400 truncate">
                  R$ {p.balance.toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BETTING AND ACTIONS (RIGHT PANEL) */}
        <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 shadow-2xl">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs uppercase text-slate-400 font-black tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-400" />
                Valor da Aposta
              </label>
              {currentPlayer?.forcedAllIn && (
                <span className="text-[11px] font-bold text-rose-400">
                  Trava ALL-IN Ativa
                </span>
              )}
            </div>

            {/* Bet Input */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-700/80 focus-within:border-indigo-500 transition p-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-lg">
                R$
              </span>
              <input
                type="number"
                min="1"
                max={currentPlayer?.balance || 10000}
                disabled={currentPlayer?.forcedAllIn || hasRolledThisTurn || isRolling}
                value={currentPlayer?.forcedAllIn ? currentPlayer?.balance : betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent pl-10 pr-2 font-mono text-2xl font-black text-white focus:outline-none disabled:opacity-80"
                placeholder="0"
              />
            </div>

            {/* Quick Percentage Chips */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: '10%', pct: 0.1 },
                { label: '25%', pct: 0.25 },
                { label: '50%', pct: 0.5 },
                { label: 'ALL-IN', pct: 1.0 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  disabled={currentPlayer?.forcedAllIn || hasRolledThisTurn || isRolling}
                  onClick={() => handleSetBetPercent(chip.pct)}
                  className={`py-2 rounded-xl text-xs font-black border transition ${
                    chip.label === 'ALL-IN'
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Multipliers Rule Card */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span>Cenários de Vitória</span>
                <span className={isPressureMode ? 'text-rose-400' : 'text-emerald-400'}>
                  {isPressureMode ? 'Regras de Pressão' : 'Regras Normais'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Soma 12</span>
                  <strong className="text-emerald-400 font-mono font-bold">
                    {isPressureMode ? '+75%' : '+100%'}
                  </strong>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Soma 8-9</span>
                  <strong className="text-slate-300 font-mono font-bold">
                    {isPressureMode ? '-20% / 0%' : 'Neutro / +10%'}
                  </strong>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Soma 2</span>
                  <strong className="text-rose-400 font-mono font-bold">-100%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SABOTAGE BUTTON (WHEN TIMED ALERT IS ACTIVE) */}
          {sabotageAvailable && !hasRolledThisTurn && (
            <div>
              <button
                onClick={() => { sounds.playClick(); setIsSabotageModalOpen(true); }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600/30 to-amber-600/30 hover:from-rose-600/40 hover:to-amber-600/40 text-rose-400 font-black text-xs border border-rose-500/50 transition flex items-center justify-between px-4 shadow-lg shadow-rose-950/60"
              >
                <span className="flex items-center space-x-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>SABOTAR ADVERSÁRIO DISPONÍVEL!</span>
                </span>
                <span className="bg-rose-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-lg font-mono">
                  {sabotageTimeLeft}s
                </span>
              </button>
            </div>
          )}

          {/* MAIN ACTION BUTTONS */}
          <div className="space-y-3">
            {!hasRolledThisTurn ? (
              <button
                disabled={isRolling}
                onClick={handleRollDice}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-base tracking-wide shadow-xl shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? 'ROLANDO DADOS...' : 'ROLAR DADOS'}</span>
              </button>
            ) : (
              <button
                onClick={handleNextTurn}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base tracking-wide shadow-xl shadow-emerald-600/30 transition transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>PASSAR A VEZ / PRÓXIMO</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setIsSetupOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Partida / Configurações
            </button>
          </div>
        </div>
      </main>

      {/* ALL MODALS */}
      <SetupModal
        isOpen={isSetupOpen}
        onStart={handleStartGame}
      />

      {currentPlayer && (
        <SabotageModal
          isOpen={isSabotageModalOpen}
          timeLeft={sabotageTimeLeft}
          attacker={currentPlayer}
          players={players}
          onExecute={handleExecuteSabotage}
          onClose={() => setIsSabotageModalOpen(false)}
        />
      )}

      {currentPlayer?.pendingSabotageNotice && (
        <SabotageNoticeModal
          notice={currentPlayer.pendingSabotageNotice}
          onClose={handleDismissNotice}
        />
      )}

      <SecretAlertModal
        code={generatedSecretCode}
        playerName={currentPlayer?.name || ''}
        onClose={() => setGeneratedSecretCode(null)}
      />

      <RedeemCodeModal
        isOpen={isRedeemOpen}
        onRedeem={handleRedeemCode}
        onClose={() => setIsRedeemOpen(false)}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <WinnerModal
        winner={winner}
        reason={winnerReason}
        players={players}
        onPlayAgain={() => setIsSetupOpen(true)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        logs={gameLogs}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
