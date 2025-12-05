const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send topup invoice email
 */
async function sendTopupInvoiceEmail(
  to,
  pdfBuffer,
  transactionId,
  userName,
  amountDisplay,
  packageName,
  totalCredits,
  creditsAllocated
) {
  const safeName = userName || "Customer";
  const safeAmount = amountDisplay || "—";
  const safePackage = packageName || "Top-up Credits";
  
  const currentYear = new Date().getFullYear();
  const dashboardUrl = `${process.env.CLIENT_URL || "https://pdfworks.com"}/dashboard`;

  // Format credits breakdown for email
  let creditsBreakdown = "";
  if (creditsAllocated) {
    const creditTypes = [
      { name: "PDF Conversions", key: "conversion" },
      { name: "Edit Tools", key: "editTools" },
      { name: "Organize Tools", key: "organizeTools" },
      { name: "Security Tools", key: "securityTools" },
      { name: "Optimize Tools", key: "optimizeTools" },
      { name: "Advanced Tools", key: "advancedTools" },
      { name: "Convert Tools", key: "convertTools" },
    ];
    
    creditTypes.forEach(credit => {
      const value = creditsAllocated[credit.key] || 0;
      if (value > 0) {
        creditsBreakdown += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #4b5563;">${credit.name}:</span>
          <span style="font-weight: 600;">${value} credits</span>
        </div>`;
      }
    });
  }

  return transporter.sendMail({
    from: `"PDF Works Billing" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your PDF Works Top-up Invoice – ${transactionId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  body {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .banner {
    background: linear-gradient(90deg, #34D399, #10B981, #059669);
    background-size: 200% 200%;
    animation: gradientShift 10s ease infinite;
  }
  @media (prefers-color-scheme: dark) {
    body, .wrapper {
      background-color: #020617 !important;
      color: #e5e7eb !important;
    }
    .card {
      background-color: #020617 !important;
      border-color: #111827 !important;
    }
    .muted {
      color: #9ca3af !important;
    }
    .footer-text {
      color: #6b7280 !important;
    }
    .summary-box {
      background-color: #020617 !important;
      border-left-color: #34D399 !important;
    }
    .btn-primary {
      background-color: #34D399 !important;
      color: #020617 !important;
      border-color: #10B981 !important;
    }
  }
</style>
</head>
<body style="background:#f5f7fa; margin:0; padding:24px;">
  <div class="wrapper" style="max-width:640px; margin:0 auto;">
    <div class="card" style="
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      border:1px solid #e5e7eb;
      box-shadow:0 8px 24px rgba(15,23,42,0.12);
    ">

      <div class="banner" style="
        padding:22px 24px;
        font-size:22px;
        font-weight:700;
        color:#020617;
        text-align:center;
      ">
        PDF WORKS ⚡
      </div>

      <div style="padding:28px 26px 24px 26px; font-family: Arial, sans-serif; color:#111827;">
        <p style="font-size:16px; margin:0 0 12px 0;">
          Hello <b>${safeName}</b> 👋,
        </p>

        <p style="font-size:14px; line-height:1.6; margin:0 0 16px 0;">
          Your top-up credits have been successfully added to your account! 
          The invoice is attached to this email as a PDF.
        </p>

        <div class="summary-box" style="
          margin-top:14px;
          background:#f0fdf4;
          border-radius:10px;
          padding:14px 16px;
          border-left:4px solid #34D399;
        ">
          <div style="font-size:13px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em; color:#059669;">
            Top-up Summary
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px; color:#111827;">
            <tr><td style="padding:2px 0; width:130px;">Transaction ID:</td><td><b>${transactionId}</b></td></tr>
            <tr><td>Amount Paid:</td><td><b>${safeAmount}</b></td></tr>
            <tr><td>Package:</td><td>${safePackage}</td></tr>
            <tr><td>Total Credits:</td><td><b>${totalCredits} credits</b></td></tr>
          </table>
          
          ${creditsBreakdown ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #d1d5db;">
            <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">Credits Breakdown:</div>
            ${creditsBreakdown}
          </div>
          ` : ''}
        </div>

        <p style="margin-top:22px; font-size:14px; color:#374151;">
          Your credits have been added to your account and are ready to use. 
          They'll be used automatically when you need them.
        </p>

        <p style="font-size:13px; background:#ecfdf5; padding:10px 12px; border-radius:8px; color:#065f46; margin-top:16px;">
          <b>💡 Important:</b> Top-up credits never expire and will be used automatically 
          when your subscription credits run out.
        </p>

        <a class="btn-primary" href="${dashboardUrl}" target="_blank" rel="noopener"
          style="
            display:inline-block;
            margin-top:16px;
            padding:10px 18px;
            border-radius:999px;
            background:#34D399;
            border:1px solid #10B981;
            color:#020617;
            font-size:14px;
            font-weight:600;
            text-decoration:none;
          ">
          Go to Dashboard
        </a>

        <p class="muted" style="margin-top:26px; font-size:12px; color:#6b7280; line-height:1.6;">
          If you have any questions about your credits, reply to this email or contact us at
          <b>support@pdfworks.com</b>.
        </p>
      </div>

      <div class="footer-text" style="
        text-align:center;
        font-size:11px;
        color:#9ca3af;
        padding:12px 10px 16px 10px;
      ">
        © ${currentYear} PDF Works · Cybomb Technologies Pvt Ltd
      </div>
    </div>
  </div>
</body>
</html>
    `,
    attachments: [
      {
        filename: `topup-invoice-${transactionId}.pdf`,
        content: pdfBuffer,
      }
    ],
  });
}

module.exports = { sendTopupInvoiceEmail };