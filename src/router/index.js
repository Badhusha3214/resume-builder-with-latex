import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Views
import Home from '@/views/Home.vue';
import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Dashboard from '@/views/Dashboard.vue';
import ResumeBuilder from '@/views/resume/ResumeBuilder.vue';
import ResumeEditor from '@/views/resume/ResumeEditor.vue';
import AdminPanel from '@/views/admin/AdminPanel.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/builder',
    name: 'ResumeBuilder',
    component: ResumeBuilder,
    meta: { requiresAuth: true }
  },
  {
    path: '/editor/:id',
    name: 'ResumeEditor',
    component: ResumeEditor,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true }
  },
  {
    path: '/latex-preview',
    name: 'LaTeXPreview',
    component: () => import('@/views/resume/LaTeXPreview.vue'),
    meta: {
      requiresAuth: false  
    }
  },
  {
    path: '/super-admin/login',
    name: 'SuperAdminLogin',
    component: () => import('@/views/superadmin/SuperAdminLogin.vue')
  },
  {
    path: '/super-admin/dashboard',
    name: 'SuperAdminDashboard',
    component: () => import('@/views/superadmin/SuperAdminDashboard.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for authentication
let isAuthReady = false;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAuthReady = true;
});

router.beforeEach((to, from, next) => {
  if (!isAuthReady) {
    // Wait for Firebase to initialize and determine if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      isAuthReady = true;
      unsubscribe();
      checkAuth(to, next);
    });
  } else {
    // Authentication state already determined, proceed
    checkAuth(to, next);
  }
});

function checkAuth(to, next) {
  if (to.meta.requiresAuth && !currentUser) {
    next('/login');
  } else if ((to.name === 'Login' || to.name === 'Register') && currentUser) {
    next('/dashboard');
  } else {
    next();
  }
}

export default router;
