// Cloud sync with Firebase (GAME_DESIGN §8): parent signs in with email + password once
// per device; the save is merged with the cloud copy on sign-in, when the app comes back
// online, and pushed a few seconds after every change. The game never waits for it.
// Firebase is loaded on demand, only when a config exists (src/firebaseConfig.ts).
import type { Auth, User } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore/lite'
import { firebaseConfig } from '../firebaseConfig'
import { reconcile } from './reconcile'
import { parseSave, type SaveData } from './save'
import { getSave, onSaveChange, replaceSave } from './store'

export type SyncStatus =
  | { state: 'unavailable' }
  | { state: 'signedOut' }
  | { state: 'syncing'; email: string }
  | { state: 'synced'; email: string; at: number }
  | { state: 'offline'; email: string }
  | { state: 'error'; email: string | null; message: string }

const PUSH_DELAY_MS = 3000

let status: SyncStatus = firebaseConfig ? { state: 'signedOut' } : { state: 'unavailable' }
const listeners = new Set<(s: SyncStatus) => void>()
let services: Promise<{ auth: Auth; db: Firestore }> | null = null
let user: User | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined

function setStatus(next: SyncStatus) {
  status = next
  for (const l of listeners) l(status)
}

export function syncStatus(): SyncStatus {
  return status
}

export function onSyncStatus(listener: (s: SyncStatus) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function load() {
  services ??= (async () => {
    const [{ initializeApp }, authLib, { getFirestore }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore/lite'),
    ])
    const app = initializeApp(firebaseConfig!)
    const auth = authLib.initializeAuth(app, {
      persistence: [authLib.indexedDBLocalPersistence, authLib.browserLocalPersistence],
    })
    authLib.onAuthStateChanged(auth, (u) => {
      user = u
      if (u) void syncNow()
      else setStatus({ state: 'signedOut' })
    })
    return { auth, db: getFirestore(app) }
  })()
  return services
}

/** Call once at startup. Restores a previous sign-in and keeps the cloud copy up to date. */
export function startSync(): void {
  if (!firebaseConfig) return
  void load()
  onSaveChange(() => {
    if (!user) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void syncNow(), PUSH_DELAY_MS)
  })
  window.addEventListener('online', () => void syncNow())
}

export async function syncNow(): Promise<void> {
  if (!firebaseConfig || !user) return
  const email = user.email ?? ''
  if (!navigator.onLine) return setStatus({ state: 'offline', email })
  setStatus({ state: 'syncing', email })
  try {
    const { db } = await load()
    const { doc, getDoc, setDoc } = await import('firebase/firestore/lite')
    const ref = doc(db, 'saves', user.uid)
    const snapshot = await getDoc(ref)
    const remote = snapshot.exists() ? parseSave(snapshot.data().save) : null
    const { merged, push, replaceLocal } = reconcile(getSave(), remote)
    if (replaceLocal) replaceSave(merged)
    if (push) await setDoc(ref, { save: toPlain(merged), updatedAt: merged.updatedAt })
    setStatus({ state: 'synced', email, at: Date.now() })
  } catch (e) {
    setStatus({ state: 'error', email, message: describe(e) })
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!firebaseConfig) return
  const { auth } = await load()
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    setStatus({ state: 'error', email: null, message: describe(e) })
    throw e
  }
}

export async function signOut(): Promise<void> {
  if (!firebaseConfig) return
  const { auth } = await load()
  const { signOut: firebaseSignOut } = await import('firebase/auth')
  await firebaseSignOut(auth)
}

/** Firestore accepts plain objects only. */
const toPlain = (save: SaveData) => JSON.parse(JSON.stringify(save)) as Record<string, unknown>

/** Short German messages for the parent area. */
function describe(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'E-Mail oder Passwort stimmt nicht.'
  if (code.includes('too-many-requests')) return 'Zu viele Versuche. Bitte später nochmal.'
  if (code.includes('network')) return 'Keine Internetverbindung.'
  if (code.includes('permission-denied')) return 'Keine Berechtigung (Firestore-Regeln prüfen).'
  return 'Synchronisieren hat nicht geklappt.'
}
