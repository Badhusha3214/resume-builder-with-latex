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
                :disabled="!valid || !resumePreview || pdfGenerating"
                :loading="pdfGenerating"
              ></v-btn>
            </v-card-title>
            <v-card-text class="preview-container">
              <div v-if="previewLoading" class="text-center py-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p class="mt-4">Generating preview...</p>
              </div>
              <div v-else-if="resume.format === 'LaTeX' && resumePreview" v-html="resumePreview" class="latex-preview-wrapper"></div>
              <div v-else-if="resumePreview" v-html="resumePreview"></div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import { generateMarkdownPreview, generateLatexPreview } from '@/utils/resumeGenerator';
import { generateLatexDocument } from '@/utils/latexCompiler';
import { downloadResumePdf } from '@/utils/resumeGeneratorSimple';

const router = useRouter();
const route = useRoute();
const resumeStore = useResumeStore();

const resumeId = route.params.id;
const form = ref(null);
const valid = ref(false);
const loading = ref(true);
const saving = ref(false);
const previewLoading = ref(false);
const pdfGenerating = ref(false);

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
const resumePreview = ref(null);

// Update preview function with better loading state management
const updatePreview = async () => {
  if (!resume || !resume.format) {
    resumePreview.value = null;
    return;
  }

  previewLoading.value = true;
  
  try {
    // Generate preview based on format - explicitly await results
    if (resume.format === 'LaTeX') {
      // Make sure we await the Promise result
      const previewContent = await generateLatexPreview(resume);
      resumePreview.value = previewContent;
    } else {
      // Markdown format
      resumePreview.value = generateMarkdownPreview(resume);
    }
  } catch (error) {
    console.error('Error generating preview:', error);
    resumePreview.value = `<div class="error-message">Error generating preview: ${error.message}</div>`;
  } finally {
    previewLoading.value = false;
  }
};

// Fetch resume data on component mount
onMounted(async () => {
  try {
    const resumeData = await resumeStore.getResumeDetails(resumeId);
    
    // Validate the LaTeX content if this is a LaTeX resume
    if (resumeData.format === 'LaTeX' && (!resumeData.latexSource || typeof resumeData.latexSource !== 'string')) {
      console.warn('Invalid or missing LaTeX source in resume:', resumeId);
      
      // Create a default LaTeX document if none exists
      resumeData.latexSource = generateDefaultLatexContent(resumeData);
    }
    
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
    updatePreview();
  }
});

// Helper function to generate default LaTeX content
function generateDefaultLatexContent(resumeData) {
  const name = resumeData.personal?.firstName && resumeData.personal?.lastName 
    ? `${resumeData.personal.firstName} ${resumeData.personal.lastName}`
    : 'Your Name';
  
  const title = resumeData.personal?.title || 'Professional Title';
  
  // Create a basic LaTeX document using information from the resume data
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}

\\geometry{left=1.8cm, right=1.8cm, top=1.8cm, bottom=1.8cm}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.3em}\\noindent\\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\
}
    
\\begin{document}

\\begin{center}
  {\\huge ${name}}\\vspace{0.5em}
  {\\large ${title}}
\\end{center}

% Contact Information
\\begin{center}
  ${resumeData.personal?.email ? `\\href{mailto:${resumeData.personal.email}}{${resumeData.personal.email}}` : 'email@example.com'}
  ${resumeData.personal?.phone ? ` $\\cdot$ ${resumeData.personal.phone}` : ''}
  ${resumeData.personal?.location ? ` $\\cdot$ ${resumeData.personal.location}` : ''}
\\end{center}

\\section{Summary}
${resumeData.personal?.summary || 'Your professional summary goes here.'}

\\section{Experience}
\\entry{Company Name}{Year - Present}{Position}{Location}
\\begin{itemize}
  \\item Describe your responsibilities and achievements
  \\item Add more bullet points as needed
\\end{itemize}

\\section{Education}
\\entry{University Name}{Year - Year}{Degree}{Location}

\\end{document}`;
}

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

// Enhanced download function with proper loading state
function downloadPdf() {
  if (!resume || !resume.format) return;

  pdfGenerating.value = true;
  
  try {
    // Use downloadResumePdf directly with the resume object
    downloadResumePdf(resume)
      .then(() => {
        pdfGenerating.value = false;
      })
      .catch(error => {
        console.error('Error downloading PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
        pdfGenerating.value = false;
      });
  } catch (error) {
    console.error('Error initiating PDF download:', error);
    alert('Error preparing PDF: ' + (error.message || 'Unknown error occurred'));
    pdfGenerating.value = false;
  }
}

// Call updatePreview when resume data changes
watch(resume, () => {
  updatePreview();
}, { deep: true });

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
  background-color: white;
  contain: content; /* Improves performance */
}

.latex-preview {
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
}

.latex-preview-wrapper {
  font-family: 'Times New Roman', serif;
}

/* Enhanced styling for LaTeX preview */
:deep(.latex-complete-preview) {
  height: 100%;
  overflow: hidden;
  max-height: 600px;
  width: 100%;
}

:deep(.compiled-view) {
  transform: scale(0.8);
  transform-origin: top center;
  height: auto;
  overflow: visible;
  max-width: 95%;
  font-family: 'Latin Modern Roman', 'Computer Modern Roman', 'Times New Roman', serif !important;
  padding: 1.5cm 1.2cm !important;
  background-color: white !important;
  box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
  margin: 0 auto;
}

:deep(.section-heading) {
  color: #2c3e50 !important;
  font-weight: bold !important;
  border-bottom: 1px solid #ddd !important;
}

:deep(.error-message) {
  color: #f44336;
  padding: 1rem;
  border: 1px solid #f44336;
  border-radius: 4px;
  background-color: #ffebee;
  margin: 1rem 0;
}
</style>
