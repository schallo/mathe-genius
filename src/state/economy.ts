// Coin rewards (GAME_DESIGN §4 "Currency"). Pure logic. Coins are never taken away.

export const REWARD = {
  firstTry: 5,
  afterHint: 3,
  afterSolution: 1,
  streakBonus: 5,
  streakLength: 5,
  showBonus: 10,
} as const

/** attempt 1 = first try, 2 = after the hint, 3+ = after the worked solution. */
export function answerReward(attempt: number, challenge = false): number {
  const base =
    attempt <= 1 ? REWARD.firstTry : attempt === 2 ? REWARD.afterHint : REWARD.afterSolution
  return challenge ? base * 2 : base
}

/** Bonus after every 5 first-try answers in a row. */
export function streakBonus(streak: number): number {
  return streak > 0 && streak % REWARD.streakLength === 0 ? REWARD.streakBonus : 0
}

export type TaskResult = { attempts: number; challenge: boolean }

export type ShowSummary = {
  /** Tasks solved on the first or second try */
  solved: number
  total: number
  coins: number
}

/** Coins for a whole show, including streak bonuses and the show bonus. */
export function summarizeShow(results: TaskResult[]): ShowSummary {
  let coins = 0
  let streak = 0
  for (const r of results) {
    coins += answerReward(r.attempts, r.challenge)
    streak = r.attempts === 1 ? streak + 1 : 0
    coins += streakBonus(streak)
  }
  return {
    solved: results.filter((r) => r.attempts <= 2).length,
    total: results.length,
    coins: coins + REWARD.showBonus,
  }
}
