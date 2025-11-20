const express = require("express");
const multer = require("multer");
const { organizePDF } = require("../../../controllers/tool-controller/Organize/Organize-Controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

router.post("/:tool", upload.array("files"), organizePDF);

module.exports = router;
