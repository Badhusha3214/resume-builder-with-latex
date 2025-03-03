import { jsPDF } from 'jspdf';
import { generateLatexDocument } from './latexCompiler';

/**
 * Generates a preview of the LaTeX resume
 * @param {Object} resume - Resume data object
 * @returns {String} HTML representation of the LaTeX document
 */
export function generateLatexPreview(resume) {
  try {
    const latexContent = generateLatexDocument(resume);
    const { processRawLatex } = require('./latexCompiler');
    return processRawLatex(latexContent);
  } catch (error) {
    console.error('Error generating LaTeX preview:', error);
    return '<div class="preview-error">Error generating resume preview</div>';
  }
}

/**
 * Downloads the resume as a PDF
 * @param {Object} resume - Resume data object or LaTeX source code
 * @param {Boolean} isSource - Whether resume is a source code string
 */
export async function downloadResumePdf(resume, isSource = false) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false
  });
  
  let latexContent;
  let name;
  
  try {
    if (isSource) {
      latexContent = resume;
      // Try to extract name from LaTeX
      const nameMatch = latexContent.match(/{\\huge\s*([^}]+)}/);
      name = nameMatch ? nameMatch[1].trim() : 'Resume';
    } else {
      latexContent = generateLatexDocument(resume);
      name = `${resume.personal.firstName}_${resume.personal.lastName}`;
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
    let margin = 15; // Smaller margin to fit more content (was 20)
    let contentWidth = pageWidth - 2 * margin;
    
    // Extract name and title for the header
    let headerName = '';
    let headerTitle = '';
    
    const nameMatch = documentContent.match(/{\\huge\s*([^}]+)}/);
    if (nameMatch) headerName = nameMatch[1].trim();
    
    const titleMatch = documentContent.match(/{\\large\s*([^}]+)}/);
    if (titleMatch) headerTitle = titleMatch[1].trim();
    
    // Add name
    pdf.setFontSize(18); // Was 20, slightly smaller to fit more
    pdf.setFont('times', 'bold');
    pdf.text(headerName, pageWidth/2, y, { align: 'center' });
    y += 7; // Was 8, slightly less spacing
    
    // Add title if available
    if (headerTitle) {
      pdf.setFontSize(13); // Was 14, slightly smaller
      pdf.setFont('times', 'italic');
      pdf.text(headerTitle, pageWidth/2, y, { align: 'center' });
      y += 8; // Was 10, reduced spacing
    } else {
      y += 4; // Was 5, reduced spacing
    }
    
    // Add contact info
    const contactMatch = documentContent.match(/\\begin{center}[^}]*?\\href{mailto:([^}]*)}{([^}]*)}([^}]*?)\\end{center}/);
    if (contactMatch) {
      pdf.setFontSize(9); // Was 10, smaller for contact info
      pdf.setFont('times', 'normal');
      
      // Clean up and format contact info
      let contactText = contactMatch[0]
        .replace(/\\begin{center}|\\end{center}/g, '')
        .replace(/\\href{mailto:([^}]*)}{([^}]*)}/g, '$2')
        .replace(/\\href{([^}]*)}{([^}]*)}/g, '$2')
        .replace(/\$\\cdot\$/g, ' • ')
        .trim();
      
      pdf.text(contactText, pageWidth/2, y, { align: 'center' });
      y += 8; // Was 10, reduced spacing
    }
    
    // Process all sections
    for (const section of sections) {
      // Check if we need a page break
      if (y > 277) { // Increased from 270 to allow more content per page
        pdf.addPage();
        y = 15; // Start a bit higher on subsequent pages (was 20)
      }
      
      // Section title
      pdf.setFontSize(13); // Was 14, slightly smaller
      pdf.setFont('times', 'bold');
      pdf.text(section.title, margin, y);
      pdf.line(margin, y + 1, pageWidth - margin, y + 1); // Underline
      y += 5; // Was 6, reduced spacing
      
      // Section content - handle entries and text
      const entries = parseEntries(section.content);
      
      if (entries.length > 0) {
        // We have structured entries
        for (const entry of entries) {
          // Check if we need a page break
          if (y > 267) { // Increased from 260 to allow more content
            pdf.addPage();
            y = 15; // Start higher on subsequent pages
          }
          
          // Entry title
          pdf.setFontSize(11); // Was 12, smaller for entry titles
          pdf.setFont('times', 'bold');
          
          // Calculate text width to prevent overlap
          const titleWidth = pdf.getTextWidth(entry.title);
          const dateWidth = entry.date ? pdf.getTextWidth(entry.date) : 0;
          
          // Ensure title doesn't overlap with date
          if (entry.date && titleWidth + dateWidth > contentWidth - 10) {
            // If they might overlap, truncate the title
            const maxTitleWidth = contentWidth - dateWidth - 20;
            let truncatedTitle = entry.title;
            while (pdf.getTextWidth(truncatedTitle) > maxTitleWidth) {
              truncatedTitle = truncatedTitle.substring(0, truncatedTitle.length - 1);
            }
            pdf.text(truncatedTitle + '...', margin, y);
          } else {
            // Normal case - no overlap
            pdf.text(entry.title, margin, y);
          }
          
          // Entry date on the right
          if (entry.date) {
            pdf.setFont('times', 'normal');
            pdf.text(entry.date, pageWidth - margin, y, { align: 'right' });
          }
          y += 4; // Was 5, reduced spacing
          
          // Entry subtitle and location
          if (entry.subtitle || entry.location) {
            pdf.setFontSize(10); // Was 11, smaller 
            pdf.setFont('times', 'italic');
            
            // Check for potential overlap again
            const subtitleWidth = entry.subtitle ? pdf.getTextWidth(entry.subtitle) : 0;
            const locationWidth = entry.location ? pdf.getTextWidth(entry.location) : 0;
            
            if (entry.subtitle && entry.location && subtitleWidth + locationWidth > contentWidth - 10) {
              // If they might overlap, truncate the subtitle
              const maxSubtitleWidth = contentWidth - locationWidth - 20;
              let truncatedSubtitle = entry.subtitle;
              while (pdf.getTextWidth(truncatedSubtitle) > maxSubtitleWidth) {
                truncatedSubtitle = truncatedSubtitle.substring(0, truncatedSubtitle.length - 1);
              }
              pdf.text(truncatedSubtitle + '...', margin, y);
            } else if (entry.subtitle) {
              pdf.text(entry.subtitle, margin, y);
            }
            
            if (entry.location) {
              pdf.text(entry.location, pageWidth - margin, y, { align: 'right' });
            }
            y += 4; // Was 5, reduced spacing
          }
          
          // Entry details (bullet points)
          if (entry.details && entry.details.length > 0) {
            pdf.setFontSize(9); // Was 10, smaller for details
            pdf.setFont('times', 'normal');
            
            for (const detail of entry.details) {
              // Multi-line text handling with word wrapping
              const textLines = pdf.splitTextToSize(detail, contentWidth - 10);
              
              for (let i = 0; i < textLines.length; i++) {
                // Check if we need a page break
                if (y > 280) { // Increased from 275
                  pdf.addPage();
                  y = 15;
                }
                
                // First line gets a bullet
                if (i === 0) {
                  pdf.text('•', margin + 2, y);
                  pdf.text(textLines[i], margin + 6, y); // Was 7, reduced indentation
                } else {
                  pdf.text(textLines[i], margin + 6, y); // Was 7, reduced indentation
                }
                
                y += 4; // Was 5, reduced spacing between lines
              }
            }
            y += 2; // Was 3, reduced space after bullet points
          }
        }
      } else {
        // Just regular text content
        pdf.setFontSize(10); // Was 11, slightly smaller
        pdf.setFont('times', 'normal');
        
        // Split content into paragraphs
        const paragraphs = section.content.split('\n\n');
        
        for (const paragraph of paragraphs) {
          if (paragraph.trim()) {
            // Word wrap long lines
            const lines = pdf.splitTextToSize(paragraph, contentWidth);
            
            for (const line of lines) {
              // Check if we need a page break
              if (y > 280) { // Increased from 275
                pdf.addPage();
                y = 15;
              }
              
              pdf.text(line, margin, y);
              y += 4; // Was 5, reduced line spacing
            }
            y += 2; // Was 3, reduced space between paragraphs
          }
        }
      }
      
      y += 6; // Was 8, reduced space between sections
    }
    
    // Save the PDF
    pdf.save(`${name.replace(/\s+/g, '_')}_resume.pdf`);
  } catch (error) {
    console.error('Error creating PDF:', error);
    alert('There was an error creating the PDF. Please try again.');
  }
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
