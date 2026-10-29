import { GoogleGenAI } from '@google/genai';

// Exponential backoff helper for robust API error handling
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((res) => setTimeout(res, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
}

export async function getGameCommentary(params: {
  playerName: string;
  round: number;
  sum: number;
  bet: number;
  change: number;
  isGain: boolean;
  balance: number;
  isPressureMode: boolean;
}): Promise<string> {
  try {
    return await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      const prompt = `Você é o "Narrador Caótico", mestre sarcástico e entusiasmado do jogo de cassino de dados "Soma ou Sabota".
Situação do turno:
- Jogador: ${params.playerName}
- Rodada: ${params.round} ${params.isPressureMode ? '(MODO PRESSÃO ATIVO!)' : ''}
- Tirou soma: ${params.sum} (nos dois dados)
- Valor apostado: R$ ${params.bet}
- Resultado: ${params.isGain ? `GANHOU R$ ${params.change}` : params.change === 0 ? 'NEUTRO (Empatou)' : `PERDEU R$ ${Math.abs(params.change)}`}
- Novo saldo: R$ ${params.balance}

Gere uma frase curta (máximo 2 frases divertidas e cheias de adrenalina em português brasileiro), estilo locutor de cassino ou showman zombeteiro / comemorativo. Seja direto, divertido e emocionante!`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é um locutor teatral, cômico e afiado de um programa de auditório e cassino chamado Soma ou Sabota.',
          temperature: 0.9,
        }
      });

      return response.text?.trim() || getDefaultCommentary(params);
    });
  } catch {
    return getDefaultCommentary(params);
  }
}

export async function getSabotageRoast(attacker: string, victim: string, effect: string): Promise<string> {
  try {
    return await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      const prompt = `Gere uma única frase chocante e divertida para o jogo 'Soma ou Sabota': ${attacker} acabou de trair e sabotar ${victim} (${effect})! Seja teatral e dramático em português.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.9,
        }
      });
      return response.text?.trim() || `${attacker} apunhalou ${victim} pelas costas com sangue frio!`;
    });
  } catch {
    return `${attacker} puxou o tapete de ${victim} com maestria! Que golpe sujo!`;
  }
}

function getDefaultCommentary(params: { sum: number; isGain: boolean; change: number; playerName: string }): string {
  if (params.sum === 12) return `DOZE PERFEITO! ${params.playerName} quebrou a banca dos dados!`;
  if (params.sum === 2) return `OLHOS DE COBRA! Dois 1s na mesa! ${params.playerName} foi engolido pelo azar!`;
  if (params.isGain) return `Os deuses dos dados sorriram para ${params.playerName}! O bolso agradece!`;
  if (params.change === 0) return `Empate tático! Nada se ganha, nada se perde. A tensão continua!`;
  return `Ai ai ai... a casa sempre vence! ${params.playerName} sentiu a picada da sorte adversa!`;
}
