<template>
  <div>
    <v-row class="hero-section align-center" style="min-height: 80vh;">
      <v-col cols="12" md="6">
        <h1 class="text-h2 font-weight-bold mb-6">Create Professional Resumes with Ease</h1>
        <p class="text-h6 mb-6">
          Build and customize your resume in minutes with our intuitive resume builder. 
          Choose from a variety of templates and export your resume in LaTeX or Markdown format.
        </p>
        <div class="d-flex">
          <v-btn 
            color="primary" 
            size="large" 
            :to="authStore.isAuthenticated ? '/dashboard' : '/register'"
            class="mr-4"
          >
            {{ authStore.isAuthenticated ? 'My Dashboard' : 'Get Started' }}
          </v-btn>
          <v-btn 
            variant="outlined" 
            color="primary" 
            size="large" 
            to="#features"
          >
            Learn More
          </v-btn>
        </div>
      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-center">
        <v-img
          max-width="500"
          src="https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126883_960_720.png"
          alt="Resume illustration"
        ></v-img>
      </v-col>
    </v-row>

    <v-row id="features" class="my-12">
      <v-col cols="12" class="text-center">
        <h2 class="text-h3 mb-6">Features</h2>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="text-center">
            <v-icon size="64" color="primary">mdi-file-document</v-icon>
            <h3 class="text-h5 my-4">Multiple Formats</h3>
            <p>Create resumes in LaTeX or Markdown format. Export your resume as a PDF with a single click.</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="text-center">
            <v-icon size="64" color="primary">mdi-palette</v-icon>
            <h3 class="text-h5 my-4">Beautiful Templates</h3>
            <p>Choose from a variety of modern, classic, and professional templates.</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-text class="text-center">
            <v-icon size="64" color="primary">mdi-account-group</v-icon>
            <h3 class="text-h5 my-4">User-Friendly</h3>
            <p>Intuitive interface that guides you through the resume creation process.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="my-12">
      <v-col cols="12" class="text-center">
        <h2 class="text-h3 mb-6">How It Works</h2>
      </v-col>
      
      <v-col cols="12">
        <v-timeline align="start">
          <v-timeline-item dot-color="primary" size="large">
            <template v-slot:opposite>
              <span class="text-h6">Step 1</span>
            </template>
            <v-card>
              <v-card-title class="text-h6">Create an Account</v-card-title>
              <v-card-text>
                Sign up and create your account to access all features.
              </v-card-text>
            </v-card>
          </v-timeline-item>
          
          <v-timeline-item dot-color="primary" size="large">
            <template v-slot:opposite>
              <span class="text-h6">Step 2</span>
            </template>
            <v-card>
              <v-card-title class="text-h6">Create Your Resume</v-card-title>
              <v-card-text>
                Fill in your details, add your experience, skills, and education.
              </v-card-text>
            </v-card>
          </v-timeline-item>
          
          <v-timeline-item dot-color="primary" size="large">
            <template v-slot:opposite>
              <span class="text-h6">Step 3</span>
            </template>
            <v-card>
              <v-card-title class="text-h6">Choose Your Template</v-card-title>
              <v-card-text>
                Select from a variety of templates that suit your style and industry.
              </v-card-text>
            </v-card>
          </v-timeline-item>
          
          <v-timeline-item dot-color="primary" size="large">
            <template v-slot:opposite>
              <span class="text-h6">Step 4</span>
            </template>
            <v-card>
              <v-card-title class="text-h6">Export and Share</v-card-title>
              <v-card-text>
                Download your resume as a PDF and share it with potential employers.
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-col>
    </v-row>

    <v-row class="my-12 align-center">
      <v-col cols="12" class="text-center">
        <h2 class="text-h3 mb-8">Ready to Create Your Professional Resume?</h2>
        <v-btn 
          color="primary" 
          size="x-large" 
          :to="authStore.isAuthenticated ? '/dashboard' : '/register'"
        >
          {{ authStore.isAuthenticated ? 'Go to Dashboard' : 'Get Started Now' }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.hero-section {
  background-color: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}
</style>
