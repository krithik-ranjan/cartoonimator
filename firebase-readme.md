# Firebase Setup

## General setup 

1. Create Firebase project and register app -- `cartoonimator`

2. Install Firebase in react project
`> npm install firebase`

3. Initialize Firebase SDK in code with the following stuff

```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgdl23SK1lQ6T2OhPnPU3KfVlm_q5Zw_g",
  authDomain: "cartoonimator-9e131.firebaseapp.com",
  projectId: "cartoonimator-9e131",
  storageBucket: "cartoonimator-9e131.firebasestorage.app",
  messagingSenderId: "134568361182",
  appId: "1:134568361182:web:1edc556d14f13f6be8964f",
  measurementId: "G-EDJ1N8XXDQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

```

## For hosting

1. Install Firebase CLI
`> npm install -g firebase-tools`

2. Setup and login 
```
> firebase login
> firebase init (in root directory)
```

3. Deploy
`> firebase deploy`

## For Storage

1. Setup Storage on the Firebase console. 