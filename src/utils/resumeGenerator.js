import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import { generateTemplatedMarkdown, generateTemplatedLatex } from './templates';
import { renderLatexPreview, compileLatexToPdf } from './latexCompiler';
import { generateLatexDocument, processRawLatex } from './latexCompiler';

/**
 * Generate Markdown preview for a resume
 * @param {Object} resume - Resume data object
 * @returns {String} HTML content from Markdown
 */
export function generateMarkdownPreview(resume) {
  if (!resume || !resume.personal) {
    return '';
  }

  try {
    // Use the template system to generate HTML with proper styling
    const templateName = resume.template || 'Modern';
    const markdown = generateBasicMarkdown(resume);
    
    // Apply template styling
    const html = `<style>
      ${getTemplateStyles(templateName)}
    </style>
    <div class="resume-preview-${templateName.toLowerCase()}">
      ${marked(markdown)}
    </div>`;
    
    return html;
  } catch (error) {
    console.error('Error generating markdown preview:', error);
    return '<p>Error generating preview</p>';
  }
}

/**
 * Generates a preview of the LaTeX resume
 * @param {Object} resume - Resume data object
 * @returns {String} HTML representation of the LaTeX document
 */
export async function generateLatexPreview(resume) {
  try {
    if (!resume) {
      console.error('Invalid resume data provided to generateLatexPreview');
      return '<div class="preview-error">Invalid resume data</div>';
    }
    
    console.log('Generating LaTeX preview with data:', {
      firstName: resume.personal.firstName,
      lastName: resume.personal.lastName,
      format: resume.format,
      template: resume.template
    });
    
    // Generate the LaTeX document with the specified template
    const latexContent = await generateLatexDocument(resume, resume.template);
    
    if (!latexContent) {
      console.error('Empty LaTeX content generated');
      return '<div class="preview-error">Failed to generate LaTeX content</div>';
    }
    
    // Process the raw LaTeX to create the HTML preview
    const { processRawLatex } = require('./latexCompiler');
    const previewHtml = processRawLatex(latexContent);
    
    // Add additional wrapper for styling
    return `<div class="latex-preview-container">${previewHtml}</div>`;
  } catch (error) {
    console.error('Error generating LaTeX preview:', error);
    return `<div class="preview-error">Error generating resume preview: ${error.message}</div>`;
  }
}

/**
 * Downloads the resume as a PDF - Enhanced version that better matches the preview
 * @param {Object} resume - Resume data object or LaTeX source code
 * @param {Boolean} isSource - Whether resume is a source code string
 * @param {String} method - Export method ('standard' or 'visual')
 */
export async function downloadResumePdf(resume, isSource = false, method = 'visual') {
  try {
    // Always use the standard method since html2pdf is not available
    await exportStandardPdf(resume, isSource);
  } catch (error) {
    console.error('Error creating PDF:', error);
    alert('There was an error creating the PDF. Please try again.');
  }
}

/**
 * Standard PDF export using jsPDF directly (original method)
 * @param {*} resume - Resume data or source
 * @param {*} isSource - Whether resume is source code
 */
async function exportStandardPdf(resume, isSource) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let latexContent;
  let name;
  
  if (isSource) {
    // If we're passed raw LaTeX code
    latexContent = resume;
  } else {
    // Generate LaTeX from resume object - NEED TO AWAIT THIS PROMISE
    try {
      latexContent = await generateLatexDocument(resume);
      name = `${resume.personal.firstName}_${resume.personal.lastName}`;
    } catch (error) {
      console.error('Error generating LaTeX document:', error);
      throw new Error('Failed to generate LaTeX content for PDF');
    }
  }

  // Ensure latexContent is a string before using string methods
  if (!latexContent || typeof latexContent !== 'string') {
    console.error('Invalid LaTeX content:', latexContent);
    throw new Error(`Cannot create PDF: expected string but got ${typeof latexContent}`);
  }
  
  // Try to extract name from LaTeX if not already set
  if (!name) {
    const nameMatch = latexContent.match(/{\\huge\s*([^}]+)}/);
    name = nameMatch ? nameMatch[1].trim() : 'Resume';
  }
  
  // Set up PDF styles
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  
  // Extract document structure from LaTeX
  const documentMatch = latexContent.match(/\\begin{document}([\s\S]*?)\\end{document}/);
  if (!documentMatch) {
    throw new Error("Could not parse LaTeX document");
  }
  
  const documentContent = documentMatch[1];
  
  // Extract sections and format the PDF
  const sections = extractSectionsFromLatex(documentContent);
  
  // Add header (name)
  let y = 20; // Starting y position in mm
  let pageWidth = 210; // A4 width in mm
  let margin = 20; // Margin in mm
  let contentWidth = pageWidth - 2 * margin;
  
  // Extract name and title for the header
  let headerName = '';
  let headerTitle = '';
  
  const nameMatch = documentContent.match(/{\\huge\s*([^}]+)}/);
  if (nameMatch) headerName = nameMatch[1].trim();
  
  const titleMatch = documentContent.match(/{\\large\s*([^}]+)}/);
  if (titleMatch) headerTitle = titleMatch[1].trim();
  
  // Add name
  pdf.setFontSize(20);
  pdf.setFont('times', 'bold');
  pdf.text(headerName, pageWidth/2, y, { align: 'center' });
  y += 8;
  
  // Add title if available
  if (headerTitle) {
    pdf.setFontSize(14);
    pdf.setFont('times', 'italic');
    pdf.text(headerTitle, pageWidth/2, y, { align: 'center' });
    y += 10;
  } else {
    y += 5;
  }
  
  // Add contact info
  const contactMatch = documentContent.match(/\\begin{center}[^}]*?\\href{mailto:([^}]*)}{([^}]*)}([^}]*?)\\end{center}/);
  if (contactMatch) {
    pdf.setFontSize(10);
    pdf.setFont('times', 'normal');
    
    // Clean up and format contact info
    let contactText = contactMatch[0]
      .replace(/\\begin{center}|\\end{center}/g, '')
      .replace(/\\href{mailto:([^}]*)}{([^}]*)}/g, '$2')
      .replace(/\\href{([^}]*)}{([^}]*)}/g, '$2')
      .replace(/\$\\cdot\$/g, ' • ')
      .trim();
    
    pdf.text(contactText, pageWidth/2, y, { align: 'center' });
    y += 10;
  }
  
  // Add sections
  for (const section of sections) {
    // Check if we need a page break
    if (y > 270) { // A4 height is 297mm, keep some margin
      pdf.addPage();
      y = 20;
    }
    
    // Section title
    pdf.setFontSize(14);
    pdf.setFont('times', 'bold');
    pdf.text(section.title, margin, y);
    pdf.line(margin, y + 1, pageWidth - margin, y + 1); // Underline
    y += 6;
    
    // Section content - handle entries and text
    const entries = parseEntries(section.content);
    
    if (entries.length > 0) {
      // We have structured entries
      for (const entry of entries) {
        // Check if we need a page break
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        
        // Entry title
        pdf.setFontSize(12);
        pdf.setFont('times', 'bold');
        pdf.text(entry.title, margin, y);
        
        // Entry date on the right
        if (entry.date) {
          pdf.setFont('times', 'normal');
          pdf.text(entry.date, pageWidth - margin, y, { align: 'right' });
        }
        y += 5;
        
        // Entry subtitle and location
        if (entry.subtitle || entry.location) {
          pdf.setFontSize(11);
          pdf.setFont('times', 'italic');
          
          if (entry.subtitle) {
            pdf.text(entry.subtitle, margin, y);
          }
          
          if (entry.location) {
            pdf.text(entry.location, pageWidth - margin, y, { align: 'right' });
          }
          y += 5;
        }
        
        // Entry details (bullet points)
        if (entry.details && entry.details.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont('times', 'normal');
          
          for (const detail of entry.details) {
            // Multi-line text handling with word wrapping
            const textLines = pdf.splitTextToSize(detail, contentWidth - 10);
            
            for (let i = 0; i < textLines.length; i++) {
              // Check if we need a page break
              if (y > 275) {
                pdf.addPage();
                y = 20;
              }
              
              // First line gets a bullet
              if (i === 0) {
                pdf.text('•', margin + 2, y);
                pdf.text(textLines[i], margin + 7, y);
              } else {
                pdf.text(textLines[i], margin + 7, y);
              }
              
              y += 5;
            }
          }
          y += 3; // Extra space after bullet points
        }
      }
    } else {
      // Just regular text content
      pdf.setFontSize(11);
      pdf.setFont('times', 'normal');
      
      // Split content into paragraphs
      const paragraphs = section.content.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          // Word wrap long lines
          const lines = pdf.splitTextToSize(paragraph, contentWidth);
          
          for (const line of lines) {
            // Check if we need a page break
            if (y > 275) {
              pdf.addPage();
              y = 20;
            }
            
            pdf.text(line, margin, y);
            y += 5;
          }
          y += 3; // Space between paragraphs
        }
      }
    }
    
    y += 8; // Space between sections
  }
  
  // Save the PDF
  pdf.save(`${name.replace(/\s+/g, '_')}_resume.pdf`);
}

/**
 * Extract sections from LaTeX content
 * @param {String} content LaTeX document content
 * @returns {Array} Array of section objects with title and content
 */
function extractSectionsFromLatex(content) {
  const sections = [];
  const sectionRegex = /\\section{([^}]+)}([\s\S]*?)(?=\\section{|\\end{document}|$)/g;
  
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      title: match[1].trim(),
      content: match[2].trim()
    });
  }
  
  return sections;
}

/**
 * Parse entry commands from LaTeX content
 * @param {String} content LaTeX content
 * @returns {Array} Array of entry objects with title, date, subtitle, location, and details
 */
function parseEntries(content) {
  const entries = [];
  // Match \entry{title}{date}{subtitle}{location} patterns
  const entryRegex = /\\entry{([^}]*)}{([^}]*)}{([^}]*)}{([^}]*)}\s*([\s\S]*?)(?=\\entry|$)/g;
  
  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const [_, title, date, subtitle, location, detailsText] = match;
    
    // Parse itemize environments for bullet points
    const details = [];
    const itemizeRegex = /\\begin{itemize}([\s\S]*?)\\end{itemize}/g;
    const itemizeMatch = itemizeRegex.exec(detailsText);
    
    if (itemizeMatch) {
      const itemsText = itemizeMatch[1];
      const itemRegex = /\\item\s+([\s\S]*?)(?=\\item|$)/g;
      
      let itemMatch;
      while ((itemMatch = itemRegex.exec(itemsText)) !== null) {
        details.push(itemMatch[1].trim());
      }
    }
    
    entries.push({
      title: title.trim(),
      date: date.trim(),
      subtitle: subtitle.trim(),
      location: location.trim(),
      details
    });
  }
  
  return entries;
}

// Helper functions

function generateBasicMarkdown(resume) {
  // Generate Markdown content based on resume data
  let markdown = `# ${resume.personal.firstName} ${resume.personal.lastName}`;
  
  if (resume.personal.title) {
    markdown += `\n## ${resume.personal.title}`;
  }
  
  // Contact info
  markdown += '\n\n';
  const contactInfo = [];
  if (resume.personal.email) contactInfo.push(`Email: ${resume.personal.email}`);
  if (resume.personal.phone) contactInfo.push(`Phone: ${resume.personal.phone}`);
  if (resume.personal.location) contactInfo.push(`Location: ${resume.personal.location}`);
  if (resume.personal.website) contactInfo.push(`Website: ${resume.personal.website}`);
  
  markdown += contactInfo.join(' | ');
  
  // Summary
  if (resume.personal.summary) {
    markdown += `\n\n## Summary\n${resume.personal.summary}`;
  }
  
  // Education
  if (Array.isArray(resume.education) && resume.education.length > 0 && resume.education.some(e => e.institution)) {
    markdown += '\n\n## Education\n';
    for (const edu of resume.education) {
      if (!edu.institution) continue;
      
      markdown += `\n### ${edu.institution}`;
      if (edu.degree) markdown += `\n**${edu.degree}**`;
      
      const eduDates = [];
      if (edu.startDate) eduDates.push(edu.startDate);
      if (edu.current) {
        eduDates.push('Present');
      } else if (edu.endDate) {
        eduDates.push(edu.endDate);
      }
      
      if (eduDates.length > 0) {
        markdown += ` | ${eduDates.join(' - ')}`;
      }
      
      if (edu.location) markdown += ` | ${edu.location}`;
      
      if (edu.description) {
        markdown += `\n\n${edu.description}`;
      }
    }
  }
  
  // Experience
  if (Array.isArray(resume.experience) && resume.experience.length > 0 && resume.experience.some(e => e.company)) {
    markdown += '\n\n## Experience\n';
    for (const exp of resume.experience) {
      if (!exp.company) continue;
      
      markdown += `\n### ${exp.company}`;
      if (exp.position) markdown += `\n**${exp.position}**`;
      
      const expDates = [];
      if (exp.startDate) expDates.push(exp.startDate);
      if (exp.current) {
        expDates.push('Present');
      } else if (exp.endDate) {
        expDates.push(exp.endDate);
      }
      
      if (expDates.length > 0) {
        markdown += ` | ${expDates.join(' - ')}`;
      }
      
      if (exp.location) markdown += ` | ${exp.location}`;
      
      if (exp.description) {
        markdown += `\n\n${exp.description}`;
      }
    }
  }
  
  // Skills
  if (resume.skills && typeof resume.skills === 'object' && Object.keys(resume.skills).length > 0) {
    const hasSkills = Object.values(resume.skills).some(skills => 
      Array.isArray(skills) && skills.length > 0
    );
    
    if (hasSkills) {
      markdown += '\n\n## Skills\n';
      
      for (const category in resume.skills) {
        if (Array.isArray(resume.skills[category]) && resume.skills[category].length > 0) {
          markdown += `\n### ${category}\n`;
          markdown += resume.skills[category].join(', ');
        }
      }
    }
  }
  
  // Projects and other sections would follow the same pattern
  // [...]
  
  return markdown;
}

// Template-specific CSS for different designs
function getTemplateStyles(templateName) {
  const styles = {
    Modern: `
      .resume-preview-modern {
        font-family: 'Roboto', Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        color: #333;
        line-height: 1.5;
      }
      .resume-preview-modern h1 {
        color: #2c3e50;
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      .resume-preview-modern h2 {
        color: #3498db;
        font-size: 1.8rem;
        margin-top: 1.5rem;
      }
      .resume-preview-modern h3 {
        color: #2c3e50;
        font-size: 1.3rem;
        margin-top: 1.2rem;
      }
      .resume-preview-modern a {
        color: #3498db;
        text-decoration: none;
      }
      .resume-preview-modern a:hover {
        text-decoration: underline;
      }
    `,
    Classic: `
      .resume-preview-classic {
        font-family: 'Times New Roman', Times, serif;
        max-width: 800px;
        margin: 0 auto;
        color: #000;
        line-height: 1.6;
      }
      .resume-preview-classic h1 {
        text-align: center;
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
      }
      .resume-preview-classic h2 {
        text-align: center;
        font-style: italic;
        color: #444;
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .resume-preview-classic h3 {
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 1.2rem;
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
        margin-top: 1.5rem;
      }
    `,
    Professional: `
      .resume-preview-professional {
        font-family: 'Georgia', serif;
        max-width: 800px;
        margin: 0 auto;
        color: #333;
        line-height: 1.6;
      }
      .resume-preview-professional h1 {
        color: #1a5276;
        font-size: 2.2rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 0.5rem;
      }
      .resume-preview-professional h2 {
        color: #1a5276;
        font-size: 1.6rem;
        border-left: 4px solid #1a5276;
        padding-left: 10px;
        margin: 1.5rem 0 1rem;
      }
      .resume-preview-professional h3 {
        font-weight: bold;
        font-size: 1.2rem;
        color: #444;
      }
    `,
    Minimalist: `
      .resume-preview-minimalist {
        font-family: 'Open Sans', Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        color: #333;
        line-height: 1.5;
      }
      .resume-preview-minimalist h1 {
        font-weight: 300;
        font-size: 2.4rem;
        color: #000;
        margin-bottom: 5px;
      }
      .resume-preview-minimalist h2 {
        font-weight: 300;
        color: #555;
        font-size: 1.5rem;
        margin-top: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-top: 1px solid #eee;
        padding-top: 10px;
      }
      .resume-preview-minimalist h3 {
        font-weight: 600;
        font-size: 1.1rem;
      }
    `,
    Creative: `
      .resume-preview-creative {
        font-family: 'Montserrat', Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        color: #333;
        line-height: 1.6;
        background: linear-gradient(to bottom right, #ffffff, #f9f9f9);
        padding: 20px;
        border-radius: 5px;
      }
      .resume-preview-creative h1 {
        font-size: 3rem;
        color: #e74c3c;
        margin-bottom: 0.3rem;
        font-weight: 700;
      }
      .resume-preview-creative h2 {
        color: #e74c3c;
        font-size: 1.5rem;
        position: relative;
        padding-bottom: 10px;
        margin-top: 1.8rem;
      }
      .resume-preview-creative h2:after {
        content: "";
        position: absolute;
        width: 60px;
        height: 4px;
        background: #e74c3c;
        bottom: 0;
        left: 0;
      }
      .resume-preview-creative h3 {
        font-size: 1.3rem;
        color: #333;
        font-weight: 600;
      }
    `
  };

  return styles[templateName] || styles['Modern'];
}
