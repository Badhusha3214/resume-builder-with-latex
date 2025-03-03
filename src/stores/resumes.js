import { defineStore } from 'pinia';
import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc 
} from 'firebase/firestore';
import { useAuthStore } from './auth';

export const useResumeStore = defineStore('resumes', {
  state: () => ({
    resumes: [],
    currentResume: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    getUserResumes: (state) => state.resumes,
    getResumeById: (state) => (id) => state.resumes.find(resume => resume.id === id),
  },
  
  actions: {
    async fetchUserResumes() {
      const authStore = useAuthStore();
      if (!authStore.userId) return [];
      
      this.isLoading = true;
      try {
        const resumesRef = collection(db, 'resumes');
        const q = query(resumesRef, where('userId', '==', authStore.userId));
        const querySnapshot = await getDocs(q);
        
        this.resumes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return this.resumes;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async createResume(resumeData) {
      const authStore = useAuthStore();
      this.isLoading = true;
      
      try {
        const resumeWithUser = {
          ...resumeData,
          userId: authStore.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'resumes'), resumeWithUser);
        const newResume = { id: docRef.id, ...resumeWithUser };
        this.resumes.push(newResume);
        return newResume;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateResume(id, resumeData) {
      this.isLoading = true;
      
      try {
        const resumeRef = doc(db, 'resumes', id);
        const updateData = {
          ...resumeData,
          updatedAt: new Date()
        };
        
        await updateDoc(resumeRef, updateData);
        
        // Update local state
        const index = this.resumes.findIndex(r => r.id === id);
        if (index !== -1) {
          this.resumes[index] = { ...this.resumes[index], ...updateData };
        }
        
        return { id, ...updateData };
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async deleteResume(id) {
      this.isLoading = true;
      
      try {
        const resumeRef = doc(db, 'resumes', id);
        await deleteDoc(resumeRef);
        
        // Remove from local state
        this.resumes = this.resumes.filter(resume => resume.id !== id);
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async getResumeDetails(id) {
      this.isLoading = true;
      
      try {
        const resumeRef = doc(db, 'resumes', id);
        const resumeSnap = await getDoc(resumeRef);
        
        if (resumeSnap.exists()) {
          this.currentResume = { id: resumeSnap.id, ...resumeSnap.data() };
          return this.currentResume;
        } else {
          throw new Error('Resume not found');
        }
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
