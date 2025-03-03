<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Register</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="register">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
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
              <v-text-field
                v-model="confirmPassword"
                :rules="[...passwordRules, passwordMatch]"
                label="Confirm Password"
                name="confirmPassword"
                prepend-icon="mdi-lock-check"
                :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showConfirmPassword = !showConfirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
              ></v-text-field>
            </v-form>
            <div v-if="error" class="error-message text-center mt-3">
              {{ error }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="loading" @click="register" :disabled="!valid">
              Register
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            Already have an account? 
            <router-link to="/login">Login</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const valid = ref(false);
const form = ref(null);

const loading = computed(() => authStore.isLoading);
const error = computed(() => authStore.error);

const emailRules = [
  v => !!v || 'Email is required',
  v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

const passwordMatch = () => password.value === confirmPassword.value || 'Passwords do not match';

const register = async () => {
  if (!valid.value) return;
  
  try {
    await authStore.register(email.value, password.value);
    router.push('/dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
    // Error is already set in the store
  }
};
</script>

<style scoped>
.error-message {
  color: #ff5252;
}
</style>
