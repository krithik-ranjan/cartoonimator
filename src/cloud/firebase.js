import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cartoonimator-9e131.firebaseapp.com",
  projectId: "cartoonimator-9e131",
  storageBucket: "cartoonimator-9e131.firebasestorage.app",
  messagingSenderId: "134568361182",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-EDJ1N8XXDQ"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db, storage }