// Einmaleins drills (GAME_DESIGN §6a, STYLE_GUIDE §9 "Einmaleins-Training"): Üben,
// Blitzrunde, Turbo-Duell and Reihen-Meister on a calm open stage – only her character,
// her pet and the task card. The number pad stays in its usual place. Times are measured
// with performance.now() (through gameNow(), see clock.ts); speed modes confirm on their own once enough digits are typed
// and show the next fact at once.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import { wakeAll } from '../battle/progress'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import {
  BLITZ_MS,
  DUEL_LENGTH,
  REVIEW_GAP,
  ROW_MASTER_MS,
  allFacts,
  answerLength,
  drawFact,
  drawFacts,
  factAnswer,
  factHelp,
  factId,
  factText,
  planPractice,
  requeue,
  rowFacts,
  shuffle,
  type DojoOp,
  type Fact,
} from '../math/einmaleins'
import { palette } from '../palette'
import { finishBlitz, finishDuel, finishRowMaster, gridReward, recordFact } from '../state/dojo'
import { DOJO_REWARD, practiceCoins } from '../state/economy'
import { activePet, coinBalance } from '../state/save'
import { addCoins, deviceId, getSave, updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { NumberPad } from '../ui/NumberPad'
import { SandTimer } from '../ui/SandTimer'
import { SpeechCard } from '../ui/SpeechCard'
import { confetti } from '../ui/confetti'
import { addText } from '../ui/text'
import { formatSeconds } from './EinmaleinsMenuScene'
import { PixelScene } from './PixelScene'
import { gameNow } from '../clock'

export type DrillMode = 'practice' | 'blitz' | 'duel' | 'row'

const FLOOR_Y = 196
const CARD = { x: 8, y: 72, w: 116, h: 64 }
const HINT = { x: 8, y: 142, w: 132 }
const TRACK = { x: 10, y: 64, w: 150 }
const SHOW_FACT_MS = 1000
const MAX_DIGITS = 3

/** wrong = the correct fact is shown for 1 s; busy = short praise in Üben */
type Phase = 'task' | 'wrong' | 'retype' | 'busy' | 'end'

export class EinmaleinsDrillScene extends PixelScene {
  private op: DojoOp = 'mul'
  private mode: DrillMode = 'practice'
  private row: number | 'mix' = 'mix'

  private queue: Fact[] = []
  private index = 0
  private fact!: Fact
  private typed = ''
  private phase: Phase = 'task'
  private shownAt = 0
  private roundStart = 0
  private correct = 0
  private mistakes = 0
  private coins = 0
  /** Üben: facts missed earlier in this round (they give 1 coin when they come back) */
  private missed = new Set<string>()
  /** Blitzrunde: missed facts and after how many answers they come back */
  private reviews: { fact: Fact; due: number }[] = []
  private recent: string[] = []

  private hero!: Character
  private pet?: Pet
  private ghost?: Pet
  private hud!: Hud
  private caption!: Caption
  private card!: Phaser.GameObjects.Graphics
  private question!: Phaser.GameObjects.Text
  private answerBox!: Phaser.GameObjects.Graphics
  private answerText!: Phaser.GameObjects.Text
  private hint!: Phaser.GameObjects.Container
  private pad!: NumberPad
  private counter!: Phaser.GameObjects.Text
  private counterPill!: Phaser.GameObjects.Container
  private timer?: SandTimer
  private progress!: Phaser.GameObjects.Graphics
  private ghostMs: number | null = null

  constructor() {
    super('EinmaleinsDrill')
  }

  init(data: { op?: DojoOp; mode?: DrillMode; row?: number | 'mix' }) {
    this.op = data.op ?? 'mul'
    this.mode = data.mode ?? 'practice'
    this.row = data.row ?? 'mix'
    this.index = 0
    this.correct = 0
    this.mistakes = 0
    this.coins = 0
    this.missed = new Set()
    this.reviews = []
    this.recent = []
    this.ghost = undefined
    this.timer = undefined
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: FLOOR_Y })).setOrigin(0)
    const save = getSave()
    const duel = this.mode === 'duel'
    this.hero = new Character(
      this,
      duel ? TRACK.x : 150,
      duel ? TRACK.y : FLOOR_Y,
      save.character?.look ?? DEFAULT_LOOK,
    )
    if (!duel) this.hero.setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 170, FLOOR_Y, pet.species)

    this.hud = new Hud(this, { onHome: () => this.toMenu(), stars: false })
    // Messages appear above the floor, so they never cover the number pad
    this.caption = new Caption(this).setViewY(FLOOR_Y - 10 - GAME_HEIGHT + 24)
    this.progress = this.add.graphics().setDepth(900)

    this.card = this.add.graphics()
    this.question = addText(this, CARD.x + CARD.w / 2, CARD.y + 20, '', 'title', 24)
    this.answerBox = this.add.graphics()
    this.answerText = addText(this, CARD.x + CARD.w / 2, CARD.y + 46, '', 'title', 18)
    this.hint = this.add.container(HINT.x, HINT.y).setVisible(false).setDepth(10)

    // Counter pill: correct answers so far
    const pill = this.add.graphics()
    pill.fillStyle(palette.paperWhite).fillRoundedRect(0, 0, 42, 16, 3)
    pill.lineStyle(1, palette.ink).strokeRoundedRect(0, 0, 42, 16, 3)
    this.counter = addText(this, 28, 7, '0', 'title', 14)
    this.counterPill = this.add.container(130, CARD.y, [
      pill,
      this.add.image(9, 8, icon(this, 'check'), 'icon'),
      this.counter,
    ])
    if (this.mode === 'blitz' || this.mode === 'row')
      this.timer = new SandTimer(this, 140, CARD.y + 22)

    this.pad = new NumberPad(this, {
      digit: (d) => this.type(d),
      back: () => this.erase(),
      ok: () => this.confirm(),
    })

    this.plan()
    if (duel) this.setupTrack()
    this.roundStart = gameNow()
    this.nextFact()
  }

  // ---------- Round flow ----------

  private plan() {
    const facts = getSave().dojo.facts
    const pool = allFacts(this.op)
    switch (this.mode) {
      case 'practice':
        this.queue = planPractice(facts, this.op, this.row, Math.random)
        break
      case 'duel':
        this.queue = drawFacts(facts, pool, DUEL_LENGTH, Math.random)
        break
      case 'row':
        this.queue = shuffle(rowFacts(this.op, this.row === 'mix' ? 1 : this.row), Math.random)
        break
      case 'blitz':
        this.queue = []
    }
  }

  private get speed() {
    return this.mode !== 'practice'
  }

  private nextFact() {
    if (this.mode === 'blitz') {
      const due = this.reviews.findIndex((r) => r.due <= this.index)
      this.fact =
        due >= 0
          ? this.reviews.splice(due, 1)[0].fact
          : drawFact(getSave().dojo.facts, allFacts(this.op), Math.random, this.recent)
      this.recent = [...this.recent, factId(this.fact)].slice(-3)
    } else {
      if (this.index >= this.queue.length) return this.end()
      this.fact = this.queue[this.index]
    }
    this.typed = ''
    this.phase = 'task'
    this.hint.setVisible(false)
    this.drawCard(false)
    this.render()
    this.renderProgress()
    this.shownAt = gameNow()
  }

  private type(d: string) {
    if (this.phase !== 'task' && this.phase !== 'retype') return
    if (this.typed.length >= MAX_DIGITS) return
    if (this.typed === '0') this.typed = ''
    this.typed += d
    this.render()
    // Speed modes: auto-confirm once the answer has as many digits as the result
    if (this.speed && this.typed.length === answerLength(this.fact)) this.judge()
  }

  private erase() {
    if (this.phase !== 'task' && this.phase !== 'retype') return
    this.typed = this.typed.slice(0, -1)
    this.render()
  }

  private confirm() {
    if ((this.phase === 'task' || this.phase === 'retype') && this.typed !== '') this.judge()
  }

  private judge() {
    const ms = gameNow() - this.shownAt
    const ok = Number(this.typed) === factAnswer(this.fact)
    if (this.phase === 'retype') {
      // Retyping the shown result is practice, not a measured answer
      if (ok) return this.advance()
      sfx.boop()
      this.typed = ''
      this.render()
      return
    }
    updateSave((s) => recordFact(s, this.fact, ok, ms))
    if (ok) this.onCorrect()
    else this.onWrong()
  }

  private onCorrect() {
    this.correct++
    this.counter.setText(String(this.correct))
    sfx.pling()
    const id = factId(this.fact)
    const coins = this.mode === 'practice' ? practiceCoins(!this.missed.has(id)) : DOJO_REWARD.speed
    this.pay(coins)
    if (this.speed) return this.advance()
    // Üben is calm: a short moment of praise before the next fact
    this.phase = 'busy'
    this.hero.jump()
    this.pet?.hop()
    this.time.delayedCall(450, () => this.advance())
  }

  private onWrong() {
    this.mistakes++
    sfx.boop()
    const id = factId(this.fact)
    if (this.mode === 'practice') {
      // Show the fact with a helper, let her retype it, and ask again later in the round
      this.missed.add(id)
      this.queue = requeue(this.queue, this.index, this.fact)
      this.phase = 'retype'
      this.typed = ''
      this.wiggleCard()
      this.showHint()
      this.render()
      return
    }
    if (this.mode === 'blitz')
      this.reviews.push({ fact: this.fact, due: this.index + 1 + REVIEW_GAP })
    if (this.mode === 'duel') this.queue = [...this.queue, this.fact]
    // The correct fact stays on the card for 1 s in accent-blue (no flashing)
    this.phase = 'wrong'
    this.typed = String(factAnswer(this.fact))
    this.drawCard(true)
    this.render()
    this.time.delayedCall(SHOW_FACT_MS, () => {
      if (this.phase === 'wrong') this.advance()
    })
  }

  private advance() {
    this.index++
    this.nextFact()
  }

  private pay(coins: number) {
    if (coins <= 0) return
    this.coins += coins
    addCoins(coins)
    this.hud.addCoins(coins)
  }

  private toMenu() {
    // Leaving early is free: coins already paid stay hers
    this.goTo('EinmaleinsMenu', { op: this.op })
  }

  // ---------- End of round ----------

  private end() {
    if (this.phase === 'end') return
    this.phase = 'end'
    const elapsed = gameNow() - this.roundStart
    this.pad.setVisible(false)
    this.hint.setVisible(false)
    this.card.setVisible(false)
    this.question.setVisible(false)
    this.answerBox.setVisible(false)
    this.answerText.setVisible(false)
    this.timer?.setVisible(false)
    this.counterPill.setVisible(false)
    this.hero.setWalking(false)
    // A finished round in a learning hut wakes napping pets (GAME_DESIGN §6b)
    updateSave(wakeAll)

    const lines = this.resultLines(elapsed)
    const reward = gridReward(getSave(), this.op)
    if (reward.item) updateSave(() => reward.save)
    this.hud.setCoins(coinBalance(getSave()))

    const celebrate = lines.celebrate || !!reward.item
    sfx.fanfare()
    if (celebrate) confetti(this, 40)
    this.hero.jump()
    this.pet?.hop()
    if (reward.item) this.caption.show(texts.dojo.gridDone(reward.item.name), 4000)

    const text = [...lines.text, texts.dojo.coins(this.coins)].join('\n')
    const card = new SpeechCard(this, 14, 70, 152, 86, text).setDepth(30)
    card.setText(text, lines.text.length > 2 ? 13 : 15)
    new Key(this, 30, 222, 120, 34, texts.dojo.again, () => this.restart(), {
      fill: 'gold',
      label: true,
      fontSize: 7,
    }).setDepth(30)
    new Key(this, 30, 266, 120, 34, texts.dojo.back, () => this.toMenu(), {
      label: true,
      fontSize: 7,
    }).setDepth(30)
  }

  private resultLines(elapsed: number): { text: string[]; celebrate: boolean } {
    const device = deviceId()
    switch (this.mode) {
      case 'practice': {
        // Every miss put the fact back once more, so the round had this many different facts
        const total = this.queue.length - this.mistakes
        const firstTry = total - this.missed.size
        return {
          text: [texts.dojo.practiceDone, texts.dojo.solvedFirst(firstTry, total)],
          celebrate: this.missed.size === 0,
        }
      }
      case 'blitz': {
        const result = finishBlitz(getSave(), this.op, this.correct, device)
        updateSave(() => result.save)
        this.coins += result.bonus
        const text = [texts.dojo.blitzScore(this.correct)]
        text.push(result.record ? texts.dojo.blitzRecord : texts.dojo.blitzBest(result.previous))
        return { text, celebrate: result.record }
      }
      case 'duel': {
        const result = finishDuel(getSave(), this.op, elapsed, device)
        updateSave(() => result.save)
        this.coins += result.bonus
        const time = texts.dojo.seconds(formatSeconds(elapsed))
        if (result.beatGhost)
          return { text: [texts.dojo.duelBeat, time, texts.dojo.star], celebrate: true }
        if (result.record) return { text: [texts.dojo.duelFirst, time], celebrate: true }
        return {
          text: [time, texts.dojo.duelMissed(formatSeconds(result.ghostMs ?? 0))],
          celebrate: false,
        }
      }
      case 'row': {
        const row = this.row === 'mix' ? 1 : this.row
        const result = finishRowMaster(getSave(), this.op, row, this.mistakes, elapsed, device)
        updateSave(() => result.save)
        this.coins += result.bonus
        const time = texts.dojo.seconds(formatSeconds(elapsed))
        if (result.newBadge) return { text: [texts.dojo.rowBadge(row), time], celebrate: true }
        if (result.passed) return { text: [texts.dojo.rowHasBadge(row), time], celebrate: true }
        return {
          text: [this.mistakes > 0 ? texts.dojo.rowMistakes : texts.dojo.rowSlow, time],
          celebrate: false,
        }
      }
    }
  }

  private restart() {
    this.scene.restart({ op: this.op, mode: this.mode, row: this.row })
  }

  // ---------- Rendering ----------

  private drawCard(showFact: boolean) {
    const g = this.card.clear()
    g.fillStyle(showFact ? palette.accentBlue : palette.cream)
    g.fillRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 3)
  }

  private render() {
    this.question.setText(`${factText(this.fact)} =`)
    const w = 48
    const x = CARD.x + (CARD.w - w) / 2
    const y = CARD.y + 36
    const g = this.answerBox.clear()
    g.fillStyle(palette.paperWhite).fillRoundedRect(x, y, w, 20, 2)
    g.lineStyle(2, palette.gold).strokeRoundedRect(x, y, w, 20, 2)
    this.answerText.setText(this.typed || '_')
  }

  /** Üben: the fact and a little helper slide in below the card. */
  private showHint() {
    this.hint.removeAll(true)
    const lines = [...factHelp(this.fact), texts.dojo.retype]
    const size = lines.some((l) => l.length > 22) ? 11 : 12
    const body = addText(this, 8, 16, lines.join('\n'), 'title', size).setOrigin(0, 0)
    body.setWordWrapWidth(HINT.w - 14).setAlign('left')
    const h = Math.ceil(body.height) + 22
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, HINT.w, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, HINT.w, h, 3)
    g.fillStyle(palette.accentBlue).fillRect(2, 2, 3, h - 4)
    const head = addText(this, 8, 8, texts.show.hint, 'label', 5).setOrigin(0, 0.5)
    this.hint.add([g, head, body]).setVisible(true)
    ;[-120, -80, -44, -16, -2, 0].forEach((dx, i) =>
      this.time.delayedCall(i * 30, () => this.hint.setX(HINT.x + dx)),
    )
  }

  /** Gentle wiggle (STYLE_GUIDE §9): 2 px left/right, 2 times. */
  private wiggleCard() {
    ;[-2, 2, -2, 2, 0].forEach((dx, i) =>
      this.time.delayedCall(i * 50, () => {
        this.card.setX(dx)
        this.question.setX(CARD.x + CARD.w / 2 + dx)
      }),
    )
  }

  /** Üben and Reihen-Meister: one dot per fact of the round (top bar). */
  private renderProgress() {
    const g = this.progress.clear()
    if (this.mode !== 'practice' && this.mode !== 'row') return
    const n = this.queue.length
    const pitch = Math.min(7, Math.floor(84 / n))
    const size = pitch - 2
    const x0 = Math.round((GAME_WIDTH - (n * pitch - 2)) / 2)
    for (let i = 0; i < n; i++) {
      const x = x0 + i * pitch
      g.fillStyle(i < this.index ? palette.gold : palette.cream).fillRect(x, 8, size, size)
      g.lineStyle(1, i === this.index ? palette.gold : palette.ink).strokeRect(x, 8, size, size)
    }
  }

  /** Turbo-Duell: a slim wooden track; she runs along it, her ghost pet at her best pace. */
  private setupTrack() {
    const g = this.add.graphics()
    g.fillStyle(palette.woodLight).fillRect(TRACK.x - 4, TRACK.y, TRACK.w + 18, 1)
    g.fillStyle(palette.woodMid).fillRect(TRACK.x - 4, TRACK.y + 1, TRACK.w + 18, 3)
    g.fillStyle(palette.woodDark).fillRect(TRACK.x - 4, TRACK.y + 4, TRACK.w + 18, 1)
    // Finish flag
    const fx = TRACK.x + TRACK.w + 6
    g.fillStyle(palette.woodEdge).fillRect(fx, TRACK.y - 16, 1, 16)
    g.fillStyle(palette.gold).fillRect(fx + 1, TRACK.y - 16, 6, 4)
    g.fillStyle(palette.goldDark).fillRect(fx + 1, TRACK.y - 13, 6, 1)
    this.ghostMs = getSave().dojo.records[this.op].duelMs
    const pet = activePet(getSave())
    if (this.ghostMs !== null && pet) {
      this.ghost = new Pet(this, TRACK.x, TRACK.y, pet.species).setAlpha(0.5)
    }
    this.caption.show(this.ghostMs === null ? texts.dojo.duelFirst : texts.dojo.duelGhost, 1500)
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
    this.ghost?.tick(delta)
    if (this.phase === 'end') return
    const elapsed = gameNow() - this.roundStart
    if (this.mode === 'blitz') {
      this.timer?.draw(1 - elapsed / BLITZ_MS)
      if (elapsed >= BLITZ_MS) this.end()
    } else if (this.mode === 'row') {
      this.timer?.draw(1 - elapsed / ROW_MASTER_MS)
    } else if (this.mode === 'duel') {
      const mine = this.correct / DUEL_LENGTH
      this.hero.setX(Math.round(TRACK.x + TRACK.w * mine))
      this.hero.setWalking(true)
      if (this.ghost && this.ghostMs) {
        this.ghost.setX(Math.round(TRACK.x + TRACK.w * Math.min(1, elapsed / this.ghostMs)))
      }
    }
  }

  /** For end-to-end tests (window.__debug.drill()). */
  debugState() {
    return {
      /** Game time since the round started (runs faster with ?speed) */
      elapsedMs: gameNow() - this.roundStart,
      mode: this.mode,
      op: this.op,
      phase: this.phase,
      fact: this.fact ? factText(this.fact) : undefined,
      answer: this.fact ? factAnswer(this.fact) : undefined,
      index: this.index,
      queue: this.queue.length,
      correct: this.correct,
      coins: this.coins,
    }
  }
}
