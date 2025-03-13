import { db } from '@/firebase/config';
import { collection, getDocs, getDoc, doc, query, where, addDoc, setDoc } from 'firebase/firestore';
import { latexTemplates, templateStyles } from './templates';

// Cache templates locally to avoid repeated database queries
const templateCache = {
  initialized: false,
  templates: null,
  lastFetch: 0
};

/**
 * Service to handle operations related to resume templates
 */
export const templateService = {
  /**
   * Gets all available templates
   * @param {Boolean} activeOnly - Whether to fetch only active templates
   * @param {Boolean} useCache - Whether to use cached templates if available
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplates(activeOnly = false, useCache = true) {
    try {
      // Check if we can use the cache
      const now = Date.now();
      if (useCache && templateCache.templates && now - templateCache.lastFetch < 300000) { // 5 minutes cache
        console.log('Using cached templates');
        return activeOnly 
          ? templateCache.templates.filter(t => t.active) 
          : templateCache.templates;
      }
      
      // Try to fetch from database
      let templateQuery;
      
      if (activeOnly) {
        templateQuery = query(collection(db, 'templates'), where('active', '==', true));
      } else {
        templateQuery = collection(db, 'templates');
      }
      
      const snapshot = await getDocs(templateQuery);
      
      if (snapshot.empty && !templateCache.initialized) {
        console.log('No templates found in database, initializing default templates');
        await this.initializeDefaultTemplates();
        templateCache.initialized = true;
        
        // Re-fetch templates after initialization
        return this.getTemplates(activeOnly, false);
      }
      
      // Update cache
      templateCache.templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      templateCache.lastFetch = now;
      
      return activeOnly 
        ? templateCache.templates.filter(t => t.active) 
        : templateCache.templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // If database fetch fails, return hardcoded templates as fallback
      if (!templateCache.initialized) {
        console.log('Using hardcoded templates as fallback');
        const fallbackTemplates = this.getHardcodedTemplatesArray();
        
        return activeOnly 
          ? fallbackTemplates.filter(t => t.active !== false)
          : fallbackTemplates;
      }
      
      throw error;
    }
  },
  
  /**
   * Gets a specific template by ID
   * @param {String} templateId - The template ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplateById(templateId) {
    try {
      const templateDoc = await getDoc(doc(db, 'templates', templateId));
      if (!templateDoc.exists()) {
        throw new Error('Template not found');
      }
      
      return {
        id: templateDoc.id,
        ...templateDoc.data()
      };
    } catch (error) {
      console.error(`Error fetching template with ID ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Gets LaTeX content for a template
   * @param {String} templateName - The template name
   * @returns {Promise<String>} LaTeX content
   */
  async getLatexTemplate(templateName) {
    try {
      // First look for the template in the database
      let templates;
      try {
        templates = await this.getTemplates(true, true);
      } catch (dbError) {
        console.error('Database error fetching templates:', dbError);
        // Return hardcoded template immediately rather than throwing
        return latexTemplates[templateName] || latexTemplates['Modern'];
      }
      
      const template = templates.find(t => t.name === templateName);
      
      if (template && template.latexContent) {
        return template.latexContent;
      }
      
      // If no match in database or no latexContent, use hardcoded template
      if (latexTemplates[templateName]) {
        return latexTemplates[templateName];
      }
      
      // If templateName doesn't match any, fall back to Modern
      return latexTemplates['Modern'];
    } catch (error) {
      console.error('Error in getLatexTemplate:', error);
      // Return hardcoded template as fallback
      return latexTemplates[templateName] || latexTemplates['Modern'];
    }
  },
  
  /**
   * Gets CSS content for a template
   * @param {String} templateName - The template name
   * @returns {Promise<String>} CSS content
   */
  async getCssTemplate(templateName) {
    try {
      // First look for the template in the database
      let templates;
      try {
        templates = await this.getTemplates(true, true);
      } catch (dbError) {
        // Return hardcoded template immediately rather than throwing
        return templateStyles[templateName] || templateStyles['Modern'];
      }
      
      const template = templates.find(t => t.name === templateName);
      
      if (template && template.cssContent) {
        return template.cssContent;
      }
      
      // If no match in database or no cssContent, use hardcoded template
      if (templateStyles[templateName]) {
        return templateStyles[templateName];
      }
      
      // If templateName doesn't match any, fall back to Modern
      return templateStyles['Modern'];
    } catch (error) {
      console.error('Error in getCssTemplate:', error);
      // Return hardcoded template as fallback
      return templateStyles[templateName] || templateStyles['Modern'];
    }
  },
  
  /**
   * Initializes the templates collection with default templates
   * @returns {Promise<void>}
   */
  async initializeDefaultTemplates() {
    try {
      const defaultTemplates = this.getHardcodedTemplatesArray();
      
      // Add each template to Firestore
      const promises = defaultTemplates.map(template => 
        addDoc(collection(db, 'templates'), {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
      
      await Promise.all(promises);
      console.log('Default templates created successfully');
    } catch (error) {
      console.error('Error creating default templates:', error);
      throw error;
    }
  },
  
  /**
   * Gets hardcoded templates as an array
   * @returns {Array} Array of template objects
   */
  getHardcodedTemplatesArray() {
    return Object.keys(latexTemplates).map(name => ({
      name,
      format: 'Both',
      active: true,
      description: this.getTemplateDescription(name),
      latexContent: latexTemplates[name],
      cssContent: templateStyles[name] || ''
    }));
  },
  
  /**
   * Gets a description for a template based on its name
   * @param {String} name - Template name
   * @returns {String} Template description
   */
  getTemplateDescription(name) {
    const descriptions = {
      'Modern': 'A clean, modern template with bold colors and clear section dividers.',
      'Classic': 'Traditional resume format suitable for all industries.',
      'Professional': 'Formal template ideal for corporate applications.',
      'Minimalist': 'Simple, clean design focusing on content rather than style.',
      'Creative': 'Stand out with this creative template for design and tech roles.'
    };
    
    return descriptions[name] || `${name} template`;
  }
};
