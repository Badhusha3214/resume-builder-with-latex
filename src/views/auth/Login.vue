<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card>
          <v-card-title class="text-center pt-4">
            <h2 class="text-h4">Login</h2>
          </v-card-title>
          
          <v-alert
            v-if="infoMessage"
            type="info"
            closable
            class="mx-4"
          >
            {{ infoMessage }}
          </v-alert>
          
          <v-alert
            v-if="error"
            type="error"
            closable
            class="mx-4"
          >
            {{ error }}
          </v-alert>
          
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                prepend-icon="mdi-account"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                :type="showPassword ? 'text' : 'password'"
                required
              ></v-text-field>
              <v-btn
                block
                color="primary"
                size="large"
                type="submit"
                :loading="loading"
                :disabled="loading"
                class="mt-4"
              >
                Login
              </v-btn>
            </v-form>
            
            <div class="text-center mt-4">
              <p>Don't have an account? <router-link to="/register">Register</router-link></p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const valid = ref(false);
const form = ref(null);
const error = ref('');
const loading = ref(false);
const redirectPath = ref(route.query.redirect || '/dashboard');
const infoMessage = ref(route.query.message || '');

const emailRules = [
  v => !!v || 'Email is required',
  v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

const login = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  
  error.value = '';
  loading.value = true;
  
  try {
    await authStore.login(email.value, password.value);
    // Redirect to the original page or dashboard
    router.push(redirectPath.value);
  } catch (err) {
    error.value = err.message || 'Failed to login';
  } finally {
    loading.value = false;
  }
};

// Clear message after a delay
onMounted(() => {
  if (infoMessage.value) {
    setTimeout(() => {
      infoMessage.value = '';
    }, 5000);
  }
});
</script>

<style scoped>
.error-message {
  color: #ff5252;
}
</style>
