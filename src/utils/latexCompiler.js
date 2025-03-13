import { jsPDF } from 'jspdf';
import { latexTemplates } from './templates';
import { templateService } from './templateService';

/**
 * Renders LaTeX code to HTML for preview
 * @param {Object} resume - Resume data object
 * @returns {String} HTML representation of the LaTeX document
 */
export function renderLatexPreview(resume) {
  try {
    if (!resume || !resume.personal) {
      return '<div class="latex-error">Invalid resume data</div>';
    }

    const templateName = resume.template || 'Modern';
    const latexContent = generateLatexDocument(resume, templateName);
    
    // In a real-world application, we would use a proper LaTeX renderer like KaTeX or MathJax
    // For simplicity, we're just formatting the LaTeX code with syntax highlighting
    
    return `
      <div class="latex-preview">
        <style>
          .latex-preview {
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            padding: 1rem;
            line-height: 1.5;
            counter-reset: line;
          }
          .latex-preview .line {
            position: relative;
            padding-left: 3em;
          }
          .latex-preview .line::before {
            counter-increment: line;
            content: counter(line);
            position: absolute;
            left: 0;
            width: 2.5em;
            text-align: right;
            color: #888;
          }
          .latex-command { color: #0000FF; }
          .latex-bracket { color: #AA0000; }
          .latex-comment { color: #008800; }
        </style>
        ${syntaxHighlight(latexContent)}
      </div>
    `;
  } catch (error) {
    console.error('LaTeX preview generation error:', error);
    return '<div class="latex-error">Error generating LaTeX preview</div>';
  }
}

/**
 * Generates a full LaTeX document for the resume
 * @param {Object} resume - Resume data
 * @param {String} templateName - Template name
 * @returns {String} Complete LaTeX document
 */
export async function generateLatexDocument(resume, templateName = 'Modern') {
  console.log(`Generating LaTeX document with template: ${templateName}`);
  
  try {
    if (!resume || !resume.personal) {
      throw new Error("Invalid resume data - missing personal information");
    }
    
    // Get the template - improved error handling
    let template;
    try {
      template = await templateService.getLatexTemplate(templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not available`);
      }
    } catch (templateError) {
      console.warn('Error accessing template service:', templateError.message);
      // Use hardcoded template as fallback - simplified to avoid nested try/catch
      template = latexTemplates[templateName] || latexTemplates['Modern'];
      if (!template) {
        throw new Error(`Template ${templateName} not found in fallback templates`);
      }
    }
    
    console.log('Building LaTeX document structure...');
    
    // Create the document
    let document = `${template}
    
\\begin{document}

\\begin{center}
  {\\huge ${resume.personal.firstName || 'First'} ${resume.personal.lastName || 'Last'}}`;
  
    if (resume.personal.title) {
      document += `\\vspace{0.5em}\n  {\\large ${resume.personal.title}}`;
    }
  
    document += `\n\\end{center}

% Contact Information
\\begin{center}`;

    // Improved contact parts formatting with better separation
    const contactParts = [];
    if (resume.personal.email) contactParts.push(`\\href{mailto:${resume.personal.email}}{${resume.personal.email}}`);
    if (resume.personal.phone) contactParts.push(resume.personal.phone);
    if (resume.personal.location) contactParts.push(resume.personal.location);
    if (resume.personal.website) {
      const website = resume.personal.website.replace(/^https?:\/\//, '');
      contactParts.push(`\\href{http://${website}}{${website}}`);
    }

    // Join with proper spacing and dots
    if (contactParts.length > 0) {
      document += `\n  ${contactParts.join(' $\\bullet$ ')}\n`;
    }
    
    document += `\\end{center}`;

    // Summary Section
    if (resume.personal.summary) {
      document += `\n\n\\section{Summary}\n${resume.personal.summary}`;
    } else {
      document += `\n\n\\section{Summary}\nProfessional summary will appear here.`;
    }

    // Education Section
    if (Array.isArray(resume.education) && resume.education.some(e => e.institution)) {
      document += `\n\n\\section{Education}`;
      for (const edu of resume.education) {
        if (!edu.institution) continue;
      
        const dates = [];
        if (edu.startDate) dates.push(edu.startDate);
        if (edu.current) {
          dates.push('Present');
        } else if (edu.endDate) {
          dates.push(edu.endDate);
        }

        document += `\n\\entry{${edu.institution}}{${dates.join(' -- ')}}{${edu.degree || ''}}{${edu.location || ''}}`;
      
        if (edu.description) {
          document += `\n${edu.description}`;
        }
      }
    }

    // Experience Section
    if (Array.isArray(resume.experience) && resume.experience.some(e => e.company)) {
      document += `\n\n\\section{Experience}`;
      for (const exp of resume.experience) {
        if (!exp.company) continue;
      
        const dates = [];
        if (exp.startDate) dates.push(exp.startDate);
        if (exp.current) {
          dates.push('Present');
        } else if (exp.endDate) {
          dates.push(exp.endDate);
        }

        document += `\n\\entry{${exp.company}}{${dates.join(' -- ')}}{${exp.position || ''}}{${exp.location || ''}}`;
      
        if (exp.description) {
          document += `\n${formatBullets(exp.description)}`;
        }
      }
    } else {
      document += `\n\n\\section{Experience}\n\\entry{Company Name}{Date Range}{Position}{Location}`;
    }

    // Skills Section
    if (resume.skills && typeof resume.skills === 'object') {
      const hasSkills = Object.values(resume.skills).some(
        skills => Array.isArray(skills) && skills.length > 0
      );
    
      if (hasSkills) {
        document += `\n\n\\section{Skills}`;
      
        for (const category in resume.skills) {
          if (Array.isArray(resume.skills[category]) && resume.skills[category].length > 0) {
            document += `\n\\textbf{${category}}: ${resume.skills[category].join(', ')}\\\\`;
          }
        }
      } else {
        document += `\n\n\\section{Skills}\n\\textbf{Technical}: Example skills go here`;
      }
    }

    // Projects Section
    if (Array.isArray(resume.projects) && resume.projects.some(p => p.name)) {
      document += `\n\n\\section{Projects}`;
      for (const project of resume.projects) {
        if (!project.name) continue;
      
        document += `\n\\entry{${project.name}}{${project.date || ''}}{${project.url ? `\\href{${project.url}}{${project.url}}` : ''}}{${''}}`;
      
        if (project.description) {
          document += `\n${formatBullets(project.description)}`;
        }
      }
    }

    // Close the document
    document += `\n\n\\end{document}`;

    console.log('LaTeX document generated successfully.');
    return document;
  } catch (error) {
    console.error('Error generating LaTeX document:', error);
    throw new Error(`Failed to generate LaTeX document: ${error.message}`);
  }
}

/**
 * Format text into LaTeX bullet points if needed
 * @param {String} text - Text that may contain bullet points
 * @returns {String} Formatted LaTeX
 */
function formatBullets(text) {
  if (!text) return '';
  
  // Check if the text contains bullet points (lines starting with - or *)
  if (text.match(/^[-*]\s+/m)) {
    const items = text.split('\n')
      .filter(line => line.trim())
      .map(line => {
        if (line.trim().match(/^[-*]\s+/)) {
          return `\\item ${line.replace(/^[-*]\s+/, '')}`;
        }
        return line;
      });
      
    return `\\begin{itemize}\n  ${items.join('\n  ')}\n\\end{itemize}`;
  }
  
  return text;
}

/**
 * Processes raw LaTeX code to create a preview
 * @param {String} rawLatex - Raw LaTeX code
 * @returns {String} HTML representation of the compiled LaTeX
 */
export function processRawLatex(rawLatex) {
  try {
    // Check if input is a Promise (common error case)
    if (rawLatex instanceof Promise) {
      console.error('Promise passed to processRawLatex. Please await the Promise before calling this function.');
      return '<div class="error-message">Error: LaTeX source is a Promise, not a string. Please report this issue.</div>';
    }
    
    // Check if input is valid
    if (!rawLatex || typeof rawLatex !== 'string') {
      console.error('Invalid LaTeX input:', rawLatex);
      return '<div class="error-message">Invalid LaTeX code provided. Please enter valid LaTeX code.</div>';
    }

    // Add recovery mechanism for potentially corrupted LaTeX content
    let fixedLatex = rawLatex;
    let fixMessage = '';

    // Check if the code is too short to be meaningful but don't reject it
    if (rawLatex.trim().length < 10) {
      fixedLatex = `\\documentclass{article}\n\\begin{document}\n${rawLatex}\n\\end{document}`;
      fixMessage = '<div class="warning-message">LaTeX code is minimal. Basic document structure added.</div>';
    }

    // Perform basic validation of essential LaTeX structure
    const missingElements = [];
    if (!fixedLatex.includes('\\documentclass')) missingElements.push('\\documentclass declaration');
    if (!fixedLatex.includes('\\begin{document}')) missingElements.push('\\begin{document}');
    if (!fixedLatex.includes('\\end{document}')) missingElements.push('\\end{document}');

    if (missingElements.length > 0) {
      // Attempt to fix common issues in corrupt or incomplete LaTeX
      
      // If we're missing full document structure but have some content
      if (missingElements.includes('\\begin{document}') && missingElements.includes('\\end{document}')) {
        // Just wrap the content in a basic document structure
        fixedLatex = `\\documentclass{article}\n\\begin{document}\n${fixedLatex}\n\\end{document}`;
        fixMessage = '<div class="warning-message">Added missing document structure. You can edit the content below.</div>';
      } 
      // If we only missing documentclass
      else if (missingElements.includes('\\documentclass') && !missingElements.includes('\\begin{document}')) {
        // Add the documentclass at the beginning
        fixedLatex = `\\documentclass{article}\n${fixedLatex}`;
        fixMessage = '<div class="warning-message">Added missing documentclass. For better results, include a proper documentclass declaration.</div>';
      }
      // If only missing end{document}
      else if (!missingElements.includes('\\documentclass') && !missingElements.includes('\\begin{document}') && missingElements.includes('\\end{document}')) {
        // Append the end{document}
        fixedLatex = `${fixedLatex}\n\\end{document}`;
        fixMessage = '<div class="warning-message">Added missing \\end{document}.</div>';
      }
    }

    // First, we'll create a syntax-highlighted version for code view
    const highlightedCode = syntaxHighlight(fixedLatex);
    
    // Then, we'll create a simulated "compiled" view
    const compiledView = createCompiledView(fixedLatex);
    
    // Create a unique ID for this preview instance to avoid conflicts
    const uniqueId = `latex-preview-${Math.random().toString(36).substring(2, 9)}`;
    
    // Return the formatted preview with any fix messages
    return `
      <div class="latex-complete-preview">
        ${fixMessage}
        <div class="preview-tabs">
          <button class="tab-btn active" data-tab="compiled" data-preview-id="${uniqueId}">Compiled View</button>
          <button class="tab-btn" data-tab="source" data-preview-id="${uniqueId}">Source Code</button>
        </div>
        
        <div id="compiled-${uniqueId}" class="tab-content active">
          ${compiledView}
        </div>
        
        <div id="source-${uniqueId}" class="tab-content">
          <div class="latex-preview">
            ${highlightedCode}
          </div>
        </div>
        
        <script>
        (function() {
          // Tab switching logic
          document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const tabId = this.dataset.tab;
              const previewId = this.dataset.previewId;
              
              // Update active button
              document.querySelectorAll('.tab-btn[data-preview-id="'+previewId+'"]').forEach(el => {
                el.classList.remove('active');
              });
              this.classList.add('active');
              
              // Update active content
              document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.remove('active');
              });
              document.getElementById(tabId + '-' + previewId).classList.add('active');
            });
          });
        })();
        </script>
        
        <style>
          .preview-tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 10px;
          }
          .tab-btn {
            padding: 8px 16px;
            border: none;
            background: none;
            cursor: pointer;
          }
          .tab-btn.active {
            border-bottom: 2px solid #1976d2;
            color: #1976d2;
            font-weight: bold;
          }
          .tab-content {
            display: none;
            padding: 10px 0;
          }
          .tab-content.active {
            display: block;
          }
          .warning-message {
            color: #856404;
            padding: 0.75rem;
            border: 1px solid #ffeeba;
            border-radius: 4px;
            background-color: #fff3cd;
            margin: 0.5rem 0;
          }
        </style>
      </div>
    `;
  } catch (error) {
    console.warn('Error processing LaTeX:', error);
    return `<div class="error-message">
      <p>Error processing LaTeX code: ${error.message}</p>
      <p>You can still edit the LaTeX code to fix the issues.</p>
      <pre class="raw-code">${rawLatex ? rawLatex.substring(0, 500) + (rawLatex.length > 500 ? '...' : '') : 'Empty LaTeX content'}</pre>
    </div>`;
  }
}

/**
 * Highlight LaTeX syntax for better readability
 * @param {String} latexCode - Raw LaTeX code
 * @returns {String} HTML with syntax highlighting
 */
function syntaxHighlight(latexCode) {
  if (!latexCode) return '';
  
  // Simple syntax highlighting
  return latexCode
    .replace(/\\([a-zA-Z]+)(?=[\s{])/g, '<span class="latex-command">\\$1</span>')
    .replace(/([{}])/g, '<span class="latex-bracket">$1</span>')
    .replace(/(%.+)$/gm, '<span class="latex-comment">$1</span>')
    .split('\n')
    .map(line => `<div class="line">${line}</div>`)
    .join('');
}

/**
 * Create a simplified visual representation of compiled LaTeX
 * @param {String} latexCode - Raw LaTeX code
 * @returns {String} HTML simulating a compiled document
 */
function createCompiledView(latexCode) {
  try {
    // Ensure latexCode is a string
    if (!latexCode || typeof latexCode !== 'string') {
      console.error('Invalid latexCode provided to createCompiledView:', latexCode);
      return `<div class="compiled-view">
        <p class="error-message">Invalid LaTeX code format. Expected a string.</p>
      </div>`;
    }
    
    // Extract document content (between \begin{document} and \end{document})
    const match = latexCode.match(/\\begin{document}([\s\S]+?)\\end{document}/);
    
    // More forgiving handling for cases where regex doesn't match
    let content = match ? match[1] : latexCode;
    
    // If we still have nothing meaningful to display
    if (!content.trim()) {
      return `<div class="compiled-view">
        <p class="info-message">This document appears to be empty. Please add content in the editor.</p>
      </div>`;
    }
    
    // Extract name (usually in \huge{...}) with safer matching
    let name = '';
    const nameMatch = content.match(/{\\huge\s*([^}]+)}/);
    if (nameMatch && nameMatch[1]) {
      name = nameMatch[1];
    }
    
    // Extract title/position (usually in \large{...})
    let title = '';
    const titleMatch = content.match(/{\\large\s*([^}]+)}/);
    if (titleMatch) {
      title = titleMatch[1];
    }
    
    // Remove the center environment for the header since we'll handle it with HTML
    content = content.replace(/\\begin{center}[\s\S]*?\\end{center}/g, '');
    
    // Process sections with proper heading tags
    content = content.replace(/\\section{([^}]+)}/g, '<h2 class="section-heading">$1</h2>');
    
    // Process entries with proper formatting
    content = content.replace(/\\entry{([^}]*)}{([^}]*)}{([^}]*)}{([^}]*)}/g, 
      '<div class="entry-item"><div class="entry-header"><span class="entry-title">$1</span><span class="entry-date">$2</span></div><div class="entry-subheader"><span class="entry-subtitle">$3</span><span class="entry-location">$4</span></div></div>');
    
    // Process itemize environments with proper bullet points
    content = content.replace(/\\begin{itemize}([\s\S]+?)\\end{itemize}/g, (match, items) => {
      const listItems = items.replace(/\\item\s+([^\n]+)/g, '<li>$1</li>');
      return `<ul class="item-list">${listItems}</ul>`;
    });
    
    // Process basic formatting
    content = content.replace(/\\textbf{([^}]+)}/g, '<strong>$1</strong>');
    content = content.replace(/\\textit{([^}]+)}/g, '<em>$1</em>');
    content = content.replace(/\\href{([^}]+)}{([^}]+)}/g, '<a href="$1" class="resume-link">$2</a>');
    
    // Handle comment lines
    content = content.replace(/(%[^\n]*)/g, '<span class="comment">$1</span>');
    
    // Replace LaTeX new paragraphs with HTML paragraphs
    content = content.replace(/\n\n+/g, '</p><p>');
    
    // Replace LaTeX line breaks with HTML breaks
    content = content.replace(/\\\\(?!\n)/g, '<br>');
    
    // Replace LaTeX special chars
    content = content.replace(/\$\\cdot\$/g, '<span class="separator">•</span>');
    
    // Clean up any remaining LaTeX commands
    content = content.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
    
    // Extract contact information with improved patterns
    const contacts = [];
    
    // Extract email
    const emailMatch = content.match(/\\href{mailto:([^}]+)}{([^}]+)}/);
    if (emailMatch) {
      contacts.push(emailMatch[2].trim());
    }
    
    // Extract phone number (typically the second item in contact section)
    const phonePattern = /\$\\bullet\$\s*([+\d\s()-]+)(?=\s*\$\\bullet\$|\s*\\end{center})/g;
    let phoneMatch;
    while ((phoneMatch = phonePattern.exec(content)) !== null) {
      contacts.push(phoneMatch[1].trim());
    }
    
    // Extract website (typically the third item in contact section with http/https links)
    const websiteMatch = content.match(/\\href{(https?:\/\/[^}]+)}{([^}]+)}/);
    if (websiteMatch) {
      contacts.push(websiteMatch[2].trim());
    }
    
    // Extract location (typically the last item in contact section)
    const locationPattern = /\$\\bullet\$\s*([^$\n{}]+?)(?=\s*\\end{center}|\s*\$\\bullet\$)/g;
    let lastLocation = null;
    let locationMatch;
    while ((locationMatch = locationPattern.exec(content)) !== null) {
      const location = locationMatch[1].trim();
      if (!location.includes('\\href')) {
        lastLocation = location;
      }
    }
    if (lastLocation) {
      contacts.push(lastLocation);
    }
    
    // Join contact information with bullets
    const contactLine = contacts.filter(Boolean).join(' • ');

    // Update the contact info section in the HTML
    return `
      <div class="compiled-view">
        <div class="resume-header">
          <h1 class="resume-name">${name}</h1>
          ${title ? `<h3 class="resume-title">${title}</h3>` : ''}
          <div class="contact-info">
            ${contactLine ? `<p class="contact-line">${contactLine}</p>` : ''}
          </div>
        </div>
        
        <div class="resume-content">
          <p>${content}</p>
        </div>
        
        <style>
          .compiled-view {
            font-family: 'Times New Roman', serif;
            line-height: 1.5;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            color: #333;
          }
          
          .resume-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 15px;
          }
          
          .resume-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .resume-title {
            font-style: italic;
            font-weight: normal;
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 10px;
            color: #555;
          }
          
          .contact-info {
            font-size: 14px;
            color: #555;
          }
          
          .contact-separator {
            margin: 0 8px;
          }
          
          .section-heading {
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            color: #333;
          }
          
          .entry-item {
            margin-bottom: 10px;
            padding-left: 15px;
          }
          
          .entry-header, .entry-subheader {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .entry-title {
            font-weight: bold;
          }
          
          .entry-subtitle {
            font-style: italic;
          }
          
          .entry-date, .entry-location {
            color: #555;
          }
          
          .item-list {
            margin-top: 5px;
            margin-bottom: 10px;
            padding-left: 20px;
          }
          
          .item-list li {
            margin-bottom: 3px;
          }
          
          .resume-link {
            color: #0066cc;
            text-decoration: none;
          }
          
          .comment {
            display: none; /* Hide comments in preview */
          }
          
          .separator {
            margin: 0 5px;
          }
          
          .contact-line {
            color: #333;
            font-size: 0.9rem;
            margin: 0.5rem 0;
            text-align: center;
          }
        </style>
      </div>
    `;
  } catch (error) {
    console.error('Error creating compiled view:', error);
    return '<div class="error-message">Error creating preview: ' + error.message + '</div>';
  }
}

/**
 * Uses jsPDF to compile LaTeX to PDF
 * @param {String} latexSource - LaTeX source code
 * @returns {Promise<Blob>} PDF file as Blob
 */
export async function compileLatexToPdf(latexSource) {
  // In a real application, you would use a proper LaTeX to PDF converter or a service
  // Here we're creating a simple PDF using jsPDF
  const pdf = new jsPDF();
  pdf.text("This is a placeholder for real LaTeX to PDF conversion", 10, 10);
  return pdf.output('blob');
}
