// The show in the Theater hut (GAME_DESIGN §3, §6; STYLE_GUIDE §9 "Math tasks on stage"):
// 10 tasks on the speech card, number pad or choice keys on the floor, hint → worked
// solution → retype, coins for every solved task. No timer. The Theater takes its tasks
// from the hut of the week, one level harder, for double coins. A learning-hut round uses the
// same flow with 10 tasks of the topic and level she picked. Written tasks are filled in
// digit by digit on the squared-paper grid instead of the speech card.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import {
  SHOW_LENGTH,
  coinFactor,
  planRound,
  roundHut,
  slotTask,
  theaterRound,
  type Round,
  type ShowSlot,
} from '../math/show'
import { checkAnswer } from '../math/topics'
import type { Answer, Task } from '../math/types'
import { layoutWritten } from '../math/written'
import { palette } from '../palette'
import { answerReward, streakBonus, type TaskResult } from '../state/economy'
import { activePet } from '../state/save'
import { currentLevels } from '../math/adaptive'
import { dueReviews } from '../math/review'
import { topic as topicOf } from '../math/topics'
import { recordShowTask } from '../state/learning'
import { addCoins, deviceId, getSave, updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { HUTS } from '../world/village'
import { NumberPad } from '../ui/NumberPad'
import { SpeechCard } from '../ui/SpeechCard'
import { WrittenCalcGrid } from '../ui/WrittenCalcGrid'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

export const SHOW_FLOOR_Y = 196
const CARD = { x: 8, y: 26, w: 116, h: 86 }
const HINT = { x: 8, y: 126, w: 116 }
/** Top-left corner of the written calculation grid (in place of the speech card) */
const GRID = { x: 8, y: 38 }
const MAX_DIGITS = 7

type Field = 'value' | 'rest'

export class ShowScene extends PixelScene {
  private round: Round = theaterRound()
  private slots: ShowSlot[] = []
  private index = 0
  private task!: Task
  private attempt = 1
  private typed = { value: '', rest: '' }
  private field: Field = 'value'
  private results: TaskResult[] = []
  private streak = 0
  private busy = false

  private hero!: Character
  private pet?: Pet
  private hud!: Hud
  private card!: SpeechCard
  private answer!: Phaser.GameObjects.Container
  private hint!: Phaser.GameObjects.Container
  private pad!: NumberPad
  private choices: Key[] = []
  private progress!: Phaser.GameObjects.Graphics
  private caption!: Caption
  private grid?: WrittenCalcGrid
  /** "Nochmal" on an old mistake that came back */
  private reviewMark!: Phaser.GameObjects.Text
  /** Wrong digits in the current square of the written grid */
  private squareMistakes = 0

  constructor() {
    super('Show')
  }

  init(data: { round?: Round }) {
    this.round = data.round ?? theaterRound()
    this.grid = undefined
    this.index = 0
    this.results = []
    this.streak = 0
    this.busy = false
    this.choices = []
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: SHOW_FLOOR_Y })).setOrigin(0)

    const save = getSave()
    this.hero = new Character(this, 150, SHOW_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 170, SHOW_FLOOR_Y, pet.species)

    this.card = new SpeechCard(this, CARD.x, CARD.y, CARD.w, CARD.h, '')
    this.card.setTextY(30)
    this.answer = this.add.container(0, 0)
    this.hint = this.add.container(HINT.x, HINT.y).setVisible(false)

    this.hud = new Hud(this, {
      stars: false,
      onHome: () => this.goTo('Village', { from: roundHut(this.round) }),
    })
    this.progress = this.add.graphics().setDepth(900)
    // Messages appear on the free middle of the stage, never over the number pad
    this.caption = new Caption(this).setViewY(SHOW_FLOOR_Y - 38 - GAME_HEIGHT + 24)

    this.pad = new NumberPad(this, {
      digit: (d) => this.type(d),
      back: () => this.erase(),
      ok: () => this.confirm(),
    })

    // Her current levels; a Theater show also brings back up to 2 old mistakes
    const reviews = this.round.kind === 'theater' ? dueReviews(save.review).map((r) => r.task) : []
    this.slots = planRound(this.round, Math.random, currentLevels(save.mastery), reviews)
    this.reviewMark = addText(this, CARD.x + 6, CARD.y + 7, texts.show.review, 'label', 5)
      .setOrigin(0, 0.5)
      .setDepth(20)
    // The Theater shows which hut's tasks it plays this week (on the stage edge, above the pad)
    if (this.round.kind === 'theater') {
      const hut = this.round.hut
      const name = HUTS.find((h) => h.id === hut)?.name ?? hut
      new LabelPill(this, GAME_WIDTH / 2, SHOW_FLOOR_Y + 7, texts.show.week(name), { size: 5 })
    }
    this.nextTask()
  }

  // ---------- Task flow ----------

  private nextTask() {
    if (this.index >= this.slots.length) {
      this.goTo('ShowEnd', { results: this.results, round: this.round })
      return
    }
    const slot = this.slots[this.index]
    this.task = slotTask(slot, Math.random)
    this.reviewMark.setVisible(!!slot.review)
    this.attempt = 1
    this.typed = { value: '', rest: '' }
    this.field = 'value'
    this.busy = false
    this.squareMistakes = 0
    this.hint.setVisible(false)

    this.grid?.destroy()
    this.grid = undefined
    if (this.task.format.kind === 'written') {
      this.card.setVisible(false)
      this.grid = new WrittenCalcGrid(this, GRID.x, GRID.y, layoutWritten(this.task.format))
    } else {
      this.card.setVisible(true)
      const q = this.task.question
      const size = q.length <= 11 ? 22 : q.length <= 16 ? 18 : q.length <= 44 ? 14 : 12
      this.card.typeText(q, size, sfx.tick)
    }

    const choice = this.task.format.kind === 'choice'
    this.pad.setVisible(!choice)
    this.buildChoices()
    this.renderAnswer()
    this.renderProgress()
  }

  private type(d: string) {
    if (this.grid) return this.writtenDigit(Number(d))
    if (this.busy || this.typed[this.field].length >= MAX_DIGITS) return
    if (this.typed[this.field] === '0') this.typed[this.field] = ''
    this.typed[this.field] += d
    this.renderAnswer()
  }

  private erase() {
    if (this.busy || this.grid) return
    if (this.field === 'rest' && this.typed.rest === '') this.field = 'value'
    else this.typed[this.field] = this.typed[this.field].slice(0, -1)
    this.renderAnswer()
  }

  private confirm() {
    if (this.busy || this.grid || this.typed.value === '') return
    const remainder = this.task.format.kind !== 'choice' && this.task.format.remainder
    if (remainder && this.field === 'value') {
      this.field = 'rest'
      this.renderAnswer()
      return
    }
    if (remainder && this.typed.rest === '') return
    this.judge({
      value: Number(this.typed.value),
      ...(remainder ? { remainder: Number(this.typed.rest) } : {}),
    })
  }

  private judge(given: Answer) {
    if (checkAnswer(this.task, given)) this.onCorrect()
    else this.onWrong()
  }

  /**
   * Written grid: every digit is checked at once. The first wrong digit in a square shows
   * a hint for that square, the second shows the right digit in accent-blue to type it.
   * Coins as in a show: no mistake = first try, hints only = second try, a shown digit = third.
   */
  private writtenDigit(d: number) {
    const grid = this.grid
    if (this.busy || !grid?.current) return
    if (grid.enter(d)) {
      this.squareMistakes = 0
      this.hint.setVisible(false)
      if (grid.done) this.onCorrect()
      return
    }
    sfx.boop()
    this.squareMistakes++
    const hint = grid.current.hint
    if (this.squareMistakes === 1) {
      this.attempt = Math.max(this.attempt, 2)
      this.showHint(texts.show.hint, [hint], this.belowGrid())
    } else {
      this.attempt = 3
      grid.showDigit()
      this.showHint(texts.show.solution, [hint, texts.learn.typeBlue], this.belowGrid())
    }
  }

  /** The hint card goes under the grid, so the grid stays readable. */
  private belowGrid(): number {
    return this.grid ? GRID.y + this.grid.cardHeight + 4 : HINT.y
  }

  private onCorrect() {
    this.busy = true
    this.results.push({ attempts: this.attempt })
    this.streak = this.attempt === 1 ? this.streak + 1 : 0
    const factor = coinFactor(this.round)
    const reward = answerReward(this.attempt, factor)
    const bonus = streakBonus(this.streak, factor)
    addCoins(reward + bonus)
    // Her level for this topic, stars for a new level, mistakes for later shows
    const review = !!this.slots[this.index].review
    let levelUp: { level: number; stars: number } | undefined
    updateSave((s) => {
      const result = recordShowTask(s, this.task, this.attempt, review, deviceId())
      if (result.change === 'up' || result.stars) {
        levelUp = { level: result.save.mastery[this.task.topic]!.level, stars: result.stars }
      }
      return result.save
    })

    sfx.pling()
    this.hero.jump()
    this.pet?.hop()
    this.risingHearts()
    this.flyCoins(reward + bonus)
    if (bonus) {
      sfx.fanfare()
      this.caption.show(`${texts.show.streak} +${bonus}`, 1500)
    }
    if (this.grid) this.caption.show(this.praise(), 1300)
    else this.card.setText(this.praise(), 20)
    this.hint.setVisible(false)
    if (levelUp) {
      const name = topicOf(this.task.topic).short
      const text = [
        texts.show.levelUp(name, levelUp.level),
        ...(levelUp.stars ? [texts.show.star] : []),
      ]
      this.time.delayedCall(bonus ? 700 : 0, () => {
        sfx.fanfare()
        this.caption.show(text.join(' '), 2000)
      })
    }

    this.time.delayedCall(1400, () => {
      this.index++
      this.nextTask()
    })
  }

  private onWrong() {
    sfx.boop()
    this.wiggleCard()
    this.attempt++
    this.typed = { value: '', rest: '' }
    this.field = 'value'
    this.renderAnswer()
    if (this.attempt === 2) {
      this.showHint(texts.show.hint, this.task.hintSteps)
    } else {
      this.showHint(texts.show.solution, [...this.task.solutionSteps, texts.show.retype])
    }
  }

  // ---------- Rendering ----------

  private renderAnswer() {
    this.answer.removeAll(true)
    const format = this.task.format
    if (format.kind === 'choice' || format.kind === 'written') return
    const y = CARD.y + 58
    const box = (x: number, w: number, value: string, field: Field) => {
      const g = this.add.graphics()
      const active = this.field === field
      g.fillStyle(palette.paperWhite).fillRoundedRect(x, y, w, 20, 2)
      g.lineStyle(active ? 2 : 1, active ? palette.gold : palette.ink).strokeRoundedRect(
        x,
        y,
        w,
        20,
        2,
      )
      const text = addText(this, x + w / 2, y + 10, value || (active ? '_' : ''), 'title', 18)
      const zone = this.add.zone(x + w / 2, y + 10, w, 24).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => {
        if (this.busy) return
        this.field = field
        this.renderAnswer()
      })
      this.answer.add([g, text, zone])
    }
    if (format.remainder) {
      box(CARD.x + 8, 38, this.typed.value, 'value')
      this.answer.add(addText(this, CARD.x + CARD.w / 2, y + 10, texts.show.rest, 'label', 6))
      box(CARD.x + CARD.w - 46, 38, this.typed.rest, 'rest')
      return
    }
    const unit = format.kind === 'numpad' ? format.unit : undefined
    const w = 56
    const x = CARD.x + (CARD.w - w) / 2 - (unit ? 10 : 0)
    box(x, w, this.typed.value, 'value')
    if (unit) this.answer.add(addText(this, x + w + 4, y + 10, unit, 'label', 6).setOrigin(0, 0.5))
  }

  private buildChoices() {
    for (const key of this.choices) key.destroy()
    this.choices = []
    if (this.task.format.kind !== 'choice') return
    const options = this.task.format.options
    const w = 64
    const h = 36
    options.forEach((option, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const centered = options.length % 2 === 1 && i === options.length - 1
      const x = centered ? (GAME_WIDTH - w) / 2 : 22 + col * (w + 8)
      const key = new Key(
        this,
        x,
        216 + row * (h + 10),
        w,
        h,
        option.label,
        () => {
          if (this.busy) return
          sfx.tick()
          this.judge({ value: option.value })
        },
        { fontSize: 18 },
      )
      this.choices.push(key)
    })
  }

  private renderProgress() {
    const g = this.progress.clear()
    const size = 5
    const gap = 2
    const x0 = Math.round((GAME_WIDTH - (SHOW_LENGTH * (size + gap) - gap)) / 2)
    for (let i = 0; i < SHOW_LENGTH; i++) {
      const x = x0 + i * (size + gap)
      const done = i < this.index
      g.fillStyle(done ? palette.gold : palette.cream).fillRect(x, 8, size, size)
      g.lineStyle(1, i === this.index ? palette.gold : palette.ink).strokeRect(x, 8, size, size)
    }
  }

  private showHint(title: string, lines: string[], y = HINT.y) {
    this.hint.removeAll(true)
    this.hint.setY(y)
    const size = lines.length > 4 ? 10 : 12
    const body = addText(this, 8, 16, lines.join('\n'), 'title', size).setOrigin(0, 0)
    body.setWordWrapWidth(HINT.w - 14).setAlign('left')
    const h = Math.min(SHOW_FLOOR_Y + 8 - y, Math.ceil(body.height) + 22)
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, HINT.w, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, HINT.w, h, 3)
    g.fillStyle(palette.accentBlue).fillRect(2, 2, 3, h - 4)
    const head = addText(this, 8, 8, title, 'label', 5).setOrigin(0, 0.5)
    this.hint.add([g, head, body]).setVisible(true).setDepth(10)

    // Slide in from the left in whole-pixel steps
    const steps = [-120, -80, -44, -16, -2, 0]
    steps.forEach((dx, i) => this.time.delayedCall(i * 30, () => this.hint.setX(HINT.x + dx)))
  }

  /** Gentle wiggle (STYLE_GUIDE §9): 2 px left/right, 2 times. Never a red flash. */
  private wiggleCard() {
    ;[-2, 2, -2, 2, 0].forEach((dx, i) =>
      this.time.delayedCall(i * 50, () => this.card.setX(CARD.x + dx)),
    )
  }

  private praise(): string {
    const name = getSave().character?.name
    const options = [...texts.show.praise, ...(name ? texts.show.praiseName(name) : [])]
    return options[Math.floor(Math.random() * options.length)]
  }

  /** Coins arc from the card into the counter; each one adds its share on landing. */
  private flyCoins(amount: number) {
    const count = Math.min(amount, 8)
    const from = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 }
    const to = this.hud.coinTarget
    let given = 0
    for (let i = 0; i < count; i++) {
      const share = i === count - 1 ? amount - given : Math.floor(amount / count)
      given += share
      const coin = this.add.image(from.x, from.y, icon(this, 'coin'), 'icon').setDepth(950)
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 450,
        delay: i * 70,
        onUpdate: (tween) => {
          const t = tween.getValue() ?? 0
          const x = from.x + (to.x - from.x) * t
          const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 30
          coin.setPosition(Math.round(x), Math.round(y))
        },
        onComplete: () => {
          coin.destroy()
          sfx.coin()
          this.hud.addCoins(share)
        },
      })
    }
  }

  /** Small pixel hearts rise from below the stage – the audience applauds. */
  private risingHearts() {
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(
        30 + i * 50 + Math.floor(Math.random() * 20),
        SHOW_FLOOR_Y + 6,
        icon(this, 'heart'),
        'icon',
      )
      heart.setDepth(5)
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 900,
        delay: i * 120,
        onUpdate: (tween) => {
          const t = tween.getValue() ?? 0
          heart.setY(Math.round(SHOW_FLOOR_Y + 6 - t * 50)).setAlpha(1 - t)
        },
        onComplete: () => heart.destroy(),
      })
    }
  }

  /** For end-to-end tests (window.__debug.show()). */
  debugState() {
    return {
      index: this.index,
      answer: this.task.answer,
      format: this.task.format,
      attempt: this.attempt,
      hintVisible: this.hint.visible,
      busy: this.busy,
      round: this.round,
      review: !!this.slots[this.index]?.review,
      /** Written grid: the digit expected in the active square */
      written: this.grid?.current
        ? { digit: this.grid.current.digit, carry: this.grid.current.carry }
        : undefined,
    }
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
