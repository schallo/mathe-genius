// Coin rewards (GAME_DESIGN §4 "Currency"). Pure logic. Coins are never taken away.

export const REWARD = {
  firstTry: 5,
  afterHint: 3,
  afterSolution: 1,
  streakBonus: 5,
  streakLength: 5,
  showBonus: 10,
} as const

/**
 * attempt 1 = first try, 2 = after the hint, 3+ = after the worked solution.
 * `factor` 2 for Theater shows (double coins for every task).
 */
export function answerReward(attempt: number, factor = 1): number {
  const base =
    attempt <= 1 ? REWARD.firstTry : attempt === 2 ? REWARD.afterHint : REWARD.afterSolution
  return base * factor
}

/** Bonus after every 5 first-try answers in a row (fewer with some pets). */
export function streakBonus(
  streak: number,
  factor = 1,
  length: number = REWARD.streakLength,
): number {
  return streak > 0 && streak % length === 0 ? REWARD.streakBonus * factor : 0
}

/**
 * What her active pet's trait adds to a round (GAME_DESIGN §4 "Pet traits"): an earlier
 * streak bonus and extra coins for first tries. Free mistakes are marked on the task result.
 */
export type RoundBoost = { streakLength: number; bonusCoins: number }

export const NO_BOOST: RoundBoost = { streakLength: REWARD.streakLength, bonusCoins: 0 }

/** `free`: one mistake on this task was forgiven by her pet (coins and streak as one try earlier). */
export type TaskResult = { attempts: number; free?: boolean }

/** The try that counts for coins and the streak (her levels always use the real one). */
export const coinAttempt = (r: TaskResult): number =>
  r.free ? Math.max(1, r.attempts - 1) : r.attempts

/** Coins for one solved task, with the pet's extra coin for a first try. */
export function taskCoins(attempt: number, factor = 1, boost: RoundBoost = NO_BOOST): number {
  return answerReward(attempt, factor) + (attempt <= 1 ? boost.bonusCoins * factor : 0)
}

export type ShowSummary = {
  /** Tasks solved on the first or second try */
  solved: number
  total: number
  coins: number
}

/** Coins for a whole round, including streak bonuses and the round bonus. */
export function summarizeShow(
  results: TaskResult[],
  factor = 1,
  boost: RoundBoost = NO_BOOST,
): ShowSummary {
  let coins = 0
  let streak = 0
  for (const r of results) {
    const attempt = coinAttempt(r)
    coins += taskCoins(attempt, factor, boost)
    streak = attempt === 1 ? streak + 1 : 0
    coins += streakBonus(streak, factor, boost.streakLength)
  }
  return {
    solved: results.filter((r) => r.attempts <= 2).length,
    total: results.length,
    coins: coins + REWARD.showBonus * factor,
  }
}

/** Einmaleins-Dojos (GAME_DESIGN §6a). Speed modes never take anything away. */
export const DOJO_REWARD = {
  /** Üben: correct the first time the fact comes up in the round */
  practice: 2,
  /** Üben: correct when a missed fact comes back later */
  practiceAgain: 1,
  /** Blitzrunde, Turbo-Duell and Reihen-Meister: per correct answer */
  speed: 1,
  /** New personal best in the Blitzrunde, or a new Turbo-Duell record */
  record: 10,
  /** Turbo-Duell: beating the ghost also gives a star */
  duelStar: 1,
  /** First medal for a row in Reihen-Meister */
  badge: 15,
} as const

export function practiceCoins(firstTime: boolean): number {
  return firstTime ? DOJO_REWARD.practice : DOJO_REWARD.practiceAgain
}
