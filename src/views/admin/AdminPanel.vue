<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Admin Panel</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-list>
            <v-list-item
              v-for="(item, i) in menuItems"
              :key="i"
              :value="item"
              @click="activeSection = item.value"
              :active="activeSection === item.value"
              :disabled="item.disabled"
              class="mb-2"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <!-- Resume Statistics Section -->
        <v-card v-if="activeSection === 'statistics'" class="mb-4">
          <v-card-title>Resume Statistics</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <div class="text-h4">{{ resumes.length }}</div>
                  <div class="text-subtitle-1">Total Resumes</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <div class="text-h4">{{ markdownCount }}</div>
                  <div class="text-subtitle-1">Markdown Resumes</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <div class="text-h4">{{ latexCount }}</div>
                  <div class="text-subtitle-1">LaTeX Resumes</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Resume Management Section -->
        <v-card v-if="activeSection === 'resumes'" class="mb-4">
          <v-card-title>
            <div>Resume Management</div>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              density="compact"
              class="max-width-200"
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="resumes"
            :search="search"
            :loading="loading"
            class="elevation-1"
          >
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            <template v-slot:item.updatedAt="{ item }">
              {{ formatDate(item.updatedAt) }}
            </template>
            <template v-slot:item.format="{ item }">
              <v-chip
                :color="item.format === 'LaTeX' ? 'primary' : 'success'"
                text-color="white"
                size="small"
              >
                {{ item.format }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="mr-2" @click="viewResume(item)">mdi-eye</v-icon>
              <v-icon size="small" class="mr-2" @click="editResume(item)">mdi-pencil</v-icon>
              <v-icon size="small" color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-card>

        <!-- Templates Section -->
        <v-card v-if="activeSection === 'templates'" class="mb-4">
          <v-card-title>Template Management</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" v-for="template in templates" :key="template.id">
                <v-card variant="outlined">
                  <v-img
                    height="200"
                    :src="template.image"
                    cover
                  ></v-img>
                  <v-card-title>{{ template.name }}</v-card-title>
                  <v-card-text>
                    <div class="mb-2">Format: {{ template.format }}</div>
                    <div>{{ template.description }}</div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn color="primary" variant="text">Edit</v-btn>
                    <v-spacer></v-spacer>
                    <v-switch
                      v-model="template.active"
                      label="Active"
                      hide-details
                      inset
                      density="compact"
                    ></v-switch>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Settings Section -->
        <v-card v-if="activeSection === 'settings'" class="mb-4">
          <v-card-title>Account Settings</v-card-title>
          <v-card-text>
            <v-form ref="settingsForm" @submit.prevent="saveSettings">
              <v-text-field
                v-model="userSettings.displayName"
                label="Display Name"
              ></v-text-field>
              
              <v-text-field
                v-model="userSettings.email"
                label="Email"
                disabled
              ></v-text-field>
              
              <v-divider class="my-4"></v-divider>
              
              <v-checkbox
                v-model="userSettings.emailNotifications"
                label="Receive Email Notifications"
              ></v-checkbox>
              
              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="settingsSaving"
              >
                Save Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Delete Resume</v-card-title>
        <v-card-text>
          Are you sure you want to delete this resume? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteItemConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useResumeStore } from '@/stores/resumes';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const resumeStore = useResumeStore();
const authStore = useAuthStore();

// Navigation
const activeSection = ref('statistics');
const menuItems = [
  { title: 'Dashboard', value: 'statistics', icon: 'mdi-chart-box' },
  { title: 'Resumes', value: 'resumes', icon: 'mdi-file-document-multiple' },
  { title: 'Templates', value: 'templates', icon: 'mdi-file-document-edit' },
  { title: 'Settings', value: 'settings', icon: 'mdi-cog' }
];

// Resume management
const search = ref('');
const loading = computed(() => resumeStore.isLoading);
const resumes = computed(() => resumeStore.getUserResumes);
const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Updated', key: 'updatedAt' },
  { title: 'Format', key: 'format' },
  { title: 'Template', key: 'template' },
  { title: 'Actions', key: 'actions', sortable: false }
];

// Resume statistics
const markdownCount = computed(() => resumes.value.filter(r => r.format === 'Markdown').length);
const latexCount = computed(() => resumes.value.filter(r => r.format === 'LaTeX').length);

// Templates
const templates = ref([
  {
    id: 1,
    name: 'Modern',
    format: 'Both',
    active: true,
    description: 'A clean, modern template with a sidebar for key information.',
    image: 'https://via.placeholder.com/300x200?text=Modern+Template'
  },
  {
    id: 2,
    name: 'Classic',
    format: 'Both',
    active: true,
    description: 'Traditional resume format suitable for all industries.',
    image: 'https://via.placeholder.com/300x200?text=Classic+Template'
  },
  {
    id: 3,
    name: 'Professional',
    format: 'LaTeX',
    active: true,
    description: 'Formal template ideal for corporate applications.',
    image: 'https://via.placeholder.com/300x200?text=Professional+Template'
  },
  {
    id: 4,
    name: 'Minimalist',
    format: 'Markdown',
    active: true,
    description: 'Simple, clean design focusing on content rather than style.',
    image: 'https://via.placeholder.com/300x200?text=Minimalist+Template'
  },
  {
    id: 5,
    name: 'Creative',
    format: 'Both',
    active: true,
    description: 'Stand out with this creative template for design and tech roles.',
    image: 'https://via.placeholder.com/300x200?text=Creative+Template'
  }
]);

// User settings
const user = computed(() => authStore.user);
const userSettings = ref({
  displayName: '',
  email: '',
  emailNotifications: true
});
const settingsSaving = ref(false);

// Delete dialog
const deleteDialog = ref(false);
const itemToDelete = ref(null);

onMounted(async () => {
  await resumeStore.fetchUserResumes();
  
  // Load user settings
  if (user.value) {
    userSettings.value.email = user.value.email;
    userSettings.value.displayName = user.value.displayName || '';
    // In a real app, you would fetch user preferences from Firestore
  }
});

// Resume actions
function viewResume(item) {
  router.push(`/preview/${item.id}`);
}

function editResume(item) {
  router.push(`/editor/${item.id}`);
}

function confirmDelete(item) {
  deleteDialog.value = true;
  itemToDelete.value = item;
}

function closeDelete() {
  deleteDialog.value = false;
  itemToDelete.value = null;
}

async function deleteItemConfirm() {
  if (itemToDelete.value) {
    try {
      await resumeStore.deleteResume(itemToDelete.value.id);
      closeDelete();
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  }
}

// Settings
async function saveSettings() {
  settingsSaving.value = true;
  try {
    // In a real app, you would update user settings in Firebase
    console.log('Saving settings:', userSettings.value);
    alert('Settings saved successfully');
    settingsSaving.value = false;
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings');
    settingsSaving.value = false;
  }
}

// Utilities
function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds * 1000);
  return d.toLocaleDateString();
}
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}
</style>