<template>
  <v-container>
    <h2 class="text-h5 mb-4">Super Admin Dashboard</h2>
    <v-alert
      v-if="error"
      type="error"
      outlined
      class="mb-4"
    >
      {{ error }}
    </v-alert>
    
    <!-- Navigation Tabs -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="users">Users</v-tab>
      <v-tab value="templates">Templates</v-tab>
    </v-tabs>
    
    <!-- Users Tab -->
    <v-window v-model="activeTab">
      <v-window-item value="users">
        <v-progress-circular
          v-if="loading"
          size="40"
          color="primary"
          indeterminate
          class="mb-4"
        />
        <div v-else>
          <v-btn color="primary" class="mb-4" @click="openAddDialog">Add User</v-btn>
          
          <!-- User table -->
          <v-data-table
            :headers="userHeaders"
            :items="users"
            class="elevation-1"
          >
            <template v-slot:item.banned="{ item }">
              <v-chip
                :color="item.banned ? 'error' : 'success'"
                text-color="white"
                size="small"
              >
                {{ item.banned ? 'Banned' : 'Active' }}
              </v-chip>
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-btn
                :color="item.banned ? 'success' : 'error'"
                variant="outlined"
                size="small"
                class="mr-2"
                @click="toggleBanUser(item)"
              >
                {{ item.banned ? 'Unban' : 'Ban' }}
              </v-btn>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="openEditDialog(item)"
              >
                Edit
              </v-btn>
            </template>
          </v-data-table>
        </div>
      </v-window-item>
      
      <!-- Templates Tab -->
      <v-window-item value="templates">
        <v-progress-circular
          v-if="loadingTemplates"
          size="40"
          color="primary"
          indeterminate
          class="mb-4"
        />
        <div v-else>
          <v-btn color="primary" class="mb-4" @click="openAddTemplateDialog">
            <v-icon start>mdi-plus</v-icon>
            Add Template
          </v-btn>
          
          <v-row>
            <v-col cols="12" md="4" v-for="(template, index) in templates" :key="index" class="mb-4">
              <v-card>
                <v-img
                  height="160"
                  :src="getTemplateThumbnail(template.name)"
                  class="align-end"
                  gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
                >
                  <v-card-title class="text-white">{{ template.name }}</v-card-title>
                </v-img>
                <v-card-text>
                  <v-chip class="mr-2">{{ template.format }}</v-chip>
                  <v-chip :color="template.active ? 'success' : 'error'">
                    {{ template.active ? 'Active' : 'Inactive' }}
                  </v-chip>
                  <p class="mt-2">{{ template.description || 'No description available' }}</p>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="primary" variant="text" @click="editTemplate(template)">
                    Edit
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-switch
                    v-model="template.active"
                    @change="updateTemplateStatus(template)"
                    label="Active"
                    hide-details
                    inset
                    density="compact"
                    :disabled="updatingTemplates[template.id]"
                  ></v-switch>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-window-item>
    </v-window>

    <!-- User Dialogs -->
    <v-dialog v-model="addDialog" max-width="500px">
      <v-card>
        <v-card-title>Add New User</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createUser">
            <v-text-field v-model="newUser.email" label="Email" required />
            <!-- Other fields as needed -->
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="addDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createUser">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title>Edit User</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateUser">
            <v-text-field v-model="selectedUser.email" label="Email" required />
            <!-- Other fields as needed -->
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="updateUser">Update</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Template Dialogs -->
    <v-dialog v-model="templateDialog" max-width="900px">
      <v-card>
        <v-card-title>
          {{ editingTemplate.id ? 'Edit Template' : 'Add Template' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveTemplate">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingTemplate.name"
                  label="Template Name"
                  required
                  :rules="[v => !!v || 'Template name is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingTemplate.format"
                  :items="['LaTeX', 'Markdown', 'Both']"
                  label="Format"
                  required
                ></v-select>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="editingTemplate.description"
              label="Description"
              rows="2"
            ></v-textarea>
            
            <v-divider class="my-4"></v-divider>
            
            <!-- LaTeX Template Content -->
            <div v-if="editingTemplate.format === 'LaTeX' || editingTemplate.format === 'Both'">
              <h3 class="text-h6 mb-2">LaTeX Template</h3>
              <v-textarea
                v-model="editingTemplate.latexContent"
                label="LaTeX Preamble"
                rows="10"
                class="font-family-monospace"
                filled
                hint="Enter the LaTeX preamble (content before \begin{document})"
                persistent-hint
              ></v-textarea>
            </div>
            
            <!-- Markdown Template Content -->
            <div v-if="editingTemplate.format === 'Markdown' || editingTemplate.format === 'Both'" class="mt-4">
              <h3 class="text-h6 mb-2">Markdown Template</h3>
              <v-textarea
                v-model="editingTemplate.cssContent"
                label="CSS Styles"
                rows="10"
                class="font-family-monospace"
                filled
                hint="Enter the CSS styles for this template"
                persistent-hint
              ></v-textarea>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="templateDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveTemplate" :loading="savingTemplate">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { latexTemplates, templateStyles } from '@/utils/templates';

// Existing user state
const users = ref([]);
const loading = ref(true);
const error = ref('');
const addDialog = ref(false);
const editDialog = ref(false);
const newUser = ref({ email: '' });
const selectedUser = ref({});

// New template state
const activeTab = ref('users');
const templates = ref([]);
const loadingTemplates = ref(false);
const templateDialog = ref(false);
const savingTemplate = ref(false);
const editingTemplate = ref({
  name: '',
  format: 'LaTeX',
  description: '',
  active: true,
  latexContent: '',
  cssContent: ''
});

// Add a reactive object to track which templates are being updated
const updatingTemplates = ref({});

// Headers
const userHeaders = [
  { title: 'Email', key: 'email', align: 'start', sortable: true },
  { title: 'Status', key: 'banned', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

// User functions
const fetchUsers = async () => {
  try {
    loading.value = true;
    const snapshot = await getDocs(collection(db, 'users'));
    
    // Debug log to see the data
    console.log("Fetched users:", snapshot.docs.map(doc => doc.data()));
    
    users.value = snapshot.docs.map(docItem => ({
      id: docItem.id,
      ...docItem.data()
    }));
  } catch (err) {
    console.error("Error fetching users:", err);
    error.value = 'Failed to fetch users: ' + err.message;
  } finally {
    loading.value = false;
  }
};

// Updated to toggle ban status
const toggleBanUser = async (user) => {
  try {
    const newStatus = !user.banned;
    await updateDoc(doc(db, 'users', user.id), { banned: newStatus });
    
    // Update local state
    users.value = users.value.map(u =>
      u.id === user.id ? { ...u, banned: newStatus } : u
    );
  } catch (err) {
    console.error("Error updating user ban status:", err);
    error.value = `Failed to ${user.banned ? 'unban' : 'ban'} user.`;
  }
};

function openAddDialog() {
  newUser.value = { email: '', banned: false };
  addDialog.value = true;
}

async function createUser() {
  try {
    const docRef = await addDoc(collection(db, 'users'), { 
      ...newUser.value, 
      banned: false,
      createdAt: new Date() // Add creation timestamp
    });
    
    // Add the new user to the local users array for immediate display
    users.value.push({
      id: docRef.id,
      ...newUser.value,
      banned: false
    });
    
    // Show success message
    alert('User created successfully!');
    
    // Close dialog
    addDialog.value = false;
  } catch (err) {
    console.error("Error creating user:", err);
    error.value = 'Failed to create user: ' + err.message;
  }
}

function openEditDialog(user) {
  selectedUser.value = { ...user };
  editDialog.value = true;
}

async function updateUser() {
  try {
    await updateDoc(doc(db, 'users', selectedUser.value.id), {
      email: selectedUser.value.email,
      banned: selectedUser.value.banned || false
    });
    editDialog.value = false;
    fetchUsers(); // Re-fetch or update users list
  } catch (err) {
    error.value = 'Failed to update user: ' + err.message;
  }
}

// Template functions
const fetchTemplates = async () => {
  try {
    loadingTemplates.value = true;
    const snapshot = await getDocs(collection(db, 'templates'));
    
    if (snapshot.empty) {
      // If no templates exist in the database, populate with defaults
      await initializeDefaultTemplates();
      return fetchTemplates();
    }
    
    templates.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Error fetching templates:", err);
    error.value = 'Failed to fetch templates: ' + err.message;
  } finally {
    loadingTemplates.value = false;
  }
};

const initializeDefaultTemplates = async () => {
  try {
    // Create default templates from the existing templates.js
    const defaultTemplates = [
      {
        name: 'Modern',
        format: 'Both',
        active: true,
        description: 'A clean, modern template with bold colors and clear section dividers.',
        latexContent: latexTemplates.Modern,
        cssContent: templateStyles.Modern
      },
      {
        name: 'Classic',
        format: 'Both',
        active: true,
        description: 'Traditional resume format suitable for all industries.',
        latexContent: latexTemplates.Classic,
        cssContent: templateStyles.Classic
      },
      {
        name: 'Professional',
        format: 'Both',
        active: true,
        description: 'Formal template ideal for corporate applications.',
        latexContent: latexTemplates.Professional,
        cssContent: templateStyles.Professional
      },
      {
        name: 'Minimalist',
        format: 'Both',
        active: true,
        description: 'Simple, clean design focusing on content rather than style.',
        latexContent: latexTemplates.Minimalist,
        cssContent: templateStyles.Minimalist
      },
      {
        name: 'Creative',
        format: 'Both',
        active: true,
        description: 'Stand out with this creative template for design and tech roles.',
        latexContent: latexTemplates.Creative,
        cssContent: templateStyles.Creative
      }
    ];
    
    // Add each template to Firestore
    const promises = defaultTemplates.map(template => 
      addDoc(collection(db, 'templates'), template)
    );
    
    await Promise.all(promises);
    console.log("Default templates created");
  } catch (err) {
    console.error("Error creating default templates:", err);
    error.value = 'Failed to initialize templates: ' + err.message;
  }
};

const openAddTemplateDialog = () => {
  editingTemplate.value = {
    name: '',
    format: 'LaTeX',
    description: '',
    active: true,
    latexContent: '',
    cssContent: ''
  };
  templateDialog.value = true;
};

const editTemplate = (template) => {
  editingTemplate.value = { ...template };
  templateDialog.value = true;
};

const saveTemplate = async () => {
  if (!editingTemplate.value.name) {
    error.value = 'Template name is required';
    return;
  }
  
  try {
    savingTemplate.value = true;
    
    const templateData = {
      name: editingTemplate.value.name,
      format: editingTemplate.value.format,
      description: editingTemplate.value.description,
      active: editingTemplate.value.active,
      latexContent: editingTemplate.value.latexContent,
      cssContent: editingTemplate.value.cssContent,
      updatedAt: new Date()
    };
    
    if (editingTemplate.value.id) {
      // Update existing template
      await updateDoc(doc(db, 'templates', editingTemplate.value.id), templateData);
      
      // Update local state
      const index = templates.value.findIndex(t => t.id === editingTemplate.value.id);
      if (index !== -1) {
        templates.value[index] = { 
          ...templates.value[index], 
          ...templateData 
        };
      }
    } else {
      // Create new template
      templateData.createdAt = new Date();
      const docRef = await addDoc(collection(db, 'templates'), templateData);
      
      // Add to local state
      templates.value.push({
        id: docRef.id,
        ...templateData
      });
    }
    
    templateDialog.value = false;
  } catch (err) {
    console.error("Error saving template:", err);
    error.value = 'Failed to save template: ' + err.message;
  } finally {
    savingTemplate.value = false;
  }
};

const updateTemplateStatus = async (template) => {
  try {
    // Set this template as updating
    updatingTemplates.value[template.id] = true;
    
    await updateDoc(doc(db, 'templates', template.id), { 
      active: template.active,
      updatedAt: new Date()
    });
    
    // Show success message
    console.log(`Template "${template.name}" ${template.active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    console.error("Error updating template status:", err);
    error.value = `Failed to update template status: ${err.message}`;
    // Revert the UI change if the update fails
    template.active = !template.active;
  } finally {
    // Clear the updating state
    updatingTemplates.value[template.id] = false;
  }
};

const getTemplateThumbnail = (templateName) => {
  // In a real app, you would have actual template thumbnails or generate previews
  const colors = {
    'Modern': '3498db',
    'Classic': '2c3e50',
    'Professional': '1a5276',
    'Minimalist': '7f8c8d',
    'Creative': 'e74c3c'
  };
  
  const color = colors[templateName] || '999999';
  return `https://via.placeholder.com/400x200/${color}?text=${encodeURIComponent(templateName)}+Template`;
};

// Initial data loading
onMounted(() => {
  fetchUsers();
  fetchTemplates();
});
</script>

<style scoped>
.font-family-monospace {
  font-family: monospace;
}
</style>