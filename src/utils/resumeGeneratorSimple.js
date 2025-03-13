import { jsPDF } from 'jspdf';
import { generateLatexDocument } from './latexCompiler';

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
 * Downloads the resume as a PDF
 * @param {Object} resume - Resume data object or LaTeX source code
 * @param {Boolean} isSource - Whether resume is a source code string
 */
export async function downloadResumePdf(resume, isSource = false) {
  try {
    console.log('Starting PDF generation process...');
    
    // Create PDF document with proper settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });
    
    // Set default font family
    pdf.setFont('helvetica', 'normal');
    
    let latexContent = '';
    let fileName = 'resume';
    
    // Get the LaTeX content either directly or by generating it
    if (isSource && typeof resume === 'string') {
      console.log('Using provided LaTeX source');
      latexContent = resume;
    } else if (resume && typeof resume === 'object') {
      console.log('Generating LaTeX from resume object');
      try {
        // Generate LaTeX from the resume object
        const generatedContent = await generateLatexDocument(resume, resume.template);
        
        // Ensure we have a string
        if (typeof generatedContent === 'string') {
          latexContent = generatedContent;
        } else if (generatedContent && typeof generatedContent.then === 'function') {
          // It's still a promise, resolve it
          latexContent = await generatedContent;
        } else {
          throw new Error('Generated LaTeX is not a valid string');
        }
        
        if (resume.personal && resume.personal.firstName && resume.personal.lastName) {
          fileName = `${resume.personal.firstName}_${resume.personal.lastName}`
            .replace(/\s+/g, '_')
            .replace(/[^\w-]/g, '');
        }
      } catch (latexError) {
        console.error('Error generating LaTeX document:', latexError);
        throw new Error(`Failed to generate LaTeX content: ${latexError.message}`);
      }
    } else {
      throw new Error('Invalid resume data provided for PDF generation');
    }
    
    // Validate that we have a proper string before proceeding
    if (!latexContent || typeof latexContent !== 'string') {
      throw new Error('Invalid LaTeX content: expected a string but got ' + typeof latexContent);
    }
    
    // Extract document content
    const documentMatch = latexContent.match(/\\begin{document}([\s\S]*?)\\end{document}/);
    if (!documentMatch) {
      console.warn('Could not extract document content, using fallback method');
      // Fallback: try to create a simple PDF with just the content we have
      createSimplePdf(pdf, latexContent);
    } else {
      const content = documentMatch[1];
      console.log('LaTeX content extracted successfully, rendering PDF...');
      
      try {
        // Create professional PDF from LaTeX content
        await renderProfessionalPdf(pdf, content);
      } catch (renderError) {
        console.error('Error during PDF rendering:', renderError);
        // Fallback to simple rendering if professional rendering fails
        createSimplePdf(pdf, latexContent);
      }
    }
    
    // Save the PDF
    console.log('PDF created, initiating download...');
    pdf.save(`${fileName}_resume.pdf`);
    console.log('PDF download complete!');
    
    return true;
  } catch (error) {
    console.error('Error creating PDF:', error);
    alert(`Failed to generate PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Fallback method to create a simple PDF when the full rendering fails
 * @param {jsPDF} pdf - PDF document
 * @param {String} content - LaTeX content
 */
function createSimplePdf(pdf, content) {
  console.log('Using fallback PDF generation method');
  
  // Extract basic information
  let title = 'Resume';
  const nameMatch = content.match(/{\\huge\s*([^}]+)}/);
  if (nameMatch) {
    title = nameMatch[1].trim();
  }
  
  // Add title to PDF
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  // Clean content of LaTeX commands for basic text extraction
  const cleanedContent = content
    .replace(/\\begin{[^}]+}|\\end{[^}]+}/g, '')  // Remove begin/end environments
    .replace(/\\[a-zA-Z]+{([^}]+)}/g, '$1')       // Remove commands but keep their content
    .replace(/\\[a-zA-Z]+/g, '')                  // Remove remaining commands
    .replace(/[{}\\$]/g, '')                      // Remove syntax characters
    .replace(/\n{3,}/g, '\n\n')                   // Normalize line breaks
    .trim();
  
  // Add content as plain text with wrapping
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const textLines = pdf.splitTextToSize(cleanedContent, 170);
  pdf.text(textLines, 20, 40);
}

/**
 * Creates a professional PDF from LaTeX content
 * @param {jsPDF} pdf - jsPDF instance
 * @param {String} content - LaTeX content
 */
async function renderProfessionalPdf(pdf, content) {
  try {
    // Page settings
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    };
  
    let currentY = margin.top;
  
    // Extract and render name section with better regex
    const nameMatch = content.match(/{\\huge\s*([^}]+)}/);
    if (nameMatch) {
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      const name = nameMatch[1].trim();
      pdf.text(name, pageWidth/2, currentY, { align: 'center' });
      currentY += 10;
    }
  
    // Extract and render title with better regex
    const titleMatch = content.match(/{\\large\s*([^}]+)}/);
    if (titleMatch) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'italic');
      const title = titleMatch[1].trim();
      pdf.text(title, pageWidth/2, currentY, { align: 'center' });
      currentY += 10;
    }
  
    // Improved contact information extraction and rendering
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Extract contact parts with improved patterns
    const emailMatch = content.match(/\\href{mailto:([^}]+)}{([^}]+)}/);
    const phonePattern = /\$\\bullet\$\s*([^$\n\$]+?)(?=\$\\bullet\$|\s*\\end{center})/g;
    const websitePattern = /\\href{http[s]?:\/\/([^}]+)}{([^}]+)}/;
    const locationPattern = /(?:\$\\bullet\$\s*)([^$\n\$]+?)(?=\\end{center})/;

    const contactParts = [];
    
    // Extract email
    if (emailMatch && emailMatch[2]) {
      contactParts.push(emailMatch[2].trim());
    }
    
    // Extract phone numbers (there might be multiple matches)
    let phoneMatch;
    while ((phoneMatch = phonePattern.exec(content)) !== null) {
      if (!phoneMatch[1].includes('href')) {  // Skip if it contains href (to avoid website matches)
        contactParts.push(phoneMatch[1].trim());
      }
    }
    
    // Extract website
    const websiteMatch = content.match(websitePattern);
    if (websiteMatch && websiteMatch[2]) {
      contactParts.push(websiteMatch[2].trim());
    }
    
    // Extract location (usually last item)
    const locationMatch = content.match(locationPattern);
    if (locationMatch && locationMatch[1]) {
      const location = locationMatch[1].trim()
        .replace(/\$\\bullet\$/g, '')
        .replace(/\\end{center}/g, '')
        .trim();
      if (location && !location.includes('href')) {
        contactParts.push(location);
      }
    }

    // Render contact information
    if (contactParts.length > 0) {
      const contactText = contactParts
        .filter(part => part && part.trim())
        .join(' • ');
      pdf.text(contactText, pageWidth/2, currentY, { align: 'center' });
      currentY += 10;
    }

    // Extract all sections from the LaTeX document
    const sections = extractSectionsFromLatex(content);
  
    if (sections.length === 0) {
      // Fallback if no sections are found
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const cleanContent = cleanLatexText(content);
      const lines = pdf.splitTextToSize(cleanContent, pageWidth - margin.left - margin.right);
      pdf.text(lines, margin.left, currentY);
      return;
    }
  
    // Process each section
    for (const section of sections) {
      // Check if we need a page break
      if (currentY > pageHeight - margin.bottom - 30) {
        pdf.addPage();
        currentY = margin.top;
      }
    
      // Add section title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, margin.left, currentY);
    
      // Add underline for section
      currentY += 2;
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin.left, currentY, pageWidth - margin.right, currentY);
      currentY += 6;
    
      // Process the section content
      const entries = parseEntries(section.content);
    
      if (entries.length > 0) {
        // Render structured entries (education, experience, projects)
        for (const entry of entries) {
          // Check for page break
          if (currentY > pageHeight - margin.bottom - 40) {
            pdf.addPage();
            currentY = margin.top;
          }
        
          // Entry organization/company/school
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(entry.title || '', margin.left, currentY);
        
          // Entry date on the right
          if (entry.date) {
            pdf.text(entry.date, pageWidth - margin.right, currentY, { align: 'right' });
          }
          currentY += 5;
        
          // Entry position/degree
          if (entry.subtitle || entry.location) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'italic');
          
            if (entry.subtitle) {
              pdf.text(entry.subtitle, margin.left, currentY);
            }
          
            // Location on the right
            if (entry.location) {
              pdf.text(entry.location, pageWidth - margin.right, currentY, { align: 'right' });
            }
            currentY += 5;
          }
        
          // Add bullet points for details
          if (entry.details && entry.details.length > 0) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
          
            for (const detail of entry.details) {
              const bulletText = "• " + detail;
              const textWidth = pageWidth - margin.left - margin.right - 5;
              const wrappedText = pdf.splitTextToSize(bulletText, textWidth);
            
              // Check for page break
              if (currentY + (wrappedText.length * 4.5) > pageHeight - margin.bottom) {
                pdf.addPage();
                currentY = margin.top;
              }
            
              // Add each line with proper indentation
              for (let i = 0; i < wrappedText.length; i++) {
                const line = wrappedText[i];
                if (i === 0) {
                  pdf.text(line, margin.left, currentY);
                } else {
                  // Indent continuing lines
                  pdf.text(line.replace(/^[•]\s/, '  '), margin.left + 4, currentY);
                }
                currentY += 4.5;
              }
            }
          
            currentY += 2; // Extra space after bullet points
          }
        
          currentY += 5; // Space between entries
        }
      } else {
        // Render unstructured text (like summary)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      
        // Clean the text
        const plainText = cleanLatexText(section.content);
        const textWidth = pageWidth - margin.left - margin.right;
        const wrappedText = pdf.splitTextToSize(plainText, textWidth);
      
        // Check for page break
        if (currentY + (wrappedText.length * 4.5) > pageHeight - margin.bottom) {
          pdf.addPage();
          currentY = margin.top;
        }
      
        // Add the text
        pdf.text(wrappedText, margin.left, currentY);
        currentY += wrappedText.length * 4.5 + 2;
      }
    
      currentY += 8; // Space after section
    }
  
    // If the Skills section doesn't have entries but has text content
    const skillsSection = sections.find(s => s.title === 'Skills');
    if (skillsSection && skillsSection.content) {
      const skillLineMatch = skillsSection.content.match(/\\textbf{([^}]+)}:\s*([^\\]+)/g);
      if (skillLineMatch) {
        skillLineMatch.forEach(match => {
          const parts = match.match(/\\textbf{([^}]+)}:\s*([^\\]+)/);
          if (parts && parts.length >= 3) {
            const category = parts[1].trim();
            const skills = parts[2].trim();
          
            // Check for page break
            if (currentY > pageHeight - margin.bottom - 10) {
              pdf.addPage();
              currentY = margin.top;
            }
          
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${category}: `, margin.left, currentY);
          
            pdf.setFont('helvetica', 'normal');
            const categoryWidth = pdf.getTextWidth(`${category}: `);
            const skillList = pdf.splitTextToSize(skills, pageWidth - margin.left - margin.right - categoryWidth);
          
            // For the first line, position after the category
            pdf.text(skillList[0], margin.left + categoryWidth, currentY);
          
            // For remaining lines, indent properly
            for (let i = 1; i < skillList.length; i++) {
              currentY += 4.5;
              pdf.text(skillList[i], margin.left + categoryWidth, currentY);
            }
          
            currentY += 6;
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in professional PDF rendering:', error);
    throw error;
  }
}

/**
 * Cleans LaTeX text for PDF output
 * @param {String} text - Raw LaTeX content
 * @returns {String} Cleaned text
 */
function cleanLatexText(text) {
  if (!text) return '';
  
  return text
    // Extract URLs from href commands - keep the URL, not the display text
    .replace(/\\href{([^}]+)}{[^}]+}/g, (_, url) => {
      return !url.startsWith('mailto:') ? url : '';
    })
    .replace(/\\textbf{([^}]+)}/g, '$1')      // Remove bold formatting but keep text
    .replace(/\\textit{([^}]+)}/g, '$1')      // Remove italic formatting but keep text
    .replace(/\\href{[^}]*}{([^}]*)}/g, '$1') // Extract link text
    .replace(/\\begin{itemize}|\\end{itemize}/g, '') // Remove itemize environments
    .replace(/\\item\s+/g, '• ')              // Replace \item with bullets
    .replace(/\$\\cdot\$/g, '•')              // Replace LaTeX bullets with Unicode
    .replace(/\\begin{center}|\\end{center}/g, '') // Remove center environment
    .replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')  // Remove other LaTeX commands
    .replace(/[{}$\\]/g, '')                  // Remove LaTeX symbols
    .replace(/\n{3,}/g, '\n\n')               // Normalize line breaks
    .replace(/\s+/g, ' ')                     // Normalize spaces
    .trim();                                 // Trim whitespace
}

/**
 * Extract sections from LaTeX content
 * @param {String} content - LaTeX document content
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
 * @param {String} content - LaTeX content
 * @returns {Array} Array of entry objects with title, date, subtitle, location, and details
 */
function parseEntries(content) {
  const entries = [];
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
        details.push(
          itemMatch[1].trim()
            .replace(/\\textbf{([^}]+)}/g, '$1')
            .replace(/\\textit{([^}]+)}/g, '$1')
            .replace(/\\href{[^}]*}{([^}]*)}/g, '$1')
            .replace(/[{}$\\]/g, '')
            .trim()
        );
      }
    }
    
    entries.push({
      title: title.trim()
        .replace(/\\textbf{([^}]+)}/g, '$1')
        .replace(/\\textit{([^}]+)}/g, '$1')
        .replace(/[{}$\\]/g, ''),
      date: date.trim(),
      subtitle: subtitle.trim(),
      location: location.trim(),
      details
    });
  }
  
  return entries;
}
