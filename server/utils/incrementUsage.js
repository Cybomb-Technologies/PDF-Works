// utils/incrementUsage.js (UPDATED WITH SUBSCRIPTION-BASED RESET)
const User = require("../models/UserModel");

/**
 * incrementUsage(userId, feature, { addBytes?, count? })
 */
async function incrementUsage(userId, feature, options = {}) {
    const { addBytes = 0, count = 1 } = options;

    try {
        const now = new Date();

        // Load user
        let user = await User.findById(userId);
        if (!user) return null;

        // ---------------------------------------
        // 1. Ensure usage object exists and valid
        // ---------------------------------------
        const defaultUsage = {
            conversions: 0,
            compressions: 0,
            ocr: 0,
            signatures: 0,
            edits: 0,
            organizes: 0,
            securityOps: 0,
            operations: 0,
            storageUsedBytes: 0,
            
            // NEW: Tool-specific usage
            editTools: 0,
            organizeTools: 0,
            securityTools: 0,
            optimizeTools: 0,
            advancedTools: 0,
            
            resetDate: now
        };

        let needsFix = false;

        // If missing or corrupted usage object
        if (!user.usage || typeof user.usage !== "object") {
            user.usage = { ...defaultUsage };
            needsFix = true;
        } else {
            for (const key of Object.keys(defaultUsage)) {
                if (user.usage[key] === undefined) {
                    user.usage[key] = defaultUsage[key];
                    needsFix = true;
                }
            }
        }

        // ---------------------------------------
        // 2. SUBSCRIPTION CYCLE RESET (30 days) - UPDATED
        // ---------------------------------------
        const cycleChanged = user.shouldResetUsage();

        if (cycleChanged) {
            user.usage = { ...defaultUsage, resetDate: now };
            needsFix = true;
        }

        if (needsFix) {
            await user.save();
        }

        // After fixes
        const usage = user.usage;

        // ---------------------------------------
        // 3. INCREMENT THE CORRECT FEATURE
        // ---------------------------------------
        switch (feature) {
            case "convert":
                usage.conversions += count;
                break;

            case "compress":
                usage.compressions += count;
                break;

            case "ocr":
                usage.ocr += count;
                break;

            case "signature":
                usage.signatures += count;
                break;

            case "edit":
                usage.edits += count;
                break;

            case "organize":
                usage.organizes += count;
                break;

            case "security":
                usage.securityOps += count;
                break;

            // NEW: Tool-specific features
            case "edit-tools":
                usage.editTools += count;
                break;

            case "organize-tools":
                usage.organizeTools += count;
                break;

            case "security-tools":
                usage.securityTools += count;
                break;

            case "optimize-tools":
                usage.optimizeTools += count;
                break;

            case "advanced-tools":
                usage.advancedTools += count;
                break;

            case "upload":
                usage.operations += count;
                break;

            case "delete":
                // deletes do not increase operations
                break;

            default:
                usage.operations += count;
                break;
        }

        // ---------------------------------------
        // 4. STORAGE UPDATE (upload/delete)
        // ---------------------------------------
        if (typeof addBytes === "number" && addBytes !== 0) {
            usage.storageUsedBytes += addBytes;

            if (usage.storageUsedBytes < 0) {
                usage.storageUsedBytes = 0;
            }
        }

        await user.save();
        return user;

    } catch (error) {
        console.error("incrementUsage error:", error);
        return null;
    }
}

module.exports = { incrementUsage };