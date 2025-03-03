import { jsPDF } from 'jspdf';
import { latexTemplates } from './templates';

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
export function generateLatexDocument(resume, templateName = 'Modern') {
  const template = latexTemplates[templateName] || latexTemplates['Modern'];
  
  let document = `${template}
    
\\begin{document}

\\begin{center}
  {\\huge ${resume.personal.firstName} ${resume.personal.lastName}}`;
  
  if (resume.personal.title) {
    document += `\\vspace{0.5em}\n  {\\large ${resume.personal.title}}`;
  }
  
  document += `\n\\end{center}

% Contact Information
\\begin{center}`;

  const contactParts = [];
  if (resume.personal.email) contactParts.push(`\\href{mailto:${resume.personal.email}}{${resume.personal.email}}`);
  if (resume.personal.phone) contactParts.push(resume.personal.phone);
  if (resume.personal.location) contactParts.push(resume.personal.location);
  if (resume.personal.website) contactParts.push(`\\href{${resume.personal.website}}{${resume.personal.website}}`);

  document += `\n  ${contactParts.join(' $\\cdot$ ')}`;
  document += `\n\\end{center}`;

  // Summary Section
  if (resume.personal.summary) {
    document += `\n\n\\section{Summary}\n${resume.personal.summary}`;
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
  
  return document;
}

/**
 * Compiles LaTeX to PDF using jsPDF
 * @param {Object} resume - Resume data
 * @returns {jsPDF} PDF document
 */
export function compileLatexToPdf(resume) {
  // In a real application, you would use a proper LaTeX to PDF compiler
  // For simplicity, we're just creating a PDF with text using jsPDF
  const doc = new jsPDF();
  const templateName = resume.template || 'Modern';
  const latexContent = generateLatexDocument(resume, templateName);
  
  // Add a title
  doc.setFontSize(16);
  doc.text(`${resume.personal.firstName} ${resume.personal.lastName} - Resume`, 10, 10);
  
  // Add the "compiled" content
  doc.setFontSize(11);
  const contentLines = latexContent.split('\n').filter(line => 
    !line.trim().startsWith('\\') && !line.trim().startsWith('%')
  );
  
  let y = 20;
  for (const line of contentLines) {
    if (line.trim()) {
      // Skip LaTeX commands and only add content text
      const text = line.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')
                       .replace(/\{|\}/g, '')
                       .trim();
      
      if (text) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(text, 10, y);
        y += 6;
      }
    }
  }
  
  return doc;
}

/**
 * Processes raw LaTeX code to create a preview
 * @param {String} rawLatex - Raw LaTeX code
 * @returns {String} HTML representation of the compiled LaTeX
 */
export function processRawLatex(rawLatex) {
  try {
    if (!rawLatex || typeof rawLatex !== 'string') {
      return '<div class="latex-error">Invalid LaTeX code</div>';
    }

    // First, we'll create a syntax-highlighted version for code view
    const highlightedCode = syntaxHighlight(rawLatex);
    
    // Then, we'll create a simulated "compiled" view
    const compiledView = createCompiledView(rawLatex);
    
    // Create a unique ID for this preview instance to avoid conflicts
    const uniqueId = `latex-preview-${Math.random().toString(36).substring(2, 9)}`;
    
    return `
      <div class="latex-complete-preview">
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
            // Use immediately invoked function to avoid globals
            const previewId = '${uniqueId}';
            const tabButtons = document.querySelectorAll('.tab-btn[data-preview-id="' + previewId + '"]');
            
            // Add event listeners to buttons
            tabButtons.forEach(button => {
              button.addEventListener('click', function(e) {
                e.preventDefault();
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName, previewId);
              });
            });
            
            function switchTab(tabName, previewId) {
              // Use RAF to batch DOM operations
              requestAnimationFrame(() => {
                // Hide all tabs
                const tabContents = document.querySelectorAll('.tab-content');
                for (let i = 0; i < tabContents.length; i++) {
                  tabContents[i].classList.remove('active');
                }
                
                // Show selected tab
                const targetTab = document.getElementById(tabName + '-' + previewId);
                if (targetTab) targetTab.classList.add('active');
                
                // Update buttons
                tabButtons.forEach(btn => {
                  if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.add('active');
                  } else {
                    btn.classList.remove('active');
                  }
                });
              });
            }
            
            // Fix any issues with the tabs not initializing properly
            setTimeout(() => {
              const activeTab = document.querySelector('.tab-btn.active[data-preview-id="' + previewId + '"]');
              if (activeTab) {
                const tabName = activeTab.getAttribute('data-tab');
                switchTab(tabName, previewId);
              }
            }, 100);
          })();
        </script>
        
        <style>
          .latex-complete-preview {
            font-family: 'Latin Modern Roman', 'Computer Modern Roman', 'Times New Roman', serif;
            border: 1px solid #ddd;
            border-radius: 4px;
            contain: content;
            overflow: hidden;
          }
          
          /* Tab navigation styling */
          .preview-tabs {
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            display: flex;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .tab-btn {
            padding: 8px 16px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            user-select: none;
          }
          
          .tab-btn.active {
            border-bottom: 2px solid #1976d2;
            color: #1976d2;
          }
          
          .tab-content {
            display: none;
            padding: 16px;
            position: relative;
            contain: content;
            height: 500px;
            overflow: auto;
          }
          
          .tab-content.active {
            display: block;
          }
          
          /* Compiled view styling */
          .compiled-view {
            padding: 2.5cm 1.8cm;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            max-width: 100%;
            margin: 0 auto;
            font-size: 10pt;
            line-height: 1.5;
          }
          
          .compiled-view .heading {
            text-align: center;
            margin-bottom: 1em;
          }
          
          .compiled-view .name {
            font-size: 24pt;
            font-weight: bold;
          }
          
          .compiled-view .title {
            font-size: 14pt;
            margin-top: 0.3em;
          }
          
          .compiled-view .contact {
            text-align: center;
            margin-bottom: 1.5em;
          }
          
          .compiled-view .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          
          .compiled-view .entry {
            margin-bottom: 0.5em;
          }
          
          .compiled-view .entry-title {
            font-weight: bold;
          }
          
          .compiled-view .entry-subtitle {
            font-style: italic;
          }
          
          .compiled-view ul {
            margin-top: 0.3em;
            padding-left: 1.5em;
          }
          
          .compiled-view li {
            margin-bottom: 0.2em;
          }
          
          /* Source code view styling */
          .latex-preview {
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            tab-size: 2;
            padding: 0.5em;
            font-size: 13px;
            height: 100%;
            overflow-y: auto;
            background-color: #f8f9fa;
          }
          
          .latex-preview .line {
            position: relative;
            padding-left: 3.5em;
            counter-increment: line;
          }
          
          .latex-preview .line::before {
            content: attr(data-line-number);
            position: absolute;
            left: 0;
            width: 3em;
            padding-right: 0.5em;
            text-align: right;
            color: #888;
            user-select: none;
          }
          
          .latex-command { color: #0000FF; }
          .latex-bracket { color: #AA0000; }
          .latex-comment { color: #008800; }
        </style>
      </div>
    `;
  } catch (error) {
    console.warn('Error processing LaTeX:', error);
    return '<div class="latex-error">Error processing LaTeX code</div>';
  }
}

/**
 * Creates a simulated "compiled" view of LaTeX
 * @param {String} latex - Raw LaTeX code
 * @returns {String} HTML representing compiled LaTeX
 */
function createCompiledView(latex) {
  try {
    // Extract document class and packages
    const documentMatch = latex.match(/\\begin{document}([\s\S]*?)\\end{document}/);
    if (!documentMatch) return '<div class="latex-error">Could not find document environment</div>';
    
    const documentContent = documentMatch[1];
    
    // Extract parts of the document
    let name = '';
    let title = '';
    let contact = '';
    let sections = [];
    
    // Try to extract the name and title from the center environment
    const centerMatch = documentContent.match(/\\begin{center}([\s\S]*?)\\end{center}/);
    if (centerMatch) {
      const centerContent = centerMatch[1];
      
      // Extract name (huge font)
      const nameMatch = centerContent.match(/{\\huge\s*([^}]+)}/);
      if (nameMatch) name = nameMatch[1].trim();
      
      // Extract title (large font)
      const titleMatch = centerContent.match(/{\\large\s*([^}]+)}/);
      if (titleMatch) title = titleMatch[1].trim();
      
      // Look for the next center environment for contact info
      const contactMatches = documentContent.match(/\\begin{center}[\s\S]*?\\end{center}/g);
      if (contactMatches && contactMatches.length > 1) {
        const contactSection = contactMatches[1];
        contact = contactSection
          .replace(/\\begin{center}|\\end{center}/g, '')
          .replace(/\\href{[^}]*}{([^}]*)}/g, '$1')
          .replace(/\$\\cdot\$/g, ' • ')
          .trim();
      }
    }
    
    // Extract sections
    const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|\\end\{document\}|$)/g;
    let match;
    while ((match = sectionRegex.exec(documentContent)) !== null) {
      sections.push({
        title: match[1].trim(),
        content: processLatexContent(match[2].trim())
      });
    }
    
    // Build HTML representation
    let html = `<div class="compiled-view">
      <div class="heading">
        <div class="name">${name}</div>
        ${title ? `<div class="title">${title}</div>` : ''}
      </div>
      
      <div class="contact">
        ${contact}
      </div>`;
    
    // Add sections
    for (const section of sections) {
      html += `<div class="section-title">${section.title}</div>
      <div class="section-content">
        ${section.content}
      </div>`;
    }
    
    html += '</div>';
    
    return html;
  } catch (error) {
    console.error('Error creating compiled view:', error);
    return '<div class="latex-error">Error creating preview</div>';
  }
}

/**
 * Process LaTeX content for HTML display
 * @param {String} content - LaTeX content
 * @returns {String} HTML content
 */
function processLatexContent(content) {
  if (!content) return '';
  
  let processed = content;
  
  // Handle entry command
  processed = processed.replace(/\\entry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g, 
    `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">$1</span>
        <span class="entry-date">$2</span>
      </div>
      <div class="entry-subheader">
        <span class="entry-subtitle">$3</span>
        <span class="entry-location">$4</span>
      </div>
    </div>`);
  
  // Handle itemize environment
  processed = processed.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match, items) => {
    const listItems = items.split('\\item').filter(item => item.trim()).map(item => 
      `<li>${item.trim().replace(/\\\\/g, '<br>')}</li>`
    ).join('');
    return `<ul>${listItems}</ul>`;
  });
  
  // Handle textbf
  processed = processed.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  
  // Handle textit
  processed = processed.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  
  // Handle href
  processed = processed.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1">$2</a>');
  
  // Handle line breaks
  processed = processed.replace(/\\\\/g, '<br>');
  
  return processed;
}

/**
 * Apply syntax highlighting to LaTeX code
 * @param {String} code - LaTeX code
 * @returns {String} HTML with syntax highlighting
 */
function syntaxHighlight(code) {
  // Very basic syntax highlighting for LaTeX, but with optimized line numbering
  const lines = code.split('\n');
  let result = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
      .replace(/\\([a-zA-Z]+)/g, '<span class="latex-command">\\$1</span>')
      .replace(/(\{|\})/g, '<span class="latex-bracket">$1</span>')
      .replace(/(%.*$)/g, '<span class="latex-comment">$1</span>');
      
    // Use data attribute for line numbers instead of pseudo-elements
    result += `<div class="line" data-line-number="${i+1}">${line}</div>`;
  }
  
  return result;
}

/**
 * Format text with bullet points for LaTeX
 * @param {String} text - Text with bullet points (starting with -)
 * @returns {String} LaTeX formatted bullets
 */
function formatBullets(text) {
  if (!text) return '';
  
  // Convert markdown-style bullet points to LaTeX itemize environment
  if (text.includes('-')) {
    const lines = text.split('\n').map(line => line.trim());
    let result = '\\begin{itemize}';
    
    for (const line of lines) {
      if (line.startsWith('-')) {
        result += `\n  \\item ${line.substring(1).trim()}`;
      } else if (line) {
        result += `\n  ${line}`;
      }
    }
    
    result += '\n\\end{itemize}';
    return result;
  }
  
  return text;
}
