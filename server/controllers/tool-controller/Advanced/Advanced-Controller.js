const axios = require("axios");
const AdvancedTool = require("../../../models/tools-models/Advanced/Advanced-Model");

// Automation Runner
exports.runAutomation = async (req, res) => {
  try {
    const { tasks } = req.body;
    const result = tasks.map(t => `${t} completed`);
    const tool = await AdvancedTool.create({ featureType: "automation", inputData: { tasks }, resultData: result, status: "done" });
    res.json({ success: true, data: tool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// API Integrator (updated with method, body, headers)
exports.callApi = async (req, res) => {
  try {
    const { url, method = "GET", body, headers } = req.body;

    if (!url) return res.status(400).json({ success: false, message: "API URL is required" });

    const response = await axios({
      url,
      method,
      data: body || undefined,
      headers: headers || undefined,
    });

    // Save request & response to DB
    await AdvancedTool.create({
      featureType: "api-connect",
      inputData: { url, method, body, headers },
      resultData: response.data,
      status: "done"
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data || err.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const total = await AdvancedTool.countDocuments();
    const automationCount = await AdvancedTool.countDocuments({ featureType: "automation" });
    const apiCount = await AdvancedTool.countDocuments({ featureType: "api-connect" });
    const analyticsCount = await AdvancedTool.countDocuments({ featureType: "analytics" });

    res.json({ success: true, summary: { total, automationCount, apiCount, analyticsCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
