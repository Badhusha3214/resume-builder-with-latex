import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyChbEuahpUHwJBXLxhwITT2V70L9o19oBc",
    authDomain: "testing24-4b6d0.firebaseapp.com",
    databaseURL: "https://testing24-4b6d0-default-rtdb.firebaseio.com",
    projectId: "testing24-4b6d0",
    storageBucket: "testing24-4b6d0.firebasestorage.app",
    messagingSenderId: "31237045544",
    appId: "1:31237045544:web:6297db8ae954bbb0baa41d",
    measurementId: "G-WS0F3YEWJP"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence (optional)
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.log('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the features required
          console.log('Persistence not supported by the browser');
      }
  });

export { auth, db, storage };
