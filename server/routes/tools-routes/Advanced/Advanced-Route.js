const express = require("express");
const router = express.Router();
const { runAutomation, callApi, getAnalytics } = require("../../../controllers/tool-controller/Advanced/Advanced-Controller");

// Routes
router.post("/automation", runAutomation);
router.post("/api-connect", callApi);
router.get("/analytics", getAnalytics);

module.exports = router;
