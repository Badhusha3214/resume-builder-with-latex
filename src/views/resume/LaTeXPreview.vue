<template>
  <div class="latex-viewer">
    <v-row>
      <v-col cols="12">
        <!-- Update title from "LaTeX Resume Editor" to "Resume Editor" -->
        <h1 class="text-h4 mb-4">Resume Editor</h1>
      </v-col>
    </v-row>
    
    <!-- ...existing template code... -->
    
    <!-- Update alert message for non-authenticated users -->
    <v-alert
      v-if="!authStore.isAuthenticated"
      type="info"
      density="compact"
      class="mb-4"
    >
      You're using the Resume Editor in guest mode. <router-link to="/login">Log in</router-link> to save your resume and access all features.
    </v-alert>
    
    <v-card>
      <v-card-title>
        LaTeX Editor
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="downloadPdf" :loading="exporting">
          <v-icon left>mdi-download</v-icon>
          Export PDF
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" lg="6">
            <v-textarea
              v-model="latexCode"
              label="LaTeX Code"
              filled
              auto-grow
              rows="15"
              class="latex-editor"
              @input="updatePreview"
            ></v-textarea>
            <v-btn color="primary" @click="saveAsResume">Save as Resume</v-btn>
          </v-col>
          
          <v-col cols="12" lg="6">
            <div class="latex-preview-container" ref="previewContainer">
              <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              <div v-else 
                class="preview-content"
                ref="previewContent">
                <div v-html="previewHtml"></div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Templates section -->
    <v-card class="mt-4">
      <v-card-title>LaTeX Templates</v-card-title>
      <v-divider></v-divider>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4" v-for="(template, name) in templates" :key="name">
            <!-- Remove the click event from the card to prevent conflicts -->
            <v-card outlined class="template-card"> 
              <v-img
                height="160"
                :src="getTemplateThumbnail(name)"
                class="align-end"
                gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
              >
                <v-card-title class="text-white">{{ name }}</v-card-title>
              </v-img>
              <v-card-actions>
                <!-- Make the apply template button more prominent and ensure it works -->
                <v-btn 
                  color="primary" 
                  variant="outlined" 
                  @click="applyTemplateWithName(name)" 
                  class="apply-btn"
                  block
                >
                  Apply {{ name }} Template
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Save Resume Modal -->
    <v-dialog v-model="saveDialog" max-width="500px">
      <v-card>
        <v-card-title>Save as Resume</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveResumeFromLatex">
            <v-text-field
              v-model="newResume.title"
              label="Resume Title"
              required
              :rules="[v => !!v || 'Title is required']"
            ></v-text-field>
            
            <v-select
              v-model="newResume.template"
              :items="Object.keys(templates)"
              label="Template"
              required
            ></v-select>
            
            <v-text-field
              v-model="newResume.personal.firstName"
              label="First Name"
              required
              :rules="[v => !!v || 'First name is required']"
            ></v-text-field>
            
            <v-text-field
              v-model="newResume.personal.lastName"
              label="Last Name"
              required
              :rules="[v => !!v || 'Last name is required']"
            ></v-text-field>
            
            <v-text-field
              v-model="newResume.personal.email"
              label="Email"
              type="email"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="saveDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveResumeFromLatex" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { processRawLatex, compileLatexToPdf } from '@/utils/latexCompiler';
import { latexTemplates } from '@/utils/templates';
import { useResumeStore } from '@/stores/resumes';
import debounce from 'lodash/debounce';
import { jsPDF } from 'jspdf';
import { downloadResumePdf } from '@/utils/resumeGeneratorSimple';

const router = useRouter();
const resumeStore = useResumeStore();
const authStore = useAuthStore(); // Add auth store import

// State
const latexCode = ref(`\\documentclass[10pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{color}

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
  {\\huge John Smith}\\vspace{0.5em}
  {\\large Software Developer}
\\end{center}

% Contact Information
\\begin{center}
  \\href{mailto:john.smith@example.com}{john.smith@example.com} $\\cdot$ 555-123-4567 $\\cdot$ New York, NY $\\cdot$ \\href{https://example.com}{example.com}
\\end{center}

\\section{Summary}
Experienced software developer with expertise in web development, cloud solutions, and mobile applications.

\\section{Experience}
\\entry{ABC Technologies}{2020 - Present}{Senior Developer}{San Francisco, CA}
\\begin{itemize}
  \\item Led development of cloud-native applications using modern technologies
  \\item Mentored junior team members and improved code review processes
\\end{itemize}

\\section{Education}
\\entry{University of Technology}{2015 - 2019}{Bachelor of Science in Computer Science}{Boston, MA}

\\end{document}`);

const previewHtml = ref('');
const loading = ref(false);
const exporting = ref(false);
const templates = ref(latexTemplates);
const saveDialog = ref(false);
const saving = ref(false);

// New resume data
const newResume = ref({
  title: 'LaTeX Resume',
  format: 'LaTeX',
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
  latexSource: ''
});

const previewContainer = ref(null);
const previewContent = ref(null);
let resizeObserver = null;
let isRendering = false;
let lastPreviewUpdate = 0;

// Better debounced preview update function
const updatePreview = debounce(() => {
  // Prevent updating too frequently
  const now = Date.now();
  if (now - lastPreviewUpdate < 500) {
    return;
  }
  lastPreviewUpdate = now;
  
  if (!latexCode.value || isRendering) return;
  
  isRendering = true;
  loading.value = true;
  
  // Use a microtask to defer without causing layout thrashing
  Promise.resolve().then(() => {
    try {
      // Process the LaTeX code to generate HTML preview
      const generated = processRawLatex(latexCode.value);
      
      // Use RAF for smoother rendering
      requestAnimationFrame(() => {
        previewHtml.value = generated;
        
        // Wait for the next frame after the update
        requestAnimationFrame(() => {
          loading.value = false;
          isRendering = false;
        });
      });
    } catch (error) {
      console.warn('Error updating LaTeX preview:', error);
      previewHtml.value = `<div class="error-message">Error generating preview: ${error.message}</div>`;
      loading.value = false;
      isRendering = false;
    }
  });
}, 500);

// Cleanup function that handles both component unmount and beforeUnmount cases
function cleanupResources() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  
  isRendering = false;
}

// Setup and teardown
onMounted(() => {
  // Defer initial preview rendering to avoid layout thrashing during mount
  setTimeout(updatePreview, 300);
  
  // Setup safer ResizeObserver
  nextTick(() => {
    if (previewContainer.value && window.SafeResizeObserver) {
      // Use our safer ResizeObserver implementation
      resizeObserver = new window.SafeResizeObserver(() => {
        // Simply log that the container was resized, no need to trigger updates
        console.log('Preview container resized');
      });
      
      // Start observing with a delay
      setTimeout(() => {
        if (previewContainer.value) { // Check again in case component was unmounted
          resizeObserver.observe(previewContainer.value);
        }
      }, 500);
    }
  });
  
  // Add a global suppressor for ResizeObserver errors
  const originalHandler = window.onresize;
  window.onresize = function(event) {
    // Throttle resize events
    if (!window._isResizing) {
      window._isResizing = true;
      setTimeout(() => { window._isResizing = false; }, 100);
      if (originalHandler) originalHandler.call(window, event);
    }
  };
});

onBeforeUnmount(cleanupResources);
onUnmounted(cleanupResources);

// Download as PDF
const downloadPdf = async () => {
  exporting.value = true;
  try {
    // Use our improved PDF download function with the raw LaTeX code
    await downloadResumePdf(latexCode.value, true);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert("Error exporting PDF. Please try again.");
  } finally {
    exporting.value = false;
  }
};

// Fix the applyTemplate function to properly handle click events
const applyTemplate = (templateName) => {
  console.log(`Applying template: ${templateName}`); // Add logging to debug
  
  const template = templates.value[templateName];
  if (template) {
    // Extract content from current document if possible
    let personalInfo = {};
    try {
      // Extract name
      const nameMatch = latexCode.value.match(/{\\huge\s*([^}]+)}/);
      if (nameMatch) personalInfo.name = nameMatch[1];
      
      // Extract title
      const titleMatch = latexCode.value.match(/{\\large\s*([^}]+)}/);
      if (titleMatch) personalInfo.title = titleMatch[1];
      
      // Extract email
      const emailMatch = latexCode.value.match(/\\href{mailto:([^}]*)}/);
      if (emailMatch) personalInfo.email = emailMatch[1];
      
      // Keep existing content sections
      const documentMatch = latexCode.value.match(/\\begin{document}([\s\S]*?)\\end{document}/);
      if (documentMatch) {
        personalInfo.content = documentMatch[1];
      }
    } catch (e) {
      console.log('Error extracting content:', e);
    }
    
    // Apply the template but keep personal information
    latexCode.value = applyTemplateWithPersonalInfo(template, personalInfo);
    updatePreview();
  }
};

// Fix the helper function that applies templates
const applyTemplateWithPersonalInfo = (template, personalInfo) => {
  let result = template;
  
  // Create simple document structure with the template
  if (personalInfo.name) {
    result += `\n\\begin{document}

\\begin{center}
  {\\huge ${personalInfo.name}}`;
    
    if (personalInfo.title) {
      result += `\\vspace{0.5em}\n  {\\large ${personalInfo.title}}`;
    }
    
    result += `\n\\end{center}`;
    
    // Add contact info if available
    if (personalInfo.email) {
      result += `\n\n% Contact Information
\\begin{center}
  \\href{mailto:${personalInfo.email}}{${personalInfo.email}}`;
      
      result += `\n\\end{center}`;
    }
    
    // Add some basic sections
    result += `\n\n\\section{Summary}
Add your professional summary here.

\\section{Experience}
\\entry{Company Name}{Year - Present}{Position}{Location}
\\begin{itemize}
  \\item Describe your responsibilities and achievements
  \\item Add more bullet points as needed
\\end{itemize}

\\section{Education}
\\entry{University Name}{Year - Year}{Degree}{Location}

\\end{document}`;
  } else {
    // Just add a basic document structure
    result += `\n\\begin{document}

\\begin{center}
  {\\huge Your Name}\\vspace{0.5em}
  {\\large Your Professional Title}
\\end{center}

% Contact Information
\\begin{center}
  \\href{mailto:email@example.com}{email@example.com} $\\cdot$ Phone Number $\\cdot$ Location $\\cdot$ \\href{https://website.com}{website.com}
\\end{center}

\\section{Summary}
Your professional summary goes here.

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
  
  return result;
};

// Get template thumbnail
const getTemplateThumbnail = (templateName) => {
  // In a real app, you would have actual template thumbnails
  const colors = {
    'Modern': '#3498db',
    'Classic': '#2c3e50',
    'Professional': '#1a5276',
    'Minimalist': '#7f8c8d',
    'Creative': '#e74c3c'
  };
  
  const color = colors[templateName] || '#999';
  return `https://via.placeholder.com/400x200/${color.replace('#', '')}?text=${templateName}+Template`;
};

// Open save dialog
const saveAsResume = () => {
  // Try to extract name and email from LaTeX
  try {
    const nameMatch = latexCode.value.match(/{\\huge\s*([^}]+)}/);
    if (nameMatch) {
      const nameParts = nameMatch[1].trim().split(' ');
      newResume.value.personal.firstName = nameParts[0] || '';
      newResume.value.personal.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const titleMatch = latexCode.value.match(/{\\large\s*([^}]+)}/);
    if (titleMatch) {
      newResume.value.personal.title = titleMatch[1].trim();
    }
    
    const emailMatch = latexCode.value.match(/\\href{mailto:([^}]*)}/);
    if (emailMatch) {
      newResume.value.personal.email = emailMatch[1];
    }
  } catch (e) {
    console.log('Error extracting info:', e);
  }
  
  saveDialog.value = true;
};

// Save LaTeX as a resume
const saveResumeFromLatex = async () => {
  saving.value = true;
  try {
    // Create a new resume object
    const resumeData = {
      ...newResume.value,
      latexSource: latexCode.value
    };
    
    // Save to database
    const result = await resumeStore.createResume(resumeData);
    
    // Show success message
    alert('Resume created successfully!');
    
    // Close dialog
    saveDialog.value = false;
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Error saving resume:', error);
    alert('Error saving resume: ' + error.message);
  } finally {
    saving.value = false;
  }
};

// Add a new method specifically for applying templates from buttons
const applyTemplateWithName = (templateName) => {
  console.log(`Applying template: ${templateName} via direct button click`);
  try {
    loading.value = true;
    applyTemplate(templateName);
    
    // Force preview update after applying template
    setTimeout(() => {
      updatePreview();
    }, 300);
  } catch (error) {
    console.error('Error applying template:', error);
    alert(`Failed to apply ${templateName} template. Please try again.`);
    loading.value = false;
  }
};
</script>

<style scoped>
.latex-viewer {
  margin-bottom: 2rem;
  contain: layout; /* Add stronger containment */
}

.latex-editor {
  font-family: 'Courier New', monospace;
  line-height: 1.5;
  height: auto !important; /* Prevent auto-resizing conflicts */
  max-height: 600px; /* Limit maximum height to prevent excessive growth */
}

.latex-preview-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1rem;
  height: 600px;
  overflow-y: auto;
  background-color: #fff;
  contain: strict; /* Use strict containment for better performance */
  position: relative; /* Create stacking context */
  overscroll-behavior: none; /* Prevent scroll chaining */
  will-change: transform; /* Hint for browser optimization */
}

.preview-content {
  font-family: 'Times New Roman', serif;
  transform: translateZ(0); /* Force GPU acceleration */
  contain: strict;
  height: 100%;
  width: 100%;
  position: relative; /* Create a new stacking context */
}

:deep(.error-message) {
  color: red;
  padding: 1rem;
  border: 1px solid red;
  border-radius: 4px;
  background-color: #ffeeee;
}

/* Override tab-switching styles to fix ResizeObserver issues */
:deep(.tab-content) {
  position: relative;
  contain: strict;
  height: 500px; /* Fixed height to prevent layout shifts */
  transition: none !important; /* Disable transitions */
}

/* Disable animations in compiled view */
:deep(.compiled-view) {
  animation: none !important;
  transition: none !important;
  transform: scale(0.5) !important; /* Use fixed scale */
  transform-origin: top center !important;
  height: auto !important;
  max-height: none !important; /* Allow content to flow naturally */
  will-change: auto !important; /* Don't use GPU for this large element */
}

/* Style to hide offscreen content */
:deep(.compiled-view) {
  content-visibility: auto;
  contain-intrinsic-height: 1000px;
}

/* Optimize layout calculations for template cards */
.template-card {
  cursor: default; /* Remove pointer cursor from card since we're clicking buttons now */
  transition: transform 0.2s, box-shadow 0.2s;
  contain: content;
  overflow: hidden; /* Ensure content doesn't overflow */
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
}

/* Style the apply button to be very prominent */
.apply-btn {
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  height: 44px !important;
  margin: 8px !important;
  position: relative;
  z-index: 5; /* Ensure button is above other elements */
}

/* Ensure v-img doesn't interfere with buttons */
.template-card .v-img {
  pointer-events: none;
}

/* Fix possible z-index issues */
.v-card-actions {
  position: relative;
  z-index: 10;
}
</style>
