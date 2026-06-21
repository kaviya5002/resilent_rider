import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './ClaimsCenter.css';

const CLAIM_TYPES  = ['accident', 'medical', 'vehicle_damage', 'theft', 'emergency'];
const STATUS_COLOR = { submitted:'#3B82F6', under_review:'#F59E0B', approved:'#10B981', rejected:'#EF4444', paid:'#10B981', fraud_suspected:'#8B5CF6' };
const RISK_COLOR   = { LOW:'#10B981', MEDIUM:'#F59E0B', HIGH:'#EF4444' };
const STAGES       = [
  { key:'submitted',    label:'Submitted',    icon:'📋' },
  { key:'under_review', label:'Under Review', icon:'🔍' },
  { key:'approved',     label:'Approved',     icon:'✅' },
  { key:'paid',         label:'Paid',         icon:'💰' },
];
const POLICIES = [
  { id:'POL-STD-001', type:'Standard Plan', coverage:25000, premium:25 },
  { id:'POL-PRM-001', type:'Premium Plan',  coverage:50000, premium:40 },
];
const SEED = [
  { id:'CLM001', policyId:'POL-STD-001', policyType:'Standard Plan', coverageAmount:25000, claimType:'accident',       claimAmount:12000, incidentDate:'2025-05-20', description:'Two-wheeler accident near Silk Board junction. Sustained injuries and vehicle damage.', documents:['medical_bill.pdf','police_report.pdf'], isEmergency:false, priority:'Normal', status:'approved',      riskScore:22, riskLevel:'LOW',    submittedAt:'2025-05-21T10:00:00Z', adminComment:'Documents verified. Claim approved.' },
  { id:'CLM002', policyId:'POL-STD-001', policyType:'Standard Plan', coverageAmount:25000, claimType:'vehicle_damage', claimAmount:8500,  incidentDate:'2025-06-01', description:'Vehicle damage due to pothole on OMR road. Front wheel and suspension damaged.',     documents:['repair_estimate.pdf'],                   isEmergency:false, priority:'Normal', status:'under_review',  riskScore:55, riskLevel:'MEDIUM', submittedAt:'2025-06-01T14:00:00Z', adminComment:'' },
  { id:'CLM003', policyId:'POL-PRM-001', policyType:'Premium Plan',  coverageAmount:50000, claimType:'medical',       claimAmount:18000, incidentDate:'2025-05-28', description:'Hospitalized after road accident. Fracture in left arm. 3 days admission.',          documents:['hospital_bill.pdf','discharge.pdf'],     isEmergency:true,  priority:'High',   status:'submitted',     riskScore:35, riskLevel:'MEDIUM', submittedAt:'2025-05-29T09:00:00Z', adminComment:'' },
];

function loadClaims() {
  try {
    const all = JSON.parse(localStorage.getItem('appClaims') || '[]');
    if (all.length === 0) { localStorage.setItem('appClaims', JSON.stringify(SEED)); return SEED; }
    return all;
  } catch { return SEED; }
}

function saveClaim(claim) {
  try {
    const all = JSON.parse(localStorage.getItem('appClaims') || '[]');
    localStorage.setItem('appClaims', JSON.stringify([claim, ...all]));
  } catch {}
}

function calcRisk(amount, coverage, docCount, incidentDate, existingCount) {
  let s = 0;
  const r = amount / (coverage || 25000);
  if (r > 0.8) s += 30; else if (r > 0.5) s += 20; else if (r > 0.3) s += 10;
  if (existingCount >= 3) s += 30; else if (existingCount >= 2) s += 20; else if (existingCount >= 1) s += 10;
  if (docCount === 0) s += 20; else if (docCount === 1) s += 10;
  const days = Math.floor((Date.now() - new Date(incidentDate)) / 86400000);
  if (days === 0) s += 15; else if (days > 30) s += 10;
  s = Math.min(100, Math.max(0, s));
  return { riskScore: s, riskLevel: s >= 70 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW' };
}

function StepBar({ step }) {
  return (
    <div className="claim-steps">
      {['Policy', 'Details', 'Documents', 'Preview'].map((s, i) => (
        <div key={i} className={`claim-step ${step === i+1 ? 'active' : step > i+1 ? 'done' : ''}`}>
          <div className="step-circle">{step > i+1 ? '✓' : i+1}</div>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

function Timeline({ claim }) {
  const stages = claim.status === 'rejected'
    ? [STAGES[0], STAGES[1], { key:'rejected', label:'Rejected', icon:'❌' }]
    : STAGES;
  const order = ['submitted', 'under_review', 'approved', 'paid'];
  return (
    <div className="claim-timeline">
      <div className="tl-track">
        {stages.map(stage => {
          const idx    = order.indexOf(stage.key);
          const curIdx = order.indexOf(claim.status);
          const done   = idx !== -1 && idx <= curIdx;
          const active = stage.key === claim.status;
          const bg     = active ? (STATUS_COLOR[stage.key] || '#3B82F6') : done ? '#10B981' : '#D9CBC2';
          return (
            <div key={stage.key} className={`tl-stage${done ? ' tl-done' : ''}${active ? ' tl-active' : ''}`}>
              <div className="tl-dot" style={{ background: bg }}>{done && !active ? '✓' : stage.icon}</div>
              <span className="tl-label">{stage.label}</span>
            </div>
          );
        })}
      </div>
      {claim.adminComment ? (
        <div className="admin-note-box">
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#3C5070' }}>💬 Admin Comment</span>
          <p style={{ fontSize:'0.82rem', color:'#112250', marginTop:'0.2rem' }}>{claim.adminComment}</p>
        </div>
      ) : null}
    </div>
  );
}

function Wizard({ onDone, onClose, count }) {
  const [step, setStep]   = useState(1);
  const [pol,  setPol]    = useState(null);
  const [form, setForm]   = useState({ claimType:'accident', claimAmount:'', incidentDate:'', description:'', isEmergency:false });
  const [docs, setDocs]   = useState([]);
  const [errs, setErrs]   = useState({});
  const [busy, setBusy]   = useState(false);

  const validate = () => {
    const e = {};
    if (!form.claimAmount || +form.claimAmount <= 0) e.claimAmount = 'Enter a valid amount';
    else if (+form.claimAmount > pol.coverage) e.claimAmount = `Max ₹${pol.coverage.toLocaleString()}`;
    if (!form.incidentDate) e.incidentDate = 'Select incident date';
    else if (new Date(form.incidentDate) > new Date()) e.incidentDate = 'Cannot be in the future';
    if (!form.description.trim()) e.description = 'Please describe the incident';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const addFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('Max 5 MB per file'); return; }
    if (docs.find(d => d.name === f.name)) { alert('File already added'); return; }
    setDocs(p => [...p, { name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }]);
    e.target.value = '';
  };

  const submit = () => {
    setBusy(true);
    const { riskScore, riskLevel } = calcRisk(+form.claimAmount, pol.coverage, docs.length, form.incidentDate, count);
    const claim = {
      id:             'CLM' + Date.now(),
      policyId:       pol.id,
      policyType:     pol.type,
      coverageAmount: pol.coverage,
      claimType:      form.claimType,
      claimAmount:    +form.claimAmount,
      incidentDate:   form.incidentDate,
      description:    form.description,
      isEmergency:    form.isEmergency,
      priority:       form.isEmergency ? 'High' : 'Normal',
      documents:      docs.map(d => d.name),
      status:         riskLevel === 'LOW' ? 'submitted' : 'under_review',
      riskScore, riskLevel,
      submittedAt:    new Date().toISOString(),
      adminComment:   '',
    };
    // Try backend, always save locally
    api.post('/claims/create', {
      policyId: pol.id, claimAmount: claim.claimAmount, claimType: claim.claimType,
      incidentDate: claim.incidentDate, description: claim.description,
      documents: docs.map(d => d.name), isEmergency: claim.isEmergency,
    }).catch(() => {});
    saveClaim(claim);
    setBusy(false);
    onDone(claim);
  };

  return (
    <div className="claim-wizard">
      <StepBar step={step} />
      <AnimatePresence mode="wait">

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
            <h3 className="wizard-title">Select Your Policy</h3>
            <div className="policy-cards">
              {POLICIES.map(p => (
                <div key={p.id} className={`policy-select-card${pol?.id === p.id ? ' selected' : ''}`} onClick={() => setPol(p)}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                    <strong style={{ color:'#112250' }}>{p.type}</strong>
                    <span style={{ fontSize:'0.7rem', padding:'0.15rem 0.5rem', borderRadius:'999px', fontWeight:700, background:'rgba(16,185,129,0.15)', color:'#10B981' }}>Active</span>
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'#3C5070' }}>ID: {p.id}</p>
                  <p style={{ fontSize:'1.1rem', fontWeight:700, color:'#112250', marginTop:'0.25rem' }}>₹{p.coverage.toLocaleString()} <span style={{ fontSize:'0.75rem', fontWeight:400 }}>coverage</span></p>
                  <p style={{ fontSize:'0.78rem', color:'#3C5070' }}>₹{p.premium}/week premium</p>
                </div>
              ))}
            </div>
            <div className="wizard-actions">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!pol} onClick={() => setStep(2)}>Next →</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
            <h3 className="wizard-title">Claim Details</h3>
            <div className="wizard-form">
              <div className="wf-row">
                <div className="wf-field">
                  <label>Claim Type</label>
                  <select value={form.claimType} onChange={e => setForm(p => ({ ...p, claimType: e.target.value }))}>
                    {CLAIM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="wf-field">
                  <label>Claim Amount (₹)</label>
                  <input type="number" placeholder={`Max ₹${pol?.coverage?.toLocaleString()}`}
                    value={form.claimAmount} onChange={e => setForm(p => ({ ...p, claimAmount: e.target.value }))} />
                  {errs.claimAmount && <span className="wf-err">{errs.claimAmount}</span>}
                </div>
              </div>
              <div className="wf-field">
                <label>Incident Date</label>
                <input type="date" max={new Date().toISOString().split('T')[0]}
                  value={form.incidentDate} onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))} />
                {errs.incidentDate && <span className="wf-err">{errs.incidentDate}</span>}
              </div>
              <div className="wf-field">
                <label>Description</label>
                <textarea rows={3} placeholder="Describe the incident in detail..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                {errs.description && <span className="wf-err">{errs.description}</span>}
              </div>
              <label className="emergency-check">
                <input type="checkbox" checked={form.isEmergency} onChange={e => setForm(p => ({ ...p, isEmergency: e.target.checked }))} />
                <span>🚨 Mark as Emergency Claim (Fast-Track)</span>
              </label>
            </div>
            <div className="wizard-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => { if (validate()) setStep(3); }}>Next →</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
            <h3 className="wizard-title">Upload Documents</h3>
            <input type="file" id="doc-inp" accept=".pdf,.jpg,.jpeg,.png" onChange={addFile} style={{ display:'none' }} />
            <label htmlFor="doc-inp" className="doc-upload-btn">📎 Click to Upload (PDF / JPG / PNG — max 5 MB)</label>
            <p style={{ fontSize:'0.75rem', color:'#6B7280', marginBottom:'0.75rem' }}>Medical Bills · Receipts · Reports · Photos</p>
            {docs.length > 0 && (
              <div className="doc-list">
                {docs.map((d, i) => (
                  <div key={i} className="doc-item">
                    <span>📄 {d.name}</span>
                    <span style={{ fontSize:'0.75rem', color:'#6B7280' }}>{d.size}</span>
                    <button onClick={() => setDocs(p => p.filter((_, j) => j !== i))}
                      style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:'1rem' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="wizard-actions">
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Next →</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
            <h3 className="wizard-title">Preview & Submit</h3>
            <div className="preview-card">
              {[
                ['Policy',       `${pol?.type} (${pol?.id})`],
                ['Coverage',     `₹${pol?.coverage?.toLocaleString()}`],
                ['Claim Type',   form.claimType.replace('_', ' ').toUpperCase()],
                ['Claim Amount', `₹${(+form.claimAmount || 0).toLocaleString()}`],
                ['Incident Date', form.incidentDate],
                ['Documents',    `${docs.length} file(s) attached`],
                ['Priority',     form.isEmergency ? '🚨 EMERGENCY' : 'Normal'],
              ].map(([k, v]) => (
                <div key={k} className="preview-row">
                  <span>{k}</span>
                  <strong style={{ color: k === 'Priority' && form.isEmergency ? '#EF4444' : '#112250' }}>{v}</strong>
                </div>
              ))}
              <div style={{ marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid rgba(17,34,80,0.06)' }}>
                <p style={{ fontSize:'0.82rem', color:'#3C5070' }}>{form.description}</p>
              </div>
            </div>
            <div className="wizard-actions">
              <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-primary" disabled={busy} onClick={submit}>
                {busy ? 'Submitting…' : '✅ Submit Claim'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default function ClaimsCenter() {
  const { user }  = useAuth();
  const [claims,     setClaims]     = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [flash,      setFlash]      = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.get(`/claims/user/${user?.id || 'demo'}`)
      .then(res => { if (res.data.success && res.data.data.length > 0) setClaims(res.data.data); else setClaims(loadClaims()); })
      .catch(() => setClaims(loadClaims()));
  }, []);

  const handleDone = (claim) => {
    setClaims(p => [claim, ...p]);
    setShowWizard(false);
    setFlash(claim);
    setTimeout(() => setFlash(null), 5000);
  };

  const visible = filterStatus === 'all' ? claims : claims.filter(c => c.status === filterStatus);

  return (
    <div className="claims-center">
      <div className="claims-header">
        <div>
          <h2 className="section-title" style={{ margin:0 }}>📋 My Claims</h2>
          <p style={{ fontSize:'0.82rem', color:'#3C5070', marginTop:'0.2rem' }}>Submit and track your insurance claims</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize:'0.85rem' }} onClick={() => setShowWizard(true)}>
          + New Claim
        </button>
      </div>

      {/* Filter tabs */}
      <div className="claim-filter-tabs">
        {['all', 'submitted', 'under_review', 'approved', 'rejected', 'paid'].map(s => (
          <button key={s} className="claim-filter-tab"
            onClick={() => setFilterStatus(s)}
            style={{ background: filterStatus === s ? '#112250' : 'rgba(17,34,80,0.07)', color: filterStatus === s ? '#fff' : '#3C5070' }}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid #10B981', borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#065F46' }}>
            ✅ Claim <strong>{flash.id}</strong> submitted! Risk: <strong style={{ color: RISK_COLOR[flash.riskLevel] }}>{flash.riskLevel}</strong>
            {flash.isEmergency && ' 🚨 Fast-tracked!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div className="wizard-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowWizard(false)}>
            <motion.div className="wizard-modal" initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
              onClick={e => e.stopPropagation()}>
              <Wizard onDone={handleDone} onClose={() => setShowWizard(false)} count={claims.length} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claims list */}
      {visible.length === 0 ? (
        <div style={{ textAlign:'center', padding:'2rem', opacity:0.6 }}>
          <p style={{ fontSize:'1.1rem' }}>📭 No claims found</p>
          <p style={{ fontSize:'0.875rem', marginTop:'0.5rem' }}>
            {filterStatus === 'all' ? 'Click "+ New Claim" to submit your first claim' : `No ${filterStatus.replace('_', ' ')} claims`}
          </p>
        </div>
      ) : (
        <div className="claims-list">
          {visible.map((c, i) => {
            const cid = c.id || String(c._id || '');
            const amt = c.claimAmount || c.amount || 0;
            return (
              <motion.div key={cid} className="claim-card"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}>

                <div className="claim-card-top" onClick={() => setExpanded(expanded === cid ? null : cid)}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                      <span style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'#3C5070' }}>{cid}</span>
                      {c.isEmergency && <span style={{ fontSize:'0.65rem', background:'#EF444420', color:'#EF4444', padding:'0.1rem 0.4rem', borderRadius:'999px', fontWeight:700 }}>🚨 EMERGENCY</span>}
                      {c.priority === 'High' && !c.isEmergency && <span style={{ fontSize:'0.65rem', background:'#F59E0B20', color:'#F59E0B', padding:'0.1rem 0.4rem', borderRadius:'999px', fontWeight:700 }}>HIGH PRIORITY</span>}
                    </div>
                    <p style={{ fontWeight:700, color:'#112250', fontSize:'0.95rem' }}>
                      {(c.claimType || '').replace('_', ' ').toUpperCase()} — ₹{amt.toLocaleString()}
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                      {new Date(c.submittedAt || c.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.4rem' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.25rem 0.75rem', borderRadius:'999px', background:`${STATUS_COLOR[c.status] || '#3B82F6'}20`, color: STATUS_COLOR[c.status] || '#3B82F6' }}>
                      {(c.status || 'submitted').replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color: RISK_COLOR[c.riskLevel] || '#10B981' }}>
                      🤖 {c.riskLevel || 'LOW'} ({c.riskScore || 0})
                    </span>
                    <span style={{ fontSize:'0.72rem', color:'#6B7280' }}>{expanded === cid ? '▲' : '▼'}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === cid && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}>
                      <div style={{ padding:'1rem 0 0', borderTop:'1px solid rgba(17,34,80,0.07)', marginTop:'0.75rem' }}>

                        {/* Details */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem', background:'rgba(17,34,80,0.03)', borderRadius:'8px', padding:'0.75rem' }}>
                          {[['Policy', c.policyType || '—'], ['Coverage', `₹${(c.coverageAmount || 0).toLocaleString()}`], ['Incident', c.incidentDate || '—'], ['Submitted', new Date(c.submittedAt || Date.now()).toLocaleDateString()]].map(([k, v]) => (
                            <div key={k}>
                              <p style={{ fontSize:'0.7rem', color:'#6B7280' }}>{k}</p>
                              <p style={{ fontSize:'0.82rem', fontWeight:600, color:'#112250' }}>{v}</p>
                            </div>
                          ))}
                        </div>

                        <p style={{ fontSize:'0.82rem', color:'#3C5070', marginBottom:'1rem' }}>{c.description}</p>

                        {/* AI Risk bar */}
                        <div style={{ background:`${RISK_COLOR[c.riskLevel || 'LOW']}10`, border:`1px solid ${RISK_COLOR[c.riskLevel || 'LOW']}30`, borderRadius:'8px', padding:'0.6rem 0.75rem', marginBottom:'1rem' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:'0.3rem' }}>
                            <span style={{ fontWeight:700, color: RISK_COLOR[c.riskLevel || 'LOW'] }}>🤖 AI Risk Score</span>
                            <span style={{ fontWeight:700, color: RISK_COLOR[c.riskLevel || 'LOW'] }}>{c.riskScore || 0}/100</span>
                          </div>
                          <div style={{ height:'6px', background:'rgba(17,34,80,0.1)', borderRadius:'999px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${c.riskScore || 0}%`, background: RISK_COLOR[c.riskLevel || 'LOW'], borderRadius:'999px' }} />
                          </div>
                          <p style={{ fontSize:'0.72rem', color:'#3C5070', marginTop:'0.25rem' }}>
                            {c.riskLevel === 'LOW' ? 'Queued for review' : c.riskLevel === 'MEDIUM' ? 'Manual review required' : 'Investigation triggered'}
                          </p>
                        </div>

                        <Timeline claim={c} />

                        {(c.documents || []).length > 0 && (
                          <div style={{ marginTop:'0.75rem' }}>
                            <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#3C5070', textTransform:'uppercase', marginBottom:'0.4rem' }}>Documents</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                              {c.documents.map((d, j) => (
                                <span key={j} style={{ fontSize:'0.72rem', background:'rgba(17,34,80,0.06)', padding:'0.2rem 0.6rem', borderRadius:'6px', color:'#112250' }}>
                                  📄 {typeof d === 'string' ? d : d.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
