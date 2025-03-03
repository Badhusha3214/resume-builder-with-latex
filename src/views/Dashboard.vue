<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Resume Dashboard</h1>
        <v-btn color="primary" to="/builder" class="mb-6">
          <v-icon left>mdi-plus</v-icon>
          Create New Resume
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-row align="center">
              <v-col cols="12" sm="8" md="6">
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="12" sm="4" md="3" class="d-flex">
                <v-select
                  v-model="formatFilter"
                  :items="['All', 'LaTeX', 'Markdown']"
                  label="Format"
                  hide-details
                ></v-select>
              </v-col>
            </v-row>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredResumes"
            :search="search"
            :loading="loading"
            loading-text="Loading resumes..."
            no-data-text="No resumes found"
            class="elevation-1"
          >
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            <template v-slot:item.format="{ item }">
              <v-chip color="blue" size="small">LaTeX</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="mr-2" @click="editResume(item)">mdi-pencil</v-icon>
              <v-icon size="small" class="mr-2" @click="viewResume(item)">mdi-eye</v-icon>
              <v-icon size="small" class="mr-2" @click="downloadResume(item)">mdi-download</v-icon>
              <v-icon size="small" color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this resume? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteResume">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';

const router = useRouter();
const resumeStore = useResumeStore();

const search = ref('');
const formatFilter = ref('All');
const deleteDialog = ref(false);
const resumeToDelete = ref(null);

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Format', key: 'format' },
  { title: 'Template', key: 'template' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const loading = computed(() => resumeStore.isLoading);
const resumes = computed(() => resumeStore.getUserResumes);
const filteredResumes = computed(() => {
  if (formatFilter.value === 'All') {
    return resumes.value;
  }
  return resumes.value.filter(resume => resume.format === formatFilter.value);
});

onMounted(async () => {
  await resumeStore.fetchUserResumes();
});

const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds * 1000);
  return d.toLocaleDateString();
};

const editResume = (resume) => {
  router.push(`/editor/${resume.id}`);
};

const viewResume = (resume) => {
  // Preview functionality
  router.push(`/preview/${resume.id}`);
};

const downloadResume = (resume) => {
  // PDF download functionality
  // Would use jsPDF or vue-pdf to generate PDF
};

const confirmDelete = (resume) => {
  resumeToDelete.value = resume;
  deleteDialog.value = true;
};

const deleteResume = async () => {
  if (resumeToDelete.value) {
    await resumeStore.deleteResume(resumeToDelete.value.id);
    deleteDialog.value = false;
    resumeToDelete.value = null;
  }
};

function createNewResume() {
  router.push('/builder');
}
</script>
