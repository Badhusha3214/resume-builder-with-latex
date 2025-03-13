import { defineStore } from 'pinia';
import { db } from '@/firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuthStore } from './auth';

export const useResumeStore = defineStore('resumes', {
  state: () => ({
    resumes: [],
    loading: false,
  }),

  getters: {
    getUserResumes(state) {
      return state.resumes;
    }
  },

  actions: {
    /**
     * Fetch all resumes for the current user
     */
    async fetchUserResumes() {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        
        if (!authStore.user) {
          console.error('No authenticated user found');
          this.resumes = [];
          return;
        }
        
        const userId = authStore.user.uid;
        const resumesQuery = query(collection(db, 'resumes'), where('userId', '==', userId));
        
        const snapshot = await getDocs(resumesQuery);
        this.resumes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Loaded ${this.resumes.length} resumes for user ${userId}`);
      } catch (error) {
        console.error('Error fetching resumes:', error);
        throw new Error(`Failed to load resumes: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Get a specific resume by ID
     * @param {String} id - Resume ID
     * @returns {Object} Resume data
     */
    async getResumeDetails(id) {
      try {
        const resumeDoc = await getDoc(doc(db, 'resumes', id));
        
        if (!resumeDoc.exists()) {
          throw new Error('Resume not found');
        }
        
        return {
          id: resumeDoc.id,
          ...resumeDoc.data()
        };
      } catch (error) {
        console.error(`Error fetching resume ${id}:`, error);
        throw new Error(`Failed to load resume: ${error.message}`);
      }
    },
    
    /**
     * Create a new resume
     * @param {Object} resumeData - Resume data
     * @returns {Object} Created resume with ID
     */
    async createResume(resumeData) {
      try {
        console.log('Creating resume with data:', resumeData);
        
        // Check authentication first
        const authStore = useAuthStore();
        if (!authStore.user) {
          console.error('Authentication required: No user logged in');
          throw new Error('You must be logged in to create a resume');
        }
        
        // Validate essential fields
        if (!resumeData.title) {
          throw new Error('Resume title is required');
        }
        
        if (!resumeData.format) {
          console.warn('Format not specified, using default');
          resumeData.format = 'LaTeX'; // Default format
        }
        
        // Ensure personal data is structured
        if (!resumeData.personal || !resumeData.personal.firstName || !resumeData.personal.lastName) {
          console.error('Missing personal data', resumeData.personal);
          throw new Error('Resume requires first and last name');
        }
        
        // Prepare resume data with timestamps and user ID
        const completeResumeData = {
          ...resumeData,
          userId: authStore.user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('Adding document to Firestore collection');
        
        try {
          // Add document to Firestore
          const docRef = await addDoc(collection(db, 'resumes'), completeResumeData);
          console.log('Resume created with ID:', docRef.id);
          
          // Add the new resume to the local state
          const newResume = {
            id: docRef.id,
            ...completeResumeData,
            createdAt: new Date(), // Use local date for immediate rendering
            updatedAt: new Date()
          };
          
          this.resumes.push(newResume);
          return newResume;
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          throw new Error(`Database error: ${firestoreError.message}`);
        }
      } catch (error) {
        console.error('Error creating resume:', error);
        throw error; // Rethrow to allow the UI to handle it
      }
    },
    
    /**
     * Update an existing resume
     * @param {String} id - Resume ID
     * @param {Object} resumeData - Updated resume data
     */
    async updateResume(id, resumeData) {
      try {
        // Validate input
        if (!id) {
          throw new Error('Resume ID is required for updates');
        }
        
        const authStore = useAuthStore();
        if (!authStore.user) {
          throw new Error('You must be logged in to update a resume');
        }
        
        // Get the existing resume to check permissions
        const existingResume = await this.getResumeDetails(id);
        
        if (existingResume.userId !== authStore.user.uid) {
          throw new Error('You do not have permission to update this resume');
        }
        
        // Prepare update data
        const updateData = {
          ...resumeData,
          updatedAt: serverTimestamp()
        };
        
        // Remove read-only fields
        delete updateData.id;
        delete updateData.userId;
        delete updateData.createdAt;
        
        // Update in Firestore
        await updateDoc(doc(db, 'resumes', id), updateData);
        console.log('Resume updated:', id);
        
        // Update in local state
        const index = this.resumes.findIndex(r => r.id === id);
        if (index !== -1) {
          this.resumes[index] = {
            ...this.resumes[index],
            ...updateData,
            updatedAt: new Date() // Use local date for immediate rendering
          };
        }
      } catch (error) {
        console.error(`Error updating resume ${id}:`, error);
        throw new Error(`Failed to update resume: ${error.message}`);
      }
    },
    
    /**
     * Delete a resume
     * @param {String} id - Resume ID
     */
    async deleteResume(id) {
      try {
        const authStore = useAuthStore();
        if (!authStore.user) {
          throw new Error('You must be logged in to delete a resume');
        }
        
        await deleteDoc(doc(db, 'resumes', id));
        console.log('Resume deleted:', id);
        
        // Remove from local state
        this.resumes = this.resumes.filter(r => r.id !== id);
      } catch (error) {
        console.error(`Error deleting resume ${id}:`, error);
        throw new Error(`Failed to delete resume: ${error.message}`);
      }
    }
  }
});
