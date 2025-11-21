const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Payment = require("../models/Payment");
const User = require("../models/UserModel");

// ==========================================================
// HELPER: Right Alignment (Prevents wrapping bugs)
// ==========================================================
function rightText(doc, text, xRight, y) {
  const width = 200; // Define a safe width box
  doc.text(text, xRight - width, y, {
    width: width,
    align: "right",
    lineBreak: false, // Forces text to stay on one line
  });
}

// ==========================================================
// HELPER: Currency Formatter (INR & USD)
// ==========================================================
function formatCurrency(amount, currency) {
  // Case 1: Indian Rupee (INR)
  // We use "Rs." because standard PDF fonts (Helvetica) do not support the '₹' symbol.
  if (currency === "INR") {
    return `Rs. ${amount.toLocaleString("en-IN")}`;
  }

  // Case 2: US Dollar (USD)
  // The '$' symbol is standard ASCII and works perfectly in PDFKit.
  if (currency === "USD") {
    return `USD. ${amount.toLocaleString("en-US")}`;
  }

  // Fallback for other currencies
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

const generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({ transactionId, userId });
    if (!payment)
      return res.status(404).json({ message: "Invoice not found" });

    const user = await User.findById(userId);

    // ==============================================
    // QR CODE GENERATION
    // ==============================================
    const qrPayload = {
      transactionId,
      amount: payment.amount,
      currency: payment.currency,
      plan: payment.planName,
      userName: user.name,
      date: new Date(payment.createdAt).toLocaleDateString("en-IN"),
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

    // ==============================================
    // PDF SETUP
    // ==============================================
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${transactionId}.pdf`
    );

    doc.pipe(res);

    // ==============================================
    // HEADER SECTION
    // ==============================================
    // Lighter Blue Background (#99badd)
    doc.fillColor("#99badd").rect(0, 0, 612, 100).fill();

    // Logo (Optional)
    try {
      doc.image("server/assets/logo.png", 50, 25, { width: 60 });
    } catch {
      // Fallback if logo is missing
    }

    // Company Name
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("PDF WORKS", 130, 30);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("The Future of Document Management", 130, 58);

    // QR Code (Positioned at top right)
    doc.image(qrCodeImage, 455, 5, { width: 90 });

    doc.fillColor("#000000");

    const RIGHT_X = 550; // Right margin anchor

    // ==============================================
    // INVOICE META DATA (Top Right)
    // ==============================================
    rightText(doc, "TAX INVOICE", RIGHT_X, 130);
    rightText(doc, "Invoice #: Scan QR for details", RIGHT_X, 155);
    rightText(
      doc,
      `Date: ${new Date(payment.createdAt).toLocaleDateString("en-IN")}`,
      RIGHT_X,
      175
    );

    // ==============================================
    // BILLING INFORMATION
    // ==============================================
    const billingTop = 220;

    // Billed To
    doc.font("Helvetica-Bold").fontSize(12).text("BILLED TO:", 50, billingTop);
    doc.font("Helvetica").fontSize(10);
    doc.text(user.name || "Customer", 50, billingTop + 18);
    doc.text(user.email, 50, billingTop + 33);
    doc.text(user.phone || "Not provided", 50, billingTop + 48);

    // From
    doc.font("Helvetica-Bold").fontSize(12).text("FROM:", 300, billingTop);
    doc.font("Helvetica").fontSize(10);
    doc.text("PDF Works", 300, billingTop + 18);
    doc.text("support@pdfworks.com", 300, billingTop + 33);
    doc.text("+91 9876543210", 300, billingTop + 48);

    // ==============================================
    // SERVICE DETAILS
    // ==============================================
    const serviceTop = billingTop + 90;

    doc.font("Helvetica-Bold").fontSize(12).text("SERVICE DETAILS:", 50, serviceTop);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Plan: ${payment.planName}`, 50, serviceTop + 18);
    doc.text(`Billing Cycle: ${payment.billingCycle}`, 50, serviceTop + 33);
    doc.text(
      `Payment Method: ${payment.paymentMethod || "Online Payment"}`,
      50,
      serviceTop + 48
    );

    // ==============================================
    // AMOUNT TABLE
    // ==============================================
    let tableTop = serviceTop + 90;

    // --- Table Header ---
    doc.font("Helvetica-Bold").fontSize(12).text("Description", 50, tableTop);
    rightText(doc, "Amount", RIGHT_X, tableTop);

    // Line under header
    doc
      .moveTo(50, tableTop + 18)
      .lineTo(550, tableTop + 18)
      .strokeColor("#4f46e5")
      .stroke();

    // --- Table Row ---
    const rowY = tableTop + 35;

    doc.font("Helvetica").fontSize(10);
    
    // Description Column
    doc.text(
      `${payment.planName} Subscription - ${payment.billingCycle}`,
      50,
      rowY,
      { width: 350 }
    );

    // Amount Column
    // This uses formatCurrency which handles INR (Rs.) and USD ($)
    rightText(
      doc,
      formatCurrency(payment.amount, payment.currency),
      RIGHT_X,
      rowY
    );

    // Line under row
    doc
      .moveTo(50, rowY + 20)
      .lineTo(550, rowY + 20)
      .strokeColor("#4f46e5")
      .stroke();

    // --- Total Section ---
    const totalY = rowY + 35;

    doc.font("Helvetica-Bold").fontSize(12).text("Total Amount", 50, totalY);
    
    rightText(
      doc,
      formatCurrency(payment.amount, payment.currency),
      RIGHT_X,
      totalY
    );

    // ==============================================
    // STATUS & FOOTER
    // ==============================================
    doc
      .font("Helvetica-Bold")
      .fillColor(payment.status === "success" ? "#10b981" : "#ef4444")
      .fontSize(12)
      .text(
        `Payment Status: ${payment.status.toUpperCase()}`,
        50,
        totalY + 40
      );

    doc.fillColor("#000000");

    // Terms
    const termsTop = totalY + 80;
    doc.font("Helvetica-Bold").fontSize(10).text("Terms & Conditions:", 50, termsTop);
    doc.font("Helvetica").fontSize(8);
    doc.text("• This is a computer-generated invoice.", 50, termsTop + 15);
    doc.text("• For support, contact support@pdfworks.com", 50, termsTop + 28);

    // Bottom Footer
    doc
      .fontSize(8)
      .text("Thank you for choosing PDF Works!", 50, 750, { align: "center" });

    doc.text("This invoice was generated automatically.", 50, 765, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({ message: "Failed to generate invoice" });
  }
};

module.exports = { generateInvoice };