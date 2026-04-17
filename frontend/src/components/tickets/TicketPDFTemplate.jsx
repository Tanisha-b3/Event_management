import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Install: npm install qrcode.react

const TicketPDFTemplate = ({ ticket, showQRCode = true, showTerms = true }) => {
  if (!ticket) return null;

  const {
    eventName,
    eventDate,
    eventLocation,
    ticketType,
    quantity,
    bookingId,
    price,
    totalAmount,
    userName,
    userEmail,
    seatNumber,
    gateNumber,
    orderNumber,
    termsAndConditions,
    additionalInfo
  } = ticket;

  const formattedDate = new Date(eventDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const totalPaid = totalAmount || (Number(price) * Number(quantity)).toFixed(2);

  return (
    <div style={styles.container}>
      {/* Ticket Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            EventPro
          </h1>
          <div style={styles.ticketBadge}>OFFICIAL TICKET</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Event Title Section */}
        <div style={styles.eventSection}>
          <h2 style={styles.eventName}>{eventName}</h2>
          {ticketType && (
            <div style={styles.ticketTypeBadge}>{ticketType}</div>
          )}
        </div>

        {/* Event Details Grid */}
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <div style={styles.detailIcon}>📅</div>
            <div>
              <div style={styles.detailLabel}>Date & Time</div>
              <div style={styles.detailValue}>{formattedDate}</div>
            </div>
          </div>

          <div style={styles.detailItem}>
            <div style={styles.detailIcon}>📍</div>
            <div>
              <div style={styles.detailLabel}>Venue</div>
              <div style={styles.detailValue}>{eventLocation || 'TBA'}</div>
            </div>
          </div>

          {gateNumber && (
            <div style={styles.detailItem}>
              <div style={styles.detailIcon}>🚪</div>
              <div>
                <div style={styles.detailLabel}>Gate</div>
                <div style={styles.detailValue}>{gateNumber}</div>
              </div>
            </div>
          )}

          {seatNumber && (
            <div style={styles.detailItem}>
              <div style={styles.detailIcon}>💺</div>
              <div>
                <div style={styles.detailLabel}>Seat</div>
                <div style={styles.detailValue}>{seatNumber}</div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Booking Information */}
        <div style={styles.bookingSection}>
          <div style={styles.bookingRow}>
            <span style={styles.bookingLabel}>Booking ID:</span>
            <span style={styles.bookingValue}>{bookingId}</span>
          </div>
          {orderNumber && (
            <div style={styles.bookingRow}>
              <span style={styles.bookingLabel}>Order Number:</span>
              <span style={styles.bookingValue}>{orderNumber}</span>
            </div>
          )}
          <div style={styles.bookingRow}>
            <span style={styles.bookingLabel}>Quantity:</span>
            <span style={styles.bookingValue}>{quantity} ticket(s)</span>
          </div>
          <div style={styles.bookingRow}>
            <span style={styles.bookingLabel}>Total Paid:</span>
            <span style={styles.bookingValue}>${totalPaid}</span>
          </div>
          {userName && (
            <div style={styles.bookingRow}>
              <span style={styles.bookingLabel}>Ticket Holder:</span>
              <span style={styles.bookingValue}>{userName}</span>
            </div>
          )}
          {userEmail && (
            <div style={styles.bookingRow}>
              <span style={styles.bookingLabel}>Email:</span>
              <span style={styles.bookingValue}>{userEmail}</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {/* {showQRCode && bookingId && (
          <div style={styles.qrSection}>
            <div style={styles.qrCode}>
              <QRCodeSVG 
                value={JSON.stringify({
                  bookingId,
                  eventName,
                  eventDate,
                  ticketType,
                  quantity
                })} 
                size={140}
                level="H"
                includeMargin={true}
              />
            </div>
            <div style={styles.qrText}>
              Scan this QR code at the entrance
            </div>
          </div>
        )} */}

        {/* Additional Info */}
        {additionalInfo && (
          <div style={styles.additionalInfo}>
            <div style={styles.infoIcon}>ℹ️</div>
            <div style={styles.infoText}>{additionalInfo}</div>
          </div>
        )}

        {/* Instructions */}
        <div style={styles.instructions}>
          <div style={styles.instructionTitle}>📋 Important Instructions:</div>
          <ul style={styles.instructionList}>
            <li>Please carry a valid ID proof for verification</li>
            <li>Arrive at least 30 minutes before the event starts</li>
            <li>This ticket is non-transferable and non-refundable</li>
            <li>Keep your ticket handy for quick entry</li>
            <li>Screenshots of this ticket are acceptable</li>
          </ul>
        </div>

        {/* Terms and Conditions */}
        {showTerms && (termsAndConditions || (
          <div style={styles.termsSection}>
            <div style={styles.termsTitle}>Terms & Conditions:</div>
            <div style={styles.termsText}>
              • This ticket is subject to terms and conditions of EventPro<br/>
              • Management reserves the right to refuse admission<br/>
              • No outside food or beverages allowed<br/>
              • Event schedule subject to change without notice<br/>
              • By using this ticket you agree to our terms
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>
          For support, contact: support@eventpro.com | +1 (555) 123-4567
        </div>
        <div style={styles.footerDate}>
          Generated on: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)',
    color: '#1f2937',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px 32px',
    textAlign: 'center',
  },
  headerContent: {
    position: 'relative',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 0 8px 0',
    color: 'white',
    letterSpacing: '-0.5px',
  },
  titleSpan: {
    color: '#fbbf24',
  },
  ticketBadge: {
    display: 'inline-block',
    // backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    letterSpacing: '1px',
  },
  content: {
    padding: '24px',
  },
  eventSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  eventName: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#1f2937',
  },
  ticketTypeBadge: {
    display: 'inline-block',
    // backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  detailIcon: {
    fontSize: '24px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #e5e7eb, transparent)',
    margin: '24px 0',
  },
  bookingSection: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  bookingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  bookingLabel: {
    fontWeight: '500',
    color: '#6b7280',
  },
  bookingValue: {
    fontWeight: '600',
    color: '#1f2937',
  },
  qrSection: {
    textAlign: 'center',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '2px dashed #e5e7eb',
    borderRadius: '12px',
  },
  qrCode: {
    display: 'inline-block',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  qrText: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#6b7280',
  },
  additionalInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '12px',
    marginBottom: '24px',
    borderLeft: '4px solid #f59e0b',
  },
  infoIcon: {
    fontSize: '20px',
  },
  infoText: {
    fontSize: '14px',
    color: '#92400e',
    flex: 1,
  },
  instructions: {
    marginBottom: '24px',
  },
  instructionTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1f2937',
  },
  instructionList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#4b5563',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  termsSection: {
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    marginTop: '16px',
  },
  termsTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#1f2937',
  },
  termsText: {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  footer: {
    backgroundColor: '#f9fafb',
    padding: '20px 32px',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  footerDate: {
    fontSize: '10px',
    color: '#9ca3af',
  },
};

// Print-specific styles
const printStyles = `
  @media print {
    body {
      background: white;
      padding: 0;
      margin: 0;
    }
    .no-print {
      display: none;
    }
    .ticket-container {
      box-shadow: none;
      margin: 0;
      padding: 0;
    }
  }
`;

// Wrapper component with print functionality
export const PrintableTicket = ({ ticket, onPrint }) => {
  React.useEffect(() => {
    // Inject print styles
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="ticket-container">
      <TicketPDFTemplate ticket={ticket} />
      <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={handlePrint}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
};

// Compact version for mobile
export const CompactTicketTemplate = ({ ticket }) => {
  if (!ticket) return null;

  return (
    <div style={{
      ...styles.container,
      maxWidth: '100%',
      borderRadius: '12px',
    }}>
      <div style={{
        ...styles.header,
        padding: '16px 20px',
      }}>
        <h2 style={{
          ...styles.title,
          fontSize: '20px',
          margin: 0,
        }}>Event<span style={styles.titleSpan}>Pro</span></h2>
      </div>
      
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{ticket.eventName}</h3>
          <div style={{
            ...styles.ticketTypeBadge,
            fontSize: '10px',
          }}>{ticket.ticketType}</div>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>📅 {new Date(ticket.eventDate).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>📍 {ticket.eventLocation}</div>
        </div>
        
        <div style={styles.divider} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Booking ID:</span>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>{ticket.bookingId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Quantity:</span>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>{ticket.quantity} ticket(s)</span>
        </div>
      </div>
    </div>
  );
};

export default TicketPDFTemplate;