<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Create New Resume</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            Resume Information
            <v-spacer></v-spacer>
            <v-btn-toggle 
              v-model="editorMode" 
              mandatory 
              v-if="resume.format === 'LaTeX'"
              density="comfortable"
              color="primary"
            >
              <v-btn value="form">Form Editor</v-btn>
              <v-btn value="latex">LaTeX Editor</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <!-- Form Editor Mode -->
            <v-form ref="form" v-model="valid" v-show="editorMode === 'form'">
              <v-text-field
                v-model="resume.title"
                :rules="titleRules"
                label="Resume Title"
                required
              ></v-text-field>

              <input type="hidden" v-model="resume.format" value="LaTeX">
              <v-text-field
                label="Format"
                value="LaTeX"
                disabled
                hint="This application uses LaTeX format for resumes"
              ></v-text-field>

              <v-select
                v-model="resume.template"
                :items="availableTemplates"
                label="Template"
                required
              ></v-select>
              
              <v-tabs v-model="activeTab">
                <v-tab value="personal">Personal Information</v-tab>
                <v-tab value="education">Education</v-tab>
                <v-tab value="experience">Experience</v-tab>
                <v-tab value="skills">Skills</v-tab>
                <v-tab value="projects">Projects</v-tab>
                <v-tab value="additional">Additional</v-tab>
              </v-tabs>

              <v-window v-model="activeTab">
                <!-- Personal Information Tab -->
                <v-window-item value="personal">
                  <v-container>
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.firstName"
                          label="First Name"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.lastName"
                          label="Last Name"
                          required
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="resume.personal.title"
                          label="Professional Title"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-textarea
                          v-model="resume.personal.summary"
                          label="Professional Summary"
                          rows="3"
                        ></v-textarea>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.email"
                          label="Email"
                          :rules="emailRules"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.phone"
                          label="Phone Number"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.website"
                          label="Website"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="resume.personal.location"
                          label="Location"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>

                <!-- Education Tab -->
                <v-window-item value="education">
                  <v-container>
                    <v-row v-for="(edu, index) in resume.education" :key="index" class="mb-3">
                      <v-col cols="12">
                        <v-card variant="outlined">
                          <v-card-text>
                            <v-row>
                              <v-col cols="12">
                                <div class="d-flex justify-space-between">
                                  <h3 class="text-h6">Education {{ index + 1 }}</h3>
                                  <v-btn
                                    icon="mdi-delete"
                                    variant="text"
                                    color="error"
                                    density="compact"
                                    @click="removeEducation(index)"
                                  ></v-btn>
                                </div>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="edu.institution"
                                  label="Institution"
                                  required
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="edu.degree"
                                  label="Degree"
                                  required
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="edu.startDate"
                                  label="Start Date"
                                  type="month"
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="edu.endDate"
                                  label="End Date"
                                  type="month"
                                  :disabled="edu.current"
                                ></v-text-field>
                                <v-checkbox
                                  v-model="edu.current"
                                  label="Currently Studying"
                                  hide-details
                                  dense
                                ></v-checkbox>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-text-field
                                  v-model="edu.location"
                                  label="Location"
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-textarea
                                  v-model="edu.description"
                                  label="Description"
                                  rows="3"
                                ></v-textarea>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-btn
                          color="primary"
                          prepend-icon="mdi-plus"
                          @click="addEducation"
                        >
                          Add Education
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>

                <!-- Experience Tab -->
                <v-window-item value="experience">
                  <v-container>
                    <v-row v-for="(exp, index) in resume.experience" :key="index" class="mb-3">
                      <v-col cols="12">
                        <v-card variant="outlined">
                          <v-card-text>
                            <v-row>
                              <v-col cols="12">
                                <div class="d-flex justify-space-between">
                                  <h3 class="text-h6">Experience {{ index + 1 }}</h3>
                                  <v-btn
                                    icon="mdi-delete"
                                    variant="text"
                                    color="error"
                                    density="compact"
                                    @click="removeExperience(index)"
                                  ></v-btn>
                                </div>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="exp.company"
                                  label="Company"
                                  required
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="exp.position"
                                  label="Position"
                                  required
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="exp.startDate"
                                  label="Start Date"
                                  type="month"
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-text-field
                                  v-model="exp.endDate"
                                  label="End Date"
                                  type="month"
                                  :disabled="exp.current"
                                ></v-text-field>
                                <v-checkbox
                                  v-model="exp.current"
                                  label="Currently Working"
                                  hide-details
                                  dense
                                ></v-checkbox>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-text-field
                                  v-model="exp.location"
                                  label="Location"
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-textarea
                                  v-model="exp.description"
                                  label="Description"
                                  rows="3"
                                  hint="Use bullet points starting with - for better formatting"
                                ></v-textarea>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-btn
                          color="primary"
                          prepend-icon="mdi-plus"
                          @click="addExperience"
                        >
                          Add Experience
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>

                <!-- Skills Tab -->
                <v-window-item value="skills">
                  <v-container>
                    <v-row>
                      <v-col cols="12">
                        <v-select
                          v-model="selectedSkillCategory"
                          :items="skillCategories"
                          label="Skill Category"
                        ></v-select>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-combobox
                          v-model="newSkill"
                          label="Add Skill"
                          hint="Press Enter to add skill"
                          @keyup.enter="addSkill"
                        ></v-combobox>
                      </v-col>
                    </v-row>
                    <v-row v-if="resume.skills[selectedSkillCategory]?.length > 0">
                      <v-col cols="12">
                        <v-chip-group>
                          <v-chip
                            v-for="(skill, i) in resume.skills[selectedSkillCategory]"
                            :key="i"
                            closable
                            @click:close="removeSkill(i)"
                          >
                            {{ skill }}
                          </v-chip>
                        </v-chip-group>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-btn color="secondary" prepend-icon="mdi-plus" @click="addSkillCategory">
                          Add Category
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-dialog v-model="skillCategoryDialog" max-width="500px">
                      <v-card>
                        <v-card-title>Add New Skill Category</v-card-title>
                        <v-card-text>
                          <v-text-field
                            v-model="newSkillCategory"
                            label="Category Name"
                          ></v-text-field>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn color="blue-darken-1" variant="text" @click="skillCategoryDialog = false">
                            Cancel
                          </v-btn>
                          <v-btn color="blue-darken-1" variant="text" @click="saveSkillCategory">
                            Save
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </v-container>
                </v-window-item>

                <!-- Projects Tab -->
                <v-window-item value="projects">
                  <v-container>
                    <v-row v-for="(project, index) in resume.projects" :key="index" class="mb-3">
                      <v-col cols="12">
                        <v-card variant="outlined">
                          <v-card-text>
                            <v-row>
                              <v-col cols="12">
                                <div class="d-flex justify-space-between">
                                  <h3 class="text-h6">Project {{ index + 1 }}</h3>
                                  <v-btn
                                    icon="mdi-delete"
                                    variant="text"
                                    color="error"
                                    density="compact"
                                    @click="removeProject(index)"
                                  ></v-btn>
                                </div>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12" sm="8">
                                <v-text-field
                                  v-model="project.name"
                                  label="Project Name"
                                  required
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" sm="4">
                                <v-text-field
                                  v-model="project.date"
                                  label="Date"
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-text-field
                                  v-model="project.url"
                                  label="Project URL"
                                ></v-text-field>
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="12">
                                <v-textarea
                                  v-model="project.description"
                                  label="Description"
                                  rows="3"
                                  hint="Use bullet points starting with - for better formatting"
                                ></v-textarea>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-btn
                          color="primary"
                          prepend-icon="mdi-plus"
                          @click="addProject"
                        >
                          Add Project
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>

                <!-- Additional Tab -->
                <v-window-item value="additional">
                  <v-container>
                    <v-row>
                      <v-col cols="12">
                        <h3 class="text-h6 mb-3">Social Links</h3>
                        <v-row v-for="(link, index) in resume.social" :key="index" class="mb-2">
                          <v-col cols="4" sm="3">
                            <v-text-field
                              v-model="link.platform"
                              label="Platform"
                              placeholder="LinkedIn, GitHub, etc."
                            ></v-text-field>
                          </v-col>
                          <v-col cols="7" sm="8">
                            <v-text-field
                              v-model="link.url"
                              label="URL"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              size="x-small"
                              @click="removeSocial(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                        <v-btn
                          color="secondary"
                          size="small"
                          prepend-icon="mdi-plus"
                          @click="addSocial"
                          class="mt-2"
                        >
                          Add Social Link
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <v-row>
                      <v-col cols="12">
                        <h3 class="text-h6 mb-3">Certifications</h3>
                        <v-row v-for="(cert, index) in resume.certifications" :key="index" class="mb-2">
                          <v-col cols="12" sm="5">
                            <v-text-field
                              v-model="cert.name"
                              label="Certification"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="3">
                            <v-text-field
                              v-model="cert.issuer"
                              label="Issuer"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="3">
                            <v-text-field
                              v-model="cert.date"
                              label="Date"
                              type="date"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              size="x-small"
                              @click="removeCertification(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                        <v-btn
                          color="secondary"
                          size="small"
                          prepend-icon="mdi-plus"
                          @click="addCertification"
                          class="mt-2"
                        >
                          Add Certification
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <v-row>
                      <v-col cols="12">
                        <h3 class="text-h6 mb-3">Languages</h3>
                        <v-row v-for="(lang, index) in resume.languages" :key="index" class="mb-2">
                          <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="lang.language"
                              label="Language"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="5">
                            <v-select
                              v-model="lang.proficiency"
                              :items="['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']"
                              label="Proficiency"
                            ></v-select>
                          </v-col>
                          <v-col cols="12" sm="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              size="x-small"
                              @click="removeLanguage(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                        <v-btn
                          color="secondary"
                          size="small"
                          prepend-icon="mdi-plus"
                          @click="addLanguage"
                          class="mt-2"
                        >
                          Add Language
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>
              </v-window>
            </v-form>

            <!-- LaTeX Editor Mode -->
            <div v-show="editorMode === 'latex' && resume.format === 'LaTeX'">
              <v-textarea
                v-model="latexSource"
                label="LaTeX Source Code"
                filled
                auto-grow
                rows="15"
                class="latex-editor"
                @input="latexSourceChanged"
                :hint="'Changes here will update the preview. Use the LaTeX template for ' + resume.template"
                persistent-hint
              ></v-textarea>
              <v-btn 
                color="primary" 
                class="mt-2" 
                @click="applyLatexTemplate(resume.template)"
                :disabled="!resume.personal.firstName || !resume.personal.lastName"
              >
                Apply Template
              </v-btn>
              <v-btn 
                color="secondary" 
                class="mt-2 ml-2" 
                @click="updateResumeFromLatex"
              >
                Update Resume Data
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="secondary"
              variant="outlined"
              @click="saveDraft"
              :loading="saving"
            >
              Save Draft
            </v-btn>
            <v-btn
              color="primary"
              @click="saveResume"
              :disabled="!valid"
              :loading="saving"
            >
              Create Resume
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
            <div v-if="resume.format === 'LaTeX' && latexPreview" v-html="latexPreview" class="latex-preview-wrapper"></div>
            <div v-else-if="resumePreview" v-html="resumePreview"></div>
            <div v-else class="text-center py-8">
              Fill in the resume details to see a preview
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';
import { jsPDF } from 'jspdf';
import { generateLatexPreview, downloadResumePdf } from '@/utils/resumeGeneratorSimple';
import { processRawLatex, generateLatexDocument } from '@/utils/latexCompiler';
import { latexTemplates } from '@/utils/templates';
import debounce from 'lodash/debounce';

const router = useRouter();
const resumeStore = useResumeStore();

const form = ref(null);
const valid = ref(false);
const activeTab = ref('personal');
const saving = ref(false);

// Form validation rules
const titleRules = [
  v => !!v || 'Title is required'
];

const emailRules = [
  v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
];

// Template options
const availableTemplates = [
  'Modern', 
  'Classic', 
  'Professional', 
  'Minimalist', 
  'Creative'
];

// Initialize resume object
const resume = reactive({
  title: '',
  format: 'LaTeX', // Set LaTeX as the only format
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
  education: [
    {
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
      current: false,
      location: '',
      description: ''
    }
  ],
  experience: [
    {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      location: '',
      description: ''
    }
  ],
  skills: {
    'Technical': [],
    'Soft Skills': []
  },
  projects: [
    {
      name: '',
      date: '',
      url: '',
      description: ''
    }
  ],
  social: [
    { platform: '', url: '' }
  ],
  certifications: [],
  languages: []
});

// Skills management
const skillCategories = computed(() => {
  return Object.keys(resume.skills);
});
const selectedSkillCategory = ref('Technical');
const newSkill = ref('');
const skillCategoryDialog = ref(false);
const newSkillCategory = ref('');

// Preview
const resumePreview = ref(null); 
const latexSourceSync = ref(null);

// Update preview function to handle the Promise
const updatePreview = async () => {
  if (!resume.personal.firstName && !resume.personal.lastName) {
    resumePreview.value = null;
    return;
  }

  try {
    // Only process LaTeX formats
    if (editorMode.value === 'form') {
      // Show loading state
      resumePreview.value = '<div class="loading-preview">Generating preview...</div>';
      
      // Generate LaTeX preview from resume data - await the Promise
      const previewContent = await generateLatexPreview(resume);
      resumePreview.value = previewContent;
      
      // Also update the latexSource for switching to LaTeX mode
      if (!latexSource.value) {
        latexSourceSync.value = await generateLatexDocument(resume, resume.template);
      }
    } else {
      // For LaTeX edit mode
      resumePreview.value = latexPreview.value;
    }
  } catch (error) {
    console.error('Error updating preview:', error);
    resumePreview.value = `<div class="error-message">Error generating preview: ${error.message}</div>`;
  }
};

// Update the watcher to observe ALL sections of the resume
watch(
  () => ({
    template: resume.template,
    personal: resume.personal,
    education: resume.education,
    experience: resume.experience,
    skills: resume.skills,
    projects: resume.projects,
    social: resume.social,
    certifications: resume.certifications,
    languages: resume.languages
  }),
  async () => {
    console.log("Resume data changed, updating preview...");
    updatePreview();
  },
  { deep: true }
);

// Add specific watchers for sections that might need more immediate updates
watch(() => resume.education, () => {
  console.log("Education updated, refreshing preview");
  updatePreview();
}, { deep: true });

watch(() => resume.experience, () => {
  console.log("Experience updated, refreshing preview");
  updatePreview();
}, { deep: true });

watch(() => resume.skills, () => {
  console.log("Skills updated, refreshing preview");
  updatePreview();
}, { deep: true });

onMounted(() => {
  updatePreview();
});
// Add a watcher to update the preview when the template changes
watch(() => resume.template, (newTemplate) => {
  // Force preview refresh when template changes
  console.log(`Template changed to: ${newTemplate}`);
});
// Education functions
function addEducation() {
  resume.education.push({
    institution: '',
    degree: '',
    startDate: '',
    endDate: '',
    current: false,
    location: '',
    description: ''
  });
}
function removeEducation(index) {
  resume.education.splice(index, 1);
  if (resume.education.length === 0) {
    addEducation();
  }
}
// Experience functions
function addExperience() {
  resume.experience.push({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    location: '',
    description: ''
  });
}
function removeExperience(index) {
  resume.experience.splice(index, 1);
  if (resume.experience.length === 0) {
    addExperience();
  }
}
// Projects functions
function addProject() {
  resume.projects.push({
    name: '',
    date: '',
    url: '',
    description: ''
  });
}
function removeProject(index) {
  resume.projects.splice(index, 1);
  if (resume.projects.length === 0) {
    addProject();
  }
}
// Skills functions
function addSkill() {
  if (!newSkill.value.trim()) return;
  if (!resume.skills[selectedSkillCategory.value]) {
    resume.skills[selectedSkillCategory.value] = [];
  }
  if (!resume.skills[selectedSkillCategory.value].includes(newSkill.value)) {
    resume.skills[selectedSkillCategory.value].push(newSkill.value);
  }
  newSkill.value = '';
}
function removeSkill(index) {
  resume.skills[selectedSkillCategory.value].splice(index, 1);
}
function addSkillCategory() {
  skillCategoryDialog.value = true;
}
function saveSkillCategory() {
  if (newSkillCategory.value.trim() && !resume.skills[newSkillCategory.value]) {
    resume.skills[newSkillCategory.value] = [];
    selectedSkillCategory.value = newSkillCategory.value;
  }
  newSkillCategory.value = '';
  skillCategoryDialog.value = false;
}
// Additional information functions
function addSocial() {
  resume.social.push({ platform: '', url: '' });
}
function removeSocial(index) {
  resume.social.splice(index, 1);
}
function addCertification() {
  resume.certifications.push({ name: '', issuer: '', date: '' });
}
function removeCertification(index) {
  resume.certifications.splice(index, 1);
}
function addLanguage() {
  resume.languages.push({ language: '', proficiency: 'Intermediate' });
}
function removeLanguage(index) {
  resume.languages.splice(index, 1);
}
// Save and export functions
async function saveResume() {
  if (!valid.value) return;
  saving.value = true;
  try {
    const result = await resumeStore.createResume(resume);
    router.push(`/editor/${result.id}`);
  } catch (error) {
    console.error('Error saving resume:', error);
    alert('Failed to save resume. Please try again.');
  } finally {
    saving.value = false;
  }
}
async function saveDraft() {
  saving.value = true;
  try {
    const draftResume = { ...resume, isDraft: true };
    const result = await resumeStore.createResume(draftResume);
    alert('Draft saved successfully!');
    router.push(`/dashboard`);
  } catch (error) {
    console.error('Error saving draft:', error);
    alert('Failed to save draft. Please try again.');
  } finally {
    saving.value = false;
  }
}
function downloadPdf() {
  try {
    pdfGenerating.value = true;
    
    if (editorMode.value === 'latex' && latexSource.value) {
      // If in LaTeX edit mode, use the LaTeX source directly
      downloadResumePdf(latexSource.value, true)
        .then(() => {
          pdfGenerating.value = false;
        })
        .catch(error => {
          console.error('Error downloading PDF:', error);
          alert('Error generating PDF: ' + error.message);
          pdfGenerating.value = false;
        });
    } else {
      // Otherwise use the resume object
      downloadResumePdf(resume)
        .then(() => {
          pdfGenerating.value = false;
        })
        .catch(error => {
          console.error('Error downloading PDF:', error);
          alert('Error generating PDF: ' + error.message);
          pdfGenerating.value = false;
        });
    }
  } catch (error) {
    console.error('Error initiating PDF download:', error);
    alert('Error preparing PDF: ' + error.message);
    pdfGenerating.value = false;
  }
}

// LaTeX editor related state
const editorMode = ref('form');
const latexSource = ref('');
const latexPreview = ref('');
const pdfGenerating = ref(false); // Add state for PDF generation

// Watch for format change to update LaTeX source
watch(() => resume.format, (newFormat) => {
  if (newFormat === 'LaTeX') {
    generateInitialLatexSource();
  } else {
    editorMode.value = 'form';
  }
});

// Generate the initial LaTeX source code from resume data
async function generateInitialLatexSource() {
  try {
    // Update UI to show loading state
    latexSource.value = 'Generating LaTeX source...';
    // Use await to get the actual LaTeX content
    const generatedContent = await generateLatexDocument(resume, resume.template);
    latexSource.value = generatedContent;
    latexSourceSync.value = generatedContent;
    updateLatexPreview();
  } catch (error) {
    console.error('Error generating LaTeX source:', error);
    latexSource.value = '% Error generating LaTeX source. Please try again.';
  }
}

// Handle LaTeX source changes
const latexSourceChanged = debounce(() => {
  updateLatexPreview();
}, 300);

// Update the LaTeX preview
const updateLatexPreview = () => {
  try {
    latexPreview.value = processRawLatex(latexSource.value);
  } catch (error) {
    console.error('Error updating LaTeX preview:', error);
    latexPreview.value = '<div class="error-message">Error generating preview</div>';
  }
};

// Apply a specific LaTeX template
async function applyLatexTemplate(templateName) {
  try {
    // Use the template service to get the template content
    const template = latexTemplates[templateName] || latexTemplates['Modern'];
    // Extract personal info to maintain it
    const personalInfo = {
      firstName: resume.personal.firstName || 'Your',
      lastName: resume.personal.lastName || 'Name',
      title: resume.personal.title || 'Professional Title',
      email: resume.personal.email || 'email@example.com',
      phone: resume.personal.phone || '',
      location: resume.personal.location || '',
      website: resume.personal.website || ''
    };
    // Generate new LaTeX with the selected template but keep personal info
    latexSource.value = `${template}
\\begin{document}
\\begin{center}
  {\\huge ${personalInfo.firstName} ${personalInfo.lastName}}\\vspace{0.5em}
  ${personalInfo.title ? `{\\large ${personalInfo.title}}` : ''}
\\end{center}
% Contact Information
\\begin{center}
  ${personalInfo.email ? `\\href{mailto:${personalInfo.email}}{${personalInfo.email}}` : ''}
  ${personalInfo.phone ? ` $\\cdot$ ${personalInfo.phone}` : ''}
  ${personalInfo.location ? ` $\\cdot$ ${personalInfo.location}` : ''}
  ${personalInfo.website ? ` $\\cdot$ \\href{${personalInfo.website}}{${personalInfo.website}}` : ''}
\\end{center}
\\section{Summary}
${resume.personal.summary || 'Your professional summary goes here.'}
% Add more sections for your resume content
\\section{Experience}
\\entry{Company Name}{Date Range}{Position Title}{Location}
% Add your work experience details here
\\section{Education}
\\entry{University Name}{Date Range}{Degree}{Location}
% Add your education details here
\\section{Skills}
% List your skills here
\\end{document}`;
    updateLatexPreview();
  } catch (error) {
    console.error('Error applying template:', error);
  }
}

// Try to extract resume data from LaTeX source code
function updateResumeFromLatex() {
  try {
    // This function would attempt to parse the LaTeX source and update the resume object
    // This is a complex operation and would require LaTeX parsing capabilities
    // For now, we'll implement a basic version that extracts a few key pieces of info
    // Extract name
    const nameMatch = latexSource.value.match(/\\begin{center}\s*{\\huge\s*([^}]+)}/);
    if (nameMatch) {
      const nameParts = nameMatch[1].trim().split(' ');
      if (nameParts.length >= 2) {
        resume.personal.firstName = nameParts[0];
        resume.personal.lastName = nameParts.slice(1).join(' ');
      }
    }
    // Extract title
    const titleMatch = latexSource.value.match(/{\\large\s*([^}]+)}/);
    if (titleMatch) {
      resume.personal.title = titleMatch[1].trim();
    }
    // Extract email
    const emailMatch = latexSource.value.match(/\\href{mailto:([^}]*)}{[^}]*}/);
    if (emailMatch) {
      resume.personal.email = emailMatch[1];
    }
    // Extract summary
    const summaryMatch = latexSource.value.match(/\\section{Summary}\s*([^\n]*(?:\n(?!\\section)[^\n]*)*)/);
    if (summaryMatch) {
      resume.personal.summary = summaryMatch[1].trim();
    }
    alert('Resume data has been updated from LaTeX source. Some complex elements may not have been captured.');
  } catch (error) {
    console.error('Error updating resume data from LaTeX:', error);
    alert('Error updating resume data from LaTeX. See console for details.');
  }
}

// Add watcher for editor mode to ensure preview is updated
watch(() => editorMode.value, async (newMode) => {
  if (newMode === 'latex' && resume.format === 'LaTeX') {
    // When switching to LaTeX mode, update the LaTeX source
    if (!latexSource.value || latexSource.value === 'Generating LaTeX source...') {
      if (latexSourceSync.value) {
        // Use already generated content if available
        latexSource.value = latexSourceSync.value;
        updateLatexPreview();
      } else {
        // Otherwise generate it
        await generateInitialLatexSource();
      }
    } else {
      updateLatexPreview();
    }
  } else if (newMode === 'form') {
    // When switching back to form mode, update the form preview
    updatePreview();
  }
});

// Update resume preview when format changes
watch(() => resume.format, (newFormat) => {
  if (newFormat === 'LaTeX') {
    generateInitialLatexSource();
  }
});
</script>
<style scoped>
.preview-container {
  height: 100%;
  max-height: 800px;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  contain: content; /* Improves performance and reduces layout thrashing */
  min-height: 400px; /* Provide a reasonable minimum height */
}

/* Add web fonts for different templates */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');

/* Add shadow effect on hover for template selection */
.template-option {
  transition: all 0.3s ease;
  cursor: pointer;
}

.template-option:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

.latex-editor {
  font-family: 'Courier New', monospace;
  line-height: 1.5;
}

.latex-preview-wrapper {
  font-family: 'Times New Roman', serif;
}

/* Enhanced LaTeX preview styling */
:deep(.latex-complete-preview) {
  height: 100%;
  overflow: hidden;
  max-height: 600px; /* Limit maximum height */
  width: 100%;
}

:deep(.compiled-view) {
  transform: scale(0.8);
  transform-origin: top center;
  height: auto;
  overflow: visible;
  max-width: 95%; /* Prevent overflow issues causing resize loops */
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

:deep(.tab-btn) {
  font-size: 0.85rem;
  padding: 4px 8px;
}

:deep(.tab-content) {
  padding: 8px;
}

:deep(.preview-tabs) {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: white;
}

:deep(.preview-content) {
  overflow: auto !important;
  height: 100% !important;
}

/* Error and loading states */
.error-message {
  color: #f44336;
  padding: 1rem;
  border: 1px solid #f44336;
  border-radius: 4px;
  background-color: #ffebee;
  margin: 1rem 0;
}

.loading-preview {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
}
</style>