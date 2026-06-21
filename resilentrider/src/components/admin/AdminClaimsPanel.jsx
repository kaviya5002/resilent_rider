import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import './AdminClaimsPanel.css';

const STATUS_COLOR = {
  submitted:    '#3B82F6',
  under_review: '#F59E0B',
  approved:     '#10B981',
  rejected:     '#EF4444',
  paid:         '#10B981',
  fraud_suspected: '#8B5CF6',
};
const RISK_COLOR = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444' };

const SEED_CLAIMS = [
  { id:'CLM001', userName:'Arjun Kumar',    policyType:'Standard Plan', coverageAmount:25000, claimType:'accident',       claimAmount:12000, incidentDate:'2025-05-20', description:'Two-wheeler accident near Silk Board junction. Sustained injuries and vehicle damage.', documents:['medical_bill.pdf','police_report.pdf'], isEmergency:false, priority:'Normal', status:'approved',      riskScore:22, riskLevel:'LOW',    submittedAt:'2025-05-21T10:00:00Z', adminComment:'Documents verified. Approved.', activityLog:[{action:'Claim Created',by:'rider',at:'2025-05-21'},{action:'Claim Approved',by:'admin',at:'2025-05-24'}] },
  { id:'CLM002', userName:'Suresh Babu',    policyType:'Basic Plan',    coverageAmount:10000, claimType:'vehicle_damage', claimAmount:8500,  incidentDate:'2025-06-01', description:'Vehicle damage due to pothole on OMR road. Front wheel and suspension damaged.',     documents:['repair_estimate.pdf'],                   isEmergency:false, priority:'Normal', status:'under_review',  riskScore:82, riskLevel:'HIGH',   submittedAt:'2025-06-01T14:00:00Z', adminComment:'GPS mismatch detected. Under investigation.', activityLog:[{action:'Claim Created',by:'rider',at:'2025-06-01'}] },
  { id:'CLM003', userName:'Dinesh Raj',     policyType:'Standard Plan', coverageAmount:25000, claimType:'medical',       claimAmount:18000, incidentDate:'2025-05-28', description:'Hospitalized after road accident. Fracture in left arm. 3 days admission.',          documents:['hospital_bill.pdf','discharge.pdf'],     isEmergency:true,  priority:'High',   status:'submitted',     riskScore:35, riskLevel:'MEDIUM', submittedAt:'2025-05-29T09:00:00Z', adminComment:'', activityLog:[{action:'Claim Created',by:'rider',at:'2025-05-29'}] },
  { id:'CLM004', userName:'Vijay Murugan',  policyType:'Basic Plan',    coverageAmount:10000, claimType:'accident',       claimAmount:9800,  incidentDate:'2025-05-25', description:'Collision with auto-rickshaw at signal. No police report filed.',                   documents:[],                                        isEmergency:false, priority:'Normal', status:'rejected',      riskScore:91, riskLevel:'HIGH',   submittedAt:'2025-05-26T11:00:00Z', adminComment:'Rejected: No documents. GPS fraud detected.', activityLog:[{action:'Claim Created',by:'rider',at:'2025-05-26'},{action:'Claim Rejected',by:'admin',at:'2025-05-28'}] },
  { id:'CLM005', userName:'Karthik Selvam', policyType:'Standard Plan', coverageAmount:25000, claimType:'theft',          claimAmount:18000, incidentDate:'2025-06-05', description:'Delivery bag and phone stolen near Tambaram bus stand.',                             documents:['fir_copy.pdf','item_list.pdf'],           isEmergency:false, priority:'Normal', status:'under_review',  riskScore:45, riskLevel:'MEDIUM', submittedAt:'2025-06-06T08:00:00Z', adminComment:'', activityLog:[{action:'Claim Created',by:'rider',at:'2025-06-06'}] },
];

function loadClaims() {
  try {
    const stored = JSON.parse(localStorage.getItem('appClaims') || '[]');
    if (stored.length === 0) {
      localStorage.setItem('appClaims', JSON.stringify(SEED_CLAIMS));
      return SEED_CLAIMS;
    }
    return stored;
  } catch { return SEED_CLAIMS; }
}

function saveClaims(claims) {
  try { localStorage.setItem('appClaims', JSON.stringify(claims)); } catch {}
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ background:'var(--background)', borderRadius:'10px', padding:'0.875rem', display:'flex', alignItems:'center', gap:'0.75rem', borderTop:`3px solid ${color}` }}>
      <span style={{ fontSize:'1.4rem' }}>{icon}</span>
      <div>
        <p style={{ fontSize:'1.3rem', fontWeight:700, color:'#112250', lineHeight:1 }}>{value}</p>
        <p style={{ fontSize:'0.72rem', color:'#3C5070', marginTop:'0.2rem' }}>{label}</p>
      </div>
    </div>
  );
}

export default function AdminClaimsPanel() {
  const [claims,  setClaims]  = useState([]);
  const [filter,  setFilter]  = useState({ status:'all', risk:'all', priority:'all' });
  const [search,  setSearch]  = useState('');
  const [sel,     setSel]     = useState(null);
  const [comment, setComment] = useState('');
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    // Try backend first, fall back to localStorage
    api.get('/claims/admin/all')
      .then(res => { if (res.data.success && res.data.data.length > 0) setClaims(res.data.data); else setClaims(loadClaims()); })
      .catch(() => setClaims(loadClaims()));
  }, []);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const updateClaim = (id, patch, action) => {
    const updated = claims.map(c =>
      (c.id === id || String(c._id) === id)
        ? { ...c, ...patch, adminComment: comment,
            activityLog: [...(c.activityLog || []), { action, by: 'admin', at: new Date().toISOString() }] }
        : c
    );
    setClaims(updated);
    saveClaims(updated);
    setSel(prev => prev ? { ...prev, ...patch, adminComment: comment } : null);
    flash(action);

    // Also try backend
    const endpoint = patch.status === 'approved' ? 'approve' : patch.status === 'rejected' ? 'reject' : patch.status === 'under_review' ? 'request-documents' : 'payment';
    api.put(`/claims/${endpoint}/${id}`, { adminComment: comment }).catch(() => {});
  };

  const filtered = claims.filter(c => {
    if (filter.status !== 'all' && c.status !== filter.status) return false;
    if (filter.risk !== 'all' && c.riskLevel !== filter.risk) return false;
    if (filter.priority !== 'all' && c.priority !== filter.priority) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = (c.userName || c.rider?.name || '').toLowerCase();
      const cid  = (c.id || String(c._id || '')).toLowerCase();
      if (!name.includes(s) && !cid.includes(s)) return false;
    }
    return true;
  });

  const total    = claims.length;
  const approved = claims.filter(c => ['approved','paid'].includes(c.status)).length;
  const rejected = claims.filter(c => c.status === 'rejected').length;
  const highRisk = claims.filter(c => c.riskLevel === 'HIGH').length;
  const emerg    = claims.filter(c => c.isEmergency).length;
  const payout   = claims.filter(c => c.status === 'paid').reduce((s, c) => s + (c.claimAmount || c.amount || 0), 0);

  return (
    <div className="admin-claims-panel">
      <h2 className="section-title">📋 Claims Management</h2>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid #10B981', borderRadius:'8px', padding:'0.6rem 1rem', marginBottom:'1rem', fontSize:'0.82rem', color:'#065F46' }}>
            ✅ {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <SummaryCard icon="📋" label="Total"     value={total}     color="#3B82F6" />
        <SummaryCard icon="✅" label="Approved"  value={approved}  color="#10B981" />
        <SummaryCard icon="❌" label="Rejected"  value={rejected}  color="#EF4444" />
        <SummaryCard icon="🔴" label="High Risk" value={highRisk}  color="#EF4444" />
        <SummaryCard icon="🚨" label="Emergency" value={emerg}     color="#F59E0B" />
        <SummaryCard icon="💰" label="Payout"    value={`₹${payout.toLocaleString()}`} color="#10B981" />
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <input type="search" placeholder="Search name or claim ID…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:'160px', padding:'0.5rem 0.875rem', border:'1.5px solid var(--neutral)', borderRadius:'8px', fontSize:'0.875rem', fontFamily:'inherit' }} />
        {[
          { key:'status',   opts:['all','submitted','under_review','approved','rejected','paid'] },
          { key:'risk',     opts:['all','LOW','MEDIUM','HIGH'] },
          { key:'priority', opts:['all','High','Normal'] },
        ].map(({ key, opts }) => (
          <select key={key} value={filter[key]} onChange={e => setFilter(p => ({ ...p, [key]: e.target.value }))}
            style={{ padding:'0.5rem 0.875rem', border:'1.5px solid var(--neutral)', borderRadius:'8px', fontSize:'0.875rem', color:'var(--primary)', background:'var(--white)', cursor:'pointer', fontFamily:'inherit' }}>
            {opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${key}` : o.replace('_', ' ')}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
          <thead>
            <tr>
              {['Claim ID','User','Type','Amount','Status','Risk','Priority','Date','Action'].map(h => (
                <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--primary)', background:'var(--background)', borderBottom:'2px solid var(--neutral)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign:'center', padding:'1.5rem', opacity:0.6 }}>No claims found</td></tr>
            )}
            {filtered.map((c, i) => {
              const cid  = c.id || String(c._id || '');
              const name = c.userName || c.rider?.name || '—';
              const amt  = c.claimAmount || c.amount || 0;
              const date = c.submittedAt || c.createdAt;
              return (
                <motion.tr key={cid} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom:'1px solid rgba(17,34,80,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'0.75rem 1rem', fontFamily:'monospace', fontSize:'0.75rem', color:'#3C5070' }}>{cid.slice(-8).toUpperCase()}</td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{name}</td>
                  <td style={{ padding:'0.75rem 1rem', textTransform:'capitalize', fontSize:'0.82rem' }}>{(c.claimType||'').replace('_',' ')}</td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#112250' }}>₹{amt.toLocaleString()}</td>
                  <td style={{ padding:'0.75rem 1rem' }}>
                    <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, textTransform:'capitalize', background:`${STATUS_COLOR[c.status]||'#3B82F6'}20`, color:STATUS_COLOR[c.status]||'#3B82F6' }}>
                      {(c.status||'').replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ padding:'0.75rem 1rem' }}>
                    <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, background:`${RISK_COLOR[c.riskLevel]||'#10B981'}20`, color:RISK_COLOR[c.riskLevel]||'#10B981' }}>
                      {c.riskLevel||'LOW'}
                    </span>
                  </td>
                  <td style={{ padding:'0.75rem 1rem' }}>
                    {c.isEmergency
                      ? <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, background:'#EF444420', color:'#EF4444' }}>🚨 EMERGENCY</span>
                      : <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, background:'rgba(17,34,80,0.07)', color:'#3C5070' }}>{c.priority||'Normal'}</span>
                    }
                  </td>
                  <td style={{ padding:'0.75rem 1rem', fontSize:'0.75rem', color:'#6B7280' }}>{date ? new Date(date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding:'0.75rem 1rem' }}>
                    <button onClick={() => { setSel(c); setComment(c.adminComment || ''); }}
                      style={{ padding:'0.35rem 0.875rem', background:'var(--primary)', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                      Manage
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manage Modal */}
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(17,34,80,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={() => setSel(null)}>
            <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:30 }}
              style={{ background:'var(--white)', borderRadius:'1.25rem', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(17,34,80,0.2)' }}
              onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(17,34,80,0.08)', position:'sticky', top:0, background:'var(--white)', zIndex:1 }}>
                <div>
                  <h3 style={{ margin:0, color:'#112250', fontSize:'1rem' }}>Claim {(sel.id||String(sel._id||'')).slice(-8).toUpperCase()}</h3>
                  <p style={{ fontSize:'0.78rem', color:'#3C5070', margin:0 }}>{sel.userName||sel.rider?.name||'—'} · {(sel.claimType||'').replace('_',' ').toUpperCase()}</p>
                </div>
                <button onClick={() => setSel(null)} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#6B7280' }}>✕</button>
              </div>

              <div style={{ padding:'1.25rem 1.5rem' }}>
                {/* Details grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem', background:'var(--background)', borderRadius:'10px', padding:'0.875rem' }}>
                  {[
                    ['Amount',    `₹${(sel.claimAmount||sel.amount||0).toLocaleString()}`],
                    ['Coverage',  `₹${(sel.coverageAmount||0).toLocaleString()}`],
                    ['Incident',  sel.incidentDate||'—'],
                    ['Submitted', sel.submittedAt ? new Date(sel.submittedAt).toLocaleDateString() : '—'],
                    ['Risk Score',`${sel.riskScore||0}/100`],
                    ['Risk Level',sel.riskLevel||'LOW'],
                    ['Status',    (sel.status||'').replace('_',' ')],
                    ['Priority',  sel.isEmergency ? '🚨 EMERGENCY' : sel.priority||'Normal'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>{k}</p>
                      <p style={{ fontSize:'0.82rem', fontWeight:600, color: k==='Risk Level' ? RISK_COLOR[v]||'#10B981' : '#112250' }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* AI Risk bar */}
                <div style={{ background:`${RISK_COLOR[sel.riskLevel||'LOW']}10`, border:`1px solid ${RISK_COLOR[sel.riskLevel||'LOW']}30`, borderRadius:'8px', padding:'0.6rem 0.75rem', marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:'0.3rem' }}>
                    <span style={{ fontWeight:700, color:RISK_COLOR[sel.riskLevel||'LOW'] }}>🤖 AI Fraud Risk Score</span>
                    <span style={{ fontWeight:700, color:RISK_COLOR[sel.riskLevel||'LOW'] }}>{sel.riskScore||0}/100</span>
                  </div>
                  <div style={{ height:'6px', background:'rgba(17,34,80,0.1)', borderRadius:'999px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${sel.riskScore||0}%`, background:RISK_COLOR[sel.riskLevel||'LOW'], borderRadius:'999px' }} />
                  </div>
                </div>

                {/* Description */}
                <div style={{ margin:'0.75rem 0', padding:'0.75rem', background:'rgba(17,34,80,0.04)', borderRadius:'8px', fontSize:'0.82rem', color:'#3C5070' }}>
                  {sel.description || 'No description provided.'}
                </div>

                {/* Documents */}
                {(sel.documents||[]).length > 0 && (
                  <div style={{ marginBottom:'0.75rem' }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#3C5070', textTransform:'uppercase', marginBottom:'0.4rem' }}>Documents</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                      {sel.documents.map((d, i) => (
                        <span key={i} style={{ fontSize:'0.72rem', background:'rgba(17,34,80,0.06)', padding:'0.2rem 0.6rem', borderRadius:'6px' }}>
                          📄 {typeof d === 'string' ? d : d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Comment */}
                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#3C5070', display:'block', marginBottom:'0.3rem' }}>Admin Comment</label>
                  <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment for the rider…"
                    style={{ width:'100%', padding:'0.5rem 0.75rem', borderRadius:'8px', border:'1.5px solid #D9CBC2', fontSize:'0.82rem', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' }} />
                </div>

                {/* Activity Log */}
                {(sel.activityLog||[]).length > 0 && (
                  <div style={{ marginBottom:'1rem' }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#3C5070', textTransform:'uppercase', marginBottom:'0.4rem' }}>Activity Log</p>
                    {sel.activityLog.map((a, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', padding:'0.25rem 0', borderBottom:'1px solid rgba(17,34,80,0.05)' }}>
                        <span style={{ color:'#112250', fontWeight:600 }}>{a.action}</span>
                        <span style={{ color:'#6B7280' }}>{a.by} · {new Date(a.at||a.timestamp||Date.now()).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  <button className="btn btn-primary" style={{ flex:1, fontSize:'0.78rem' }}
                    onClick={() => updateClaim(sel.id||String(sel._id), { status:'approved' }, 'Claim Approved')}>
                    ✅ Approve
                  </button>
                  <button className="btn btn-outline" style={{ flex:1, fontSize:'0.78rem', borderColor:'#EF4444', color:'#EF4444' }}
                    onClick={() => updateClaim(sel.id||String(sel._id), { status:'rejected' }, 'Claim Rejected')}>
                    ❌ Reject
                  </button>
                  <button className="btn btn-outline" style={{ flex:1, fontSize:'0.78rem', borderColor:'#F59E0B', color:'#F59E0B' }}
                    onClick={() => updateClaim(sel.id||String(sel._id), { status:'under_review' }, 'Documents Requested')}>
                    📎 Request Docs
                  </button>
                  <button className="btn btn-outline" style={{ flex:1, fontSize:'0.78rem', borderColor:'#10B981', color:'#10B981' }}
                    onClick={() => updateClaim(sel.id||String(sel._id), { status:'paid' }, 'Payment Processed')}>
                    💰 Process Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
