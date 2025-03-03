import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

// --------------------------
// Super aggressive ResizeObserver error suppression
// --------------------------

// Monkey patch the Error constructor to intercept ResizeObserver errors at their source
const originalError = window.Error;
window.Error = function(message, ...args) {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
    // Create error but prevent it from appearing in console or being reported
    const error = new originalError('ResizeObserver loop suppressed', ...args);
    error.suppressed = true;
    return error;
  }
  return new originalError(message, ...args);
};

// More aggressive error suppression for console.error
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = args[0] && typeof args[0] === 'string' 
    ? args[0] 
    : (args[0] instanceof Error ? args[0].message : '');
  
  // Filter out all variations of ResizeObserver errors
  if (errorString.includes('ResizeObserver')) {
    return; // Completely suppress the error
  }
  
  // Pass through all other errors
  originalConsoleError(...args);
};

// Suppress errors in the webpack-dev-server overlay
if (process.env.NODE_ENV === 'development') {
  // Check if we're in webpack-dev-server context
  if (typeof __webpack_dev_server_client__ !== 'undefined') {
    const originalOnError = window.onerror;
    window.onerror = function(message, source, line, column, error) {
      if (message && typeof message === 'string' && message.includes('ResizeObserver')) {
        return true; // This prevents the error from propagating
      }
      return originalOnError ? originalOnError.call(this, message, source, line, column, error) : false;
    };
  }
}

// Create a more tolerant ResizeObserver wrapper
class SafeResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this._hasActiveObservation = false;
    this._timeoutId = null;
    
    this.observer = new ResizeObserver((...args) => {
      // Cancel any pending callback to prevent rapid succession calls
      if (this._timeoutId) {
        clearTimeout(this._timeoutId);
      }
      
      // Reschedule with debouncing
      this._timeoutId = setTimeout(() => {
        if (this._hasActiveObservation) {
          try {
            this.callback(...args);
          } catch (error) {
            console.warn('Error in ResizeObserver callback:', error);
          }
        }
      }, 100);
    });
  }
  
  observe(target) {
    this._hasActiveObservation = true;
    this.observer.observe(target);
  }
  
  unobserve(target) {
    this.observer.unobserve(target);
  }
  
  disconnect() {
    this._hasActiveObservation = false;
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this.observer.disconnect();
  }
}

// Make our safer version available globally
window.SafeResizeObserver = SafeResizeObserver;

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light'
  },
  // Add display optimization
  display: {
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Create and mount the app
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  // Skip reporting suppressed errors
  if (err && err.suppressed) {
    return;
  }
  
  // Check if this is a ResizeObserver error
  if (err && err.message && err.message.includes('ResizeObserver')) {
    return; // Silently ignore
  }
  
  // Log other errors as usual
  console.error('Vue error:', err, info);
};

app.mount('#app');
