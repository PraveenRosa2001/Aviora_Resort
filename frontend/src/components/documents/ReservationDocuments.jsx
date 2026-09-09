import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { FileText, Printer, Loader2 } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';

/* --------------------------------------------------------------------------
   Executive-Grade Printable Invoices & Documents for Aviora Resort.

   Documents:
     1. StayVoucher   - Guest Villa Booking Invoice & Confirmation Folio.
     2. StayInvoice   - Certified Accounting Tax Invoice for Villa Stays.
     3. TableVoucher  - Restaurant Dining Reservation Invoice & Confirmation Folio.
     4. TableDocket   - Service Pass & Maitre d' Kitchen Docket.

   Structure adheres strictly to the modern corporate invoice standard:
     - Top Header with Official Logo, Resort Name & giant INVOICE title
     - High-contrast Black Reference & Date block
     - Clean 2-column FROM (Resort) and TO (Guest) dossiers
     - Schedule Highlights Strip (Arrival, Departure, Duration, Allocation)
     - Formal "Description of ... Services:" heading
     - Itemized table with solid black header and light-bordered grid
     - Right-aligned Financial Breakdown (Subtotal, Service Charge, Taxes, Total)
     - Guest Special Requests & Dietary Advisory section
     - Payment Arrangement block in solid black box (bottom-left)
     - Official Authorized Signatory line & Verification Seal (bottom-center)
     - Clean Contact Info with inline SVG icons (bottom-right)
   -------------------------------------------------------------------------- */

const money = (value, currency = 'LKR') =>
  `${currency === 'LKR' ? 'Rs. ' : ''}${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const longDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const stamp = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shortDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Robust helper to resolve guest information from any shape of booking object.
 */
function resolveGuestDetails(booking, currentUser) {
  const g = booking?.guest || booking?.guestInfo || booking?.user || {};

  const fName = g.firstName || booking?.firstName || currentUser?.firstName || '';
  const lName = g.lastName || booking?.lastName || currentUser?.lastName || '';
  let name = `${fName} ${lName}`.trim();
  if (!name) {
    name =
      g.fullName ||
      g.name ||
      g.guestName ||
      booking?.guestName ||
      booking?.fullName ||
      currentUser?.name ||
      'Valued Guest';
  }

  const email =
    g.email ||
    booking?.guestEmail ||
    booking?.email ||
    booking?.userEmail ||
    currentUser?.email ||
    'reservations@aviora.com';

  const phone =
    g.phone ||
    g.telephone ||
    g.phoneNumber ||
    booking?.guestPhone ||
    booking?.phone ||
    booking?.telephone ||
    booking?.phoneNumber ||
    currentUser?.phone ||
    currentUser?.phoneNumber ||
    '+94 11 000 0000';

  const country = g.country || booking?.country || currentUser?.country || '';

  const bedConfig =
    booking?.bedConfiguration ||
    booking?.bedPreference ||
    g.bedPreference ||
    g.bedConfiguration ||
    '1 King Bed';

  const villaName =
    booking?.villaName ||
    booking?.villa?.name ||
    booking?.roomName ||
    'Canopy Forest Villa';

  const ratePlanName =
    booking?.ratePlanName ||
    booking?.ratePlan?.name ||
    booking?.ratePlan ||
    'Flexible Standard Rate';

  const specialRequests = g.specialRequests || booking?.specialRequests || '';

  return {
    name,
    firstName: fName,
    lastName: lName,
    email,
    phone,
    country,
    bedConfig,
    villaName,
    ratePlanName,
    specialRequests,
  };
}

function resolveDiningDetails(table, currentUser) {
  const name =
    table?.guestName ||
    table?.name ||
    table?.fullName ||
    currentUser?.name ||
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    'Valued Guest';

  const email =
    table?.email ||
    table?.guestEmail ||
    currentUser?.email ||
    'reservations@aviora.com';

  const phone =
    table?.phone ||
    table?.telephone ||
    table?.phoneNumber ||
    currentUser?.phone ||
    '+94 11 000 0000';

  const venueName =
    table?.venueName ||
    table?.restaurantName ||
    'The Pool Brasserie';

  return {
    name,
    email,
    phone,
    venueName,
  };
}

/* --------------------------------------------------------------------------
   The print stylesheet.
   Optimized for crisp A4 rendering, high-contrast monochrome printing,
   and executive typography.
   -------------------------------------------------------------------------- */
const PRINT_CSS = `
  @page {
    size: A4;
    margin: 10mm 12mm;
  }

  #aviora-print-root {
    display: none;
  }

  @media print {
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body > *:not(#aviora-print-root) {
      display: none !important;
    }
    #aviora-print-root {
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .avoid-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }

  #aviora-print-root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #111827;
    font-size: 8.8pt;
    line-height: 1.42;
    background-color: #ffffff;
    max-width: 100%;
    box-sizing: border-box;
  }

  #aviora-print-root table {
    width: 100%;
    border-collapse: collapse;
  }

  #aviora-print-root .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  #aviora-print-root .border-box {
    box-sizing: border-box;
  }
`;

/* --------------------------------------------------------------------------
   Shared Modular Sub-components for Invoices
   -------------------------------------------------------------------------- */

/**
 * Top Header matching the reference structure:
 * Left: Logo image + Company Name + Subtitle
 * Right: Giant "INVOICE" Title
 */
function InvoiceHeader({ documentTitle = 'INVOICE', documentSubtitle = 'SANCTUARY OF GRANDEUR · SRI LANKA' }) {
  return (
    <div className="avoid-break" style={{ marginBottom: '8pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10pt' }}>
          <img
            src="/assets/logo/Aviora Resort Logo - Without Background.png"
            alt="Aviora Resort"
            style={{
              height: '42pt',
              width: 'auto',
              maxWidth: '65pt',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(e) => {
              // Fallback monogram if image asset is unavailable
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextSibling;
              if (fb) fb.style.display = 'flex';
            }}
          />
          {/* Fallback emblem */}
          <div
            style={{
              display: 'none',
              width: '36pt',
              height: '36pt',
              backgroundColor: '#000000',
              color: '#ffffff',
              borderRadius: '4pt',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontFamily: 'Georgia, serif',
              fontSize: '14pt',
            }}
          >
            AV
          </div>

          <div>
            <div
              style={{
                fontSize: '19pt',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#000000',
              }}
            >
              Aviora Resort
            </div>
            <div
              style={{
                fontSize: '6.5pt',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#4b5563',
                fontWeight: '700',
                marginTop: '2pt',
              }}
            >
              {documentSubtitle}
            </div>
          </div>
        </div>

        {/* Right: Giant Document Title */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '28pt',
              fontWeight: '900',
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: '#000000',
              textTransform: 'uppercase',
            }}
          >
            {documentTitle}
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div
        style={{
          borderBottom: '1.5pt solid #000000',
          marginTop: '8pt',
          marginBottom: '10pt',
        }}
      />
    </div>
  );
}

/**
 * Invoice Number, Date & Status Block matching reference image:
 * Solid black box on the right with Invoice Number & Date.
 * Credentials & License on the left.
 */
function InvoiceMetaBanner({ reference, date, status = 'Confirmed', labelPrefix = 'Invoice Number:' }) {
  return (
    <div
      className="avoid-break"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12pt',
      }}
    >
      {/* Left: Resort Tax & License Credentials */}
      <div style={{ fontSize: '7.8pt', color: '#4b5563', lineHeight: 1.5 }}>
        <div>
          <span style={{ fontWeight: '700', color: '#111827' }}>VAT / TIN Reg No: </span>
          AVI-VAT-9400281
        </div>
        <div>
          <span style={{ fontWeight: '700', color: '#111827' }}>SL Tourism License: </span>
          SLTDA/SQ/2026/0842
        </div>
        <div>
          <span style={{ fontWeight: '700', color: '#111827' }}>Folio Security Code: </span>
          AVI-{reference}-SEC
        </div>
      </div>

      {/* Right: Solid Black Badge */}
      <div
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '4pt',
          padding: '8pt 14pt',
          textAlign: 'left',
          minWidth: '175pt',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '9pt', fontWeight: '700', marginBottom: '2pt', letterSpacing: '0.02em' }}>
          {labelPrefix} <span style={{ fontFamily: 'monospace', fontSize: '9.5pt' }}>{reference}</span>
        </div>
        <div style={{ fontSize: '8pt', opacity: 0.95 }}>
          Date: <span style={{ fontWeight: '600' }}>{date}</span>
        </div>
        <div style={{ fontSize: '8pt', opacity: 0.95, marginTop: '1pt' }}>
          Status: <span style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Two-column FROM / TO Dossier strictly matching reference structure.
 */
function InvoiceParties({ guest, reference }) {
  return (
    <div
      className="avoid-break"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '24pt',
        marginBottom: '12pt',
      }}
    >
      {/* Left Column: FROM */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '9.5pt',
            fontWeight: '800',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4pt',
          }}
        >
          FROM:
        </div>
        <div style={{ fontSize: '8.5pt', color: '#1f2937', lineHeight: 1.48 }}>
          <div style={{ fontWeight: '700', color: '#000000' }}>Aviora Resort &amp; Lagoon Sanctuary</div>
          <div>Bentota Coastal Reserve, Southern Province</div>
          <div>Post Code: 80500, Sri Lanka</div>
          <div>
            <span style={{ fontWeight: '600' }}>Phone:</span> +94 11 000 0000 / +94 91 223 4567
          </div>
          <div>
            <span style={{ fontWeight: '600' }}>Email:</span> reservations@aviora.com
          </div>
          <div>
            <span style={{ fontWeight: '600' }}>Web:</span> www.avioraresort.com
          </div>
        </div>
      </div>

      {/* Right Column: TO */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '9.5pt',
            fontWeight: '800',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4pt',
          }}
        >
          TO:
        </div>
        <div style={{ fontSize: '8.5pt', color: '#1f2937', lineHeight: 1.48 }}>
          <div style={{ fontWeight: '700', fontSize: '9.5pt', color: '#000000' }}>{guest.name}</div>
          <div>{guest.country ? `Region / Country: ${guest.country}` : 'Valued International Guest'}</div>
          <div>
            <span style={{ fontWeight: '600' }}>Phone:</span> {guest.phone}
          </div>
          <div>
            <span style={{ fontWeight: '600' }}>Email:</span> {guest.email}
          </div>
          <div>
            <span style={{ fontWeight: '600' }}>Guest Folio:</span> G-{reference}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Key Reservation / Stay Schedule Bar (Professional Enhancement)
 */
function StayScheduleBar({ checkIn, checkOut, nights, bedding, adults, children, villaName }) {
  return (
    <div
      className="avoid-break"
      style={{
        display: 'flex',
        border: '1px solid #d1d5db',
        borderRadius: '3pt',
        backgroundColor: '#f9fafb',
        padding: '7pt 10pt',
        marginBottom: '11pt',
        fontSize: '8.2pt',
      }}
    >
      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', paddingRight: '8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          CHECK-IN (ARRIVAL)
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{longDate(checkIn)}</div>
        <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>From 14:00 onwards</div>
      </div>

      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: '0 8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          CHECK-OUT (DEPARTURE)
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{longDate(checkOut)}</div>
        <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>Until 12:00 noon</div>
      </div>

      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: '0 8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          STAY DURATION &amp; GUESTS
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>
          {nights} Night{nights === 1 ? '' : 's'} Total
        </div>
        <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>
          {adults || 1} Adult{(adults || 1) === 1 ? '' : 's'}
          {children ? `, ${children} Child${children === 1 ? '' : 'ren'}` : ''}
        </div>
      </div>

      <div style={{ flex: 1.1, paddingLeft: '8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          VILLA &amp; BED ARRANGEMENT
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{villaName}</div>
        <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>{bedding}</div>
      </div>
    </div>
  );
}

function DiningScheduleBar({ venueName, date, time, partySize, occasion }) {
  return (
    <div
      className="avoid-break"
      style={{
        display: 'flex',
        border: '1px solid #d1d5db',
        borderRadius: '3pt',
        backgroundColor: '#f9fafb',
        padding: '7pt 10pt',
        marginBottom: '11pt',
        fontSize: '8.2pt',
      }}
    >
      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', paddingRight: '8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          DINING DATE
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{longDate(date)}</div>
      </div>

      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: '0 8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          SITTING TIME
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{time}</div>
      </div>

      <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: '0 8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PARTY SIZE (COVERS)
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>
          {partySize} Guest{partySize === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ flex: 1.2, paddingLeft: '8pt' }}>
        <div style={{ fontSize: '6.8pt', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          VENUE &amp; OCCASION
        </div>
        <div style={{ fontWeight: '700', color: '#000000', marginTop: '1pt' }}>{venueName}</div>
        <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>{occasion || 'Fine Dining & Lagoon Atmosphere'}</div>
      </div>
    </div>
  );
}

/**
 * Bottom Section strictly matching reference image:
 * Left: Solid black box for Payment Method
 * Center: Authorized Signature & Official Seal
 * Right: Contact details with icons
 */
function InvoiceFooterBlocks({
  paymentMethod,
  paymentAccount,
  status = 'Confirmed',
  currency = 'LKR',
  reference,
  signatoryTitle = 'Front Desk & Cashier Auditing',
}) {
  return (
    <div
      className="avoid-break"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '14pt',
        paddingTop: '8pt',
      }}
    >
      {/* Left: Solid Black Payment Block */}
      <div
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '3pt',
          padding: '8pt 14pt',
          fontSize: '8pt',
          lineHeight: 1.5,
          minWidth: '180pt',
        }}
      >
        <div style={{ fontWeight: '700', fontSize: '8.5pt' }}>
          Payment Method: <span style={{ fontWeight: '400' }}>{paymentMethod}</span>
        </div>
        {paymentAccount && (
          <div style={{ fontSize: '7.8pt', opacity: 0.9 }}>
            Account / Card: <span style={{ fontFamily: 'monospace' }}>{paymentAccount}</span>
          </div>
        )}
        <div style={{ fontSize: '7.8pt', opacity: 0.9 }}>
          Settlement Status: <span style={{ fontWeight: '700' }}>{status}</span> · {currency}
        </div>
      </div>

      {/* Center: Official Authorized Signatory Line & Digital Seal */}
      <div style={{ textAlign: 'center', minWidth: '130pt' }}>
        <div
          style={{
            borderBottom: '1px solid #9ca3af',
            width: '120pt',
            margin: '0 auto 4pt',
            height: '18pt',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '8pt',
              color: '#374151',
              letterSpacing: '0.04em',
            }}
          >
            Aviora Front Desk
          </span>
        </div>
        <div
          style={{
            fontSize: '6.5pt',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#4b5563',
          }}
        >
          Authorized Signatory
        </div>
        <div style={{ fontSize: '6pt', color: '#6b7280' }}>{signatoryTitle}</div>
      </div>

      {/* Right: Contact Information with Inline SVG Icons (Matching Image 3!) */}
      <div style={{ textAlign: 'right', fontSize: '8.2pt', color: '#111827', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5pt' }}>
          {/* Phone Icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span style={{ fontWeight: '600' }}>+94 11 000 0000</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5pt' }}>
          {/* Globe Icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span style={{ fontWeight: '500' }}>www.avioraresort.com</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5pt' }}>
          {/* Mail Icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span style={{ color: '#4b5563' }}>reservations@aviora.com</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Document 1: StayVoucher / Guest Villa Booking Invoice
   -------------------------------------------------------------------------- */

function StayVoucher({ booking }) {
  const currentUser = useSelector(selectCurrentUser);
  const guest = resolveGuestDetails(booking, currentUser);
  const nights = Number(booking.nights) || 1;

  // Breakdown calculation
  const roomBase = Number(booking.roomSubtotal) || Number(booking.finalTotal) || 0;
  const unitNightRate = roomBase > 0 ? roomBase / nights : 0;
  const addons = booking.addons || [];
  const addonsTotal = addons.reduce((sum, a) => sum + (Number(a.lineTotal) || 0), 0);
  const subTotal = roomBase + addonsTotal;
  const discount = Number(booking.discountAmount) || 0;
  const netSubtotal = booking.netSubtotal ? Number(booking.netSubtotal) : subTotal - discount;

  // Compute or extract 10% service charge and taxes
  let serviceCharge = 0;
  let governmentTaxes = 0;

  if (booking.taxes && Array.isArray(booking.taxes) && booking.taxes.length > 0) {
    const scTax = booking.taxes.find(
      (t) => t.code?.toLowerCase().includes('service') || t.displayName?.toLowerCase().includes('service')
    );
    serviceCharge = scTax ? Number(scTax.taxAmount) : netSubtotal * 0.1;
    governmentTaxes = booking.taxes
      .filter((t) => t !== scTax)
      .reduce((sum, t) => sum + Number(t.taxAmount || 0), 0);
  } else {
    // Standard hospitality breakdown fallback
    serviceCharge = netSubtotal * 0.1;
    governmentTaxes = Math.max(0, Number(booking.finalTotal || 0) - (netSubtotal + serviceCharge));
  }

  const grandTotal = Number(booking.finalTotal) || (netSubtotal + serviceCharge + governmentTaxes);

  let rowCounter = 1;

  return (
    <>
      {/* 1. Header */}
      <InvoiceHeader documentTitle="INVOICE" documentSubtitle="SANCTUARY OF GRANDEUR · SRI LANKA" />

      {/* 2. Reference & Date Block */}
      <InvoiceMetaBanner
        reference={booking.referenceId}
        date={shortDate(booking.bookedAt || new Date().toISOString())}
        status={booking.status || 'Confirmed'}
        labelPrefix="Invoice Number:"
      />

      {/* 3. FROM & TO Dossier */}
      <InvoiceParties guest={guest} reference={booking.referenceId} />

      {/* 4. Stay Schedule Strip (Professional Enhancement) */}
      <StayScheduleBar
        checkIn={booking.checkIn}
        checkOut={booking.checkOut}
        nights={nights}
        bedding={guest.bedConfig}
        adults={booking.adults}
        children={booking.children}
        villaName={guest.villaName}
      />

      {/* 5. Section Heading strictly like Image 3 */}
      <div
        className="avoid-break"
        style={{
          fontSize: '10.5pt',
          fontWeight: '800',
          color: '#000000',
          marginBottom: '5pt',
        }}
      >
        Description of Accommodation &amp; Sanctuary Services:
      </div>

      {/* 6. Itemized Services Table */}
      <table className="avoid-break" style={{ width: '100%', marginBottom: '6pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '6%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              No
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'left', width: '46%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Service Description
            </th>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '14%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Duration
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Rate / Night
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Reserved Villa */}
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
              {rowCounter++}
            </td>
            <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              <div style={{ fontWeight: '700', color: '#000000', fontSize: '9pt' }}>{guest.villaName}</div>
              <div style={{ fontSize: '7.6pt', color: '#4b5563', marginTop: '1pt' }}>
                Rate Plan: <span style={{ fontWeight: '600' }}>{guest.ratePlanName}</span> · {guest.bedConfig}
              </div>
              <div style={{ fontSize: '7.2pt', color: '#6b7280' }}>
                {shortDate(booking.checkIn)} to {shortDate(booking.checkOut)} ({nights} night{nights === 1 ? '' : 's'})
              </div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
              {nights} Night{nights === 1 ? '' : 's'}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              {money(unitNightRate, booking.currency)}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
              {money(roomBase, booking.currency)}
            </td>
          </tr>

          {/* Additional Addons / Experiences (if any) */}
          {addons.map((a) => (
            <tr key={a.id || a.name}>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
                {rowCounter++}
              </td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
                <div style={{ fontWeight: '700', color: '#000000', fontSize: '8.8pt' }}>{a.name}</div>
                <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>{a.chargeBasis || 'Curated sanctuary experience'}</div>
              </td>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
                {a.quantity > 1 ? `${a.quantity} Units` : '1 Experience'}
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
                {money(a.unitPrice, booking.currency)}
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
                {money(a.lineTotal, booking.currency)}
              </td>
            </tr>
          ))}

          {/* Promotional Discount (if any) */}
          {discount > 0 && (
            <tr>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
                {rowCounter++}
              </td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
                <div style={{ fontWeight: '700', color: '#047857' }}>Promotional Privilege Savings</div>
                <div style={{ fontSize: '7.5pt', color: '#065f46' }}>
                  Code Applied: {booking.promoCode || 'RESORT-PROMO'} ({booking.promoDiscountPct || 10}%)
                </div>
              </td>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', color: '#047857' }}>
                Special Rate
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', color: '#047857' }}>
                −{booking.promoDiscountPct || 10}%
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700', color: '#047857' }}>
                −{money(discount, booking.currency)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 7. Summary / Financial Breakdown (Right-aligned, matching Image 3!) */}
      <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8pt' }}>
        <table style={{ width: '45%', borderCollapse: 'collapse', fontSize: '8.8pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3.5pt 6pt', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                Sub Total:
              </td>
              <td className="num" style={{ padding: '3.5pt 6pt', width: '50%', fontWeight: '600' }}>
                {money(subTotal, booking.currency)}
              </td>
            </tr>

            {discount > 0 && (
              <tr>
                <td style={{ padding: '3pt 6pt', textAlign: 'right', color: '#047857', fontWeight: '600' }}>
                  Promotional Discount:
                </td>
                <td className="num" style={{ padding: '3pt 6pt', color: '#047857', fontWeight: '600' }}>
                  −{money(discount, booking.currency)}
                </td>
              </tr>
            )}

            <tr>
              <td style={{ padding: '3pt 6pt', textAlign: 'right', color: '#4b5563' }}>
                Service Charge (10%):
              </td>
              <td className="num" style={{ padding: '3pt 6pt', color: '#4b5563' }}>
                {money(serviceCharge, booking.currency)}
              </td>
            </tr>

            {governmentTaxes > 0 && (
              <tr>
                <td style={{ padding: '3pt 6pt', textAlign: 'right', color: '#4b5563' }}>
                  Govt Taxes &amp; Tourism VAT:
                </td>
                <td className="num" style={{ padding: '3pt 6pt', color: '#4b5563' }}>
                  {money(governmentTaxes, booking.currency)}
                </td>
              </tr>
            )}

            <tr>
              <td
                style={{
                  padding: '6pt 6pt 4pt',
                  textAlign: 'right',
                  fontWeight: '800',
                  fontSize: '10.5pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                Total:
              </td>
              <td
                className="num"
                style={{
                  padding: '6pt 6pt 4pt',
                  fontWeight: '800',
                  fontSize: '11pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                {money(grandTotal, booking.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 8. Guest Special Requests Box (If any) */}
      {guest.specialRequests && (
        <div
          className="avoid-break"
          style={{
            borderLeft: '2.5pt solid #000000',
            backgroundColor: '#f9fafb',
            padding: '5pt 8pt',
            marginBottom: '7pt',
            fontSize: '7.8pt',
            color: '#1f2937',
          }}
        >
          <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '7pt', letterSpacing: '0.05em' }}>
            Guest Special Requests &amp; Preferences:{' '}
          </span>
          &ldquo;{guest.specialRequests}&rdquo;
        </div>
      )}

      {/* 9. Thank You Notice & Terms */}
      <div className="avoid-break" style={{ fontSize: '8pt', color: '#374151', lineHeight: 1.45, marginBottom: '6pt' }}>
        <div>
          Thank you for choosing Aviora Resort. Please present this invoice or photo identification upon arrival at Sanctuary Reception.
        </div>
        <div style={{ marginTop: '2pt', fontSize: '7.6pt', color: '#4b5563' }}>
          <span style={{ fontWeight: '700' }}>Cancellation Policy: </span>
          {booking.isRefundable !== false
            ? booking.cancellationDeadline
              ? `Complimentary cancellation permitted until ${stamp(booking.cancellationDeadline)}. Later changes incur full rate.`
              : 'Complimentary cancellation permitted prior to check-in.'
            : 'Non-refundable rate plan. Changes or cancellations are subject to full stay forfeiture.'}
        </div>
      </div>

      {/* 10. Bottom Blocks (Matching Image 3!) */}
      <InvoiceFooterBlocks
        paymentMethod={
          booking.payment?.method === 'card'
            ? 'Credit / Debit Card'
            : 'Payable at Resort upon Check-out'
        }
        paymentAccount={
          booking.payment?.cardLast4 ? `Card ending ${booking.payment.cardLast4}` : 'Payable on departure'
        }
        status={booking.status || 'Confirmed'}
        currency={booking.currency || 'LKR'}
        reference={booking.referenceId}
        signatoryTitle="Front Desk & Cashier Auditing"
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Document 2: StayInvoice / Accounting Tax Invoice for Admin
   -------------------------------------------------------------------------- */

function StayInvoice({ booking }) {
  const currentUser = useSelector(selectCurrentUser);
  const guest = resolveGuestDetails(booking, currentUser);
  const nights = Number(booking.nights) || 1;

  const roomBase = Number(booking.roomSubtotal) || Number(booking.finalTotal) || 0;
  const addons = booking.addons || [];
  const discount = Number(booking.discountAmount) || 0;
  const netSubtotal = Number(booking.netSubtotal) || (roomBase - discount);
  const finalTotal = Number(booking.finalTotal) || netSubtotal;

  let rowCounter = 1;

  return (
    <>
      <InvoiceHeader documentTitle="TAX INVOICE" documentSubtitle="CERTIFIED CORPORATE TAX INVOICE · SRI LANKA" />

      <InvoiceMetaBanner
        reference={booking.referenceId}
        date={shortDate(new Date().toISOString())}
        status={booking.status || 'Settled'}
        labelPrefix="Tax Invoice No:"
      />

      <InvoiceParties guest={guest} reference={booking.referenceId} />

      <StayScheduleBar
        checkIn={booking.checkIn}
        checkOut={booking.checkOut}
        nights={nights}
        bedding={guest.bedConfig}
        adults={booking.adults}
        children={booking.children}
        villaName={guest.villaName}
      />

      <div
        className="avoid-break"
        style={{
          fontSize: '10.5pt',
          fontWeight: '800',
          color: '#000000',
          marginBottom: '5pt',
        }}
      >
        Itemized Hospitality &amp; Accommodation Charges:
      </div>

      <table className="avoid-break" style={{ width: '100%', marginBottom: '6pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '6%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              No
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'left', width: '46%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Service Description
            </th>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '14%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Duration
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Unit Rate
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
              {rowCounter++}
            </td>
            <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              <div style={{ fontWeight: '700', color: '#000000' }}>{guest.villaName} — {guest.ratePlanName}</div>
              <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>
                Folio stay: {shortDate(booking.checkIn)} to {shortDate(booking.checkOut)}
              </div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
              {nights} Night{nights === 1 ? '' : 's'}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              {money(roomBase / nights, booking.currency)}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
              {money(roomBase, booking.currency)}
            </td>
          </tr>

          {addons.map((a) => (
            <tr key={a.id || a.name}>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
                {rowCounter++}
              </td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
                <div style={{ fontWeight: '700', color: '#000000' }}>{a.name}</div>
                <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>{a.chargeBasis}</div>
              </td>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
                {a.quantity || 1}
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
                {money(a.unitPrice, booking.currency)}
              </td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
                {money(a.lineTotal, booking.currency)}
              </td>
            </tr>
          ))}

          {discount > 0 && (
            <tr>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
                {rowCounter++}
              </td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', color: '#047857' }}>
                Promotional Discount ({booking.promoCode})
              </td>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', color: '#047857' }}>—</td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', color: '#047857' }}>−{booking.promoDiscountPct}%</td>
              <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700', color: '#047857' }}>
                −{money(discount, booking.currency)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tax Cascade Breakdown */}
      <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8pt' }}>
        <table style={{ width: '48%', borderCollapse: 'collapse', fontSize: '8.8pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3pt 6pt', textAlign: 'right', fontWeight: '600' }}>Net Subtotal:</td>
              <td className="num" style={{ padding: '3pt 6pt', fontWeight: '600' }}>
                {money(netSubtotal, booking.currency)}
              </td>
            </tr>

            {booking.taxes?.map((t) => (
              <tr key={t.code || t.displayName}>
                <td style={{ padding: '2.5pt 6pt', textAlign: 'right', color: '#4b5563' }}>
                  {t.displayName} ({t.percentage}%):
                </td>
                <td className="num" style={{ padding: '2.5pt 6pt', color: '#4b5563' }}>
                  {money(t.taxAmount, booking.currency)}
                </td>
              </tr>
            ))}

            <tr>
              <td
                style={{
                  padding: '6pt 6pt 4pt',
                  textAlign: 'right',
                  fontWeight: '800',
                  fontSize: '10.5pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                Total Folio Balance:
              </td>
              <td
                className="num"
                style={{
                  padding: '6pt 6pt 4pt',
                  fontWeight: '800',
                  fontSize: '11pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                {money(finalTotal, booking.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="avoid-break" style={{ fontSize: '7.8pt', color: '#4b5563', marginBottom: '8pt' }}>
        This is an official certified tax invoice generated electronically by Aviora Central Financial Accounting. Valid without physical rubber seal.
      </div>

      <InvoiceFooterBlocks
        paymentMethod={
          booking.payment?.method === 'card'
            ? 'Credit / Debit Card'
            : 'Direct Resort Folio Settlement'
        }
        paymentAccount={booking.payment?.cardLast4 ? `Card ending ${booking.payment.cardLast4}` : 'Folio Account'}
        status="Certified Paid"
        currency={booking.currency || 'LKR'}
        reference={booking.referenceId}
        signatoryTitle="Corporate Financial Controller"
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Document 3: TableVoucher / Restaurant Dining Reservation Invoice
   -------------------------------------------------------------------------- */

function TableVoucher({ table }) {
  const currentUser = useSelector(selectCurrentUser);
  const dining = resolveDiningDetails(table, currentUser);

  const guest = {
    name: dining.name,
    email: dining.email,
    phone: dining.phone,
    country: table.country || 'Valued Dining Guest',
  };

  return (
    <>
      {/* 1. Header */}
      <InvoiceHeader documentTitle="INVOICE" documentSubtitle="RESTAURANT &amp; LAGOON DINING SANCTUARY · SRI LANKA" />

      {/* 2. Reference & Date Block */}
      <InvoiceMetaBanner
        reference={table.referenceId}
        date={shortDate(new Date().toISOString())}
        status={table.status || 'Confirmed'}
        labelPrefix="Invoice Number:"
      />

      {/* 3. FROM & TO Dossier */}
      <InvoiceParties guest={guest} reference={table.referenceId} />

      {/* 4. Dining Schedule Strip (Professional Enhancement) */}
      <DiningScheduleBar
        venueName={dining.venueName}
        date={table.date}
        time={table.time}
        partySize={table.partySize}
        occasion={table.occasion}
      />

      {/* 5. Section Heading strictly like Image 3 */}
      <div
        className="avoid-break"
        style={{
          fontSize: '10.5pt',
          fontWeight: '800',
          color: '#000000',
          marginBottom: '5pt',
        }}
      >
        Description of Dining &amp; Table Reservation Services:
      </div>

      {/* 6. Itemized Services Table */}
      <table className="avoid-break" style={{ width: '100%', marginBottom: '6pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '6%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              No
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'left', width: '46%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Service Description
            </th>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '14%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Sitting / Time
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Party Size
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '17%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Restaurant Table Reservation */}
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
              1
            </td>
            <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              <div style={{ fontWeight: '700', color: '#000000', fontSize: '9pt' }}>
                {dining.venueName} — Table Reservation
              </div>
              <div style={{ fontSize: '7.6pt', color: '#4b5563', marginTop: '1pt' }}>
                Dining Date: <span style={{ fontWeight: '600' }}>{longDate(table.date)}</span> · Sitting: {table.time}
              </div>
              <div style={{ fontSize: '7.2pt', color: '#6b7280' }}>
                {table.occasion ? `Occasion: ${table.occasion} · ` : ''}Atmosphere: Fine Dining &amp; Lagoon Deck
              </div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
              {table.time}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              {table.partySize} Guest{table.partySize === 1 ? '' : 's'}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
              Complimentary
            </td>
          </tr>

          {/* Row 2: Guaranteed Table Service Cover */}
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
              2
            </td>
            <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              <div style={{ fontWeight: '700', color: '#000000', fontSize: '8.8pt' }}>
                Chef&apos;s Culinary Cover &amp; Table Allocation
              </div>
              <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>
                Guaranteed table seating for {table.partySize} covers. Dining &amp; beverages settled directly at venue.
              </div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
              During Sitting
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              {table.partySize} Cover{table.partySize === 1 ? '' : 's'}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
              Settled at Venue
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Summary / Financial Breakdown (Right-aligned, matching Image 3!) */}
      <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8pt' }}>
        <table style={{ width: '45%', borderCollapse: 'collapse', fontSize: '8.8pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3.5pt 6pt', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                Table Reservation Fee:
              </td>
              <td className="num" style={{ padding: '3.5pt 6pt', width: '50%', fontWeight: '600' }}>
                Rs. 0.00
              </td>
            </tr>

            <tr>
              <td style={{ padding: '3pt 6pt', textAlign: 'right', color: '#4b5563' }}>
                Advance Holding Deposit:
              </td>
              <td className="num" style={{ padding: '3pt 6pt', color: '#4b5563' }}>
                Rs. 0.00 (Waived)
              </td>
            </tr>

            <tr>
              <td
                style={{
                  padding: '6pt 6pt 4pt',
                  textAlign: 'right',
                  fontWeight: '800',
                  fontSize: '10.5pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                Total Due Online:
              </td>
              <td
                className="num"
                style={{
                  padding: '6pt 6pt 4pt',
                  fontWeight: '800',
                  fontSize: '11pt',
                  borderTop: '1.5pt solid #000000',
                  color: '#000000',
                }}
              >
                Rs. 0.00
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 8. Dietary Requirements & Special Requests Box (If any) */}
      {(table.dietaryNotes || table.specialRequests) && (
        <div
          className="avoid-break"
          style={{
            borderLeft: '2.5pt solid #000000',
            backgroundColor: '#f9fafb',
            padding: '5pt 8pt',
            marginBottom: '7pt',
            fontSize: '7.8pt',
            color: '#1f2937',
          }}
        >
          {table.dietaryNotes && (
            <div style={{ marginBottom: table.specialRequests ? '3pt' : 0 }}>
              <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '7pt', letterSpacing: '0.05em' }}>
                Dietary Requirements &amp; Allergen Advisory:{' '}
              </span>
              <span style={{ fontWeight: '600', color: '#991b1b' }}>{table.dietaryNotes}</span>
            </div>
          )}
          {table.specialRequests && (
            <div>
              <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '7pt', letterSpacing: '0.05em' }}>
                Special Table Notes:{' '}
              </span>
              &ldquo;{table.specialRequests}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* 9. Thank You Notice & Terms */}
      <div className="avoid-break" style={{ fontSize: '8pt', color: '#374151', lineHeight: 1.45, marginBottom: '6pt' }}>
        <div>
          Thank you for reserving a dining table at Aviora Resort. No advance deposit is taken; restaurant covers and refreshments are settled directly at the venue.
        </div>
        <div style={{ marginTop: '2pt', fontSize: '7.6pt', color: '#4b5563' }}>
          <span style={{ fontWeight: '700' }}>Amendment Policy: </span>
          {dining.venueName} requests {table.noticeHours || 4} hours notice for any amendments or cancellations.
          {table.canCancel && table.cancellationDeadline && (
            <span> (Complimentary cancellation allowed until {stamp(table.cancellationDeadline)}).</span>
          )}
        </div>
      </div>

      {/* 10. Bottom Blocks (Matching Image 3!) */}
      <InvoiceFooterBlocks
        paymentMethod="Settled Directly at Restaurant"
        paymentAccount="No Online Deposit Required"
        status={table.status || 'Confirmed'}
        currency="LKR"
        reference={table.referenceId}
        signatoryTitle="Maitre d' &amp; Restaurant Manager"
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Document 4: TableDocket / Kitchen & Service Pass Docket for Admin
   -------------------------------------------------------------------------- */

function TableDocket({ table }) {
  const currentUser = useSelector(selectCurrentUser);
  const dining = resolveDiningDetails(table, currentUser);

  const guest = {
    name: dining.name,
    email: dining.email,
    phone: dining.phone,
    country: 'Resident / Dining Guest',
  };

  return (
    <>
      <InvoiceHeader documentTitle="SERVICE DOCKET" documentSubtitle="RESTAURANT SERVICE PASS &amp; KITCHEN BRIEFING" />

      <InvoiceMetaBanner
        reference={table.referenceId}
        date={shortDate(new Date().toISOString())}
        status={table.status || 'Active Pass'}
        labelPrefix="Service Docket No:"
      />

      <InvoiceParties guest={guest} reference={table.referenceId} />

      <DiningScheduleBar
        venueName={dining.venueName}
        date={table.date}
        time={table.time}
        partySize={table.partySize}
        occasion={table.occasion}
      />

      <div
        className="avoid-break"
        style={{
          fontSize: '10.5pt',
          fontWeight: '800',
          color: '#000000',
          marginBottom: '5pt',
        }}
      >
        Table Briefing &amp; Kitchen Pass Particulars:
      </div>

      <table className="avoid-break" style={{ width: '100%', marginBottom: '8pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '6%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              No
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'left', width: '46%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Service Parameter
            </th>
            <th style={{ padding: '6pt 6pt', textAlign: 'center', width: '16%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Scheduled Sitting
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '16%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Cover Allocation
            </th>
            <th style={{ padding: '6pt 8pt', textAlign: 'right', width: '16%', fontSize: '8pt', fontWeight: '700', border: '1px solid #000000' }}>
              Operational Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt', fontWeight: '600' }}>
              1
            </td>
            <td style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              <div style={{ fontWeight: '700', color: '#000000' }}>{dining.venueName} Table Reservation</div>
              <div style={{ fontSize: '7.5pt', color: '#6b7280' }}>
                Guest: {dining.name} · Phone: {dining.phone}
              </div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '6pt 6pt' }}>
              {table.time}
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt' }}>
              {table.partySize} Covers
            </td>
            <td className="num" style={{ border: '1px solid #e5e7eb', padding: '6pt 8pt', fontWeight: '700' }}>
              Ready for Pass
            </td>
          </tr>
        </tbody>
      </table>

      {table.dietaryNotes && (
        <div
          className="avoid-break"
          style={{
            border: '1.5pt solid #000000',
            backgroundColor: '#fef2f2',
            padding: '7pt 10pt',
            marginBottom: '8pt',
            borderRadius: '2pt',
          }}
        >
          <div style={{ fontSize: '7.5pt', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CRITICAL DIETARY REQUIREMENTS &amp; ALLERGIES — BRIEF EXECUTIVE CHEF
          </div>
          <div style={{ fontSize: '9.5pt', fontWeight: '700', color: '#111827', marginTop: '2pt' }}>
            {table.dietaryNotes}
          </div>
        </div>
      )}

      {table.specialRequests && (
        <div
          className="avoid-break"
          style={{
            borderLeft: '2.5pt solid #000000',
            backgroundColor: '#f9fafb',
            padding: '5pt 8pt',
            marginBottom: '8pt',
            fontSize: '8pt',
          }}
        >
          <span style={{ fontWeight: '700' }}>Guest Service Notes: </span>
          {table.specialRequests}
        </div>
      )}

      <InvoiceFooterBlocks
        paymentMethod="Direct Restaurant Settlement"
        paymentAccount={table.stayReference ? `Linked Stay: ${table.stayReference}` : 'Non-resident Table'}
        status="Confirmed for Service"
        currency="LKR"
        reference={table.referenceId}
        signatoryTitle="Executive Chef / Restaurant Lead"
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   The print pipeline with requestAnimationFrame.
   -------------------------------------------------------------------------- */

function usePrintDocument() {
  const [printing, setPrinting] = useState(false);
  const [document_, setDocument] = useState(null);

  const print = useCallback((node) => {
    setDocument(node);
    setPrinting(true);

    // Two frames: one for React to commit the portal, one for the browser to
    // lay it out. Calling print() in the same tick prints an empty sheet.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setPrinting(false);
        // Left mounted briefly so Safari, which returns from print()
        // asynchronously, still has the node.
        setTimeout(() => setDocument(null), 800);
      });
    });
  }, []);

  const portal = useMemo(() => {
    if (!document_) return null;

    return createPortal(
      <>
        <style>{PRINT_CSS}</style>
        <div id="aviora-print-root">{document_}</div>
      </>,
      window.document.body,
    );
  }, [document_]);

  return { print, printing, portal };
}

/**
 * Action Buttons for triggering document print / PDF download.
 * Default guest button is renamed to "PDF Invoice" to match user expectations.
 */
export function DocumentButtons({
  voucher,
  invoice,
  isAdmin = false,
  compact = false,
  voucherLabel = 'PDF Invoice',
}) {
  const { print, printing, portal } = usePrintDocument();

  const size = compact ? 12 : 13;
  const base = compact
    ? 'px-2.5 py-1.5 rounded-lg text-[10px]'
    : 'px-3.5 py-2 rounded-xl text-[11px]';

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => print(voucher)}
          disabled={printing}
          title="Open official invoice. Choose Save as PDF in the print dialog to download."
          className={`${base} bg-white border border-primary/30 text-deep-wood font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50`}
        >
          {printing ? (
            <Loader2 size={size} className="animate-spin" />
          ) : (
            <FileText size={size} className="text-primary" />
          )}
          {voucherLabel}
        </button>

        {/* {isAdmin && invoice && (
          <button
            type="button"
            onClick={() => print(invoice)}
            disabled={printing}
            title="Print the certified tax invoice"
            className={`${base} bg-deep-wood hover:bg-deep-wood/90 text-sand font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50`}
          >
            <Printer size={size} />
            Tax Invoice
          </button>
        )} */}
      </div>

      {portal}
    </>
  );
}

/** Convenience wrappers so callers do not assemble the templates themselves. */
export function StayDocuments({ booking, isAdmin = false, compact = false }) {
  if (!booking) return null;

  return (
    <DocumentButtons
      voucher={<StayVoucher booking={booking} />}
      invoice={<StayInvoice booking={booking} />}
      isAdmin={isAdmin}
      compact={compact}
      voucherLabel="PDF Invoice"
    />
  );
}

export function TableDocuments({ table, isAdmin = false, compact = false }) {
  if (!table) return null;

  return (
    <DocumentButtons
      voucher={<TableVoucher table={table} />}
      invoice={<TableDocket table={table} />}
      isAdmin={isAdmin}
      compact={compact}
      voucherLabel="PDF Invoice"
    />
  );
}
