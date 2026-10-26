// Bibliothek (GAME_DESIGN §3a, §4, §7): the Sammelalbum and the daily calendar.
// Album: every item and kind of pet; what she owns is in colour, the rest a dark silhouette
// of just that piece. A full category gives a bonus star (claimed when she opens the album).
// Kalender: this month with a sticker on every day she finished a round, and this week's
// way to the box (5 stickers).
import Phaser from 'phaser'
import { accessories } from '../art/character/accessory'
import { DEFAULT_LOOK, type CharacterLook } from '../art/character/look'
import { hairstyles } from '../art/character/hair'
import { outfits } from '../art/character/outfit'
import { ensureCharacterTextures, textureKeys } from '../art/character/textures'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import type { PixelMap } from '../art/pixels'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import type { Item } from '../data/items'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { palette } from '../palette'
import {
  ALBUM_CATEGORIES,
  albumCount,
  albumEntries,
  claimAlbumStars,
  type AlbumCategory,
  type AlbumEntry,
} from '../state/album'
import { STICKERS_FOR_BOX, boxPrize, dayKey, stickersThisWeek, weekDays } from '../state/calendar'
import { tryOn } from '../state/shop'
import { deviceId, getSave, updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Tabs } from '../ui/Tabs'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

type View = 'album' | 'kalender'

const CELL = { x: 10, y: 96, w: 38, h: 44, gap: 3 }
const MONTH = { x: 8, y: 62, w: 164, cell: 22 }

export class LibraryScene extends PixelScene {
  private view: View = 'album'
  private category: AlbumCategory = 'kleider'
  private content: Phaser.GameObjects.GameObject[] = []
  private categoryTabs?: Tabs<AlbumCategory>
  private caption!: Caption

  constructor() {
    super('Library')
  }

  init() {
    this.view = 'album'
    this.category = 'kleider'
    this.content = []
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: 330 })).setOrigin(0)
    // A full album category gives its bonus star once (before the top bar shows the stars)
    const claimed = claimAlbumStars(getSave(), deviceId())
    if (claimed.categories.length) updateSave(() => claimed.save)
    new Hud(this, { onHome: () => this.goTo('Village', { from: 'bibliothek' }) })
    this.caption = new Caption(this)
    new Tabs<View>(
      this,
      40,
      [
        { id: 'album', label: texts.library.album },
        { id: 'kalender', label: texts.library.calendar },
      ],
      (id) => {
        this.view = id
        this.render()
      },
    ).select(this.view)

    if (claimed.categories.length) {
      sfx.fanfare()
      this.caption.show(texts.library.categoryDone(claimed.categories.length), 2500)
    }
    this.render()
  }

  private render() {
    for (const o of this.content) o.destroy()
    this.content = []
    this.categoryTabs?.destroy()
    this.categoryTabs = undefined
    if (this.view === 'album') this.renderAlbum()
    else this.renderCalendar()
  }

  // ---------- Album ----------

  private renderAlbum() {
    this.categoryTabs = new Tabs<AlbumCategory>(
      this,
      60,
      ALBUM_CATEGORIES.map((id) => ({ id, label: texts.library.categories[id] })),
      (id) => {
        this.category = id
        this.render()
      },
    ).select(this.category)

    const save = getSave()
    const { collected, total } = albumCount(save, this.category)
    const done = save.album.claimed.includes(this.category)
    this.content.push(
      addText(
        this,
        GAME_WIDTH / 2,
        87,
        texts.library.count(collected, total),
        'title',
        13,
        'cream',
      ),
    )
    if (done) this.content.push(this.add.image(GAME_WIDTH / 2 + 46, 87, icon(this, 'star'), 'icon'))

    const look = save.character?.look ?? DEFAULT_LOOK
    albumEntries(save, this.category).forEach((entry, i) => {
      const x = CELL.x + (i % 4) * (CELL.w + CELL.gap)
      const y = CELL.y + Math.floor(i / 4) * (CELL.h + CELL.gap)
      this.content.push(this.cell(entry, x, y, look))
    })
  }

  private cell(entry: AlbumEntry, x: number, y: number, look: CharacterLook) {
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, CELL.w, CELL.h, 3)
    g.lineStyle(1, palette.ink).strokeRoundedRect(0, 0, CELL.w, CELL.h, 3)
    const preview = this.preview(entry, look)
    const parts: Phaser.GameObjects.GameObject[] = [g, ...preview]
    if (entry.collected) {
      const name = entry.kind === 'pet' ? entry.name : entry.item.name
      parts.push(addText(this, CELL.w / 2, CELL.h - 6, name, 'label', 3.5))
    } else {
      // A silhouette: the shape in ink, a little see-through, and "?" instead of the name
      for (const p of preview) silhouette(p)
      parts.push(addText(this, CELL.w / 2, CELL.h - 6, '?', 'title', 10))
    }
    const container = this.add.container(x, y, parts)
    container.setSize(CELL.w, CELL.h)
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(CELL.w / 2, CELL.h / 2, CELL.w, CELL.h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    container.on('pointerdown', () => {
      sfx.tick()
      const name = entry.kind === 'pet' ? entry.name : entry.item.name
      this.caption.show(
        entry.collected ? texts.library.have(name) : texts.library.missing(name),
        1800,
      )
    })
    return container
  }

  /** Just the piece itself: the outfit, the hairstyle or the accessory layer, a pet, or an icon. */
  private preview(entry: AlbumEntry, look: CharacterLook): Phaser.GameObjects.GameObject[] {
    const cx = CELL.w / 2
    const cy = (CELL.h - 10) / 2 + 1
    if (entry.kind === 'pet') return [new Pet(this, cx, cy + 8, entry.species).setScale(2)]
    const item = entry.item
    const layer = wornLayer(item)
    if (!layer) {
      return [
        this.add
          .image(cx, cy, icon(this, item.id === 'ball' ? 'ball' : 'star'), 'icon')
          .setScale(2),
      ]
    }
    const worn = tryOn(look, item)
    ensureCharacterTextures(this, worn)
    const key = textureKeys(worn)[layer]
    const [top, bottom] = visibleRows(worn, layer)
    const image = this.add.image(cx, cy, key!, 'down-0').setScale(2)
    image.setOrigin(0.5, (top + bottom + 1) / 2 / 22)
    return [image]
  }

  // ---------- Kalender ----------

  private renderCalendar() {
    const save = getSave()
    const today = new Date()
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const offset = (first.getDay() + 6) % 7 // Monday first
    const rows = Math.ceil((offset + daysInMonth) / 7)
    const h = 30 + rows * MONTH.cell + 4
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(MONTH.x, MONTH.y, MONTH.w, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(MONTH.x, MONTH.y, MONTH.w, h, 3)
    this.content.push(g)
    const month = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    this.content.push(addText(this, GAME_WIDTH / 2, MONTH.y + 9, month, 'title', 14))
    const x0 = MONTH.x + (MONTH.w - 7 * MONTH.cell) / 2
    texts.library.weekdays.forEach((d, i) => {
      this.content.push(
        addText(this, x0 + i * MONTH.cell + MONTH.cell / 2, MONTH.y + 22, d, 'label', 4),
      )
    })
    const todayKey = dayKey(today)
    for (let day = 1; day <= daysInMonth; day++) {
      const pos = offset + day - 1
      const cx = x0 + (pos % 7) * MONTH.cell + MONTH.cell / 2
      const cy = MONTH.y + 30 + Math.floor(pos / 7) * MONTH.cell + MONTH.cell / 2
      const key = dayKey(new Date(today.getFullYear(), today.getMonth(), day))
      if (key === todayKey) {
        const ring = this.add.graphics()
        ring.lineStyle(1, palette.gold).strokeRect(cx - 10.5, cy - 10.5, 21, 21)
        this.content.push(ring)
      }
      if ((save.calendar.days[key] ?? 0) > 0) {
        this.content.push(this.add.image(cx, cy - 2, icon(this, 'star'), 'icon').setScale(2))
        this.content.push(addText(this, cx + 6, cy + 6, String(day), 'title', 8))
      } else {
        this.content.push(addText(this, cx, cy, String(day), 'title', 11))
      }
    }

    // This week: 5 sticker slots, then the box
    const y = MONTH.y + h + 12
    const stickers = stickersThisWeek(save, today)
    const opened = save.calendar.boxes.includes(weekDays(today)[0])
    this.content.push(addText(this, GAME_WIDTH / 2, y, texts.library.thisWeek, 'label', 5, 'cream'))
    for (let i = 0; i < STICKERS_FOR_BOX; i++) {
      const sx = GAME_WIDTH / 2 - 52 + i * 22
      const slot = this.add.graphics()
      slot.fillStyle(palette.cream).fillRoundedRect(sx - 9, y + 8, 18, 18, 3)
      slot.lineStyle(1, palette.ink).strokeRoundedRect(sx - 9, y + 8, 18, 18, 3)
      this.content.push(slot)
      if (i < stickers) this.content.push(this.add.image(sx, y + 17, icon(this, 'star'), 'icon'))
    }
    this.content.push(
      this.add
        .image(GAME_WIDTH / 2 + 62, y + 17, icon(this, opened ? 'boxOpen' : 'box'), 'icon')
        .setScale(2),
    )
    const prize = boxPrize(save)
    const line = opened
      ? texts.library.boxOpened
      : texts.library.boxSoon(Math.max(0, STICKERS_FOR_BOX - stickers), prize?.name ?? null)
    const note = addText(this, GAME_WIDTH / 2, y + 42, line, 'title', 12, 'cream')
    note.setWordWrapWidth(GAME_WIDTH - 24).setAlign('center')
    this.content.push(note)
  }
}

/** Which character layer an item changes (null for toys). */
function wornLayer(item: Item): 'outfit' | 'hair' | 'accessory' | null {
  if (item.wear?.outfit) return 'outfit'
  if (item.wear?.hair) return 'hair'
  if (item.wear?.accessory) return 'accessory'
  return null
}

/** First and last row with pixels of a layer, seen from the front (legs included). */
function visibleRows(
  look: CharacterLook,
  layer: 'outfit' | 'hair' | 'accessory',
): [number, number] {
  const map: PixelMap =
    layer === 'outfit'
      ? outfits[look.outfit].maps.down
      : layer === 'hair'
        ? hairstyles[look.hair].down
        : accessories[look.accessory!].down
  const rows = map.map((row, i) => (/[^.]/.test(row) ? i : -1)).filter((i) => i >= 0)
  const bottom = layer === 'outfit' && outfits[look.outfit].longLegs ? 21 : Math.max(...rows)
  return [Math.min(...rows), bottom]
}

/** Dark, see-through shape (STYLE_GUIDE: a goal to collect, not a locked door). */
function silhouette(o: Phaser.GameObjects.GameObject) {
  if (o instanceof Phaser.GameObjects.Container) {
    for (const child of o.list) silhouette(child)
  } else if (o instanceof Phaser.GameObjects.Image) {
    o.setTintFill(palette.ink).setAlpha(0.45)
  }
}
