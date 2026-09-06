import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { FileText, Printer, Loader2 } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';

/* --------------------------------------------------------------------------
   Printable documents for Aviora Resort.

   Documents:
     1. StayVoucher   - Guest and Admin official reservation voucher / folio.
     2. StayInvoice   - Admin accounting tax invoice with line items & tax cascade.
     3. TableVoucher  - Restaurant dining reservation voucher.
     4. TableDocket   - Service pass / kitchen docket with allergies & covers.

   Rendering approach:
   Uses an off-screen portal node with browser native window.print().
   Strictly styled with high-end luxury typography, warm sand backgrounds,
   gold letterhead seals, and robust fallback data resolution so guest details
   are always clearly populated.
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

/**
 * Robust helper to resolve guest information from any shape of booking object
 * (nested guest, nested guestInfo, flat fields, or active Redux user session).
 */
function resolveGuestDetails(booking, currentUser) {
  const g = booking?.guest || booking?.guestInfo || booking?.user || {};

  // First & Last Name
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

  // Email
  const email =
    g.email ||
    booking?.guestEmail ||
    booking?.email ||
    booking?.userEmail ||
    currentUser?.email ||
    'reservations@aviora.com';

  // Phone / Telephone
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

  // Country
  const country = g.country || booking?.country || currentUser?.country || '';

  // Bedding Configuration / Preference
  const bedConfig =
    booking?.bedConfiguration ||
    booking?.bedPreference ||
    g.bedPreference ||
    g.bedConfiguration ||
    '1 King Bed';

  // Villa Name
  const villaName =
    booking?.villaName ||
    booking?.villa?.name ||
    booking?.roomName ||
    'Canopy Forest Villa';

  // Rate Plan
  const ratePlanName =
    booking?.ratePlanName ||
    booking?.ratePlan?.name ||
    booking?.ratePlan ||
    'Flexible Standard Rate';

  // Special Requests
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
    'The Canopy Table';

  return {
    name,
    email,
    phone,
    venueName,
  };
}

/* --------------------------------------------------------------------------
   The print stylesheet. Injected once alongside the document root.
   -------------------------------------------------------------------------- */
const PRINT_CSS = `
  @page {
    size: A4;
    margin: 12mm 14mm;
  }

  #aviora-print-root {
    display: none;
  }

  @media print {
    html, body {
      background: #ffffff !important;
      color: #23170f !important;
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
      color-adjust: exact !important;
    }
    .avoid-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }

  #aviora-print-root {
    font-family: Georgia, 'Times New Roman', serif;
    color: #23170f;
    font-size: 9.5pt;
    line-height: 1.45;
    background-color: #ffffff;
  }

  #aviora-print-root .sans {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  #aviora-print-root .mono {
    font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace;
  }

  #aviora-print-root .label {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 6.8pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #8c6d53;
    font-weight: 700;
    margin-bottom: 2pt;
  }

  #aviora-print-root .card {
    background-color: #faf7f2;
    border: 1px solid #e7ded4;
    border-radius: 6pt;
    padding: 9pt 11pt;
  }

  #aviora-print-root .accent-card {
    background-color: #f7f2ea;
    border: 1.5pt solid #cbb298;
    border-radius: 6pt;
    padding: 11pt 13pt;
  }

  #aviora-print-root .gold-badge {
    display: inline-block;
    background-color: #7d4e24;
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 2.5pt 6pt;
    border-radius: 3pt;
  }

  #aviora-print-root .status-pill {
    display: inline-block;
    background-color: #eaf3ec;
    color: #1e5a32;
    border: 0.5pt solid #b6d9be;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 2pt 5.5pt;
    border-radius: 10pt;
  }

  #aviora-print-root .doc-divider {
    border-bottom: 1.5pt solid #7d4e24;
    margin: 8pt 0 12pt;
  }

  #aviora-print-root .doc-hair {
    border-bottom: 0.5pt solid #e7ded4;
    margin: 7pt 0;
  }

  #aviora-print-root table {
    width: 100%;
    border-collapse: collapse;
  }

  #aviora-print-root td, #aviora-print-root th {
    padding: 4.5pt 4pt;
    vertical-align: middle;
  }

  #aviora-print-root .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  #aviora-print-root .muted {
    color: #6b5a4e;
  }
`;

function Letterhead({
  documentTitle,
  documentSubtitle = 'Rainforest & Lagoon Sanctuary · Sri Lanka',
  reference,
  issued,
  status = 'Confirmed',
}) {
  return (
    <div className="avoid-break" style={{ marginBottom: '11pt' }}>
      {/* Top Banner with Brand and Reference */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9pt' }}>
          {/* Resort Monogram Emblem */}
          <div
            style={{
              width: '36pt',
              height: '36pt',
              borderRadius: '5pt',
              backgroundColor: '#2b1a0d',
              border: '1pt solid #cbb298',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ecd5b9',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '12.5pt',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 'bold',
                lineHeight: 1,
              }}
            >
              AV
            </div>
            <div
              style={{
                fontSize: '4.5pt',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: '1pt',
                fontFamily: 'sans-serif',
              }}
            >
              RESORT
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '20pt',
                fontStyle: 'italic',
                fontWeight: '700',
                letterSpacing: '0.01em',
                lineHeight: 1.1,
                color: '#2b1a0d',
              }}
            >
              Aviora Resort
            </div>
            <div
              className="label"
              style={{
                fontSize: '7.2pt',
                letterSpacing: '0.17em',
                color: '#8c6d53',
                marginTop: '2pt',
                marginBottom: 0,
              }}
            >
              {documentSubtitle}
            </div>
          </div>
        </div>

        {/* Right Document Reference Header */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4pt',
              marginBottom: '2pt',
            }}
          >
            <span className="gold-badge">{documentTitle}</span>
            {status && <span className="status-pill">{status}</span>}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '14pt',
              fontWeight: '700',
              letterSpacing: '0.05em',
              color: '#2b1a0d',
              marginTop: '2pt',
            }}
          >
            {reference}
          </div>
          <div className="sans muted" style={{ fontSize: '7.8pt', marginTop: '1.5pt' }}>
            Issued: <span style={{ fontWeight: '600', color: '#3c2817' }}>{issued}</span>
          </div>
        </div>
      </div>

      {/* Decorative Gold Rule */}
      <div
        style={{
          marginTop: '9pt',
          borderBottom: '2pt solid #7d4e24',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: '-4pt',
            width: '28pt',
            height: '2pt',
            backgroundColor: '#cbb298',
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ marginBottom: '7pt' }}>
      <div className="label">{label}</div>
      <div style={{ marginTop: '1pt', color: '#23170f' }}>{value || '—'}</div>
    </div>
  );
}

function Footer({ note }) {
  return (
    <div className="avoid-break" style={{ marginTop: '14pt' }}>
      <div className="doc-hair" style={{ marginBottom: '6pt' }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: '7.5pt',
          color: '#6f6257',
          lineHeight: 1.45,
        }}
      >
        <div style={{ maxWidth: '70%' }}>
          <div style={{ fontWeight: '600', color: '#3d2b1e', marginBottom: '2pt' }}>
            {note}
          </div>
          <div className="sans">
            Aviora Resort · Rainforest &amp; Lagoon Sanctuary, Sri Lanka ·
            reservations@aviora.com · +94 11 000 0000
          </div>
        </div>
        <div className="sans muted" style={{ textAlign: 'right', fontSize: '7pt' }}>
          Official Guest Document
          <br />
          Aviora Central System
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Stay Documents (Voucher & Invoice)
   -------------------------------------------------------------------------- */

function StayVoucher({ booking }) {
  const currentUser = useSelector(selectCurrentUser);
  const guest = resolveGuestDetails(booking, currentUser);
  const nights = booking.nights ?? 1;

  return (
    <>
      <Letterhead
        documentTitle="Reservation Voucher"
        reference={booking.referenceId}
        issued={stamp(booking.bookedAt || new Date().toISOString())}
        status={booking.status || 'Confirmed'}
      />

      {/* 2-Column Guest & Sanctuary Dossier */}
      <div className="avoid-break" style={{ display: 'flex', gap: '10pt', marginBottom: '8pt' }}>
        {/* Guest Information Card */}
        <div className="card" style={{ flex: 1 }}>
          <div
            className="label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4pt',
              borderBottom: '0.5pt solid #e7ded4',
              paddingBottom: '3pt',
              marginBottom: '7pt',
            }}
          >
            <span style={{ color: '#7d4e24', fontSize: '8pt' }}>●</span> PRIMARY GUEST INFORMATION
          </div>

          <div style={{ marginBottom: '6pt' }}>
            <div className="label">Guest Name</div>
            <div style={{ fontSize: '11.5pt', fontWeight: '700', color: '#23170f' }}>
              {guest.name}
            </div>
          </div>

          <div style={{ marginBottom: '5pt' }}>
            <div className="label">Email Address</div>
            <div
              className="sans"
              style={{ fontSize: '8.5pt', color: '#332317', wordBreak: 'break-all' }}
            >
              {guest.email}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8pt' }}>
            <div style={{ flex: 1 }}>
              <div className="label">Telephone</div>
              <div className="sans" style={{ fontSize: '8.5pt', color: '#332317' }}>
                {guest.phone}
              </div>
            </div>
            {guest.country && (
              <div style={{ flex: 1 }}>
                <div className="label">Country / Region</div>
                <div className="sans" style={{ fontSize: '8.5pt', color: '#332317' }}>
                  {guest.country}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sanctuary & Accommodation Card */}
        <div className="card" style={{ flex: 1 }}>
          <div
            className="label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4pt',
              borderBottom: '0.5pt solid #e7ded4',
              paddingBottom: '3pt',
              marginBottom: '7pt',
            }}
          >
            <span style={{ color: '#7d4e24', fontSize: '8pt' }}>●</span> SANCTUARY &amp; ACCOMMODATION
          </div>

          <div style={{ marginBottom: '6pt' }}>
            <div className="label">Reserved Villa</div>
            <div
              style={{
                fontSize: '11.5pt',
                fontWeight: '700',
                fontStyle: 'italic',
                color: '#7d4e24',
              }}
            >
              {guest.villaName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8pt', marginBottom: '5pt' }}>
            <div style={{ flex: 1 }}>
              <div className="label">Rate Plan</div>
              <div
                className="sans"
                style={{ fontSize: '8.5pt', fontWeight: '600', color: '#23170f' }}
              >
                {guest.ratePlanName}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Bedding</div>
              <div className="sans" style={{ fontSize: '8.5pt', color: '#23170f' }}>
                {guest.bedConfig}
              </div>
            </div>
          </div>

          <div>
            <div className="label">Party &amp; Duration</div>
            <div
              className="sans"
              style={{ fontSize: '8.5pt', fontWeight: '600', color: '#23170f' }}
            >
              {booking.adults || 1} Adult{booking.adults === 1 ? '' : 's'}
              {booking.children ? `, ${booking.children} Child${booking.children === 1 ? '' : 'ren'}` : ''}{' '}
              · {nights} Night{nights === 1 ? '' : 's'} Total
            </div>
          </div>
        </div>
      </div>

      {/* Check-In / Check-Out Schedule Banner */}
      <div
        className="avoid-break"
        style={{
          display: 'flex',
          gap: '10pt',
          padding: '8pt 11pt',
          backgroundColor: '#f6f1eb',
          border: '1pt solid #decbb8',
          borderRadius: '5pt',
          marginBottom: '8pt',
        }}
      >
        <div style={{ flex: 1, borderRight: '1pt solid #decbb8', paddingRight: '6pt' }}>
          <div className="label" style={{ color: '#6d4826' }}>
            ARRIVAL / CHECK-IN
          </div>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#23170f' }}>
            {longDate(booking.checkIn)}
          </div>
          <div className="sans muted" style={{ fontSize: '7.5pt', marginTop: '1pt' }}>
            From 14:00 onwards
          </div>
        </div>

        <div style={{ flex: 1, borderRight: '1pt solid #decbb8', paddingRight: '6pt' }}>
          <div className="label" style={{ color: '#6d4826' }}>
            DEPARTURE / CHECK-OUT
          </div>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#23170f' }}>
            {longDate(booking.checkOut)}
          </div>
          <div className="sans muted" style={{ fontSize: '7.5pt', marginTop: '1pt' }}>
            Until 12:00 noon
          </div>
        </div>

        <div
          style={{
            flex: 0.7,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div className="label" style={{ color: '#6d4826' }}>
            STAY DURATION
          </div>
          <div style={{ fontSize: '10.5pt', fontWeight: 'bold', color: '#7d4e24' }}>
            {nights} Night{nights === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Curated Experiences / Add-ons (if any) */}
      {booking.addons?.length > 0 && (
        <div className="avoid-break" style={{ marginBottom: '8pt' }}>
          <div className="label" style={{ marginBottom: '3pt' }}>
            INCLUDED SANCTUARY EXPERIENCES &amp; ADD-ONS
          </div>
          <div className="card" style={{ padding: '3pt 8pt' }}>
            <table style={{ width: '100%' }}>
              <tbody>
                {booking.addons.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '0.5pt solid #eee5db' }}>
                    <td style={{ fontSize: '9pt', fontWeight: '600' }}>{a.name}</td>
                    <td className="sans muted" style={{ fontSize: '8pt' }}>
                      {a.chargeBasis || 'per stay'}
                    </td>
                    <td
                      className="num sans"
                      style={{ width: '20%', fontSize: '9pt', fontWeight: 'bold' }}
                    >
                      {a.quantity > 1 ? `×${a.quantity}` : 'Included'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Special Requests */}
      {guest.specialRequests && (
        <div
          className="avoid-break card"
          style={{ marginBottom: '8pt', backgroundColor: '#fcf8f2' }}
        >
          <div className="label" style={{ color: '#7d4e24' }}>
            GUEST SPECIAL REQUESTS &amp; PREFERENCES
          </div>
          <div
            className="sans"
            style={{ fontSize: '8.5pt', color: '#332317', marginTop: '2pt', fontStyle: 'italic' }}
          >
            &ldquo;{guest.specialRequests}&rdquo;
          </div>
        </div>
      )}

      {/* Grand Total & Settlement Card */}
      <div className="avoid-break accent-card" style={{ marginTop: '6pt', marginBottom: '8pt' }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>
                <div
                  className="label"
                  style={{ color: '#7d4e24', fontSize: '7.5pt', marginBottom: '2pt' }}
                >
                  TOTAL STAY CHARGES (INCL. 10% SERVICE CHARGE &amp; TAXES)
                </div>
                <div className="sans muted" style={{ fontSize: '8pt' }}>
                  {booking.payment?.method === 'card'
                    ? `Settled via Credit/Debit Card ending ${booking.payment.cardLast4 ?? '••••'}`
                    : 'Payment Arrangement: Payable at the resort upon departure'}
                </div>
              </td>
              <td
                className="num"
                style={{ fontSize: '16pt', fontWeight: 'bold', color: '#2b1a0d' }}
              >
                {money(booking.finalTotal, booking.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cancellation Policy Banner */}
      <div
        className="avoid-break"
        style={{
          padding: '7pt 9pt',
          backgroundColor: booking.isRefundable !== false ? '#f1f8f3' : '#fcf4f2',
          border: `1pt solid ${booking.isRefundable !== false ? '#c4e3cb' : '#ecc5be'}`,
          borderRadius: '5pt',
          display: 'flex',
          alignItems: 'center',
          gap: '6pt',
        }}
      >
        <span
          style={{
            fontSize: '9.5pt',
            color: booking.isRefundable !== false ? '#1e5a32' : '#9c3426',
          }}
        >
          {booking.isRefundable !== false ? '✓' : 'ℹ'}
        </span>
        <div
          className="sans"
          style={{
            fontSize: '8pt',
            color: booking.isRefundable !== false ? '#1e5a32' : '#7c2519',
          }}
        >
          <span style={{ fontWeight: '700' }}>Cancellation Policy: </span>
          {booking.isRefundable !== false
            ? booking.cancellationDeadline
              ? `Complimentary cancellation permitted until ${stamp(booking.cancellationDeadline)}.`
              : 'Complimentary cancellation prior to check-in.'
            : 'Non-refundable rate plan. Changes or cancellations are subject to full stay forfeiture.'}
        </div>
      </div>

      <Footer
        note={`Please present this official voucher or photo ID upon arrival at Sanctuary Reception. Status: ${booking.status || 'Confirmed'}.`}
      />
    </>
  );
}

function StayInvoice({ booking }) {
  const currentUser = useSelector(selectCurrentUser);
  const guest = resolveGuestDetails(booking, currentUser);

  return (
    <>
      <Letterhead
        documentTitle="Tax Invoice"
        reference={booking.referenceId}
        issued={stamp(new Date().toISOString())}
        status={booking.status || 'Confirmed'}
      />

      {/* Billing & Stay Header Cards */}
      <div className="avoid-break" style={{ display: 'flex', gap: '10pt', marginBottom: '8pt' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="label" style={{ borderBottom: '0.5pt solid #e7ded4', paddingBottom: '3pt', marginBottom: '6pt' }}>
            BILLED TO
          </div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#23170f' }}>
            {guest.name}
          </div>
          <div className="sans muted" style={{ fontSize: '8.5pt', marginTop: '2pt' }}>
            {guest.email}
            {guest.phone ? ` · ${guest.phone}` : ''}
            {guest.country ? ` · ${guest.country}` : ''}
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="label" style={{ borderBottom: '0.5pt solid #e7ded4', paddingBottom: '3pt', marginBottom: '6pt' }}>
            STAY PARTICULARS
          </div>
          <div style={{ fontSize: '11pt', fontWeight: '700', fontStyle: 'italic', color: '#7d4e24' }}>
            {guest.villaName}
          </div>
          <div className="sans muted" style={{ fontSize: '8.5pt', marginTop: '2pt' }}>
            {longDate(booking.checkIn)} to {longDate(booking.checkOut)} ({booking.nights || 1} Night{booking.nights === 1 ? '' : 's'})
          </div>
        </div>
      </div>

      {/* Folio Line Items Table */}
      <table className="avoid-break card" style={{ width: '100%', padding: '4pt 8pt', marginBottom: '8pt' }}>
        <thead>
          <tr style={{ borderBottom: '1pt solid #decbb8' }}>
            <th className="label" style={{ textAlign: 'left' }}>
              ITEM / DESCRIPTION
            </th>
            <th className="label num">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '0.5pt solid #eee5db' }}>
            <td>
              <div style={{ fontWeight: '600' }}>Accommodation — {guest.ratePlanName}</div>
              <div className="sans muted" style={{ fontSize: '8pt' }}>
                {booking.nights} night{booking.nights === 1 ? '' : 's'}
                {booking.ratePlanDiscountPct
                  ? ` · rate modifier ${booking.ratePlanDiscountPct}%`
                  : ''}
              </div>
            </td>
            <td className="num" style={{ fontWeight: '600' }}>
              {money(booking.roomSubtotal, booking.currency)}
            </td>
          </tr>

          {booking.addons?.map((a) => (
            <tr key={a.id} style={{ borderBottom: '0.5pt solid #eee5db' }}>
              <td>
                <div style={{ fontWeight: '600' }}>{a.name}</div>
                <div className="sans muted" style={{ fontSize: '8pt' }}>
                  {money(a.unitPrice, booking.currency)}
                  {a.quantity > 1 ? ` × ${a.quantity}` : ''} · {a.chargeBasis}
                </div>
              </td>
              <td className="num">{money(a.lineTotal, booking.currency)}</td>
            </tr>
          ))}

          {booking.discountAmount > 0 && (
            <tr style={{ borderBottom: '0.5pt solid #eee5db' }}>
              <td>
                <div style={{ fontWeight: '600', color: '#1e5a32' }}>Promotional Discount</div>
                <div className="sans muted" style={{ fontSize: '8pt' }}>
                  Code: {booking.promoCode} ({booking.promoDiscountPct}%)
                </div>
              </td>
              <td className="num" style={{ color: '#1e5a32', fontWeight: '600' }}>
                −{money(booking.discountAmount, booking.currency)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tax Cascade Breakdown */}
      <table className="avoid-break" style={{ width: '100%', marginBottom: '6pt' }}>
        <tbody>
          <tr>
            <td className="label">Net Subtotal</td>
            <td className="num sans" style={{ fontWeight: '600' }}>
              {money(booking.netSubtotal, booking.currency)}
            </td>
          </tr>

          {booking.taxes?.map((t) => (
            <tr key={t.code}>
              <td className="sans muted" style={{ fontSize: '8.5pt' }}>
                {t.displayName} ({t.percentage}%)
                <span className="muted" style={{ fontSize: '7.8pt' }}>
                  {' '}
                  on {money(t.baseAmount, booking.currency)}
                </span>
              </td>
              <td className="num sans muted" style={{ fontSize: '8.5pt' }}>
                {money(t.taxAmount, booking.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Due Banner */}
      <div className="avoid-break accent-card" style={{ marginTop: '4pt', marginBottom: '8pt' }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ fontSize: '11pt', fontWeight: 'bold', color: '#2b1a0d' }}>
                Total Folio Balance Due
              </td>
              <td
                className="num"
                style={{ fontSize: '16pt', fontWeight: 'bold', color: '#2b1a0d' }}
              >
                {money(booking.finalTotal, booking.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Information */}
      <div className="avoid-break" style={{ display: 'flex', gap: '10pt', marginTop: '6pt' }}>
        <div className="card" style={{ flex: 1 }}>
          <Row
            label="Payment Settlement"
            value={
              booking.payment
                ? `${booking.payment.method === 'card' ? 'Credit/Debit Card' : 'Payable at resort'} · ${
                    booking.payment.status
                  }${
                    booking.payment.cardLast4 ? ` · ending ${booking.payment.cardLast4}` : ''
                  }`
                : 'Payable at resort upon check-out'
            }
          />
        </div>
        <div className="card" style={{ flex: 1 }}>
          <Row label="Reservation Status" value={booking.status || 'Confirmed'} />
        </div>
        <div className="card" style={{ flex: 1 }}>
          <Row label="Booking Date" value={stamp(booking.bookedAt || new Date().toISOString())} />
        </div>
      </div>

      <Footer note="This is a certified computer-generated tax invoice valid without signature. All amounts are stated in Sri Lankan Rupees (LKR)." />
    </>
  );
}

/* --------------------------------------------------------------------------
   Dining Documents (Table Voucher & Service Docket)
   -------------------------------------------------------------------------- */

function TableVoucher({ table }) {
  const currentUser = useSelector(selectCurrentUser);
  const dining = resolveDiningDetails(table, currentUser);

  return (
    <>
      <Letterhead
        documentTitle="Table Reservation"
        reference={table.referenceId}
        issued={stamp(new Date().toISOString())}
        status={table.status || 'Confirmed'}
      />

      <div className="avoid-break" style={{ display: 'flex', gap: '10pt', marginBottom: '8pt' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="label" style={{ borderBottom: '0.5pt solid #e7ded4', paddingBottom: '3pt', marginBottom: '6pt' }}>
            GUEST &amp; RESTAURANT
          </div>
          <div style={{ fontSize: '11.5pt', fontWeight: '700', color: '#7d4e24', fontStyle: 'italic', marginBottom: '4pt' }}>
            {dining.venueName}
          </div>
          <Row label="Guest Name" value={dining.name} />
          <Row label="Email" value={dining.email} />
          <Row label="Telephone" value={dining.phone} />
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="label" style={{ borderBottom: '0.5pt solid #e7ded4', paddingBottom: '3pt', marginBottom: '6pt' }}>
            TABLE PARTICULARS
          </div>
          <Row label="Dining Date" value={longDate(table.date)} />
          <Row label="Sitting Time" value={table.time} />
          <Row
            label="Party Size"
            value={`${table.partySize} Guest${table.partySize === 1 ? '' : 's'}`}
          />
          {table.occasion && <Row label="Occasion" value={table.occasion} />}
        </div>
      </div>

      {table.dietaryNotes && (
        <div
          className="avoid-break card"
          style={{ marginBottom: '8pt', backgroundColor: '#fdf6ec', border: '1pt solid #e8cb9b' }}
        >
          <div className="label" style={{ color: '#8a5a36' }}>
            DIETARY REQUIREMENTS &amp; ALLERGIES
          </div>
          <div className="sans" style={{ fontSize: '9pt', fontWeight: '600', color: '#3b2413' }}>
            {table.dietaryNotes}
          </div>
        </div>
      )}

      {table.specialRequests && (
        <div className="avoid-break card" style={{ marginBottom: '8pt' }}>
          <div className="label">SPECIAL REQUESTS</div>
          <div className="sans" style={{ fontSize: '8.5pt', color: '#332317' }}>
            {table.specialRequests}
          </div>
        </div>
      )}

      <div
        className="avoid-break"
        style={{
          padding: '8pt 10pt',
          background: '#f6f2ee',
          border: '0.5pt solid #d8cec4',
          borderRadius: '5pt',
          fontSize: '8.5pt',
        }}
      >
        {table.canCancel && table.cancellationDeadline
          ? `Complimentary cancellation permitted until ${stamp(table.cancellationDeadline)}. `
          : ''}
        {dining.venueName} requests {table.noticeHours || 2} hours notice for any amendments.
      </div>

      <Footer note="No deposit charge is taken at the time of table reservation. Restaurant covers are settled directly at the venue." />
    </>
  );
}

function TableDocket({ table }) {
  const currentUser = useSelector(selectCurrentUser);
  const dining = resolveDiningDetails(table, currentUser);

  return (
    <>
      <Letterhead
        documentTitle="Service Docket"
        reference={table.referenceId}
        issued={stamp(new Date().toISOString())}
        status={table.status || 'Confirmed'}
      />

      <div
        className="avoid-break card"
        style={{
          display: 'flex',
          gap: '20pt',
          alignItems: 'baseline',
          marginBottom: '10pt',
          backgroundColor: '#2b1a0d',
          color: '#ffffff',
          border: 'none',
        }}
      >
        <div style={{ fontSize: '26pt', fontWeight: 'bold', color: '#ecc59b', lineHeight: 1 }}>
          {table.time}
        </div>
        <div style={{ fontSize: '17pt', fontWeight: '600', color: '#ffffff' }}>
          {table.partySize} Cover{table.partySize === 1 ? '' : 's'}
        </div>
        <div className="sans muted" style={{ fontSize: '10pt', color: '#c4b5a8' }}>
          {longDate(table.date)}
        </div>
      </div>

      <div className="avoid-break" style={{ display: 'flex', gap: '10pt', marginBottom: '8pt' }}>
        <div className="card" style={{ flex: 1 }}>
          <Row label="Restaurant" value={dining.venueName} />
          <Row label="Guest Name" value={dining.name} />
          <Row label="Contact" value={dining.phone || dining.email} />
        </div>
        <div className="card" style={{ flex: 1 }}>
          <Row label="Status" value={table.status || 'Confirmed'} />
          <Row label="Occasion" value={table.occasion || 'General Dining'} />
          <Row label="Linked Stay" value={table.stayReference || 'Non-resident Guest'} />
        </div>
      </div>

      {table.dietaryNotes && (
        <div
          className="avoid-break"
          style={{
            marginBottom: '8pt',
            padding: '9pt 11pt',
            border: '1.5pt solid #7d4e24',
            background: '#fdf6ec',
            borderRadius: '5pt',
          }}
        >
          <div className="label" style={{ color: '#7d4e24', marginBottom: '2pt' }}>
            DIETARY REQUIREMENTS — BRIEF THE PASS
          </div>
          <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#2b1a0d' }}>
            {table.dietaryNotes}
          </div>
        </div>
      )}

      {table.specialRequests && (
        <div className="avoid-break card" style={{ marginBottom: '8pt' }}>
          <Row label="Guest Notes" value={table.specialRequests} />
        </div>
      )}

      <Footer note={`Internal restaurant service document. Booked ${stamp(table.createdAt || new Date().toISOString())}.`} />
    </>
  );
}

/* --------------------------------------------------------------------------
   The print pipeline.
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
 * The two buttons. `invoice` is rendered only when isAdmin is true - and the
 * data behind it (payment method, card tail, the tax breakdown) only ever
 * reaches an admin session anyway.
 */
export function DocumentButtons({ voucher, invoice, isAdmin = false, compact = false }) {
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
          title="Open official voucher. Choose Save as PDF in the print dialog to download."
          className={`${base} bg-white border border-primary/30 text-deep-wood font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50`}
        >
          {printing ? (
            <Loader2 size={size} className="animate-spin" />
          ) : (
            <FileText size={size} className="text-primary" />
          )}
          PDF Voucher
        </button>

        {isAdmin && invoice && (
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
        )}
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
    />
  );
}
