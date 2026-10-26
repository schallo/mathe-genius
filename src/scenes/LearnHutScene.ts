// Learning huts (GAME_DESIGN §3a, §9 "Lernhütte"): Rechenwerkstatt, Zahlenturm and
// Marktstand. She picks a topic of the hut and a level; the round itself runs in the show
// flow (ShowScene) – 10 calm tasks without a timer, hints, worked solutions, same coins.
// The last pick per hut is remembered in the save.
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { currentLevels } from '../math/adaptive'
import { TOPICS, topic as topicOf } from '../math/topics'
import { LEVELS, type Level, type TopicId } from '../math/types'
import { icon } from '../art/icons'
import { palette } from '../palette'
import { activePet } from '../state/save'
import { getSave, updateSave } from '../state/store'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'
import { SHOW_FLOOR_Y } from './ShowScene'

export type LearnHut = keyof typeof texts.learn.title

const CARD = { x: 8, y: 38, w: 128 }
const TOPIC_KEY = { x: 6, y: 24, w: 116, h: 20, gap: 3 }
const LEVEL_Y = 214

export class LearnHutScene extends PixelScene {
  private hut: LearnHut = 'werkstatt'
  private topic!: TopicId
  private level: Level = 1
  private topicKeys: Key[] = []
  private levelKeys: Key[] = []
  private levelTitle!: Phaser.GameObjects.Text
  /** Small star over the key of her current level */
  private levelStar!: Phaser.GameObjects.Image
  private hero!: Character
  private pet?: Pet

  constructor() {
    super('LearnHut')
  }

  init(data: { hut?: LearnHut }) {
    this.hut = data.hut ?? 'werkstatt'
    this.topicKeys = []
    this.levelKeys = []
    const topics = this.topics()
    const saved = getSave().learn[this.hut]
    const known = saved && topics.some((t) => t.id === saved.topic)
    this.topic = known ? saved.topic : topics[0].id
    this.level = known ? saved.level : currentLevels(getSave().mastery)[this.topic]
  }

  private topics() {
    return TOPICS.filter((t) => t.hut === this.hut)
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: SHOW_FLOOR_Y })).setOrigin(0)
    new Hud(this, { onHome: () => this.goTo('Village', { from: this.hut }) })

    const save = getSave()
    this.hero = new Character(this, 150, SHOW_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 170, SHOW_FLOOR_Y, pet.species)

    // Card with the hut's name and one key per topic
    const topics = this.topics()
    const h = TOPIC_KEY.y + topics.length * (TOPIC_KEY.h + TOPIC_KEY.gap) + 3
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(CARD.x, CARD.y, CARD.w, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(CARD.x, CARD.y, CARD.w, h, 3)
    addText(this, CARD.x + CARD.w / 2, CARD.y + 12, texts.learn.title[this.hut], 'title', 16)
    topics.forEach((t, i) => {
      const key = new Key(
        this,
        CARD.x + TOPIC_KEY.x,
        CARD.y + TOPIC_KEY.y + i * (TOPIC_KEY.h + TOPIC_KEY.gap),
        TOPIC_KEY.w,
        TOPIC_KEY.h,
        t.short,
        () => this.pick(t.id, this.level),
        { fontSize: 13 },
      )
      this.topicKeys.push(key)
    })

    // Levels on the floor, with the level's title below
    addText(this, GAME_WIDTH / 2, LEVEL_Y - 8, texts.learn.level, 'label', 6, 'cream')
    LEVELS.forEach((level, i) => {
      const key = new Key(
        this,
        12 + i * 32,
        LEVEL_Y,
        28,
        28,
        String(level),
        () => this.pick(this.topic, level),
        { fontSize: 18 },
      )
      this.levelKeys.push(key)
    })
    this.levelStar = this.add.image(0, LEVEL_Y, icon(this, 'star'), 'icon').setDepth(5)
    const card = this.add.graphics()
    card.fillStyle(palette.cream).fillRoundedRect(8, 248, GAME_WIDTH - 16, 20, 3)
    card.lineStyle(1, palette.ink).strokeRoundedRect(8, 248, GAME_WIDTH - 16, 20, 3)
    this.levelTitle = addText(this, GAME_WIDTH / 2, 257, '', 'title', 13)

    new Key(this, 30, 280, 120, 36, texts.learn.start, () => this.start(), {
      fill: 'gold',
      label: true,
      fontSize: 8,
    })
    this.refresh()
  }

  private pick(topic: TopicId, level: Level) {
    sfx.tick()
    this.topic = topic
    this.level = level
    this.refresh()
  }

  private refresh() {
    const topics = this.topics()
    this.topicKeys.forEach((k, i) => k.setFill(topics[i].id === this.topic ? 'gold' : 'cream'))
    this.levelKeys.forEach((k, i) => k.setFill(LEVELS[i] === this.level ? 'gold' : 'cream'))
    this.levelTitle.setText(topicOf(this.topic).levels[this.level].title)
    // Her level in this topic (adaptive, see math/adaptive.ts)
    const mine = currentLevels(getSave().mastery)[this.topic]
    this.levelStar.setX(12 + (mine - 1) * 32 + 24)
  }

  private start() {
    sfx.tick()
    const pick = { topic: this.topic, level: this.level }
    updateSave((s) => ({ ...s, learn: { ...s.learn, [this.hut]: pick } }))
    this.goTo('Show', { round: { kind: 'hut', hut: this.hut, ...pick } })
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
