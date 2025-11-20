const Contact = require("../models/Contact");
const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// Create new contact message
exports.createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    const newMessage = new Contact({ name, email, message });
    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message saved successfully!",
      data: newMessage,
    });
  } catch (error) {
    console.error("Contact Save Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Get all contact messages (for admin)
exports.getAllContacts = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      contacts: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
    });
  }
};

// Export contacts to Excel (Admin only)
exports.exportContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contacts");

    // Add headers
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Message", key: "message", width: 50 },
      { header: "Submitted Date", key: "createdAt", width: 20 },
      { header: "Contact ID", key: "contactId", width: 30 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Add data
    contacts.forEach((contact) => {
      worksheet.addRow({
        name: contact.name,
        email: contact.email,
        message: contact.message,
        createdAt: contact.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        contactId: contact._id.toString(),
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=contacts-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Export failed",
      error: error.message,
    });
  }
};

// Download contact import template
exports.downloadContactTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contact Import Template");

    // Add headers with styling
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Message", key: "message", width: 50 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // Add example data
    const examples = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        message:
          "I am interested in your services. Please contact me for more information.",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        message:
          "Looking forward to hearing back from your team about the project.",
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        message:
          "Can you provide more details about your pricing and packages?",
      },
    ];

    examples.forEach((example) => {
      worksheet.addRow(example);
    });

    // Add instructions
    worksheet.addRow([]);
    worksheet.addRow(["Instructions:"]);
    worksheet.addRow([
      "1. Fill in your contact data following the examples above",
    ]);
    worksheet.addRow(["2. Required fields: Name, Email, Message"]);
    worksheet.addRow([
      "3. Submitted Date will be automatically set to import time",
    ]);
    worksheet.addRow(["4. Remove example rows before importing your data"]);
    worksheet.addRow(["5. Save file as .xlsx or .csv before importing"]);

    // Style instructions
    for (let i = 3; i <= 8; i++) {
      worksheet.getRow(i).font = { italic: true, color: { argb: "FF6B7280" } };
    }

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=contact-import-template.xlsx"
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Download contact template error:", error);
    res.status(500).json({
      success: false,
      message: "Template download failed",
      error: error.message,
    });
  }
};

// Import contacts from CSV/Excel
exports.importContacts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let contacts = [];

    // Parse file based on extension
    if (fileExtension === ".csv") {
      contacts = await parseContactCSV(filePath);
    } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      contacts = await parseContactExcel(filePath);
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Unsupported file format. Please upload CSV or Excel files.",
      });
    }

    if (contacts.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "No valid contact data found in the file.",
      });
    }

    // Process and save contacts
    const results = await processContacts(contacts);

    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Import completed successfully. ${results.added} new contacts added. ${results.skipped} duplicates skipped.`,
      data: {
        totalProcessed: contacts.length,
        added: results.added,
        skipped: results.skipped,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Import contacts error:", error);

    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Import failed",
      error: error.message,
    });
  }
};

// Parse CSV file for contacts
const parseContactCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const contacts = [];

    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("data", (row) => {
        contacts.push(row);
      })
      .on("end", () => {
        resolve(contacts);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

// Parse Excel file for contacts
const parseContactExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        resolve([]);
        return;
      }

      // Get headers (first row)
      const headers = data[0].map((header) =>
        header ? header.toString().trim().toLowerCase() : ""
      );

      // Process data rows
      const contacts = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const contact = {};

        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            contact[header] = row[index] ? row[index].toString().trim() : "";
          }
        });

        // Only add if there's at least name, email, and message
        if (contact.name && contact.email && contact.message) {
          contacts.push(contact);
        }
      }

      resolve(contacts);
    } catch (error) {
      reject(error);
    }
  });
};

// Process and save contacts to database
const processContacts = async (contacts) => {
  const results = {
    added: 0,
    skipped: 0,
    errors: [],
  };

  for (const contactData of contacts) {
    try {
      // Map and validate data
      const name = contactData.name || contactData.Name;
      const email = contactData.email || contactData.Email;
      const message = contactData.message || contactData.Message;

      if (!name || !email || !message) {
        results.errors.push(
          "Missing required fields (name, email, or message) in row"
        );
        continue;
      }

      // Check for duplicate (by email and similar message)
      const existingContact = await Contact.findOne({
        email: email.toLowerCase(),
        message: message,
      });

      if (existingContact) {
        results.skipped++;
        continue;
      }

      // Create new contact
      const contact = new Contact({
        name: name,
        email: email.toLowerCase(),
        message: message,
        // createdAt is automatically set by MongoDB
      });

      await contact.save();
      results.added++;
    } catch (error) {
      if (error.code === 11000) {
        results.skipped++;
      } else {
        results.errors.push(
          `Error processing ${contactData.email}: ${error.message}`
        );
      }
    }
  }

  return results;
};
