/********************************************************************************************
 * INVOICE CONTROLLER – FULL VERSION
 * NOTHING REMOVED — FULL SIZE — FULLY COMMENTED — EMAIL + PDF + ATTACHMENT
 ********************************************************************************************/

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Payment = require("../models/Payment");
const User = require("../models/UserModel");
const { sendInvoiceEmail } = require("../utils/emailSender");

/********************************************************************************************
 * FORMAT CURRENCY EXACTLY AS DISPLAYED
 ********************************************************************************************/
function formatCurrency(amount, currency) {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/********************************************************************************************
 * INTERNAL FUNCTION — BUILD PDF INTO BUFFER
 * USED FOR: download + email attachment
 ********************************************************************************************/
async function buildInvoicePdfBuffer(transactionId, userId) {
  // ================================
  // FETCH PAYMENT RECORD
  // ================================
  const payment = await Payment.findOne({ transactionId, userId });
  if (!payment) return null;

  // ================================
  // FETCH USER
  // ================================
  const user = await User.findById(userId);
  if (!user) return null;

  // ================================
  // GST MATH
  // ================================
  let baseAmount = payment.amount;
  let gstAmount = 0;

  if (payment.currency === "INR") {
    baseAmount = Math.round((payment.amount / 1.18) * 100) / 100;
    gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  }

  // ================================
  // QR GENERATION
  // ================================
  const qrPayload = {
    transactionId,
    amount: payment.amount,
    currency: payment.currency,
    userName: user.name,
    email: user.email,
    date: payment.createdAt,
  };
  const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

  // ================================
  // BUILD PDF INTO BUFFER
  // ================================
  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pageWidth = doc.page.width;

      /********************************************************************************************
       * HEADER SECTION — GRADIENT BAR
       ********************************************************************************************/
      const gradient = doc.linearGradient(0, 0, pageWidth, 0);
      gradient.stop(0, "#8EC5FC");
      gradient.stop(1, "#E0C3FC");
      doc.rect(0, 0, pageWidth, 150).fill(gradient);

      try {
        doc.image("server/assets/logo.png", 40, 25, { width: 60 });
      } catch {}

      doc.fillColor("#000000")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("PDF WORKS", 120, 30);

      doc.fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text("Professional PDF editing Platform", 120, 60);

      doc.fontSize(9)
        .text(
          "Cybomb Technologies Pvt Ltd.\n" +
            "GSTIN: IN07AADCT2341D2Z\n" +
            "Chennai, Tamil Nadu, India",
          120,
          85
        );

      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(`${transactionId}`, pageWidth - 260, 30, {
          align: "right",
          width: 220,
        });

      /********************************************************************************************
       * BILL TO SECTION
       ********************************************************************************************/
      doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#000000")
        .text("BILL TO:", 40, 170);

      doc.fillColor("#000000").font("Helvetica").fontSize(11);
      doc.text(user.name || "Customer", 40, 190);
      doc.text(user.email || "", 40, 210);

      /********************************************************************************************
       * RIGHT SIDE INFO BOX
       ********************************************************************************************/
      const rightBoxX = pageWidth - 260;
      doc.rect(rightBoxX, 165, 220, 100).fill("#f6f6f8").stroke("#e0e0e0");

      doc.fillColor("#000000").fontSize(9);

      const createdDate = new Date(payment.createdAt).toLocaleDateString("en-IN");
      const expiryDate = new Date(payment.expiryDate).toLocaleDateString("en-IN");

      doc.text("Invoice Date:", rightBoxX + 10, 175);
      doc.text(createdDate, rightBoxX + 90, 175);

      doc.text("Due Date:", rightBoxX + 10, 190);
      doc.text(createdDate, rightBoxX + 90, 190);

      doc.text("Status:", rightBoxX + 10, 205);
      doc.fillColor("#000000").font("Helvetica-Bold");
      doc.text((payment.status || "success").toUpperCase(), rightBoxX + 90, 205);

      doc.fillColor("#000000").font("Helvetica");
      doc.text("Billing Cycle:", rightBoxX + 10, 220);
      doc.text(payment.billingCycle || "", rightBoxX + 90, 220);

      doc.text("Service Period:", rightBoxX + 10, 235);
      doc.text(`${createdDate} → ${expiryDate}`, rightBoxX + 90, 235, {
        width: 115,
      });

      /********************************************************************************************
       * TABLE HEADER
       ********************************************************************************************/
      doc.rect(0, 265, pageWidth, 28).fill("#E9B6FF");

      doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold")
        .text("DESCRIPTION", 40, 273);
      doc.text("QTY", 350, 273);
      doc.text("PRICE", 420, 273);
      doc.text("AMOUNT", 500, 273);

      /********************************************************************************************
       * DESCRIPTION ROW
       ********************************************************************************************/
      const descY = 305;

      doc.fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`${payment.planName} Subscription`, 40, descY);

      doc.font("Helvetica").fontSize(9)
        .text(`${payment.billingCycle} billing with full feature access`, 40, descY + 18);

      doc.fontSize(10).text("1", 355, descY);
      doc.text(formatCurrency(baseAmount, payment.currency), 415, descY);
      doc.text(formatCurrency(baseAmount, payment.currency), 500, descY);

      /********************************************************************************************
       * TOTAL SECTION
       ********************************************************************************************/
      const summaryY = descY + 75;

      doc.font("Helvetica").fontSize(10)
        .fillColor("#000000")
        .text("Subtotal:", 420, summaryY);
      doc.text(formatCurrency(baseAmount, payment.currency), 500, summaryY);

      if (payment.currency === "INR") {
        doc.text("GST (18%):", 420, summaryY + 18);
        doc.text(formatCurrency(gstAmount, payment.currency), 500, summaryY + 18);

        doc.font("Helvetica-Bold").fontSize(12)
          .fillColor("#000000")
          .text("TOTAL PAID", 420, summaryY + 45);
        doc.text(formatCurrency(payment.amount, payment.currency), 500, summaryY + 45);
      } else {
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000")
          .text("TOTAL PAID", 420, summaryY + 20);
        doc.text(formatCurrency(payment.amount, payment.currency), 500, summaryY + 20);
      }

      /********************************************************************************************
       * QR CODE AT FOOTER
       ********************************************************************************************/
      doc.image(qrCodeImage, 40, summaryY + 90, { width: 85 });

      /********************************************************************************************
       * TERMS SECTION
       ********************************************************************************************/
      doc.fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Payment Status: SUCCESS", 150, summaryY + 90);

      doc.fillColor("#000000").fontSize(8)
        .text(
          "\n\nGST Note:\nAll amounts are inclusive of GST 18% as applicable.\n\nTerms & Conditions:\n• This is a computer-generated invoice.\n• For support, contact support@pdfworks.com\n\n\n\n",
          150
        );

      doc.fontSize(9).fillColor("#000000")
        .text("Thank you for choosing PDF Works!", 40, 800, { align: "center" });

      doc.fontSize(8)
        .text("This invoice was generated automatically.", 40, 815, {
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/********************************************************************************************
 * PUBLIC FUNCTION — RETURN PDF TO USER DOWNLOAD
 ********************************************************************************************/
const generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const pdfBuffer = await buildInvoicePdfBuffer(transactionId, userId);
    if (!pdfBuffer)
      return res.status(404).json({ message: "Invoice not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${transactionId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({ message: "Failed to generate invoice" });
  }
};

/********************************************************************************************
 * PUBLIC FUNCTION — SEND EMAIL AFTER PAYMENT
 ********************************************************************************************/
const sendInvoiceAfterPayment = async (transactionId, userId) => {
  try {
    const pdfBuffer = await buildInvoicePdfBuffer(transactionId, userId);
    if (!pdfBuffer) {
      console.warn("No PDF buffer created for invoice email");
      return;
    }

    const payment = await Payment.findOne({ transactionId, userId });
    if (!payment) {
      console.warn("Payment not found for invoice email");
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("User not found for invoice email");
      return;
    }

    const amountDisplay = formatCurrency(payment.amount, payment.currency);
    const planName = payment.planName;
    const billingCycle = payment.billingCycle;

    await sendInvoiceEmail(
      user.email,
      pdfBuffer,
      transactionId,
      user.name || "Customer",
      amountDisplay,
      planName,
      billingCycle
    );

    console.log("📨 Invoice email successfully sent to:", user.email);
  } catch (err) {
    console.error("❌ Failed to send invoice email:", err);
  }
};

module.exports = { generateInvoice, sendInvoiceAfterPayment };
