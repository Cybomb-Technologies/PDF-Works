/********************************************************************************************
 * TOPUP INVOICE CONTROLLER – NEW SEPARATE VERSION FOR TOPUP PAYMENTS
 * NOTHING REMOVED — FULL SIZE — FULLY COMMENTED — EMAIL + PDF + ATTACHMENT
 ********************************************************************************************/

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const TopupPayment = require("../models/TopupPayment");
const User = require("../models/UserModel");
const TopupPackage = require("../models/TopupPackage");

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
 * INTERNAL FUNCTION — BUILD PDF INTO BUFFER FOR TOPUP
 * USED FOR: download + email attachment
 ********************************************************************************************/
async function buildTopupInvoicePdfBuffer(transactionId, userId) {
  // ================================
  // FETCH TOPUP PAYMENT RECORD
  // ================================
  const payment = await TopupPayment.findOne({ transactionId, userId })
    .populate('topupPackageId');
  if (!payment) return null;

  // ================================
  // FETCH USER
  // ================================
  const user = await User.findById(userId);
  if (!user) return null;

  // ================================
  // GST MATH (for INR payments)
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
    date: payment.paidAt || payment.createdAt,
    type: "topup",
    credits: payment.creditsAllocated.total
  };
  const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

  // ================================
  // GET PACKAGE DETAILS
  // ================================
  const packageName = payment.topupPackageId?.name || "Top-up Credits Package";
  const packageDesc = payment.topupPackageId?.description || "Additional credits for PDF tools";

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
      gradient.stop(0, "#34D399"); // Emerald green
      gradient.stop(1, "#10B981"); // Slightly darker emerald
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
      const paidDate = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN") : createdDate;

      doc.text("Invoice Date:", rightBoxX + 10, 175);
      doc.text(paidDate, rightBoxX + 90, 175);

      doc.text("Status:", rightBoxX + 10, 190);
      doc.fillColor("#000000").font("Helvetica-Bold");
      doc.text((payment.status || "success").toUpperCase(), rightBoxX + 90, 190);

      doc.fillColor("#000000").font("Helvetica");
      doc.text("Payment Type:", rightBoxX + 10, 205);
      doc.text("Top-up Credits", rightBoxX + 90, 205);

      doc.text("Credits Added:", rightBoxX + 10, 220);
      doc.text(payment.creditsAllocated.total.toString(), rightBoxX + 90, 220);

      doc.text("Plan:", rightBoxX + 10, 235);
      doc.text(user.planName || "Free", rightBoxX + 90, 235, {
        width: 115,
      });

      /********************************************************************************************
       * TABLE HEADER
       ********************************************************************************************/
      doc.rect(0, 265, pageWidth, 28).fill("#A7F3D0"); // Light emerald

      doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold")
        .text("DESCRIPTION", 40, 273);
      doc.text("QTY", 350, 273);
      doc.text("PRICE", 420, 273);
      doc.text("AMOUNT", 500, 273);

      /********************************************************************************************
       * DESCRIPTION ROW - TOPUP CREDITS
       ********************************************************************************************/
      const descY = 305;

      doc.fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`${packageName}`, 40, descY);

      doc.font("Helvetica").fontSize(9)
        .text(`${packageDesc}`, 40, descY + 18);

      // Credits breakdown
      doc.fontSize(8).fillColor("#666666");
      let creditLineY = descY + 35;
      
      const creditTypes = [
        { name: "PDF Conversions", value: payment.creditsAllocated.conversion },
        { name: "Edit Tools", value: payment.creditsAllocated.editTools },
        { name: "Organize Tools", value: payment.creditsAllocated.organizeTools },
        { name: "Security Tools", value: payment.creditsAllocated.securityTools },
        { name: "Optimize Tools", value: payment.creditsAllocated.optimizeTools },
        { name: "Advanced Tools", value: payment.creditsAllocated.advancedTools },
        { name: "Convert Tools", value: payment.creditsAllocated.convertTools },
      ];

      creditTypes.forEach((credit, index) => {
        if (credit.value > 0) {
          doc.text(`• ${credit.name}: ${credit.value} credits`, 40, creditLineY);
          creditLineY += 12;
        }
      });

      doc.fontSize(10).fillColor("#000000")
        .text("1", 355, descY);
      doc.text(formatCurrency(baseAmount, payment.currency), 415, descY);
      doc.text(formatCurrency(baseAmount, payment.currency), 500, descY);

      /********************************************************************************************
       * TOTAL SECTION
       ********************************************************************************************/
      const summaryY = creditLineY + 25;

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
       * CREDITS SUMMARY
       ********************************************************************************************/
      doc.fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Credits Added:", 40, summaryY + 40);

      doc.fillColor("#000000").fontSize(9)
        .text(`Total: ${payment.creditsAllocated.total} credits`, 40, summaryY + 55);
      
      doc.fontSize(8).fillColor("#666666")
        .text("Credits never expire and will be used automatically when needed.", 40, summaryY + 70);

      /********************************************************************************************
       * QR CODE AT FOOTER
       ********************************************************************************************/
      const qrY = summaryY + 90;
      doc.image(qrCodeImage, 40, qrY, { width: 85 });

      /********************************************************************************************
       * TERMS SECTION
       ********************************************************************************************/
      doc.fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Payment Status: SUCCESS", 150, qrY);

      doc.fillColor("#000000").fontSize(8)
        .text(
          "\n\nTop-up Credits Note:\n• Credits never expire\n• Used automatically when subscription credits are exhausted\n• Non-refundable once used\n\nGST Note:\nAll amounts are inclusive of GST 18% as applicable.\n\nTerms & Conditions:\n• This is a computer-generated invoice.\n• For support, contact support@pdfworks.com\n\n\n\n",
          150,
          qrY + 15
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
 * PUBLIC FUNCTION — RETURN PDF TO USER DOWNLOAD (TOPUP)
 ********************************************************************************************/
const generateTopupInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const pdfBuffer = await buildTopupInvoicePdfBuffer(transactionId, userId);
    if (!pdfBuffer)
      return res.status(404).json({ message: "Topup invoice not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=topup-invoice-${transactionId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Topup invoice generation error:", error);
    return res.status(500).json({ message: "Failed to generate topup invoice" });
  }
};

/********************************************************************************************
 * PUBLIC FUNCTION — SEND EMAIL AFTER TOPUP PAYMENT
 ********************************************************************************************/
const sendTopupInvoiceAfterPayment = async (transactionId, userId) => {
  try {
    const pdfBuffer = await buildTopupInvoicePdfBuffer(transactionId, userId);
    if (!pdfBuffer) {
      console.warn("No PDF buffer created for topup invoice email");
      return;
    }

    const payment = await TopupPayment.findOne({ transactionId, userId })
      .populate('topupPackageId');
    if (!payment) {
      console.warn("Topup payment not found for invoice email");
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("User not found for topup invoice email");
      return;
    }

    const amountDisplay = formatCurrency(payment.amount, payment.currency);
    const packageName = payment.topupPackageId?.name || "Top-up Credits";
    const totalCredits = payment.creditsAllocated.total;

    // Import the email sender
    const { sendTopupInvoiceEmail } = require("../utils/topupEmailSender");
    
    await sendTopupInvoiceEmail(
      user.email,
      pdfBuffer,
      transactionId,
      user.name || "Customer",
      amountDisplay,
      packageName,
      totalCredits,
      payment.creditsAllocated
    );

    console.log("📨 Topup invoice email successfully sent to:", user.email);
  } catch (err) {
    console.error("❌ Failed to send topup invoice email:", err);
  }
};

module.exports = { generateTopupInvoice, sendTopupInvoiceAfterPayment };