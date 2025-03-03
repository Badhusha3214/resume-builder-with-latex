# Resume Builder Application

A Vue.js & Firebase-based resume builder application that allows users to create and manage resumes in LaTeX or Markdown format.

## Features

- **User Authentication**: Login & Sign Up using Firebase Authentication
- **Resume Builder**: Create resumes with real-time preview
- **Template System**: Choose from different layouts and styles
- **Export Options**: Download resumes as PDFs
- **Admin Panel**: Manage all your resumes in one place

## Tech Stack

- **Frontend**: Vue 3, Vue Router, Pinia (for state management), Vuetify 3
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **PDF Generation**: jsPDF
- **Markdown Rendering**: Marked
- **LaTeX Support**: latex.js

## Project Setup

```bash
# Install dependencies
npm install

# Configure Firebase
# Edit the firebaseConfig object in src/firebase/config.js with your Firebase project details

# Serve for development
npm run serve

# Build for production
npm run build
```

## Application Structure

- `/src/components`: Reusable Vue components
- `/src/views`: Page components
- `/src/stores`: Pinia stores for state management
- `/src/router`: Vue Router configuration
- `/src/firebase`: Firebase configuration and utilities

## Resume Features

The application supports creating resumes with the following sections:

- Personal Information
- Professional Summary
- Education
- Work Experience
- Skills (with categories)
- Projects
- Certifications
- Languages
- Social Links

## Template System

Choose from multiple resume templates:

- Modern
- Classic
- Professional
- Minimalist
- Creative

Each template is available in both LaTeX and Markdown formats.

## License

[MIT License](LICENSE)
"# resume-builder-with-latex" 
