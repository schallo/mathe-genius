// Battle screen (GAME_DESIGN §6b, STYLE_GUIDE §9a): wild creature top right, her pet bottom
// left, task box with a calm time bar, the number pad in its usual place. Answers are
// auto-confirmed once enough digits are typed; times are measured with performance.now()
// (through gameNow(), see clock.ts).
import Phaser from 'phaser'
import { area } from '../world/wild'
import { FOE_SPOT, PET_SPOT, ensureBattleTexture } from '../art/battle'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import { sfx } from '../audio/sfx'
import {
  answerCorrect,
  answerWrong,
  startBattle,
  timeKey,
  timeLimitMs,
  traitLabel,
  useTip,
  type BattleState,
} from '../battle/battle'
import { addAnswerTime, addPetXp, finishBattle, petLevel } from '../battle/progress'
import { recordMistake } from '../state/learning'
import { SPECIES, traitOf, type SpeciesId, type WildForm } from '../data/creatures'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { generateTask } from '../math/topics'
import type { Task } from '../math/types'
import { palette } from '../palette'
import { activePet, coinBalance, type PetSave } from '../state/save'
import { deviceId, getSave, updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { NumberPad, PAD } from '../ui/NumberPad'
import { SpeechCard } from '../ui/SpeechCard'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'
import { gameNow } from '../clock'

const SCALE = 3
const FOE_BOX = { x: 4, y: 40, w: 92, h: 28 }
const PET_BOX = { x: 84, y: 126, w: 92, h: 36 }
const TASK = { x: 6, y: 176, w: 168, h: 24 }
const BAR = { x: 10, y: 202, w: 160, h: 5 }
const SHOW_ANSWER_MS = 1000
const HIT_MS = 600
const ARENA_CAPTION_Y = 116

type Phase = 'intro' | 'task' | 'busy' | 'end'

type InfoBox = {
  container: Phaser.GameObjects.Container
  bar: Phaser.GameObjects.Graphics
  shownHp: number
  maxHp: number
}

export class BattleScene extends PixelScene {
  private foeId!: SpeciesId
  private wild!: WildForm
  private petSave!: PetSave
  private state!: BattleState
  private phase: Phase = 'intro'
  private task!: Task
  private typed = ''
  private startedAt = 0
  private limitMs = 10_000
  private tipUsed = false

  private foe!: Pet
  private pet!: Pet
  private foeBox!: InfoBox
  private petBox!: InfoBox
  private taskBox!: Phaser.GameObjects.Graphics
  private taskText!: Phaser.GameObjects.Text
  private timeBar!: Phaser.GameObjects.Graphics
  private tipCard?: Phaser.GameObjects.Container
  private tipKey!: Key
  private pad!: NumberPad
  private hud!: Hud
  private caption!: Caption

  constructor() {
    super('Battle')
  }

  init(data: { foe: SpeciesId }) {
    this.foeId = data.foe
    this.phase = 'intro'
    this.tipCard = undefined
  }

  create() {
    this.setupCamera()
    const save = getSave()
    const pet = activePet(save)
    const wild = SPECIES[this.foeId].wild
    // The battle looks like the creature's island
    this.add.image(0, 0, ensureBattleTexture(this, wild && area(wild.area).theme)).setOrigin(0)
    if (!pet || !wild) {
      this.goTo('Wild', { from: 'battle' })
      return
    }
    this.wild = wild
    this.petSave = pet
    const level = petLevel(pet)
    this.state = startBattle(pet.species, level, wild)

    this.foe = new Pet(this, GAME_WIDTH + 30, FOE_SPOT.y, this.foeId).setScale(SCALE)
    this.foe.setFlip(true)
    this.pet = new Pet(this, -30, PET_SPOT.y, pet.species).setScale(SCALE)

    const trait = traitLabel(traitOf(pet.species), level)
    this.foeBox = this.infoBox(FOE_BOX, SPECIES[this.foeId].name, wild.level, this.state.foe.maxHp)
    this.petBox = this.infoBox(PET_BOX, pet.name, level, this.state.pet.maxHp, trait)

    this.taskBox = this.add.graphics()
    this.taskText = addText(this, TASK.x + TASK.w / 2, TASK.y + TASK.h / 2 - 1, '', 'title', 20)
    this.timeBar = this.add.graphics()
    this.drawTaskBox(false)

    this.pad = new NumberPad(this, {
      digit: (d) => this.type(d),
      back: () => this.erase(),
      ok: () => this.confirm(),
    })
    const padRight = PAD.x + 3 * PAD.keyW + 2 * PAD.gap
    this.tipKey = new Key(this, padRight + 3, PAD.y, GAME_WIDTH - padRight - 5, PAD.keyH, '?', () =>
      this.showTip(),
    )
    this.tipKey.setVisible(this.state.tipsLeft > 0)

    this.hud = new Hud(this, { onHome: () => this.runAway() })
    // Messages appear over the arena, so they never cover the number pad
    this.caption = new Caption(this).setViewY(ARENA_CAPTION_Y - GAME_HEIGHT + 24)
    this.intro()
  }

  // ---------- Flow ----------

  /** Creature slides in from the right, her pet from the left (~300 ms, whole pixels). */
  private intro() {
    this.slide(this.foe, GAME_WIDTH + 30, FOE_SPOT.x)
    this.slide(this.pet, -30, PET_SPOT.x)
    this.caption.show(texts.battle.appears(SPECIES[this.foeId].name), 1400)
    this.time.delayedCall(1000, () => this.nextTask())
  }

  private slide(target: Pet, from: number, to: number) {
    this.tweens.addCounter({
      from,
      to,
      duration: 300,
      onUpdate: (t) => target.setX(Math.round(t.getValue() ?? to)),
    })
  }

  private nextTask() {
    this.task = generateTask(this.wild.topic, this.wild.taskLevel)
    this.typed = ''
    this.tipUsed = false
    this.tipCard?.destroy()
    this.tipCard = undefined
    const times = getSave().battle.times[this.key()] ?? []
    this.limitMs = timeLimitMs(times, this.wild.timeFactor, this.state.extraMs)
    this.phase = 'task'
    this.drawTaskBox(false)
    this.renderTask()
    this.startedAt = gameNow()
  }

  private key() {
    return timeKey(this.task.topic, this.task.level)
  }

  private type(d: string) {
    if (this.phase !== 'task') return
    const length = String(this.task.answer.value).length
    if (this.typed.length >= length) return
    if (this.typed === '0') this.typed = ''
    this.typed += d
    this.renderTask()
    if (this.typed.length === length) this.judge()
  }

  private erase() {
    if (this.phase !== 'task') return
    this.typed = this.typed.slice(0, -1)
    this.renderTask()
  }

  private confirm() {
    if (this.phase === 'task' && this.typed !== '') this.judge()
  }

  private judge() {
    const elapsed = gameNow() - this.startedAt
    if (Number(this.typed) === this.task.answer.value) this.onCorrect(elapsed)
    else this.onWrong(false)
  }

  private onCorrect(elapsed: number) {
    this.phase = 'busy'
    // Her own time only: trait bonuses and tip pauses never enter the statistics
    if (!this.tipUsed) updateSave((s) => addAnswerTime(s, this.key(), elapsed))
    const result = answerCorrect(this.state, elapsed, this.limitMs)
    this.state = result.state
    sfx.pling()
    if (result.full) {
      this.caption.show(texts.battle.volltreffer, 900)
      this.time.delayedCall(250, () => this.starBurst(this.foe.x, this.foe.y - 18))
    }
    this.attack(this.pet, this.foe, 1, 'star')
    this.drainHp(this.foeBox, this.state.foe.hp)
    this.time.delayedCall(HIT_MS, () => {
      if (this.state.outcome === 'win') this.end(true)
      else this.nextTask()
    })
  }

  private onWrong(timeout: boolean) {
    const result = answerWrong(this.state, timeout)
    this.state = result.state
    sfx.boop()
    // A wrong answer comes back in a later Theater show (GAME_DESIGN §6b)
    if (!timeout) updateSave((s) => recordMistake(s, this.task))
    if (result.joker) {
      this.caption.show(texts.battle.joker, 1200)
      this.typed = ''
      this.renderTask()
      this.startedAt = gameNow()
      return
    }
    this.phase = 'busy'
    if (timeout) {
      this.caption.show(texts.battle.tooSlow, 1000)
      // Counts as a slow answer, so the timer gives her more time next time
      if (!this.tipUsed)
        updateSave((s) => addAnswerTime(s, this.key(), this.limitMs - this.state.extraMs))
    }
    // The correct fact stays on the card for 1 s (accent-blue, no flashing)
    this.typed = String(this.task.answer.value)
    this.drawTaskBox(true)
    this.renderTask()
    if (result.shield) {
      // A free mistake (pet trait): no hit, just the next task
      this.caption.show(texts.battle.shield(this.petSave.name), 1000)
      this.pet.hop()
    } else {
      this.time.delayedCall(250, () => {
        this.attack(this.foe, this.pet, -1, 'bubble')
        this.drainHp(this.petBox, this.state.pet.hp)
      })
    }
    this.time.delayedCall(SHOW_ANSWER_MS, () => {
      if (this.state.outcome === 'lose') this.end(false)
      else this.nextTask()
    })
  }

  private showTip() {
    if (this.phase !== 'task') return
    const next = useTip(this.state)
    if (!next) return
    this.state = next
    this.tipUsed = true
    this.tipKey.setVisible(this.state.tipsLeft > 0)
    sfx.tick()
    // Method only (hints.ts), never the result; the timer starts again
    const lines = this.task.hintSteps
    const body = addText(this, 8, 16, lines.join('\n'), 'title', 12).setOrigin(0, 0)
    body.setWordWrapWidth(150).setAlign('left')
    const h = Math.ceil(body.height) + 22
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, 164, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, 164, h, 3)
    g.fillStyle(palette.accentBlue).fillRect(2, 2, 3, h - 4)
    const head = addText(this, 8, 8, texts.battle.tip, 'label', 5).setOrigin(0, 0.5)
    this.tipCard = this.add.container(8, Math.max(72, 170 - h), [g, head, body]).setDepth(20)
    this.startedAt = gameNow()
  }

  private end(won: boolean) {
    this.phase = 'end'
    this.tipCard?.destroy()
    this.pad.setVisible(false)
    this.tipKey.setVisible(false)
    this.timeBar.clear()
    this.taskBox.setVisible(false)
    this.taskText.setVisible(false)

    const reward = finishBattle(
      getSave(),
      { petId: this.petSave.id, foe: this.foeId, won, answerXp: this.state.xp },
      deviceId(),
      Date.now(),
    )
    updateSave(() => reward.save)
    this.hud.setCoins(coinBalance(getSave()))

    const lines: string[] = []
    if (won) {
      sfx.fanfare()
      this.fadeOut(this.foe)
      this.pet.hop()
      lines.push(
        texts.battle.win,
        `${texts.battle.coins(reward.coins)} · ${texts.battle.xp(reward.xp)}`,
      )
    } else {
      this.pet.setSleeping(true)
      this.floatZ()
      lines.push(texts.battle.nap(this.petSave.name))
      if (reward.xp > 0) lines.push(texts.battle.xp(reward.xp))
    }
    if (reward.levelAfter > reward.levelBefore) {
      lines.push(texts.battle.levelUp(this.petSave.name, reward.levelAfter))
    }
    if (reward.newPet) lines.push(texts.battle.wantsToJoin(SPECIES[this.foeId].name))

    const card = new SpeechCard(this, 14, 180, 152, 96, lines.join('\n'))
    card.setText(lines.join('\n'), lines.length > 3 ? 13 : 15)
    card.setDepth(30)
    new Key(this, 50, 302, 80, 30, texts.battle.next, () => this.leave(reward.newPet), {
      fill: 'gold',
      label: true,
      fontSize: 7,
    }).setDepth(30)
  }

  private leave(newPet?: PetSave) {
    // A beaten creature runs off for a while, so she isn't pulled into the same battle
    const back = {
      from: 'battle',
      ...(this.state?.outcome === 'win' ? { beaten: this.foeId } : {}),
    }
    if (newPet) {
      this.goTo('NameEntry', {
        mode: 'pet',
        species: newPet.species,
        petId: newPet.id,
        returnTo: 'Wild',
        returnData: back,
      })
    } else {
      this.goTo('Wild', back)
    }
  }

  /** Battles are optional: leaving early costs nothing, right answers keep their XP. */
  private runAway() {
    if (this.phase === 'end') return this.leave()
    this.phase = 'end'
    if (this.state.xp > 0) updateSave((s) => addPetXp(s, this.petSave.id, this.state.xp))
    this.goTo('Wild', { from: 'battle' })
  }

  // ---------- Rendering ----------

  private infoBox(
    box: { x: number; y: number; w: number; h: number },
    name: string,
    level: number,
    maxHp: number,
    trait?: string | null,
  ): InfoBox {
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, box.w, box.h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, box.w, box.h, 3)
    const nameText = addText(this, 6, 7, name, 'label', 5).setOrigin(0, 0.5)
    const levelText = addText(this, box.w - 6, 7, texts.wild.level(level), 'title', 12).setOrigin(
      1,
      0.5,
    )
    const hp = addText(this, 6, 17, 'HP', 'label', 4).setOrigin(0, 0.5)
    const bar = this.add.graphics()
    const parts: Phaser.GameObjects.GameObject[] = [g, nameText, levelText, hp, bar]
    if (trait) parts.push(addText(this, 6, 28, `★ ${trait}`, 'label', 4).setOrigin(0, 0.5))
    const container = this.add.container(box.x, box.y, parts).setDepth(10)
    const info = { container, bar, shownHp: maxHp, maxHp }
    this.drawHp(info, maxHp, box.w)
    return info
  }

  /** wood-dark frame, fill mint → gold (under 50 %) → rose (under 20 %). Never red. */
  private drawHp(info: InfoBox, hp: number, boxW = FOE_BOX.w) {
    const w = boxW - 26
    const ratio = hp / info.maxHp
    const fill = ratio < 0.2 ? palette.rose : ratio < 0.5 ? palette.gold : palette.mint
    info.bar.clear()
    info.bar.fillStyle(palette.woodDark).fillRect(18, 14, w + 2, 6)
    info.bar.fillStyle(palette.cream).fillRect(19, 15, w, 4)
    info.bar.fillStyle(fill).fillRect(19, 15, Math.round(w * ratio), 4)
  }

  /** HP drains smoothly in whole pixels. */
  private drainHp(info: InfoBox, to: number) {
    const from = info.shownHp
    info.shownHp = to
    this.tweens.addCounter({
      from,
      to,
      duration: 350,
      onUpdate: (t) => this.drawHp(info, t.getValue() ?? to),
    })
  }

  private drawTaskBox(showAnswer: boolean) {
    const g = this.taskBox.clear()
    g.fillStyle(showAnswer ? palette.accentBlue : palette.cream)
    g.fillRoundedRect(TASK.x, TASK.y, TASK.w, TASK.h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(TASK.x, TASK.y, TASK.w, TASK.h, 3)
  }

  private renderTask() {
    const shown = this.typed || '_'
    this.taskText.setText(this.task.question.replace('?', shown))
  }

  /** Time bar: gold fill shrinking from right to left; the last 25 % gently pulse the outline. */
  private drawTimeBar(share: number, now: number) {
    const g = this.timeBar.clear()
    const pulse = share < 0.25 && Math.floor(now / 500) % 2 === 0
    g.fillStyle(pulse ? palette.goldDark : palette.woodDark).fillRect(BAR.x, BAR.y, BAR.w, BAR.h)
    g.fillStyle(palette.cream).fillRect(BAR.x + 1, BAR.y + 1, BAR.w - 2, BAR.h - 2)
    g.fillStyle(palette.gold).fillRect(
      BAR.x + 1,
      BAR.y + 1,
      Math.round((BAR.w - 2) * share),
      BAR.h - 2,
    )
  }

  /** Attacker hops forward 4 px, a little effect flies across, the target wiggles 2 px (≤ 400 ms). */
  private attack(attacker: Pet, target: Pet, dir: 1 | -1, effect: 'star' | 'bubble') {
    const x0 = attacker.x
    ;[4, 4, 2, 0].forEach((dx, i) =>
      this.time.delayedCall(i * 60, () => attacker.setX(x0 + dx * dir)),
    )
    const texture = effect === 'star' ? icon(this, 'star') : icon(this, 'heart')
    for (let i = 0; i < 3; i++) {
      const p = this.add.image(attacker.x, attacker.y - 18, texture, 'icon').setDepth(15)
      if (effect === 'bubble') p.setTint(palette.accentBlue)
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 220,
        delay: i * 50,
        onUpdate: (t) => {
          const k = t.getValue() ?? 1
          p.setPosition(
            Math.round(attacker.x + (target.x - attacker.x) * k),
            Math.round(attacker.y - 18 + (target.y - attacker.y) * k - Math.sin(k * Math.PI) * 10),
          )
        },
        onComplete: () => p.destroy(),
      })
    }
    const tx = target.x
    ;[-2, 2, -2, 2, 0].forEach((dx, i) =>
      this.time.delayedCall(240 + i * 30, () => target.setX(tx + dx)),
    )
  }

  /** "Volltreffer!": a bigger pixel star burst in gold and paper-white. */
  private starBurst(x: number, y: number) {
    const dirs = [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ]
    dirs.forEach(([dx, dy], i) => {
      const dot = this.add
        .rectangle(x, y, 2, 2, i % 2 ? palette.paperWhite : palette.gold)
        .setDepth(16)
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 350,
        onUpdate: (t) => {
          const k = t.getValue() ?? 1
          dot.setPosition(Math.round(x + dx * 16 * k), Math.round(y + dy * 16 * k))
        },
        onComplete: () => dot.destroy(),
      })
    })
  }

  /** The defeated creature fades in three steps (no flashing). */
  private fadeOut(target: Pet) {
    ;[0.66, 0.33, 0].forEach((a, i) =>
      this.time.delayedCall(200 + i * 120, () => target.setAlpha(a)),
    )
  }

  /** A small "z" floats up from the sleeping pet. */
  private floatZ() {
    const z = addText(this, this.pet.x + 14, this.pet.y - 34, 'z', 'title', 14, 'cream').setDepth(
      15,
    )
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1600,
      repeat: -1,
      onUpdate: (t) => {
        const k = t.getValue() ?? 0
        z.setPosition(Math.round(this.pet.x + 14 + k * 6), Math.round(this.pet.y - 34 - k * 14))
        z.setAlpha(1 - k)
      },
    })
  }

  update(_time: number, delta: number) {
    this.foe?.tick(delta)
    this.pet?.tick(delta)
    if (this.phase === 'task') {
      const now = gameNow()
      const share = 1 - (now - this.startedAt) / this.limitMs
      this.drawTimeBar(Math.max(0, share), now)
      if (share <= 0) this.onWrong(true)
    }
  }

  /** For end-to-end tests (window.__debug.battle()). */
  debugState() {
    return {
      phase: this.phase,
      answer: this.task?.answer.value,
      limitMs: this.limitMs,
      petHp: this.state?.pet.hp,
      foeHp: this.state?.foe.hp,
      outcome: this.state?.outcome,
    }
  }
}
