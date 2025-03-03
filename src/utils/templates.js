/**
 * Resume template definitions with styling and structure for different designs
 */

// Template CSS classes for Markdown preview styling
export const templateStyles = {
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
    .resume-preview-professional a {
      color: #1a5276;
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
    .resume-preview-minimalist a {
      color: #000;
      text-decoration: none;
      border-bottom: 1px dotted #555;
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
    .resume-preview-creative a {
      color: #e74c3c;
      text-decoration: none;
      font-weight: 600;
    }
  `
};

// LaTeX template variations
export const latexTemplates = {
  Modern: `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{color}
\\definecolor{linkcolor}{rgb}{0.0, 0.53, 0.74}

\\geometry{left=1.5cm, right=1.5cm, top=2cm, bottom=2cm}

\\hypersetup{colorlinks=true, linkcolor=linkcolor, urlcolor=linkcolor}

\\titleformat{\\section}{\\Large\\bfseries\\color{linkcolor}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.5em}\\noindent\\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\
}`,

  Classic: `\\documentclass[12pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}

\\geometry{left=2.5cm, right=2.5cm, top=2cm, bottom=2cm}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{\\MakeUppercase}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.5em}\\noindent\\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\
}`,

  Professional: `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{color}
\\definecolor{darkblue}{rgb}{0.1, 0.32, 0.46}

\\geometry{left=2cm, right=2cm, top=2cm, bottom=2cm}

\\hypersetup{colorlinks=true, linkcolor=darkblue, urlcolor=darkblue}

\\titleformat{\\section}{\\Large\\bfseries\\color{darkblue}}{}{0em}{}
\\titlespacing{\\section}{0pt}{14pt}{8pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.5em}\\noindent\\textbf{\\large #1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\
}`,

  Minimalist: `\\documentclass[10pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{color}

\\geometry{left=1.8cm, right=1.8cm, top=1.8cm, bottom=1.8cm}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.3em}\\noindent\\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\
}`,

  Creative: `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\definecolor{accent}{rgb}{0.91, 0.3, 0.24}

\\geometry{left=1.5cm, right=1.5cm, top=1.5cm, bottom=1.5cm}

\\hypersetup{colorlinks=true, linkcolor=accent, urlcolor=accent}

\\titleformat{\\section}{\\Large\\bfseries\\color{accent}}{}{0em}{}
\\titlespacing{\\section}{0pt}{15pt}{8pt}

\\newcommand{\\entry}[4]{
  \\vspace{0.5em}\\noindent\\textbf{\\large #1} \\hfill #2 \\\\
  \\textit{\\color{accent}#3} \\hfill #4 \\\\
}`
};

// Generate markdown with template-specific styling
export function generateTemplatedMarkdown(resume, templateName) {
  // Base content for all templates
  let markdown = generateMarkdownContent(resume);
  
  // Wrap content in template-specific container
  return `<style>${templateStyles[templateName]}</style>
<div class="resume-preview-${templateName.toLowerCase()}">
  ${markdown}
</div>`;
}

// Generate LaTeX with template-specific styling
export function generateTemplatedLatex(resume, templateName) {
  const latexTemplate = latexTemplates[templateName] || latexTemplates['Modern'];
  
  // Base LaTeX content with specific template preamble
  let latex = `${latexTemplate}
    
\\begin{document}

\\begin{center}
  {\\Huge ${resume.personal.firstName} ${resume.personal.lastName}}
  \\vspace{0.5em}

  ${resume.personal.title ? `{\\large ${resume.personal.title}}` : ''}
\\end{center}

% Contact Information
\\begin{center}
  ${resume.personal.email ? `\\href{mailto:${resume.personal.email}}{${resume.personal.email}} $\\cdot$ ` : ''}
  ${resume.personal.phone ? `${resume.personal.phone} $\\cdot$ ` : ''}
  ${resume.personal.location ? `${resume.personal.location} $\\cdot$ ` : ''}
  ${resume.personal.website ? `\\href{${resume.personal.website}}{${resume.personal.website}}` : ''}
\\end{center}

% Base LaTeX content would continue here...
\\end{document}`;

  return `<pre class="latex-preview">${latex}</pre>`;
}

// Helper function to generate markdown content
function generateMarkdownContent(resume) {
  let markdown = '';

  // Title and name
  markdown += `<h1>${resume.personal.firstName} ${resume.personal.lastName}</h1>`;
  
  if (resume.personal.title) {
    markdown += `<h2>${resume.personal.title}</h2>`;
  }
  
  // Contact info
  let contactInfo = [];
  if (resume.personal.email) contactInfo.push(`Email: <a href="mailto:${resume.personal.email}">${resume.personal.email}</a>`);
  if (resume.personal.phone) contactInfo.push(`Phone: ${resume.personal.phone}`);
  if (resume.personal.location) contactInfo.push(`Location: ${resume.personal.location}`);
  if (resume.personal.website) contactInfo.push(`Website: <a href="${resume.personal.website}" target="_blank">${resume.personal.website}</a>`);
  
  if (contactInfo.length > 0) {
    markdown += `<p>${contactInfo.join(' | ')}</p>`;
  }
  
  // Summary
  if (resume.personal.summary) {
    markdown += `<h2>Summary</h2>
<p>${resume.personal.summary}</p>`;
  }

  // Further sections (education, experience, etc.) would follow...
  // This is a simplified version focusing on the template system
  
  return markdown;
}
