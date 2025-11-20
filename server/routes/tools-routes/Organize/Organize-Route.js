// server/routes/tools-routes/Organize/Organize-Route.js

const express = require('express');
const multer = require('multer');

// Corrected path to the controller
const { organizePDF } = require('../../../controllers/tool-controller/Organize/Organize-Controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/:tool', upload.array('files'), organizePDF);

module.exports = router;