<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Super Admin Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="loginSuperAdmin">
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
            </v-form>
            <div v-if="error" class="error-message text-center mt-3">
              {{ error }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="loading" @click="loginSuperAdmin" :disabled="!valid">
              Super Admin Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const valid = ref(false);
const form = ref(null);

const loading = ref(false);
const error = ref('');

const emailRules = [
  v => !!v || 'Email is required',
  v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

const loginSuperAdmin = async () => {
  if (!valid.value) return;

  loading.value = true;
  error.value = '';

  try {
    // Implement super admin login logic here
    // For example, you can call an API to authenticate the super admin
    // If successful, redirect to the super admin dashboard
    router.push('/superadmin/dashboard');
  } catch (err) {
    error.value = 'Login failed. Please check your credentials and try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.error-message {
  color: #ff5252;
}
</style>