const User            = require('../../models/User');
const InsurancePolicy = require('./InsurancePolicy');
const { recommendPolicy } = require('./policyRecommender');

// ── Helpers ───────────────────────────────────────────────────────────────────

function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function logPolicy(label, policy) {
  console.log(`\n📋 [PolicyEngine] ${label}`);
  console.log('─────────────────────────────────────────────────────');
  console.log(`  Policy ID   : ${policy._id}`);
  console.log(`  User ID     : ${policy.userId}`);
  console.log(`  Type        : ${policy.policyType}`);
  console.log(`  Coverage    : ₹${policy.coverageAmount}`);
  console.log(`  Premium     : ₹${policy.premiumAmount}/month`);
  console.log(`  Risk Level  : ${policy.riskLevel}`);
  console.log(`  Status      : ${policy.status}`);
  console.log(`  Valid Until : ${policy.endDate?.toDateString()}`);
  console.log('─────────────────────────────────────────────────────\n');
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc  Create a new insurance policy for a user
 * @route POST /api/policy/create
 * @access Private
 */
const createPolicy = async (req, res) => {
  try {
    // Support both authenticated (req.user) and explicit userId in body
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // 1. Fetch user to get their riskScore
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Use stored riskScore (from registration intelligence) or default to 50
    const riskScore = user.riskScore ?? 50;

    // 3. Get policy recommendation
    const recommendation = recommendPolicy(riskScore);

    // 4. Create and save policy
    const policy = await InsurancePolicy.create({
      userId,
      policyType:      recommendation.policyType,
      coverageAmount:  recommendation.coverageAmount,
      premiumAmount:   recommendation.premiumAmount,
      startDate:       new Date(),
      endDate:         oneYearFromNow(),
      status:          'Active',
      riskLevel:       recommendation.riskLevel,
      recommendedPlan: user.recommendedPlan || recommendation.policyType,
    });

    // 5. Log
    logPolicy('Policy created successfully', policy);

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy,
    });
  } catch (error) {
    console.error('[PolicyEngine] createPolicy error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Get all policies for a user
 * @route GET /api/policy/user/:userId
 * @access Private
 */
const getUserPolicies = async (req, res) => {
  try {
    const { userId } = req.params;

    const policies = await InsurancePolicy.find({ userId }).sort({ createdAt: -1 });

    console.log(`\n📋 [PolicyEngine] Policy retrieved successfully`);
    console.log(`   User ID : ${userId} | Count : ${policies.length}\n`);

    res.status(200).json({
      success: true,
      message: 'Policy retrieved successfully',
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    console.error('[PolicyEngine] getUserPolicies error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Update a policy's status or fields
 * @route PUT /api/policy/update/:policyId
 * @access Private
 */
const updatePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;

    // Only allow safe fields to be updated — never overwrite userId or risk data
    const ALLOWED_UPDATES = ['status', 'endDate', 'premiumAmount', 'coverageAmount'];
    const updates = {};
    ALLOWED_UPDATES.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const policy = await InsurancePolicy.findByIdAndUpdate(
      policyId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    console.log(`\n📋 [PolicyEngine] Policy updated successfully`);
    console.log(`   Policy ID : ${policyId} | Updates : ${JSON.stringify(updates)}\n`);

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: policy,
    });
  } catch (error) {
    console.error('[PolicyEngine] updatePolicy error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPolicy, getUserPolicies, updatePolicy };
