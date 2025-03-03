<template>
  <v-app>
    <Header v-if="showHeader" />
    <v-main>
      <v-container fluid>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
    <Footer v-if="showFooter" />
  </v-app>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/layout/Header.vue';
import Footer from '@/components/layout/Footer.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

// Only show header and footer on certain routes
const showHeader = computed(() => route.name !== 'Login' && route.name !== 'Register');
const showFooter = computed(() => route.name !== 'Login' && route.name !== 'Register');

// Check if user is logged in when the app starts
authStore.initAuth();
</script>

<style>
/* Global styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fix for ResizeObserver issues */
body {
  overflow-x: hidden;
}

/* Prevent layout shifts with fixed container sizing */
.v-application {
  contain: paint layout;
}

/* Force content to respect container boundaries */
* {
  max-width: 100%;
  box-sizing: border-box;
}

/* Performance optimization for LaTeX components */
.latex-complete-preview,
.compiled-view,
.preview-container {
  contain: content;
  content-visibility: auto;
}
</style>
