import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import { createRoot } from 'react-dom/client';
import TicketPDFTemplate, { CompactTicketTemplate } from './TicketPDFTemplate';

/**
 * Download ticket as PDF with enhanced options
 * @param {Object} ticket - Ticket data object
 * @param {string} filename - Output filename
 * @param {Object} options - Configuration options
 */
export async function downloadTicketPDF(ticket, filename = 'ticket.pdf', options = {}) {
  const {
    scale = 2,               // Render scale (higher = better quality)
    backgroundColor = '#ffffff',
    timeout = 500,           // Timeout for render
    quality = 'high',        // 'low', 'medium', 'high'
    orientation = 'portrait', // 'portrait' or 'landscape'
    format = 'a4',          // 'a4', 'letter', 'legal'
    margins = { top: 20, right: 20, bottom: 20, left: 20 },
    template = 'full',       // 'full' or 'compact'
    onProgress = null,      // Progress callback
    onError = null          // Error callback
  } = options;

  let container = null;
  let root = null;

  try {
    // Validate ticket data
    if (!ticket || !ticket.bookingId) {
      throw new Error('Invalid ticket data: bookingId is required');
    }

    // Report progress
    if (onProgress) onProgress(10, 'Preparing ticket data...');

    // Create container for rendering
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = backgroundColor;
    document.body.appendChild(container);

    // Select template based on option
    const TemplateComponent = template === 'compact' ? CompactTicketTemplate : TicketPDFTemplate;

    // Render React component
    root = createRoot(container);
    root.render(<TemplateComponent ticket={ticket} showQRCode={true} showTerms={true} />);

    if (onProgress) onProgress(30, 'Rendering ticket...');

    // Wait for render with dynamic timeout
    await new Promise((resolve) => setTimeout(resolve, timeout));

    if (onProgress) onProgress(50, 'Capturing image...');

    // Configure html2canvas options based on quality
    const canvasOptions = {
      backgroundColor,
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      ...(quality === 'high' && {
        scale: 3,
        dpi: 300,
      }),
      ...(quality === 'low' && {
        scale: 1,
        dpi: 72,
      })
    };

    // Capture the component as canvas
    const canvas = await html2canvas(container, canvasOptions);

    if (onProgress) onProgress(70, 'Generating PDF...');

    // Calculate image dimensions
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Initialize PDF with custom settings
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format,
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate available space considering margins
    const availableWidth = pageWidth - margins.left - margins.right;
    const availableHeight = pageHeight - margins.top - margins.bottom;
    
    // Calculate image dimensions maintaining aspect ratio
    let imgWidth = canvas.width;
    let imgHeight = canvas.height;
    
    // Scale image to fit within available width
    if (imgWidth > availableWidth) {
      const ratio = availableWidth / imgWidth;
      imgWidth = availableWidth;
      imgHeight = imgHeight * ratio;
    }
    
    // Check if image fits on one page
    if (imgHeight > availableHeight) {
      console.warn('Ticket content exceeds page height. Consider using compact template or landscape orientation.');
    }

    // Add image to PDF
    pdf.addImage(
      imgData, 
      'PNG', 
      margins.left, 
      margins.top, 
      imgWidth, 
      imgHeight,
      undefined,
      'FAST'
    );

    // Add metadata to PDF
    pdf.setProperties({
      title: `Ticket-${ticket.bookingId}`,
      subject: `Event Ticket: ${ticket.eventName}`,
      author: 'EventPro',
      creator: 'EventPro Ticket System',
      keywords: `ticket, event, ${ticket.eventName}, ${ticket.bookingId}`,
      creationDate: new Date()
    });

    // Add page numbers if multiple pages (for future enhancement)
    const pageCount = pdf.internal.getNumberOfPages();
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 50, pageHeight - 10);
      }
    }

    if (onProgress) onProgress(90, 'Saving PDF...');

    // Save the PDF
    pdf.save(filename);

    if (onProgress) onProgress(100, 'Done!');

    return { success: true, filename, pages: pageCount };

  } catch (error) {
    console.error('PDF generation error:', error);
    if (onError) onError(error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    // Cleanup
    if (root) {
      try {
        root.unmount();
      } catch (unmountError) {
        console.error('Error unmounting root:', unmountError);
      }
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generate PDF with watermark for verification
 */
export async function downloadTicketWithWatermark(ticket, filename = 'ticket-verified.pdf', watermarkText = 'VERIFIED') {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <div style={{ position: 'relative' }}>
      <TicketPDFTemplate ticket={ticket} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {watermarkText}
      </div>
    </div>
  );

  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = Math.min(canvas.width, pageWidth - 40);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
  pdf.save(filename);
  
  root.unmount();
  document.body.removeChild(container);
}

/**
 * Generate multiple tickets as a single PDF
 */
export async function downloadMultipleTicketsPDF(tickets, filename = 'tickets-bundle.pdf') {
  if (!tickets || tickets.length === 0) {
    throw new Error('No tickets provided for PDF generation');
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  document.body.appendChild(container);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const root = createRoot(container);
    root.render(<TicketPDFTemplate ticket={ticket} showQRCode={true} />);
    
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = Math.min(canvas.width, pageWidth - 40);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (i > 0) {
      pdf.addPage();
    }
    
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    root.unmount();
  }
  
  pdf.save(filename);
  document.body.removeChild(container);
}

/**
 * Generate PDF with custom header and footer
 */
export async function downloadTicketWithCustomHeaderFooter(ticket, filename = 'ticket-custom.pdf', headerText, footerText) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <div>
      {headerText && (
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          marginBottom: '20px'
        }}>
          {headerText}
        </div>
      )}
      <TicketPDFTemplate ticket={ticket} />
      {footerText && (
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          marginTop: '20px',
          fontSize: '10px'
        }}>
          {footerText}
        </div>
      )}
    </div>
  );

  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = Math.min(canvas.width, pageWidth - 40);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
  pdf.save(filename);
  
  root.unmount();
  document.body.removeChild(container);
}

// React Hook for PDF generation
export function useTicketPDF() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState(null);

  const generatePDF = React.useCallback(async (ticket, filename, options = {}) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const result = await downloadTicketPDF(ticket, filename, {
        ...options,
        onProgress: (percent, message) => {
          setProgress(percent);
          if (options.onProgress) options.onProgress(percent, message);
        },
        onError: (err) => {
          setError(err);
          if (options.onError) options.onError(err);
        }
      });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return {
    generatePDF,
    isGenerating,
    progress,
    error
  };
}

// Utility function to validate ticket data before PDF generation
export function validateTicketForPDF(ticket) {
  const requiredFields = ['bookingId', 'eventName', 'eventDate'];
  const missingFields = requiredFields.filter(field => !ticket[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  return {
    valid: true,
    message: 'Ticket data is valid for PDF generation'
  };
}

export default downloadTicketPDF;