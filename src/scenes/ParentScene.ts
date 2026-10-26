// Parent area (GAME_DESIGN §8): grown-up question, progress overview, settings (rounds per
// day, "auswendig" time, her level per topic), bonus coins, cloud sync, export/import.
// Opened from the lock on the title screen or the mailbox in the village.
import { ensureStageTexture } from '../art/stage'
import { currentLevels } from '../math/adaptive'
import { factText, knownCount, missedFacts, slowestFacts, type DojoOp } from '../math/einmaleins'
import { zufall } from '../math/random'
import { TOPICS } from '../math/topics'
import { LEVELS, type Level } from '../math/types'
import { dayKey } from '../state/calendar'
import { setTopicLevel } from '../state/learning'
import {
  coinBalance,
  earnCoins,
  mergeSaves,
  parseSave,
  resetProgress,
  starBalance,
} from '../state/save'
import { deviceId, getSave, replaceSave, updateSave } from '../state/store'
import { onSyncStatus, signIn, signOut, syncNow, syncStatus, type SyncStatus } from '../state/sync'
import { HtmlPanel, esc } from '../ui/HtmlPanel'
import { PixelScene } from './PixelScene'

export class ParentScene extends PixelScene {
  private panel!: HtmlPanel
  private message = ''
  /** Where "Zurück" leads: the title screen or the village (mailbox) */
  private from: 'title' | 'village' = 'title'

  constructor() {
    super('Parent')
  }

  init(data: { from?: 'title' | 'village' }) {
    this.from = data.from ?? 'title'
  }

  private back() {
    if (this.from === 'village') this.goTo('Village', { from: 'mailbox' })
    else this.goTo('Title')
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { open: false })).setOrigin(0)
    this.panel = new HtmlPanel(this)
    this.message = ''
    this.showGate()
  }

  /** A question only grown-ups can answer quickly (e.g. 17 · 23). */
  private showGate() {
    const a = zufall(Math.random, 12, 29)
    const b = zufall(Math.random, 12, 29)
    this.panel
      .render(
        `<h1>Eltern-Bereich</h1>
        <div class="zh-card">
          <p>Frage für Erwachsene:</p>
          <h2>Wie viel ist ${a} · ${b}?</h2>
          <form data-action="noop">
            <input name="answer" inputmode="numeric" autocomplete="off" aria-label="Antwort" />
            <button class="zh-gold" data-action="check">OK</button>
            <button data-action="back">Zurück</button>
          </form>
          <p class="zh-error">${esc(this.message)}</p>
        </div>`,
      )
      .on('check', () => {
        if (Number(this.panel.field('answer').value) === a * b) {
          this.message = ''
          this.showMenu()
        } else {
          this.message = 'Das stimmt leider nicht.'
          this.showGate()
        }
      })
      .on('back', () => this.back())
    this.panel.field('answer').focus()
  }

  private showMenu() {
    const save = getSave()
    const unsubscribe = onSyncStatus(() => this.showMenu())
    this.events.once('shutdown', unsubscribe)
    this.events.once('menu-rendered', unsubscribe)
    this.events.emit('menu-rendered')

    this.panel
      .render(
        `<h1>Eltern-Bereich</h1>
        ${this.message ? `<div class="zh-card"><p>${esc(this.message)}</p></div>` : ''}
        ${this.progressSection()}
        ${this.settingsSection()}
        <div class="zh-card">
          <h2>Bonus-Münzen</h2>
          <p>Zum Beispiel für Hausaufgaben außerhalb des Spiels.</p>
          <button data-action="bonus" data-coins="10">+10</button>
          <button data-action="bonus" data-coins="25">+25</button>
          <button data-action="bonus" data-coins="50">+50</button>
        </div>
        <div class="zh-card">
          <h2>Cloud-Sync</h2>
          ${this.syncSection(syncStatus())}
        </div>
        <div class="zh-card">
          <h2>Spielstand</h2>
          <p>${esc(save.character?.name ?? '–')} · ${coinBalance(save)} Münzen · ${save.pets.length} Tier(e)</p>
          <button data-action="export">Exportieren</button>
          <button data-action="import">Importieren</button>
          <input type="file" name="file" accept="application/json,.json" hidden />
          <p class="zh-note">Import fügt den Spielstand zum vorhandenen hinzu – es geht nichts verloren.</p>
        </div>
        <div class="zh-card">
          <h2>Neu anfangen</h2>
          <p>Setzt den ganzen Spielstand zurück – auch auf allen anderen Geräten mit Cloud-Sync.</p>
          <button data-action="reset">Spielstand zurücksetzen …</button>
        </div>
        <button class="zh-gold" data-action="back">Zurück zum Spiel</button>`,
      )
      .on('reset', () => this.showReset())
      .on('signin', async () => {
        try {
          await signIn(this.panel.field('email').value, this.panel.field('password').value)
          this.message = ''
        } catch {
          // syncStatus carries the message
        }
      })
      .on('signout', () => void signOut())
      .on('sync', () => void syncNow())
      .on('export', () => this.exportSave())
      .on('import', () => this.panel.field('file').click())
      .on('bonus', (el) => this.giveBonus(Number(el.dataset.coins)))
      .on('save-settings', () => this.saveSettings())
      .on('back', () => this.back())
    this.panel.field('file').addEventListener('change', (e) => this.importSave(e))
  }

  /** Levels and accuracy per topic, the Einmaleins grids, open mistakes, days played. */
  private progressSection(): string {
    const save = getSave()
    const levels = currentLevels(save.mastery)
    const rows = TOPICS.map((t) => {
      const p = save.mastery[t.id]
      const rate = p && p.solved ? `${Math.round((100 * p.firstTry) / p.solved)} %` : '–'
      return `<tr><td>${esc(t.title)}</td><td>${levels[t.id]}</td><td>${p?.solved ?? 0}</td><td>${rate}</td></tr>`
    }).join('')
    const facts = save.dojo.facts
    const list = (
      items: { fact: Parameters<typeof factText>[0]; value: number }[],
      unit: string,
    ) =>
      items.length
        ? items
            .map(
              (r) =>
                `${esc(factText(r.fact))} (${unit === 's' ? (r.value / 1000).toFixed(1).replace('.', ',') + ' s' : r.value + '×'})`,
            )
            .join(', ')
        : '–'
    const dojo = (op: DojoOp, name: string) =>
      `<p><b>${name}:</b> ${knownCount(facts, op)} von 100 auswendig</p>
       <p class="zh-note">Am langsamsten: ${list(slowestFacts(facts, op), 's')}<br />
       Am häufigsten falsch: ${list(missedFacts(facts, op), 'x')}</p>`
    const mistakes = save.review.items
      .map((i) => esc(i.task.question.replace(' = ?', '')))
      .join(', ')
    const month = dayKey(new Date()).slice(0, 7)
    const played = Object.keys(save.calendar.days).filter((d) => d.startsWith(month)).length
    return `<div class="zh-card">
      <h2>Fortschritt</h2>
      <p>${esc(save.character?.name ?? '–')} · ${coinBalance(save)} Münzen · ${starBalance(save)} Sterne · ${played} Tage gespielt diesen Monat</p>
      <table class="zh-table"><tr><th>Thema</th><th>Stufe</th><th>Aufgaben</th><th>Sofort richtig</th></tr>${rows}</table>
      ${dojo('mul', 'Mal-Dojo')}
      ${dojo('div', 'Teil-Dojo')}
      <p><b>Fehler, die wiederkommen:</b> ${mistakes || '–'}</p>
    </div>`
  }

  private settingsSection(): string {
    const save = getSave()
    const levels = currentLevels(save.mastery)
    const options = (values: number[], selected: number, label = (v: number) => String(v)) =>
      values
        .map((v) => `<option value="${v}"${v === selected ? ' selected' : ''}>${label(v)}</option>`)
        .join('')
    const topicRows = TOPICS.map(
      (t) =>
        `<label>${esc(t.title)} <select name="level-${t.id}">${options(LEVELS, levels[t.id])}</select></label>`,
    ).join('')
    return `<div class="zh-card">
      <h2>Einstellungen</h2>
      <label>Runden pro Tag bis zur Pause-Meldung
        <select name="roundsPerDay">${options([1, 2, 3, 4, 5], save.settings.roundsPerDay)}</select></label>
      <label>Einmaleins „auswendig“ unter
        <select name="knownMs">${options([2000, 3000, 4000, 5000], save.settings.knownMs, (v) => `${v / 1000} s`)}</select></label>
      <p class="zh-note">Stufe pro Thema (passt sich danach beim Spielen weiter an):</p>
      ${topicRows}
      <button class="zh-gold" data-action="save-settings">Speichern</button>
    </div>`
  }

  private saveSettings() {
    const value = (name: string) => Number(this.panel.field(name).value)
    updateSave((s) => {
      let next = {
        ...s,
        settings: { ...s.settings, roundsPerDay: value('roundsPerDay'), knownMs: value('knownMs') },
      }
      const levels = currentLevels(next.mastery)
      for (const t of TOPICS) {
        const level = value(`level-${t.id}`) as Level
        if (LEVELS.includes(level) && level !== levels[t.id])
          next = setTopicLevel(next, t.id, level)
      }
      return next
    })
    this.message = 'Einstellungen gespeichert.'
    this.showMenu()
  }

  private giveBonus(coins: number) {
    if (!(coins > 0)) return
    updateSave((s) => earnCoins(s, coins, deviceId()))
    this.message = `+${coins} Münzen für ${getSave().character?.name ?? 'dein Kind'}!`
    this.showMenu()
  }

  /**
   * Second step before a reset: what gets deleted, a backup first, and the character's
   * name typed in exactly – so nothing is reset by accident.
   */
  private showReset(error = '') {
    const save = getSave()
    const name = save.character?.name ?? 'NEU'
    this.panel
      .render(
        `<h1>Eltern-Bereich</h1>
        <div class="zh-card">
          <h2>Wirklich neu anfangen?</h2>
          <p>Das wird gelöscht: Figur und Name, ${coinBalance(save)} Münzen, ${starBalance(save)} Sterne,
            alle gekauften Sachen, ${save.pets.length} Tier(e), Einmaleins-Fortschritt, Stufen, Kalender und Album.</p>
          <p>Bleibt: deine Einstellungen und die Cloud-Anmeldung.</p>
          <p class="zh-note">Tipp: Exportiere vorher den Spielstand, dann kannst du ihn wieder importieren.</p>
          <button data-action="export">Erst exportieren</button>
          <form data-action="noop">
            <label>Zum Bestätigen den Namen eintippen: <b>${esc(name)}</b>
              <input name="confirm" autocomplete="off" aria-label="Name zur Bestätigung" /></label>
            <button class="zh-danger" data-action="reset-now">Endgültig zurücksetzen</button>
            <button data-action="cancel">Abbrechen</button>
          </form>
          <p class="zh-error">${esc(error)}</p>
        </div>`,
      )
      .on('export', () => this.exportSave())
      .on('cancel', () => {
        this.message = ''
        this.showMenu()
      })
      .on('reset-now', () => {
        if (this.panel.field('confirm').value.trim() !== name) {
          this.showReset('Der Name stimmt nicht – es wurde nichts gelöscht.')
          return
        }
        replaceSave(resetProgress(getSave(), Date.now()))
        // The fresh start reaches the cloud (and from there the other devices) right away
        void syncNow()
        this.goTo('Title')
      })
    this.panel.field('confirm').focus()
  }

  private syncSection(status: SyncStatus): string {
    switch (status.state) {
      case 'unavailable':
        return `<p>Noch nicht eingerichtet.</p>
          <p class="zh-note">Anleitung: docs/SETUP_FIREBASE.md im Projekt.</p>`
      case 'signedOut':
      case 'error':
        return `<p>Melde dich einmal pro Gerät an. Danach wird Lenis Spielstand automatisch abgeglichen.</p>
          <form data-action="noop">
            <input name="email" type="email" autocomplete="username" placeholder="E-Mail" />
            <input name="password" type="password" autocomplete="current-password" placeholder="Passwort" />
            <button class="zh-gold" data-action="signin">Anmelden</button>
          </form>
          ${status.state === 'error' ? `<p class="zh-error">${esc(status.message)}</p>` : ''}`
      case 'syncing':
        return `<p>Angemeldet als ${esc(status.email)}</p><p>Wird abgeglichen …</p>`
      case 'offline':
        return `<p>Angemeldet als ${esc(status.email)}</p>
          <p>Offline – wird abgeglichen, sobald wieder Internet da ist.</p>
          <button data-action="signout">Abmelden</button>`
      case 'synced':
        return `<p>Angemeldet als ${esc(status.email)}</p>
          <p>Zuletzt abgeglichen: ${new Date(status.at).toLocaleTimeString('de-DE')}</p>
          <button data-action="sync">Jetzt abgleichen</button>
          <button data-action="signout">Abmelden</button>`
    }
  }

  private exportSave() {
    const blob = new Blob([JSON.stringify(getSave(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mathe-genie-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  private async importSave(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const imported = parseSave(JSON.parse(await file.text()))
      if (!imported) throw new Error('no save')
      replaceSave(mergeSaves(getSave(), imported))
      this.message = 'Spielstand importiert.'
    } catch {
      this.message = 'Diese Datei ist kein Mathe-Genie-Spielstand.'
    }
    this.showMenu()
  }
}
