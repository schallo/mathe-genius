// Parent area (GAME_DESIGN §8). Step 5: grown-up question, cloud sync login, export/import.
// Settings and the progress overview follow in step 11.
import { ensureStageTexture } from '../art/stage'
import { zufall } from '../math/random'
import { coinBalance, mergeSaves, parseSave } from '../state/save'
import { getSave, replaceSave } from '../state/store'
import { onSyncStatus, signIn, signOut, syncNow, syncStatus, type SyncStatus } from '../state/sync'
import { HtmlPanel, esc } from '../ui/HtmlPanel'
import { PixelScene } from './PixelScene'

export class ParentScene extends PixelScene {
  private panel!: HtmlPanel
  private message = ''

  constructor() {
    super('Parent')
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
      .on('back', () => this.goTo('Title'))
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
          <p class="zh-error">${esc(this.message)}</p>
        </div>
        <button class="zh-gold" data-action="back">Zurück zum Spiel</button>`,
      )
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
      .on('back', () => this.goTo('Title'))
    this.panel.field('file').addEventListener('change', (e) => this.importSave(e))
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
