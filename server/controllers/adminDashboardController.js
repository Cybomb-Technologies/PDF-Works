const User = require("../models/UserModel");
const File = require("../models/FileModel");
const Payment = require("../models/Payment");
const TopupPayment = require("../models/TopupPayment");
const TopupPackage = require("../models/TopupPackage");
const Convert = require("../models/tools-models/Convert/Convert");
const Organize = require("../models/tools-models/Organize/Organize-Model");
const Optimize = require("../models/tools-models/Optimize/Optimize");
const Edit = require("../models/tools-models/Edit/Edit-Model");
const Security = require("../models/tools-models/Security/Security-Model");
const Advanced = require("../models/tools-models/Advanced/Advanced-Model");

// Exchange rate (INR to USD)
const EXCHANGE_RATE = 83.5;

// Helper function for currency conversion
const convertToINR = (amount, currency) => {
  if (!amount) return 0;
  return currency === 'INR' ? amount : amount * EXCHANGE_RATE;
};

const convertToUSD = (amount, currency) => {
  if (!amount) return 0;
  return currency === 'USD' ? amount : amount / EXCHANGE_RATE;
};

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
          advancedCount,
          topupPurchases,
          topupCredits
        ] = await Promise.all([
          File.countDocuments({ uploadedBy: userId }),
          Organize.countDocuments({ userId }),
          Optimize.countDocuments({ userId }),
          Edit.countDocuments({ userId }),
          Security.countDocuments({ userId }),
          Advanced.countDocuments({ userId }),
          TopupPayment.countDocuments({ userId, status: 'success' }),
          TopupPayment.aggregate([
            { $match: { userId, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$creditsAllocated.total' } } }
          ])
        ]);

        const totalFiles = convertCount + organizeCount + optimizeCount + editCount + securityCount + advancedCount;
        const totalTopupCredits = topupCredits[0]?.total || 0;

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
          subscriptionStatus: user.subscriptionStatus || "active",
          topupPurchases: topupPurchases,
          topupCredits: totalTopupCredits,
          currentTopupCredits: user.topupCredits?.total || 0
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

    // Calculate subscription revenue (INR)
    const subscriptionRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: {
        _id: null,
        totalINR: { 
          $sum: { 
            $cond: [
              { $eq: ["$currency", "INR"] }, 
              "$amount",
              { $multiply: ["$amount", EXCHANGE_RATE] }
            ]
          }
        }
      }}
    ]);

    // Calculate topup revenue (INR)
    const topupRevenue = await TopupPayment.aggregate([
      { $match: { status: 'success' } },
      { $group: {
        _id: null,
        totalINR: { 
          $sum: { 
            $cond: [
              { $eq: ["$currency", "INR"] }, 
              "$amount",
              { $multiply: ["$amount", EXCHANGE_RATE] }
            ]
          }
        }
      }}
    ]);

    const subscriptionRevenueINR = subscriptionRevenue[0]?.totalINR || 0;
    const topupRevenueINR = topupRevenue[0]?.totalINR || 0;
    const totalRevenueINR = subscriptionRevenueINR + topupRevenueINR;

    // Convert to USD for display
    const totalRevenueUSD = totalRevenueINR / EXCHANGE_RATE;
    const subscriptionRevenueUSD = subscriptionRevenueINR / EXCHANGE_RATE;
    const topupRevenueUSD = topupRevenueINR / EXCHANGE_RATE;

    // Get topup credits
    const creditsStats = await TopupPayment.aggregate([
      { $match: { status: 'success' } },
      { $group: {
        _id: null,
        totalCredits: { $sum: '$creditsAllocated.total' },
        count: { $sum: 1 }
      }}
    ]);

    const totalCreditsSold = creditsStats[0]?.totalCredits || 0;
    const totalTopupPurchases = creditsStats[0]?.count || 0;

    // Calculate success rates
    const [totalSubs, successSubs, totalTopups, successTopups] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'success' }),
      TopupPayment.countDocuments(),
      TopupPayment.countDocuments({ status: 'success' })
    ]);

    const topupSuccessRate = totalTopups > 0 ? (successTopups / totalTopups) * 100 : 0;
    const avgCreditsPerPurchase = totalTopupPurchases > 0 ? Math.round(totalCreditsSold / totalTopupPurchases) : 0;

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
        // User Stats
        totalUsers,
        totalFiles,
        activeUsers,
        usersByPlan: usersByPlan.reduce((acc, plan) => {
          acc[plan._id || "Free"] = plan.count;
          return acc;
        }, {}),
        
        // Revenue Stats (USD for frontend display)
        totalRevenue: totalRevenueUSD,
        monthlySubscriptionRevenue: subscriptionRevenueUSD,
        topupRevenue: topupRevenueUSD,
        combinedRevenue: totalRevenueUSD,
        
        // Revenue Stats (INR - original)
        totalRevenueINR: totalRevenueINR,
        subscriptionRevenueINR: subscriptionRevenueINR,
        topupRevenueINR: topupRevenueINR,
        
        // Topup Stats
        totalTopupPurchases,
        totalCreditsSold: totalCreditsSold,
        topupTransactions: totalTopups,
        topupSuccessRate: Math.round(topupSuccessRate * 100) / 100,
        avgCreditsPerPurchase: avgCreditsPerPurchase,
        
        // Files Stats
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

// Get ALL payments (Combined: Subscription + Topup)
const getPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      plan, 
      startDate, 
      endDate,
      search,
      paymentType = 'all'
    } = req.query;
    
    const skip = (page - 1) * limit;

    let subscriptionFilter = {};
    let topupFilter = {};
    
    // Common filters
    if (status && status !== 'all') {
      subscriptionFilter.status = status;
      topupFilter.status = status;
    }
    
    if (plan && plan !== 'all' && paymentType !== 'topup') {
      subscriptionFilter.planName = plan;
    }
    
    if (startDate && endDate) {
      const dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
      subscriptionFilter.createdAt = dateFilter;
      topupFilter.createdAt = dateFilter;
    }
    
    if (search) {
      subscriptionFilter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
      topupFilter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { cashfreeOrderId: { $regex: search, $options: 'i' } },
        { 'userSnapshot.email': { $regex: search, $options: 'i' } }
      ];
    }

    let subscriptionPayments = [];
    let topupPayments = [];
    let totalSubscriptionPayments = 0;
    let totalTopupPayments = 0;

    // Fetch subscription payments
    if (paymentType === 'all' || paymentType === 'subscription') {
      subscriptionPayments = await Payment.find(subscriptionFilter)
        .populate('userId', 'name email')
        .populate('planId', 'name planId price billingCycle')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      totalSubscriptionPayments = await Payment.countDocuments(subscriptionFilter);
    }

    // Fetch topup payments
    if (paymentType === 'all' || paymentType === 'topup') {
      topupPayments = await TopupPayment.find(topupFilter)
        .populate({
          path: 'topupPackageId',
          select: 'name totalCredits price'
        })
        .populate({
          path: 'userId',
          select: 'name email planName'
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      totalTopupPayments = await TopupPayment.countDocuments(topupFilter);
    }

    // Format subscription payments
    const formattedSubscriptionPayments = subscriptionPayments.map(payment => ({
      ...payment,
      paymentType: 'subscription',
      displayAmount: payment.amount,
      displayPlan: payment.planName,
      billingCycle: payment.billingCycle || payment.planId?.billingCycle || 'monthly',
      currency: payment.currency || 'INR',
      user: payment.userId ? {
        id: payment.userId._id,
        name: payment.userId.name,
        email: payment.userId.email
      } : payment.user || { name: 'Unknown', email: 'Unknown' },
      planDetails: payment.planId
    }));

    // Format topup payments
    const formattedTopupPayments = topupPayments.map(payment => ({
      ...payment,
      paymentType: 'topup',
      displayAmount: payment.amount,
      displayPlan: 'Topup Credits',
      billingCycle: 'one-time',
      currency: payment.currency || 'INR',
      credits: payment.creditsAllocated?.total || 0,
      user: payment.userId ? {
        id: payment.userId._id,
        name: payment.userId.name,
        email: payment.userId.email,
        plan: payment.userId.planName
      } : {
        id: payment.userId,
        email: payment.userSnapshot?.email || "Unknown User",
        plan: payment.userSnapshot?.plan || "Unknown"
      },
      package: payment.topupPackageId || {
        name: "Unknown Package",
        totalCredits: payment.creditsAllocated?.total || 0
      }
    }));

    // Combine and sort all payments
    const allPayments = [...formattedSubscriptionPayments, ...formattedTopupPayments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    const totalPayments = totalSubscriptionPayments + totalTopupPayments;

    // Calculate revenue stats (INR)
    const subscriptionRevenue = await Payment.aggregate([
      { $match: { ...subscriptionFilter, status: 'success' } },
      { $group: { 
        _id: null, 
        totalINR: { 
          $sum: { 
            $cond: [
              { $eq: ["$currency", "INR"] }, 
              "$amount",
              { $multiply: ["$amount", EXCHANGE_RATE] }
            ]
          }
        }
      }}
    ]);

    const topupRevenue = await TopupPayment.aggregate([
      { $match: { ...topupFilter, status: 'success' } },
      { $group: { 
        _id: null, 
        totalINR: { 
          $sum: { 
            $cond: [
              { $eq: ["$currency", "INR"] }, 
              "$amount",
              { $multiply: ["$amount", EXCHANGE_RATE] }
            ]
          }
        }
      }}
    ]);

    const totalRevenueINR = 
      (subscriptionRevenue[0]?.totalINR || 0) + 
      (topupRevenue[0]?.totalINR || 0);
    
    const totalRevenueUSD = totalRevenueINR / EXCHANGE_RATE;

    // Get revenue by plan
    const revenueByPlan = await Payment.aggregate([
      { $match: { ...subscriptionFilter, status: 'success' } },
      { $group: {
        _id: '$planName',
        revenueINR: { 
          $sum: { 
            $cond: [
              { $eq: ["$currency", "INR"] }, 
              "$amount",
              { $multiply: ["$amount", EXCHANGE_RATE] }
            ]
          }
        },
        count: { $sum: 1 }
      }},
      { $sort: { revenueINR: -1 } }
    ]);

    // Get filters
    const uniquePlans = await Payment.distinct('planName');
    const uniqueStatuses = await Payment.distinct('status');
    const topupStatuses = await TopupPayment.distinct('status');
    const allStatuses = [...new Set([...uniqueStatuses, ...topupStatuses])];

    res.json({
      success: true,
      payments: allPayments,
      stats: {
        totalPayments,
        totalRevenue: totalRevenueUSD,
        totalRevenueINR: totalRevenueINR,
        subscriptionRevenue: subscriptionRevenue[0]?.totalINR ? subscriptionRevenue[0].totalINR / EXCHANGE_RATE : 0,
        topupRevenue: topupRevenue[0]?.totalINR ? topupRevenue[0].totalINR / EXCHANGE_RATE : 0,
        subscriptionCount: totalSubscriptionPayments,
        topupCount: totalTopupPayments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / limit),
        revenueByPlan: revenueByPlan.map(plan => ({
          _id: plan._id,
          revenue: plan.revenueINR / EXCHANGE_RATE, // USD for display
          revenueINR: plan.revenueINR, // Original INR
          count: plan.count
        }))
      },
      filters: {
        plans: uniquePlans,
        statuses: allStatuses,
        paymentTypes: ['all', 'subscription', 'topup']
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

// Get payment statistics for dashboard (Combined)
const getPaymentStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Subscription payment stats (INR)
    const [
      subscriptionStats,
      topupStats,
      subscriptionMonthly,
      topupMonthly,
      revenueByPlan,
      creditsStats
    ] = await Promise.all([
      // Total subscription revenue
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: {
          _id: null,
          totalINR: { 
            $sum: { 
              $cond: [
                { $eq: ["$currency", "INR"] }, 
                "$amount",
                { $multiply: ["$amount", EXCHANGE_RATE] }
              ]
            }
          },
          count: { $sum: 1 }
        }}
      ]),
      
      // Total topup revenue
      TopupPayment.aggregate([
        { $match: { status: 'success' } },
        { $group: {
          _id: null,
          totalINR: { 
            $sum: { 
              $cond: [
                { $eq: ["$currency", "INR"] }, 
                "$amount",
                { $multiply: ["$amount", EXCHANGE_RATE] }
              ]
            }
          },
          count: { $sum: 1 }
        }}
      ]),
      
      // Monthly subscription
      Payment.aggregate([
        { 
          $match: { 
            status: 'success',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $group: {
          _id: null,
          monthlyINR: { 
            $sum: { 
              $cond: [
                { $eq: ["$currency", "INR"] }, 
                "$amount",
                { $multiply: ["$amount", EXCHANGE_RATE] }
              ]
            }
          }
        }}
      ]),
      
      // Monthly topup
      TopupPayment.aggregate([
        { 
          $match: { 
            status: 'success',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $group: {
          _id: null,
          monthlyINR: { 
            $sum: { 
              $cond: [
                { $eq: ["$currency", "INR"] }, 
                "$amount",
                { $multiply: ["$amount", EXCHANGE_RATE] }
              ]
            }
          }
        }}
      ]),
      
      // Revenue by plan
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: {
          _id: '$planName',
          revenueINR: { 
            $sum: { 
              $cond: [
                { $eq: ["$currency", "INR"] }, 
                "$amount",
                { $multiply: ["$amount", EXCHANGE_RATE] }
              ]
            }
          },
          count: { $sum: 1 }
        }},
        { $sort: { revenueINR: -1 } }
      ]),
      
      // Credits stats
      TopupPayment.aggregate([
        { $match: { status: 'success' } },
        { $group: {
          _id: null,
          totalCredits: { $sum: '$creditsAllocated.total' },
          avgCredits: { $avg: '$creditsAllocated.total' }
        }}
      ])
    ]);

    // Calculate totals
    const subscriptionTotal = subscriptionStats[0] || { totalINR: 0, count: 0 };
    const topupTotal = topupStats[0] || { totalINR: 0, count: 0 };
    const subscriptionMonth = subscriptionMonthly[0] || { monthlyINR: 0 };
    const topupMonth = topupMonthly[0] || { monthlyINR: 0 };
    const credits = creditsStats[0] || { totalCredits: 0, avgCredits: 0 };

    // Convert to USD
    const totalRevenueUSD = (subscriptionTotal.totalINR + topupTotal.totalINR) / EXCHANGE_RATE;
    const monthlyRevenueUSD = (subscriptionMonth.monthlyINR + topupMonth.monthlyINR) / EXCHANGE_RATE;
    
    // Get transaction counts
    const [totalSubs, successSubs, totalTopups, successTopups] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'success' }),
      TopupPayment.countDocuments(),
      TopupPayment.countDocuments({ status: 'success' })
    ]);

    // Calculate success rates
    const subscriptionSuccessRate = totalSubs > 0 ? (successSubs / totalSubs) * 100 : 0;
    const topupSuccessRate = totalTopups > 0 ? (successTopups / totalTopups) * 100 : 0;
    const overallSuccessRate = (totalSubs + totalTopups) > 0 ? 
      ((successSubs + successTopups) / (totalSubs + totalTopups)) * 100 : 0;

    res.json({
      success: true,
      stats: {
        // Combined Stats
        totalRevenue: totalRevenueUSD,
        totalRevenueINR: subscriptionTotal.totalINR + topupTotal.totalINR,
        monthlyRevenue: monthlyRevenueUSD,
        monthlyRevenueINR: subscriptionMonth.monthlyINR + topupMonth.monthlyINR,
        totalTransactions: totalSubs + totalTopups,
        successfulTransactions: successSubs + successTopups,
        successRate: Math.round(overallSuccessRate * 100) / 100,
        
        // Subscription Stats
        subscriptionRevenue: subscriptionTotal.totalINR / EXCHANGE_RATE,
        subscriptionRevenueINR: subscriptionTotal.totalINR,
        monthlySubscriptionRevenue: subscriptionMonth.monthlyINR / EXCHANGE_RATE,
        monthlySubscriptionRevenueINR: subscriptionMonth.monthlyINR,
        totalSubscriptionTransactions: totalSubs,
        successfulSubscriptionTransactions: successSubs,
        subscriptionSuccessRate: Math.round(subscriptionSuccessRate * 100) / 100,
        subscriptionRevenueByPlan: revenueByPlan.map(plan => ({
          _id: plan._id,
          revenue: plan.revenueINR / EXCHANGE_RATE,
          revenueINR: plan.revenueINR,
          count: plan.count
        })),
        
        // Topup Stats
        topupRevenue: topupTotal.totalINR / EXCHANGE_RATE,
        topupRevenueINR: topupTotal.totalINR,
        monthlyTopupRevenue: topupMonth.monthlyINR / EXCHANGE_RATE,
        monthlyTopupRevenueINR: topupMonth.monthlyINR,
        totalTopupTransactions: totalTopups,
        successfulTopupTransactions: successTopups,
        topupSuccessRate: Math.round(topupSuccessRate * 100) / 100,
        totalCreditsSold: credits.totalCredits,
        avgCreditsPerPurchase: Math.round(credits.avgCredits || 0)
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

// Get specific payment details (Supports both subscription and topup)
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find as subscription payment first
    let payment = await Payment.findById(id)
      .populate('userId', 'name email createdAt')
      .populate('planId', 'name planId price billingCycle');

    let paymentType = 'subscription';

    // If not found as subscription, try as topup payment
    if (!payment) {
      payment = await TopupPayment.findById(id)
        .populate({
          path: 'topupPackageId',
          select: 'name description totalCredits price'
        })
        .populate({
          path: 'userId',
          select: 'name email phone planName topupCredits createdAt'
        })
        .lean();
      
      paymentType = 'topup';
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    // Add missing fields
    const formattedPayment = {
      ...payment.toObject ? payment.toObject() : payment,
      paymentType,
      currency: payment.currency || 'INR',
      billingCycle: paymentType === 'subscription' 
        ? (payment.billingCycle || payment.planId?.billingCycle || 'monthly')
        : 'one-time'
    };

    res.json({
      success: true,
      payment: formattedPayment,
      paymentType
    });

  } catch (error) {
    console.error("Admin get payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details"
    });
  }
};

// Update payment status (for manual adjustments) - Supports both types
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autoRenewal, renewalStatus, refundReason } = req.body;
    
    // Try to find and update as subscription payment
    let payment = await Payment.findById(id);
    let paymentType = 'subscription';

    if (!payment) {
      // Try as topup payment
      payment = await TopupPayment.findById(id);
      paymentType = 'topup';
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    const updateData = {};
    
    if (paymentType === 'subscription') {
      if (status) updateData.status = status;
      if (autoRenewal !== undefined) updateData.autoRenewal = autoRenewal;
      if (renewalStatus) updateData.renewalStatus = renewalStatus;
    } else if (paymentType === 'topup') {
      if (status) updateData.status = status;
      if (refundReason) updateData.refundReason = refundReason;
    }

    if (paymentType === 'subscription') {
      payment = await Payment.findByIdAndUpdate(id, updateData, { new: true })
        .populate('userId', 'name email');
    } else {
      payment = await TopupPayment.findByIdAndUpdate(id, updateData, { new: true })
        .populate('userId', 'name email')
        .populate('topupPackageId', 'name');
    }

    res.json({
      success: true,
      message: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment updated successfully`,
      payment,
      paymentType
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