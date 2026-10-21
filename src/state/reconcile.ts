// Decides what a sync has to do with the local and the cloud save. Pure logic.
import { mergeSaves, type SaveData } from './save'

export type Reconciled = {
  merged: SaveData
  /** The cloud copy is missing or older than the merged save */
  push: boolean
  /** The local save changed through the merge */
  replaceLocal: boolean
}

const same = (a: SaveData, b: SaveData) => JSON.stringify(a) === JSON.stringify(b)

export function reconcile(local: SaveData, remote: SaveData | null): Reconciled {
  if (!remote) return { merged: local, push: true, replaceLocal: false }
  const merged = mergeSaves(local, remote)
  return { merged, push: !same(merged, remote), replaceLocal: !same(merged, local) }
}
