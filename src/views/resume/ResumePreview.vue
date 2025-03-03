<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Resume Preview</h1>
        <v-spacer></v-spacer>
        <v-btn color="secondary" variant="outlined" :to="`/editor/${resumeId}`" class="mr-2">
          <v-icon left>mdi-pencil</v-icon>
          Edit
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

    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            {{ resume.title }}
            <v-chip
              class="ml-2"
              :color="resume.format === 'LaTeX' ? 'primary' : 'success'"
              text-color="white"
              size="small"
            >
              {{ resume.format }}
            </v-chip>
            <v-chip class="ml-2" size="small">
              {{ resume.template }}
            </v-chip>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text>
            <div class="resume-preview pa-4" v-if="resumeContent" v-html="resumeContent"></div>
            <div v-else class="text-center py-12">
              <p>Unable to generate preview. Please try again.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';
import { generateMarkdownPreview, generateLatexPreview, downloadResumePdf } from '@/utils/resumeGenerator';

const route = useRoute();
const router = useRouter();
const resumeStore = useResumeStore();

const resumeId = route.params.id;
const loading = ref(true);
const resume = ref({});

const resumeContent = computed(() => {
  if (!resume.value || !resume.value.format) return null;

  if (resume.value.format === 'Markdown') {
    return generateMarkdownPreview(resume.value);
  } else {
    return generateLatexPreview(resume.value);
  }
});

onMounted(async () => {
  try {
    resume.value = await resumeStore.getResumeDetails(resumeId);
  } catch (error) {
    console.error('Error loading resume:', error);
    alert('Failed to load resume preview');
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
});

function downloadPdf() {
  downloadResumePdf(resume.value);
}
</script>

<style scoped>
.resume-preview {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
}

.latex-preview {
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
}

/* Add styles for LaTeX preview */
:deep(.latex-preview) {
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 0.85rem;
  background-color: #f8f8f8;
  border-radius: 4px;
  counter-reset: line;
}

:deep(.latex-preview .line) {
  padding-left: 3em;
  position: relative;
}

:deep(.latex-preview .line:hover) {
  background-color: #f0f0f0;
}

:deep(.latex-command) { 
  color: #0000FF; 
  font-weight: 500;
}

:deep(.latex-bracket) { 
  color: #AA0000; 
}

:deep(.latex-comment) { 
  color: #008800; 
  font-style: italic;
}

:deep(.latex-error) {
  color: #ff0000;
  padding: 1rem;
  border: 1px solid #ff0000;
  border-radius: 4px;
}
</style>
