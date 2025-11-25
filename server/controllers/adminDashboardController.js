const User = require("../models/UserModel");
const File = require("../models/FileModel");
const Payment = require("../models/Payment");
const Convert = require("../models/tools-models/Convert/Convert");
const Organize = require("../models/tools-models/Organize/Organize-Model");
const Optimize = require("../models/tools-models/Optimize/Optimize");
const Edit = require("../models/tools-models/Edit/Edit-Model");
const Security = require("../models/tools-models/Security/Security-Model");
const Advanced = require("../models/tools-models/Advanced/Advanced-Model");

// Get available plans for filtering
const getPlans = async (req, res) => {
  try {
    const userPlans = await User.distinct("planName");
    const paymentPlans = await Payment.distinct("planName");
    
    const allPlans = [...new Set([...userPlans, ...paymentPlans])].filter(plan => plan);
    
    const defaultPlans = ['Free', 'Pro', 'Business', 'Enterprise'];
    const finalPlans = allPlans.length > 0 ? allPlans : defaultPlans;
    
    res.json({
      success: true,
      plans: finalPlans
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.json({
      success: true,
      plans: ['Free', 'Pro', 'Business', 'Enterprise']
    });
  }
};

// Get ALL users with file counts for admin dashboard
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userId = user._id;
        
        const [
          convertCount,
          organizeCount,
          optimizeCount,
          editCount,
          securityCount,
          advancedCount
        ] = await Promise.all([
          File.countDocuments({ uploadedBy: userId }),
          Organize.countDocuments({ userId }),
          Optimize.countDocuments({ userId }),
          Edit.countDocuments({ userId }),
          Security.countDocuments({ userId }),
          Advanced.countDocuments({ userId })
        ]);

        const totalFiles = convertCount + organizeCount + optimizeCount + editCount + securityCount + advancedCount;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.planName || "Free",
          planType: user.planName?.toLowerCase() || "free",
          createdAt: user.createdAt,
          lastActive: user.updatedAt,
          files: totalFiles,
          storageUsed: user.usage?.storageUsedBytes || 0,
          subscriptionStatus: user.subscriptionStatus || "active"
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
};

// Get ALL files from ALL users for admin dashboard
const getFiles = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const [
      convertFiles,
      organizeFiles,
      optimizeFiles,
      editFiles,
      securityFiles,
      advancedFiles
    ] = await Promise.all([
      File.find()
        .populate('uploadedBy', 'name email')
        .select('filename originalName path size uploadedAt category toolUsed uploadedBy')
        .sort({ uploadedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      
      Organize.find()
        .populate('userId', 'name email')
        .select('processedFilename originalFilenames downloadUrl fileSize createdAt operationType outputPath userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      
      Optimize.find()
        .populate('userId', 'name email')
        .select('processedFilename originalFilename downloadUrl fileSize optimizedFileSize createdAt operationType outputPath userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      
      Edit.find()
        .populate('userId', 'name email')
        .select('editedFilename originalFilename downloadUrl fileSize createdAt editType outputPath editMetadata userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      
      Security.find()
        .populate('userId', 'name email')
        .select('processedFilename originalFilename downloadUrl fileSize createdAt operationType outputPath userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      
      Advanced.find()
        .populate('userId', 'name email')
        .select('processedName originalName downloadUrl createdAt operationType featureType outputPath userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
    ]);

    const allFiles = [
      ...convertFiles.map(file => ({
        _id: file._id,
        source: 'convert',
        filename: file.originalName,
        displayName: file.filename,
        path: file.path,
        size: file.size,
        uploadedAt: file.uploadedAt,
        category: file.category || 'converted',
        toolUsed: file.toolUsed || 'convert',
        toolCategory: 'convert',
        userId: file.uploadedBy?._id,
        userName: file.uploadedBy?.name,
        userEmail: file.uploadedBy?.email,
        type: 'file'
      })),
      
      ...organizeFiles.map(file => ({
        _id: file._id,
        source: 'organize',
        filename: file.processedFilename,
        displayName: file.originalFilenames?.join(', ') || file.processedFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'organized',
        toolUsed: file.operationType,
        toolCategory: 'organize',
        userId: file.userId?._id,
        userName: file.userId?.name,
        userEmail: file.userId?.email,
        type: 'file'
      })),
      
      ...optimizeFiles.map(file => ({
        _id: file._id,
        source: 'optimize',
        filename: file.processedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.optimizedFileSize || file.fileSize,
        uploadedAt: file.createdAt,
        category: 'optimized',
        toolUsed: file.operationType,
        toolCategory: 'optimize',
        userId: file.userId?._id,
        userName: file.userId?.name,
        userEmail: file.userId?.email,
        type: 'file'
      })),
      
      ...editFiles.map(file => ({
        _id: file._id,
        source: 'edit',
        filename: file.editedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'edited',
        toolUsed: file.editType,
        toolCategory: 'edit',
        userId: file.userId?._id,
        userName: file.userId?.name,
        userEmail: file.userId?.email,
        type: file.editType === 'file-rename' ? 'batch' : 'file'
      })),
      
      ...securityFiles.map(file => ({
        _id: file._id,
        source: 'security',
        filename: file.processedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'secured',
        toolUsed: file.operationType,
        toolCategory: 'security',
        userId: file.userId?._id,
        userName: file.userId?.name,
        userEmail: file.userId?.email,
        type: 'file'
      })),
      
      ...advancedFiles.filter(file => file.downloadUrl).map(file => ({
        _id: file._id,
        source: 'advanced',
        filename: file.processedName,
        displayName: file.originalName,
        path: file.outputPath || file.downloadUrl,
        size: 0,
        uploadedAt: file.createdAt,
        category: 'advanced',
        toolUsed: file.featureType,
        toolCategory: 'advanced',
        userId: file.userId?._id,
        userName: file.userId?.name,
        userEmail: file.userId?.email,
        type: 'file'
      }))
    ];

    allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const paginatedFiles = allFiles.slice(0, parseInt(limit));

    res.json({
      success: true,
      files: paginatedFiles,
      total: allFiles.length,
      page: parseInt(page),
      totalPages: Math.ceil(allFiles.length / limit)
    });

  } catch (error) {
    console.error("Admin get files error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch files"
    });
  }
};

// Get admin dashboard statistics
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    const usersByPlan = await User.aggregate([
      {
        $group: {
          _id: "$planName",
          count: { $sum: 1 }
        }
      }
    ]);

    const [
      convertCount,
      organizeCount,
      optimizeCount,
      editCount,
      securityCount,
      advancedCount
    ] = await Promise.all([
      File.countDocuments(),
      Organize.countDocuments(),
      Optimize.countDocuments(),
      Edit.countDocuments(),
      Security.countDocuments(),
      Advanced.countDocuments()
    ]);

    const totalFiles = convertCount + organizeCount + optimizeCount + editCount + securityCount + advancedCount;

    const payingUsers = await User.aggregate([
      {
        $match: {
          planName: { $in: ["Pro", "Business", "Professional", "Enterprise"] }
        }
      },
      {
        $group: {
          _id: "$planName",
          count: { $sum: 1 }
        }
      }
    ]);

    let monthlyRevenue = 0;
    payingUsers.forEach(plan => {
      if (plan._id === "Pro" || plan._id === "Professional") {
        monthlyRevenue += plan.count * 12;
      } else if (plan._id === "Business" || plan._id === "Enterprise") {
        monthlyRevenue += plan.count * 49;
      }
    });

    const usersWithFiles = await User.aggregate([
      {
        $lookup: {
          from: "files",
          localField: "_id",
          foreignField: "uploadedBy",
          as: "userFiles"
        }
      },
      {
        $match: {
          $or: [
            { "userFiles.0": { $exists: true } },
            { lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
          ]
        }
      },
      {
        $count: "activeUsers"
      }
    ]);

    const activeUsers = usersWithFiles[0]?.activeUsers || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFiles,
        monthlyRevenue,
        activeUsers,
        usersByPlan: usersByPlan.reduce((acc, plan) => {
          acc[plan._id || "Free"] = plan.count;
          return acc;
        }, {}),
        filesByTool: {
          convert: convertCount,
          organize: organizeCount,
          optimize: optimizeCount,
          edit: editCount,
          security: securityCount,
          advanced: advancedCount
        }
      }
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics"
    });
  }
};

// Get ALL payments with user details
const getPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      plan, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (plan && plan !== 'all') {
      filter.planName = plan;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(filter)
      .populate('userId', 'name email')
      .populate('planId', 'name planId price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPayments = await Payment.countDocuments(filter);
    const totalRevenue = await Payment.aggregate([
      { $match: { ...filter, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenueStats = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          monthlyRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const uniquePlans = await Payment.distinct('planName');
    const uniqueStatuses = await Payment.distinct('status');

    res.json({
      success: true,
      payments,
      stats: {
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: revenueStats,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / limit)
      },
      filters: {
        plans: uniquePlans,
        statuses: uniqueStatuses
      }
    });

  } catch (error) {
    console.error("Admin get payments error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments"
    });
  }
};

// Get payment statistics for dashboard
const getPaymentStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    const sixtyDaysAgo = new Date(today.setDate(today.getDate() - 60));

    const [
      totalRevenue,
      monthlyRevenue,
      previousMonthRevenue,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      revenueByPlan,
      recentPayments
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: 'success',
            createdAt: { $gte: thirtyDaysAgo }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: 'success',
            createdAt: { 
              $gte: sixtyDaysAgo,
              $lt: thirtyDaysAgo
            }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'success' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.aggregate([
        { $match: { status: 'success' } },
        {
          $group: {
            _id: '$planName',
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      Payment.find({ status: 'success' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('transactionId amount planName billingCycle createdAt user')
    ]);

    const revenueGrowth = previousMonthRevenue[0]?.total 
      ? ((monthlyRevenue[0]?.total - previousMonthRevenue[0]?.total) / previousMonthRevenue[0]?.total) * 100
      : 0;

    res.json({
      success: true,
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        previousMonthRevenue: previousMonthRevenue[0]?.total || 0,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
        revenueByPlan,
        recentPayments
      }
    });

  } catch (error) {
    console.error("Admin payment stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment statistics"
    });
  }
};

// Get specific payment details
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email createdAt')
      .populate('planId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error("Admin get payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details"
    });
  }
};

// Update payment status (for manual adjustments)
const updatePayment = async (req, res) => {
  try {
    const { status, autoRenewal, renewalStatus } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (autoRenewal !== undefined) updateData.autoRenewal = autoRenewal;
    if (renewalStatus) updateData.renewalStatus = renewalStatus;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    res.json({
      success: true,
      message: "Payment updated successfully",
      payment
    });

  } catch (error) {
    console.error("Admin update payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment"
    });
  }
};

module.exports = {
  getPlans,
  getUsers,
  getFiles,
  getStats,
  getPayments,
  getPaymentStats,
  getPaymentById,
  updatePayment
};