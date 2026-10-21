// Firebase web config for the cloud sync (docs/SETUP_FIREBASE.md, step 4).
// These values only identify the project; they are not secret. The Firestore rules and
// the parent's password protect the data. null = cloud sync not set up (game stays offline).
import type { FirebaseOptions } from 'firebase/app'

export const firebaseConfig: FirebaseOptions | null = null
