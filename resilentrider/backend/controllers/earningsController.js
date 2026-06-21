const EarningsRecord = require('../models/EarningsRecord');

// POST /api/earnings/add
const addEarningsRecord = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, earningsAmount, keyword, notes } = req.body;

    if (!date || earningsAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Date and earningsAmount are required' });
    }

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const existing = await EarningsRecord.findOne({ userId, date: recordDate });

    if (existing) {
      existing.earningsAmount = earningsAmount;
      existing.keyword        = keyword || existing.keyword;
      existing.notes          = notes   || existing.notes;
      await existing.save();
      console.log(`[Earnings] Earnings record updated for user ${userId} on ${recordDate.toDateString()}`);
      return res.status(200).json({ success: true, message: 'Earnings record updated', data: existing });
    }

    const record = await EarningsRecord.create({ userId, date: recordDate, earningsAmount, keyword: keyword || '', notes: notes || '' });
    console.log(`[Earnings] Earnings record created for user ${userId} on ${recordDate.toDateString()}`);
    res.status(201).json({ success: true, message: 'Earnings record created', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/earnings/month/:year/:month
const getMonthlyEarnings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year, month } = req.params;

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);

    const records = await EarningsRecord.find({
      userId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });

    const total = records.reduce((s, r) => s + r.earningsAmount, 0);

    console.log(`[Earnings] Monthly earnings fetched for user ${userId} — ${month}/${year}`);
    res.status(200).json({ success: true, data: records, totalEarnings: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/earnings/date/:date
const getEarningsByDate = async (req, res) => {
  try {
    const userId     = req.user._id;
    const recordDate = new Date(req.params.date);
    recordDate.setHours(0, 0, 0, 0);

    const record = await EarningsRecord.findOne({ userId, date: recordDate });
    if (!record) return res.status(404).json({ success: false, message: 'No record found for this date' });

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/earnings/update/:date
const updateEarningsRecord = async (req, res) => {
  try {
    const userId     = req.user._id;
    const recordDate = new Date(req.params.date);
    recordDate.setHours(0, 0, 0, 0);

    const { earningsAmount, keyword, notes } = req.body;

    const record = await EarningsRecord.findOneAndUpdate(
      { userId, date: recordDate },
      { earningsAmount, keyword, notes },
      { new: true, upsert: true }
    );

    console.log(`[Earnings] Earnings record updated for user ${userId} on ${recordDate.toDateString()}`);
    res.status(200).json({ success: true, message: 'Earnings record updated', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/earnings/delete/:date
const deleteEarningsRecord = async (req, res) => {
  try {
    const userId     = req.user._id;
    const recordDate = new Date(req.params.date);
    recordDate.setHours(0, 0, 0, 0);

    await EarningsRecord.findOneAndDelete({ userId, date: recordDate });
    res.status(200).json({ success: true, message: 'Earnings record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addEarningsRecord, getMonthlyEarnings, getEarningsByDate, updateEarningsRecord, deleteEarningsRecord };
