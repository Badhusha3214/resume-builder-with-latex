import { defineStore } from 'pinia';
import { auth, db } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onUnmounted } from 'vue';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.uid
  },
  
  actions: {
    initAuth() {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        this.user = user;
        console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'No user');
      });
      
      // Clean up listener on app unmount
      onUnmounted(unsubscribe);
    },
    
    async register(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        
        // Create a document in the users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          banned: false,
          createdAt: new Date(),
          role: 'user'
        });
        
        return userCredential.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user is banned
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().banned === true) {
          // If user is banned, sign them out immediately
          await signOut(auth);
          this.user = null;
          throw new Error('Your account has been banned. Please contact support for assistance.');
        }
        
        this.user = userCredential.user;
        return userCredential.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async logout() {
      this.loading = true;
      try {
        await signOut(auth);
        this.user = null;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
