<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-title>
      <router-link to="/" class="text-decoration-none text-white">
        Resume Builder
      </router-link>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- LaTeX Editor should be visible to all users -->
    <v-btn 
      variant="text" 
      class="hidden-sm-and-down" 
      @click="navigateTo('/latex-preview')"
    >Resume Editor</v-btn>

    <!-- Navigation links for authenticated users -->
    <template v-if="authStore.isAuthenticated">
      <v-btn to="/dashboard" variant="text" class="hidden-sm-and-down">Dashboard</v-btn>
      <v-btn to="/builder" variant="text" class="hidden-sm-and-down">Create Resume</v-btn>
      <v-btn to="/admin" variant="text" class="hidden-sm-and-down">Admin Panel</v-btn>
      
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/admin">
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

    <!-- Navigation links for non-authenticated users -->
    <template v-else>
      <v-btn to="/login" variant="text">Login</v-btn>
      <v-btn to="/register" color="secondary">Register</v-btn>
    </template>

    <!-- Mobile menu -->
    <v-btn
      v-if="authStore.isAuthenticated"
      @click="drawer = !drawer"
      icon
      class="d-sm-flex d-md-none"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-app-bar>

  <!-- Mobile navigation drawer -->
  <v-navigation-drawer
    v-model="drawer"
    temporary
    right
  >
    <v-list>
      <!-- LaTeX Editor should be visible to all users in the mobile menu too -->
      <v-list-item @click="(e) => { e.preventDefault(); navigateTo('/latex-preview'); }">
        <template v-slot:prepend>
          <v-icon>mdi-file-document-edit</v-icon>
        </template>
        <v-list-item-title>Resume Editor</v-list-item-title>
      </v-list-item>
      
      <!-- Only show these items for authenticated users -->
      <template v-if="authStore.isAuthenticated">
        <v-list-item to="/dashboard">
          <template v-slot:prepend>
            <v-icon>mdi-view-dashboard</v-icon>
          </template>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/builder">
          <template v-slot:prepend>
            <v-icon>mdi-file-document-edit</v-icon>
          </template>
          <v-list-item-title>Create Resume</v-list-item-title>
        </v-list-item>

        <v-list-item to="/admin">
          <template v-slot:prepend>
            <v-icon>mdi-account-cog</v-icon>
          </template>
          <v-list-item-title>Admin Panel</v-list-item-title>
        </v-list-item>
        
        <v-divider></v-divider>
        
        <v-list-item @click="logout">
          <template v-slot:prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </template>
      
      <!-- Show these items for non-authenticated users in mobile menu -->
      <template v-else>
        <v-list-item to="/login">
          <template v-slot:prepend>
            <v-icon>mdi-login</v-icon>
          </template>
          <v-list-item-title>Login</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/register">
          <template v-slot:prepend>
            <v-icon>mdi-account-plus</v-icon>
          </template>
          <v-list-item-title>Register</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const drawer = ref(false);

// Track navigation to prevent multiple clicks
let isNavigating = false;

// Function to safely navigate without causing layouting issues
const navigateTo = (route) => {
  if (isNavigating) return;
  isNavigating = true;
  
  // Close drawer if open
  drawer.value = false;
  
  // Use setTimeout to ensure any animations complete first
  setTimeout(() => {
    router.push(route).finally(() => {
      // Reset flag after navigation completes
      setTimeout(() => {
        isNavigating = false;
      }, 300);
    });
  }, 50);
};

// Enhanced logout function
const logout = async () => {
  try {
    drawer.value = false; // Close drawer first
    await authStore.logout();
    
    // Navigate after a short delay to allow for UI updates
    setTimeout(() => {
      router.push('/login');
    }, 100);
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Handle cleanup
onMounted(() => {
  // Set an event listener to handle transit
  window.addEventListener('beforeunload', () => {
    drawer.value = false;
  });
});

onUnmounted(() => {
  // Clean up any event listeners if needed
});
</script>
