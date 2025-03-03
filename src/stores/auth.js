import { defineStore } from 'pinia';
import { auth } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.uid
  },
  
  actions: {
    async initAuth() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          this.user = user;
          resolve(user);
        });
      });
    },
    
    async register(email, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        return userCredential.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async login(email, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        return userCredential.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async logout() {
      this.isLoading = true;
      try {
        await signOut(auth);
        this.user = null;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
