/**
 * Registration Upgrade — Validators, Risk Engine, Activity Logger
 * ----------------------------------------------------------------
 */

const RegistrationLog = require('../../models/RegistrationLog');

// ── STEP 1: Multi-level validators ───────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
// Password: min 8 chars, uppercase, lowercase, digit, special char
const PW_UPPER   = /[A-Z]/;
const PW_LOWER   = /[a-z]/;
const PW_DIGIT   = /[0-9]/;
const PW_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * validateRegistrationInput
 * Returns { valid: boolean, errors: string[] }
 */
function validateRegistrationInput({ name, email, phone, password }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Email
  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Email format is invalid');
  }

  // Phone
  if (phone) {
    if (!PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
      errors.push('Phone number must be exactly 10 numeric digits');
    }
  }

  // Password
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8)        errors.push('Password must be at least 8 characters');
    if (!PW_UPPER.test(password))   errors.push('Password must contain at least one uppercase letter');
    if (!PW_LOWER.test(password))   errors.push('Password must contain at least one lowercase letter');
    if (!PW_DIGIT.test(password))   errors.push('Password must contain at least one number');
    if (!PW_SPECIAL.test(password)) errors.push('Password must contain at least one special character');
  }

  if (errors.length > 0) {
    console.log('\n⚠️  [RegistrationUpgrade] Validation errors:');
    errors.forEach((e) => console.log(`   • ${e}`));
    console.log('');
  }

  return { valid: errors.length === 0, errors };
}

// ── STEP 2: Registration risk scoring ────────────────────────────────────────

const HIGH_RISK_VEHICLES = ['motorcycle', 'scooter'];
const NIGHT_SHIFT_KEYWORDS = ['night', 'late', 'midnight', 'overnight'];

/**
 * calculateRegistrationRisk
 * @param {{ age, vehicleType, workingHours, accidentHistory }} userData
 * @returns {{ riskScore, riskLevel, breakdown }}
 */
function calculateRegistrationRisk({ age, vehicleType, workingHours, accidentHistory }) {
  let risk = 0;
  const breakdown = {};

  // Age < 21
  if (age && Number(age) < 21) {
    risk += 20;
    breakdown.youngAge = 20;
  }

  // High-risk vehicle
  const vt = (vehicleType || '').toLowerCase();
  if (HIGH_RISK_VEHICLES.includes(vt)) {
    risk += 25;
    breakdown.highRiskVehicle = 25;
  }

  // Night shift working hours
  const wh = (workingHours || '').toLowerCase();
  const isNight = NIGHT_SHIFT_KEYWORDS.some((k) => wh.includes(k));
  if (isNight) {
    risk += 15;
    breakdown.nightShift = 15;
  }

  // Accident history
  if (accidentHistory && Number(accidentHistory) > 0) {
    risk += 30;
    breakdown.accidentHistory = 30;
  }

  const riskScore = Math.min(100, risk);
  const riskLevel = riskScore <= 40 ? 'LOW' : riskScore <= 70 ? 'MEDIUM' : 'HIGH';

  return { riskScore, riskLevel, breakdown };
}

// ── STEP 3: Activity logger ───────────────────────────────────────────────────

/**
 * logRegistrationActivity
 * Saves a RegistrationLog document and prints to console.
 */
async function logRegistrationActivity({ userId, ipAddress, deviceType, registrationStatus, riskScore, riskLevel, validationErrors = [] }) {
  try {
    await RegistrationLog.create({
      userId,
      ipAddress:          ipAddress  || 'unknown',
      deviceType:         deviceType || 'unknown',
      registrationStatus,
      riskScore,
      riskLevel,
      validationErrors,
    });

    console.log('\n📝 [RegistrationUpgrade] Activity logged');
    console.log(`   User ID : ${userId} | Status : ${registrationStatus} | Risk : ${riskLevel || 'N/A'} (${riskScore ?? 'N/A'})\n`);
  } catch (err) {
    // Non-blocking — log failure should never break signup
    console.error('[RegistrationUpgrade] Failed to write activity log:', err.message);
  }
}

module.exports = { validateRegistrationInput, calculateRegistrationRisk, logRegistrationActivity };
