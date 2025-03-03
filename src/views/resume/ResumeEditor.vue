<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Edit Resume</h1>
        <v-spacer></v-spacer>
        <v-btn color="secondary" variant="outlined" :to="`/preview/${resumeId}`" class="mr-2">
          <v-icon left>mdi-eye</v-icon>
          Preview
        </v-btn>
        <v-btn color="primary" @click="downloadPdf">
          <v-icon left>mdi-download</v-icon>
          Export PDF
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-col>
    </v-row>

    <template v-else>
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Resume Information</v-card-title>
            <v-card-text>
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="resume.title"
                  :rules="titleRules"
                  label="Resume Title"
                  required
                ></v-text-field>

                <v-select
                  v-model="resume.format"
                  :items="['LaTeX', 'Markdown']"
                  label="Resume Format"
                  required
                ></v-select>

                <v-select
                  v-model="resume.template"
                  :items="availableTemplates"
                  label="Template"
                  required
                ></v-select>
                
                <!-- Rest of the form structure is identical to ResumeBuilder.vue -->
                <!-- Tabs for Personal Info, Education, Experience, Skills, Projects, Additional -->
                <!-- Using same structure as ResumeBuilder component -->
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="secondary" variant="outlined" @click="cancel">
                Cancel
              </v-btn>
              <v-btn
                color="primary"
                @click="updateResume"
                :disabled="!valid"
                :loading="saving"
              >
                Save Changes
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card height="100%">
            <v-card-title>
              Preview
              <v-spacer></v-spacer>
              <v-btn
                icon="mdi-download"
                variant="text"
                @click="downloadPdf"
                :disabled="!valid || !resumePreview"
              ></v-btn>
            </v-card-title>
            <v-card-text class="preview-container">
              <div v-if="resumePreview" v-html="resumePreview"></div>
              <div v-else class="text-center py-8">
                Fill in the resume details to see a preview
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import { generateMarkdownPreview, generateLatexPreview, downloadResumePdf } from '@/utils/resumeGenerator';

const router = useRouter();
const route = useRoute();
const resumeStore = useResumeStore();

const resumeId = route.params.id;
const form = ref(null);
const valid = ref(false);
const loading = ref(true);
const saving = ref(false);

// Initialize resume object with default structure
const resume = reactive({
  title: '',
  format: 'Markdown',
  template: 'Modern',
  personal: {
    firstName: '',
    lastName: '',
    title: '',
    summary: '',
    email: '',
    phone: '',
    website: '',
    location: ''
  },
  education: [],
  experience: [],
  skills: {},
  projects: [],
  social: [],
  certifications: [],
  languages: []
});

// Form validation rules
const titleRules = [
  v => !!v || 'Title is required'
];

// Template options
const availableTemplates = [
  'Modern', 
  'Classic', 
  'Professional', 
  'Minimalist', 
  'Creative'
];

// Preview
const resumePreview = computed(() => {
  if (!resume.personal.firstName && !resume.personal.lastName) {
    return null;
  }

  if (resume.format === 'Markdown') {
    return generateMarkdownPreview(resume);
  } else {
    return generateLatexPreview(resume);
  }
});

// Fetch resume data on component mount
onMounted(async () => {
  try {
    const resumeData = await resumeStore.getResumeDetails(resumeId);
    
    // Populate the resume object with fetched data
    Object.keys(resumeData).forEach(key => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
        if (typeof resumeData[key] === 'object') {
          resume[key] = { ...resume[key], ...resumeData[key] };
        } else {
          resume[key] = resumeData[key];
        }
      }
    });
    
    // Ensure all required sections exist
    if (!resume.education || resume.education.length === 0) {
      resume.education = [{
        institution: '',
        degree: '',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        description: ''
      }];
    }
    
    if (!resume.experience || resume.experience.length === 0) {
      resume.experience = [{
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        description: ''
      }];
    }
    
    if (!resume.skills || Object.keys(resume.skills).length === 0) {
      resume.skills = {
        'Technical': [],
        'Soft Skills': []
      };
    }
    
    if (!resume.projects || resume.projects.length === 0) {
      resume.projects = [{
        name: '',
        date: '',
        url: '',
        description: ''
      }];
    }
    
    if (!resume.social || resume.social.length === 0) {
      resume.social = [{ platform: '', url: '' }];
    }
    
  } catch (error) {
    console.error('Error fetching resume:', error);
    alert('Failed to load resume. Redirecting to dashboard.');
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
});

// Save functions
async function updateResume() {
  if (!valid.value) return;
  
  saving.value = true;
  try {
    await resumeStore.updateResume(resumeId, resume);
    alert('Resume updated successfully!');
    router.push('/dashboard');
  } catch (error) {
    console.error('Error updating resume:', error);
    alert('Failed to update resume. Please try again.');
  } finally {
    saving.value = false;
  }
}

function cancel() {
  router.push('/dashboard');
}

function downloadPdf() {
  downloadResumePdf(resume);
}

</script>

<style scoped>
.preview-container {
  height: 100%;
  max-height: 800px;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.8rem;
}

.latex-preview {
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  font-size: 12px;
}
</style>
