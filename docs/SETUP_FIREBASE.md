# Firebase Setup – Cloud Sync for Mathe-Genie

Cloud sync keeps Leni's progress the same on the PC and her iPhone. You do this setup once (about 10 minutes); afterwards you sign in once per device in the game's parent area.

What gets stored: her character (name, look), pets, coins and math progress. Nothing else. Only your account can read or write it.

## 1. Create the Firebase project

1. Open **https://console.firebase.google.com** and sign in with your Google account.
2. **Create a project** → name: `mathe-genie`.
3. Google Analytics: **turn off** (not needed, no tracking in a children's game).
4. Wait until the project is ready → **Continue**.

## 2. Turn on email + password login

1. Left menu: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → **Email/Password** → enable the first switch (_Email/Password_), leave _Email link_ off → **Save**.
3. Tab **Settings → Authorized domains** → **Add domain** → `schallo.github.io`.
   (`localhost` is already in the list, so it also works with `npm run dev`.)
4. Tab **Users** → **Add user** → your email + a password. This is the parent account you'll type into the game.

## 3. Create the database

1. Left menu: **Build → Firestore Database → Create database**.
2. Location: **`europe-west3` (Frankfurt)** – data stays in Germany. This can't be changed later.
3. Start in **production mode** → **Create**.
4. Tab **Rules** → replace everything with the following and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each parent account can only read and write its own save
    match /saves/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. Register the web app and copy the config

1. Project overview (house icon top left) → **Add app** → web icon `</>`.
2. App nickname: `mathe-genie-web`. **Don't** tick _Firebase Hosting_ (we use GitHub Pages) → **Register app**.
3. Firebase shows a block like this:

```js
const firebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'mathe-genie-xxxx.firebaseapp.com',
  projectId: 'mathe-genie-xxxx',
  storageBucket: 'mathe-genie-xxxx.firebasestorage.app',
  messagingSenderId: '…',
  appId: '1:…:web:…',
}
```

4. **Paste this block into the chat with Claude.** These values are not secret – they only identify the project; the rules from step 3 and your password protect the data. They are committed to the repository.

## 5. Optional but recommended: limit the API key

1. Open **https://console.cloud.google.com/apis/credentials** and select the project `mathe-genie-xxxx`.
2. Click the key named _Browser key (auto created by Firebase)_.
3. **Application restrictions → Websites** → add `https://schallo.github.io/*` and `http://localhost:5173/*` → **Save**.

## Checklist

- [ ] Project `mathe-genie` created, Analytics off
- [ ] Email/Password sign-in enabled, `schallo.github.io` authorized
- [ ] Parent user added
- [ ] Firestore in `europe-west3`, rules published
- [ ] Web app registered, config pasted to Claude
- [ ] (Optional) API key limited to the two websites
