# ResilientRider

**AI-Powered Income Protection for Gig Delivery Workers**

ResilientRider is an AI-enabled parametric insurance platform that protects food delivery partners from income loss caused by environmental disruptions such as heavy rain, extreme heat, floods, and severe pollution. The system follows a **Prevention-First → Protection → Recovery** architecture, transforming passive insurance into an active income stabilization ecosystem.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Core Innovation Layers](#core-innovation-layers)
4. [Key Features](#key-features)
5. [Person](#person)
6. [Person Scenario](#person-scenario)
7. [System Workflow](#system-workflow)
8. [Weekly Premium Model](#weekly-premium-model)
9. [Payment Failure, Grace Period & Risk-Based Interest](#payment-failure-grace-period--risk-based-interest)
10. [Parametric Triggers](#parametric-triggers)
11. [AI Integration](#ai-integration)
12. [Fraud Detection & Adversarial Defense](#fraud-detection--adversarial-defense)
13. [Technology Stack](#technology-stack)
14. [Architecture](#architecture)
15. [Business Model](#business-model)
16. [Benefits & Impact](#benefits--impact)
17. [Development Plan](#development-plan)
18. [Future Enhancements](#future-enhancements)
19. [Project Status](#project-status)
20. [Contributors](#contributors)
21. [License](#license)

---

## Problem Statement

Food delivery workers on platforms like Swiggy, Zomato, and Uber Eats face sudden income loss due to conditions entirely outside their control.

**Research indicates:**
- Average hourly income ≈ ₹102/hour
- Workers typically work 9–11 hours per day
- Monthly earnings range ₹20,000 – ₹30,000 depending on city

> Sources: Times of India, NDTV, MoneyControl, LinkedIn industry insights

**Workers remain financially vulnerable because:**
- Income depends entirely on completed deliveries
- Bad weather reduces order volume
- Road conditions become unsafe during disruptions
- Workers still bear fixed costs — fuel, data, maintenance

**Example impact:**

| Scenario | Deliveries | Income |
|---|---|---|
| Normal working day | 15 | ₹1,000 |
| Rain disruption day | 6 | ₹400 |
| **Income loss** | | **₹600** |

Traditional insurance models focus on health or accident coverage — not income protection. No dedicated product currently exists for short-term gig income disruption.

---

## Solution Overview

ResilientRider protects delivery workers from sudden income drops by combining:

- **Smart demand prediction** — AI forecasts disruption zones before they occur
- **Rider redeployment suggestions** — Workers are guided to high-demand areas
- **Parametric micro-insurance payouts** — Automatic, claim-free financial relief
- **Community-based financial support** — Micro-loans for prolonged disruptions

Unlike traditional insurance that reacts after a loss, ResilientRider acts before, during, and after a disruption — creating a self-balancing ecosystem where losses are minimized and value is maximized for all stakeholders.

---

## Core Innovation Layers

### 1. Prevention Layer — Proactive Intelligence

The system continuously analyzes real-time signals (weather, order demand, rider distribution) to predict income disruptions before they occur. AI models identify high-risk zones, low-demand pockets, and temporal demand shifts — enabling preemptive action rather than reactive payouts.

### 2. Optimization Layer — Smart Redeployment

When a potential demand drop is detected, the system dynamically suggests high-demand relocation zones using demand-supply balancing algorithms, location-based optimization, and real-time earning potential estimation. This reduces idle time and increases earning opportunities.

### 3. Protection Layer — Parametric Insurance

When prevention is insufficient, the system activates automated micro-insurance payouts — no paperwork, no manual verification, no delays. Payouts are trigger-based, ensuring immediate and transparent financial relief.

### 4. Recovery Layer — Community Finance

For prolonged disruptions, riders can access community-backed micro-loans with flexible repayment from future earnings. This prevents workers from falling into high-interest debt traps and ensures long-term financial resilience.

---

## Key Features

### AI Demand Prediction
Analyzes weather conditions, historical order demand, rider availability, traffic patterns, and location-based trends to predict zones where earnings may drop.

### Smart Rider Redeployment
When a demand drop is predicted, riders receive real-time location suggestions.

> **Example notification:** *"Heavy rain expected in your zone. Move 2 km to a high-demand area and earn an extra ₹40 bonus."*

### Parametric Micro-Insurance
If earnings fall below a predefined threshold due to verified external conditions, a micro-payout is automatically triggered — no claim required.

> **Example:** A rider earning ₹600/day normally earns only ₹200 during rain. The system automatically provides a ₹200–₹300 support payout.

### Community Support Pool
Riders can access small community-backed micro-loans for longer disruptions, repaid gradually from future earnings.

---

## Person

**Target Person: Food Delivery Partner**

| Attribute | Details |
|---|---|
| Name | Ravi |
| Age | 27 |
| Platform | Swiggy |
| Work hours | 9–10 hours/day, 6 days/week |
| Daily deliveries | ~15 |
| Hourly income | ≈ ₹100/hour |
| Daily income | ₹900 – ₹1,200 |
| Monthly income | ₹22,000 – ₹28,000 |

**Daily Expenses:**
- Fuel → ₹150 – ₹300
- Mobile data → ₹10 – ₹20
- Bike maintenance → ₹30 – ₹50

Net daily income after expenses can drop to **₹600 – ₹900/day**, making delivery workers highly vulnerable to income shocks.

---

## Person Scenario

**Worker:** Ramesh | **Platform:** Swiggy / Zomato | **City:** Hyderabad

**Normal Day vs Rain Disruption:**

| | Normal Day | Rain Disruption Day |
|---|---|---|
| Hours worked | 10 | 10 |
| Deliveries | 15 | 5 |
| Income | ₹800 | ₹250 |

**Income loss = ₹550**

**Daily expenses:** Fuel ₹200 + Mobile data ₹20 + Food ₹100 = **₹320 total**

On a rain day, Ramesh earns ₹250 but spends ₹320 — **he loses money instead of earning.**

**With ResilientRider:**

| | Amount |
|---|---|
| Weekly premium paid | ₹50 |
| Delivery income (rain day) | ₹250 |
| Insurance payout (auto-triggered) | ₹500 |
| **Final income** | **₹750** |

---

## System Workflow

```
Rider registers on platform
        ↓
Rider enters delivery location and platform
        ↓
System collects real-time environmental data (weather, traffic, demand)
        ↓
AI model predicts disruption risk score
        ↓
Rider selects weekly insurance plan and pays premium
        ↓
System continuously monitors parametric triggers
        ↓
Trigger detected (rain / heat / pollution / platform outage)
        ↓
Claim automatically initiated
        ↓
Fraud detection verification
        ↓
Instant payout processed
        ↓
If disruption persists → Community micro-loan access enabled
```

---

## Weekly Premium Model

**Typical worker earnings:**
- Hourly income ≈ ₹100 × 10 hours = ₹1,000/day
- Weekly income = ₹1,000 × 6 days = **₹6,000/week**
- Weather disruptions can reduce earnings by **₹600 – ₹1,200/week**

### Insurance Plans

| Plan | Weekly Premium | Max Weekly Payout |
|---|---|---|
| Basic | ₹20 | ₹300 |
| Standard | ₹35 | ₹600 |
| Premium | ₹50 | ₹1,000 |

> Premium ≈ 5–10% of coverage value, consistent with standard micro-insurance logic.

### Dynamic Premium Calculation

Premiums are dynamically adjusted based on the worker's delivery zone risk level.

**Formula:** `Final Premium = Base Premium × Risk Multiplier`

| Risk Level | Multiplier | Example (₹50 base) |
|---|---|---|
| 🟢 Low Risk | 0.9 | ₹45 |
| 🟡 Medium Risk | 1.0 | ₹50 |
| 🔴 High Risk | 1.2 | ₹60 |

> Premiums are capped to ensure affordability in high-risk scenarios.

### 6-Week Minimum Waiting Period

Workers must pay premiums for **6 consecutive weeks** before becoming eligible for claims. Coverage activates from **Week 7 onwards**, preventing users from joining only when disruptions are predicted.

### Automatic Premium Deduction

Workers register their bank account or UPI ID during onboarding. The system auto-debits the weekly premium to ensure uninterrupted coverage.

---

## Payment Failure, Grace Period & Risk-Based Interest

If automatic premium deduction fails due to insufficient balance, the following process is initiated:

### Grace Period (First 2 Days)

- Worker is notified to add balance
- Policy remains temporarily active
- Any disruption during this period → Claim marked as **Pending**

### Post Grace Period (After 2 Days)

- Policy is **not** cancelled
- A risk-based daily interest penalty is applied
- The system continuously monitors the user's account balance for auto-deduction

### Risk-Based Interest Model

**Formula:** `Interest = Premium × Risk Rate × Delay Days`

**Final Payable:** `Total Amount = Premium + (Premium × Risk Rate × Delay Days)`

| Variable | Description |
|---|---|
| Premium (P) | Weekly premium amount |
| Risk Rate (R) | Determined by user's risk level |
| Delay Days (D) | Number of days elapsed after grace period |

**Interest Rates by Risk Level:**

| Risk Level | Daily Interest Rate |
|---|---|
| 🟢 Low Risk | 1% (0.01) |
| 🟡 Medium Risk | 2% (0.02) |
| 🔴 High Risk | 3% (0.03) |

Risk level is determined using historical claim behavior, fraud risk score, payment reliability, and activity patterns.

### Interest Calculation Examples

**Weekly Premium = ₹50, Delay = 3 days**

| Risk Level | Calculation | Interest | Total Payable |
|---|---|---|---|
| 🟢 Low Risk (1%) | 50 × 0.01 × 3 | ₹1.5 | ₹51.5 |
| 🟡 Medium Risk (2%) | 50 × 0.02 × 3 | ₹3 | ₹53 |
| 🔴 High Risk (3%) | 50 × 0.03 × 3 | ₹4.5 | ₹54.5 |

### Auto-Deduction & Claim Resolution

Once sufficient balance is available, the system automatically deducts the pending premium plus accumulated interest — no manual action required. Pending claims are then validated and processed, and the policy becomes fully active.

---

## Parametric Triggers

Payouts are triggered automatically when verified external conditions are met — no manual claim submission required.

| Trigger | Condition | Reason |
|---|---|---|
| Heavy Rain | Rainfall > 70 mm in 24 hours | Waterlogging reduces delivery activity |
| Extreme Heat | Temperature > 42°C | Heatwaves reduce delivery operations |
| Severe Pollution | AQI > 350 | Outdoor activity becomes dangerous |
| Flood | Government flood alert or rainfall > 120 mm | Roads become impassable |
| Demand Drop | Zone demand falls below historical average | Reduced earning opportunity |
| Platform Outage | Platform downtime detected | Deliveries become impossible |

**Data Sources:**
- India Meteorological Department (IMD)
- CPCB Pollution API
- OpenWeather Air Pollution API

---

## AI Integration

### Risk Prediction

ML models predict disruption probability per delivery zone using rainfall, temperature, AQI, historical disruption patterns, and delivery activity data.

**Risk Level Classification:**

| Risk Score | Risk Level |
|---|---|
| 0.0 – 0.3 | 🟢 Low Risk |
| 0.3 – 0.6 | 🟡 Medium Risk |
| 0.6 – 1.0 | 🔴 High Risk |

**Examples:**
- Anna Nagar → 0.25 → Low Risk
- Velachery → 0.52 → Medium Risk
- Flood-prone zone → 0.78 → High Risk

**Model used:** Random Forest

### Premium Calculation

ML models dynamically adjust premiums based on historical claim data, rider activity, and location risk levels.

### Demand Forecasting

Time-series models predict future order demand across delivery zones, enabling proactive rider redeployment before income loss occurs.

### AI-Based Plan Recommendation System

A hybrid AI architecture combining Machine Learning and LLaMA3 provides personalized insurance plan recommendations based on each worker's real-world conditions.

**How It Works:**

1. **User Input** — Worker provides weekly salary and current location
2. **Weather Integration** — Real-time weather data fetched via OpenWeather API contributes to risk evaluation
3. **Risk Prediction (ML)** — A trained Random Forest model predicts a risk score (0–1) → Low / Medium / High
4. **AI Recommendation (LLaMA3)** — Risk score, salary, and weather conditions are passed to LLaMA3, which recommends the most suitable plan with a plain-language explanation

**Recommendation Logic (Hybrid Approach):**

| Step | Component | Role |
|---|---|---|
| 1 | ML Model | Predicts risk score |
| 2 | Rule-Based Constraints | Ensures affordability — avoids expensive plans for low-salary users |
| 3 | LLaMA3 | Final recommendation with human-readable explanation |

> LLaMA3 does not perform risk prediction. It enhances interpretability and user experience.

---

## Fraud Detection & Adversarial Defense

The platform uses an AI-powered, multi-layer fraud detection engine combining location intelligence, behavioral analytics, device fingerprinting, and graph-based network analysis. No single signal determines fraud — multiple independent layers combine to reach a final decision.

### Fraud Detection Overview

| Fraud Type | Description | Detection Logic | Example |
|---|---|---|---|
| GPS Spoofing | Fake location injection via spoofing apps | GPS vs motion sensors vs IP location cross-check | Location jumps 2 km → 30 km instantly |
| Duplicate Claims | Same disruption claimed multiple times | Claim pattern matching + timestamp validation | Same incident claimed repeatedly |
| Abnormal Patterns | Unusual claim frequency or activity | Behavioral baseline deviation detection | 15 claims/month vs normal 2/month |
| Bot Behavior | Scripted or automated activity | Continuous 24/7 activity, repetitive routes | No human-like variation in activity |
| Coordinated Fraud | Organized multi-account exploitation | Graph-based relationship analysis | Synchronized claims from same device cluster |

### Multi-Source Location Verification

Location is validated using GPS coordinates, IP-based location, and device motion sensors (accelerometer, gyroscope).

- GPS changes with no physical movement detected → flagged
- GPS ≠ IP location → flagged

### Behavioral Analysis Engine

Each user has a dynamic behavioral profile tracking speed patterns, delivery frequency, active working hours, and route consistency. The engine detects unrealistic travel speeds, 24/7 continuous activity, and repetitive identical routes.

### Device Fingerprinting

Devices are uniquely identified using Device ID, OS version, app version, and hardware-level signals. Multiple accounts on the same device or frequent device switching are flagged immediately.

### Fraud Ring Detection (Graph-Based Intelligence)

The system builds a relationship graph between users based on shared IP addresses, shared devices, and synchronized activity patterns — detecting clusters of coordinated users and organized fraud rings.

### Real-Time Risk Scoring Engine

**Formula:** `Risk Score = Location Risk + Behavior Risk + Device Risk + Network Risk`

**Risk Weights:**

| Factor | Score |
|---|---|
| Location mismatch | +30 |
| Abnormal behavior | +20 |
| Device reuse | +40 |
| Fraud cluster match | +50 |

**Decision Engine:**

| Score Range | Action |
|---|---|
| 0 – 30 | ✅ Allow |
| 30 – 70 | ⚠️ Monitor |
| 70+ | 🚫 Block |

### Algorithms Used

| Algorithm | Purpose |
|---|---|
| Isolation Forest | Anomaly detection in GPS movement, claim frequency, behavioral deviations |
| DBSCAN / K-Means Clustering | Identifying fraud rings and coordinated attack patterns |
| Rule-Based Validation | Instant detection of impossible speeds, location mismatches, duplicate claims |
| Behavioral Profiling | Detecting subtle deviations from historical activity patterns |

### Adversarial Defense — Genuine vs Spoofing Differentiation

| Signal | Genuine Rider | Spoofing Attacker |
|---|---|---|
| App usage | Continuous during working hours | Irregular or absent |
| Delivery activity | Active order acceptance | No actual delivery activity |
| Income pattern | Gradual drop | Sudden or fabricated |
| Location | Consistent with weather and traffic | Sudden jumps, inconsistent |
| Movement | Natural speed and route variation | Unnatural or repetitive patterns |

### Fairness & False Positive Protection

The system uses a graded response model to protect genuine users:

| Anomaly Level | Response |
|---|---|
| First anomaly | Warning issued |
| Repeated anomalies | Temporary restriction |
| High-confidence fraud | Account blocked |

Manual review is available for edge cases. Adaptive thresholds account for real-world conditions such as network loss during heavy rain, temporary GPS inaccuracies, and device or battery issues.

### Continuous Learning

AI models continuously improve using historical fraud patterns, verified genuine claims, and evolving behavioral trends — creating a self-evolving detection system that becomes more accurate over time.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js / Flutter (Mobile App) |
| Backend | Node.js, Python FastAPI |
| Machine Learning | Python, Scikit-learn, Time Series Forecasting |
| Database | PostgreSQL, Redis (real-time caching) |
| Weather Data | India Meteorological Department API, OpenWeather API |
| Pollution Data | CPCB / OpenWeather Air Pollution API |
| Maps & Traffic | Maps API, Traffic API |
| Payments | Mock UPI / Razorpay sandbox |
| Cloud | AWS / Firebase |

---

## Architecture

```
+---------------------------+
|     Delivery Worker       |
|     (Web / Mobile App)    |
+------------+--------------+
             |
             v
+---------------------------+
|   Frontend (React.js)     |
+------------+--------------+
             |
             v
+---------------------------+
|   Backend API             |
|   (FastAPI / Node.js)     |
+------------+--------------+
             |
             v
+---------------------------+
|   AI / ML Engine          |
|   Risk Prediction         |
|   Fraud Detection         |
|   Plan Recommendation     |
+------------+--------------+
             |
             v
+---------------------------+
|   Premium & Claims        |
|   Processing Engine       |
+------------+--------------+
             |
             v
+---------------------------+
|   Database & APIs         |
|   PostgreSQL + Redis      |
|   Weather / Pollution     |
+---------------------------+
```

---

## Business Model

### Rider Contribution
Riders pay a small weekly premium (example: ₹25/week). With 10,000 riders, this generates a ₹2,50,000 weekly pool managed by the insurance provider.

### Platform Contribution
Gig platforms pay a small operational fee for using the rider stability system, benefiting from higher rider retention and better delivery efficiency.

### Insurance Provider Revenue
Insurance companies earn through premium pool collection, predictable micro-payout models, and data-driven risk control. Because payouts are small and conditional, long-term profitability is maintained.

---

## Benefits & Impact





### For Delivery Riders
- Income stability during unpredictable conditions
- Higher earnings through smart redeployment
- Instant micro-payouts during income loss
- Access to community-based micro-loans for emergencies

### For Platform Owners
- Improved rider retention and reduced churn
- Better order fulfillment through dynamic rider allocation
- Operational efficiency using AI-driven insights
- Worker-friendly brand image

### For Insurance Providers
- Steady revenue through scalable premium pools
- Controlled risk via small, conditional payouts
- Fraud reduction using AI-based detection
- Expansion into the gig economy insurance market

### For the Ecosystem
- Strengthened financial inclusion for gig workers
- A stable and resilient gig economy
- Improved overall delivery service reliability

### Registration Process
- Seamless onboarding using mobile number, UPI, and delivery platform integration
- Quick KYC verification ensures fast activation with minimal friction

### Insurance Policy Management
- Users can easily view, upgrade, or modify their insurance plans anytime
- Transparent dashboard showing policy status, coverage, and payment history

### Dynamic Premium Calculation
- AI-driven pricing adjusts premiums based on real-time risk levels and user behavior
- Ensures affordability while maintaining fair risk distribution across users

### Claims Management
- Fully automated claim processing with zero paperwork
- Real-time claim tracking and instant payout notifications for transparency

---

## Development Plan

| Phase | Focus | Key Tasks |
|---|---|---|
| Phase 1 | Ideation | Persona definition, system architecture, README, prototype planning |
| Phase 2 | Core Platform | User registration, policy management, premium calculation, claims system |
| Phase 3 | Advanced Features | AI fraud detection, payout simulation, analytics dashboards, deployment |

---

## Future Enhancements

- Direct integration with gig delivery platforms (Swiggy, Zomato, Uber Eats)
- Advanced ML demand prediction models
- Blockchain-based transparent insurance pools
- Multi-platform gig worker protection
- Dynamic real-time premium pricing
- Dedicated mobile application for workers

---

## Project Status

Currently under active development as part of a hackathon project.

**Phase 1 focus:**
- Idea development and validation
- System workflow design
- AI model planning
- Prototype preparation

**Phase 2 focus:**
- Registration process implementation
- Insurance policy management system
- Dynamic premium calculation engine
- Claims management system

---

## Contributors

| Name |
|---|
| Sanjushree J |
| Kamalika P |
| Kaviya A K |
| Shakthi Logitha H |

---

## License

This project is created for academic and research purposes.

https://github.com/user-attachments/assets/02ec7d0e-7dbf-41d0-9778-1da261d88563
