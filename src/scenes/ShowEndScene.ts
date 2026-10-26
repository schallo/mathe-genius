// Show end (GAME_DESIGN §3, §9): curtain closed, summary, coins counted up one by one.
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { REWARD, summarizeShow, type TaskResult } from '../state/economy'
import { activePet, coinBalance } from '../state/save'
import { wakeAll } from '../battle/progress'
import { addCoins, getSave, updateSave } from '../state/store'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { SpeechCard } from '../ui/SpeechCard'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'
import { SHOW_FLOOR_Y } from './ShowScene'
import { coinFactor, roundHut, theaterRound, type Round } from '../math/show'

export class ShowEndScene extends PixelScene {
  private results: TaskResult[] = []
  private round: Round = theaterRound()
  private hero!: Character
  private pet?: Pet

  constructor() {
    super('ShowEnd')
  }

  init(data: { results: TaskResult[]; round?: Round }) {
    this.results = data.results ?? []
    this.round = data.round ?? theaterRound()
  }

  create() {
    this.setupCamera()
    this.add
      .image(0, 0, ensureStageTexture(this, { floorY: SHOW_FLOOR_Y, open: false }))
      .setOrigin(0)

    // Per-task coins were paid during the show; the show bonus is paid now
    const factor = coinFactor(this.round)
    addCoins(REWARD.showBonus * factor)
    // A finished show wakes up pets that were napping after a battle
    updateSave(wakeAll)
    const hud = new Hud(this)
    const summary = summarizeShow(this.results, factor)

    const save = getSave()
    this.hero = new Character(this, 112, SHOW_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setScale(2).jump()
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 146, SHOW_FLOOR_Y, pet.species).setScale(2)

    const headline =
      summary.solved >= summary.total / 2
        ? texts.show.endSolved(summary.solved, summary.total)
        : texts.show.endEffort
    const lines =
      factor > 1
        ? `${headline}
${texts.show.doubleCoins}`
        : headline
    // A Theater card has one more line ("Doppelte Münzen!")
    const cardH = factor > 1 ? 92 : 70
    const card = new SpeechCard(this, 14, 34, 152, cardH, lines)
    card.setTextY(factor > 1 ? 32 : 24)
    const coinsText = addText(
      this,
      GAME_WIDTH / 2,
      34 + cardH - 12,
      texts.show.endCoins(0),
      'title',
      20,
    )
    sfx.fanfare()

    // Count up one by one, with a soft coin sound
    let shown = 0
    this.time.addEvent({
      delay: 60,
      repeat: summary.coins - 1,
      startAt: -400,
      callback: () => {
        shown++
        coinsText.setText(texts.show.endCoins(shown))
        if (shown % 2 === 0) sfx.coin()
      },
    })
    hud.setCoins(coinBalance(getSave()))

    const round = this.round
    new Key(this, 20, 260, 66, 30, texts.show.again, () => this.goTo('Show', { round }), {
      label: true,
      fontSize: 8,
    })
    new Key(
      this,
      94,
      260,
      66,
      30,
      // A learning-hut round goes back to the topic picker, a show into the village
      round.kind === 'hut' ? texts.learn.back : texts.show.toVillage,
      () =>
        round.kind === 'hut'
          ? this.goTo('LearnHut', { hut: round.hut })
          : this.goTo('Village', { from: roundHut(round) }),
      {
        fill: 'gold',
        label: true,
        fontSize: 8,
      },
    )
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
