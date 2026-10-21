// Firebase web config for the cloud sync (docs/SETUP_FIREBASE.md, step 4).
// These values only identify the project; they are not secret. The Firestore rules and
// the parent's password protect the data. null = cloud sync not set up (game stays offline).
// No Analytics: no measurementId, never import firebase/analytics.
import type { FirebaseOptions } from 'firebase/app'

export const firebaseConfig: FirebaseOptions | null = {
  apiKey: 'AIzaSyDbvpsUE3OduVgmCkYAvaB6QsH7Z_HRv3Y',
  authDomain: 'mathe-genie.firebaseapp.com',
  projectId: 'mathe-genie',
  storageBucket: 'mathe-genie.firebasestorage.app',
  messagingSenderId: '962541631595',
  appId: '1:962541631595:web:1eaac4730f3c39c499992e',
}
