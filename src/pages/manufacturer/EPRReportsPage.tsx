import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2, Download, AlertTriangle, CheckCircle2,
  ExternalLink, FileText, Mail,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeviceRow {
  id: string
  created_at: string
  status: string
  serial_number: string | null
  material_gold_g: number
  material_copper_g: number
  material_aluminum_g: number
  material_lithium_g: number
  material_cobalt_g: number
  material_lead_g: number
  co2_kg_avoided: number
}

interface DisposalRow {
  id: string
  device_id: string
  created_at: string
  final_mass_kg: number | null
  eco_credits_awarded: number | null
  tx_hash: string | null
  status: string
  hazard_class: string | null
  disposal_type: string | null
}

interface FlagRow {
  id: string
  created_at: string
  flag_type: string
  description: string | null
  status: string
  severity: string | null
}

interface ScoreCriterion {
  label: string
  weight: number
  value: number
  target: number
  note: string
  included: boolean
}

type ReportStatus = 'ready' | 'pending'

interface Report {
  title: string
  form: string
  note: string
  status: ReportStatus
  fileType: string
  fileSize: string
  onDownload: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FY_START = new Date('2025-07-01T00:00:00Z')
const EPR_GOAL = 45

const QUARTERS = [
  { q: 'Q1', period: 'Jul–Sep 2025', start: new Date('2025-07-01'), end: new Date('2025-10-01') },
  { q: 'Q2', period: 'Oct–Dec 2025', start: new Date('2025-10-01'), end: new Date('2026-01-01') },
  { q: 'Q3', period: 'Jan–Mar 2026', start: new Date('2026-01-01'), end: new Date('2026-04-01') },
  { q: 'Q4', period: 'Apr–Jun 2026', start: new Date('2026-04-01'), end: new Date('2026-07-01') },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function quarterLabel(iso: string) {
  const m = new Date(iso).getMonth()
  if (m >= 6 && m <= 8) return 'Q1'
  if (m >= 9 && m <= 11) return 'Q2'
  if (m >= 0 && m <= 2) return 'Q3'
  return 'Q4'
}

function scoreColor(score: number) {
  if (score >= 70) return '#4ade80'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function scoreLabel(score: number) {
  if (score >= 70) return 'COMPLIANT'
  if (score >= 40) return 'AT RISK'
  return 'NON-COMPLIANT'
}

function barColor(pct: number) {
  if (pct >= 85) return '#2f6b3a'
  if (pct >= 60) return '#d97706'
  return '#dc2626'
}

// ── EPR score — only use criteria with real data ──────────────────────────────

function computeEPRScore(
  takeBackScore: number,
  hazardScore: number,
  regScore: number,
  hasDevices: boolean,
  hasDisposals: boolean,
): number {
  if (!hasDevices) return 0
  let points = takeBackScore * 0.30 + regScore * 0.15
  let weight = 0.45
  if (hasDisposals) { points += hazardScore * 0.20; weight += 0.20 }
  return Math.round(points / weight)
}

// ── Print window ──────────────────────────────────────────────────────────────

function openPrintWindow(title: string, html: string) {
  const win = window.open('', '_blank', 'width=960,height=750,scrollbars=yes')
  if (!win) {
    toast.error('Pop-up blocked. Please allow pop-ups for this site and try again.')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:40px;line-height:1.55}
h1{font-size:17px;font-weight:bold;margin-bottom:3px}
h2{font-size:13px;font-weight:bold;margin:22px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #ccc}
h3{font-size:12px;font-weight:bold;margin:10px 0 5px}
p{margin:4px 0}
table{width:100%;border-collapse:collapse;margin:8px 0 12px}
th{background:#f0f0ee;text-align:left;padding:6px 8px;border:1px solid #bbb;font-size:11px}
td{padding:6px 8px;border:1px solid #ddd;font-size:11px;vertical-align:top}
tr:nth-child(even) td{background:#fafaf8}
.header-block{border:2px solid #111;padding:18px 20px;margin-bottom:24px}
.header-block .sub{font-size:11px;color:#555;margin-top:3px}
.score-wrap{text-align:center;margin:14px 0}
.score-box{display:inline-block;border:2px solid #1a5229;padding:10px 24px;min-width:120px}
.score-box .num{font-size:36px;font-weight:bold;color:#1a5229}
.score-box .lbl{font-size:10px;color:#555;margin-top:2px}
.stamp{display:inline-block;border:2px solid #1a5229;color:#1a5229;font-weight:bold;padding:4px 12px;font-size:11px;letter-spacing:.5px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:12px}
.sign-line{border-bottom:1px solid #555;width:220px;display:inline-block;margin-top:24px;margin-right:40px}
.footer{margin-top:36px;padding-top:14px;border-top:1px solid #ddd;font-size:10px;color:#888}
.no-print{margin-bottom:16px}
@media print{.no-print{display:none}body{padding:20px}}
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()" style="padding:8px 20px;background:#0f1410;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">
    ⬇ Print / Save as PDF
  </button>
</div>
${html}
</body>
</html>`)
  win.document.close()
}

// ── Report HTML generators ─────────────────────────────────────────────────────

interface ReportData {
  name: string
  org: string | null
  profileId: string
  devicesYTD: number
  devicesTotal: number
  devicesReturned: number
  takeBackRate: number
  takeBackScore: number
  hazardScore: number
  regScore: number
  withSerial: number
  hazardCount: number
  eprScore: number
  totalMassKg: number
  onChainCount: number
  quarters: { q: string; period: string; count: number; txSample: string | null }[]
  hazardDisposals: DisposalRow[]
  materials: { label: string; value: number }[]
}

function genEPR104(quarter: string, period: string, d: ReportData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const regId = `EPA-LR-EPR-${d.profileId.slice(0, 8).toUpperCase()}`
  const sl = scoreLabel(d.eprScore)
  return `
<div class="header-block">
  <h1>ENVIRONMENTAL PROTECTION AGENCY — LIBERIA</h1>
  <p class="sub">Extended Producer Responsibility Compliance Report</p>
  <p class="sub">EPA Form EPR-104 &nbsp;·&nbsp; ${quarter} FY 2025/26 &nbsp;·&nbsp; ${period}</p>
  <p class="sub">Generated: ${today}</p>
</div>

<h2>SECTION 1 — PRODUCER INFORMATION</h2>
<table>
  <tr><td style="width:220px"><b>Producer Name</b></td><td>${d.name}</td></tr>
  <tr><td><b>Organization</b></td><td>${d.org ?? '—'}</td></tr>
  <tr><td><b>Reporting Period</b></td><td>${quarter} FY 2025/26 &nbsp;(${period})</td></tr>
  <tr><td><b>Submission Date</b></td><td>${today}</td></tr>
  <tr><td><b>EPR Registration No.</b></td><td>${regId}</td></tr>
</table>

<h2>SECTION 2 — DEVICE PLACEMENT & TAKE-BACK DATA</h2>
<table>
  <tr><th>Metric</th><th>Value</th><th>Notes</th></tr>
  <tr><td>Total devices placed on market (FY)</td><td>${fmt(d.devicesYTD)}</td><td>Registered on EcoLedger chain this FY</td></tr>
  <tr><td>Total devices placed (all time)</td><td>${fmt(d.devicesTotal)}</td><td>Cumulative</td></tr>
  <tr><td>Devices taken back for recycling</td><td>${fmt(d.devicesReturned)}</td><td>Confirmed disposal records</td></tr>
  <tr><td>Take-back rate</td><td><b>${d.takeBackRate.toFixed(1)}%</b></td><td>EPR statutory goal: ${EPR_GOAL}%</td></tr>
  <tr><td>Mass recovered</td><td>${d.totalMassKg.toFixed(2)} kg</td><td>From disposal records</td></tr>
  <tr><td>Estimated CO₂ avoided</td><td>${(d.totalMassKg * 1.5 / 1000).toFixed(4)} tonnes</td><td>Based on 1.5 kg CO₂ / kg e-waste</td></tr>
</table>

<h2>SECTION 3 — EPR COMPLIANCE SCORE</h2>
<div class="score-wrap">
  <div class="score-box">
    <div class="num">${d.eprScore}</div>
    <div class="lbl">/ 100 &nbsp;·&nbsp; <span class="stamp">${sl}</span></div>
  </div>
</div>
<p style="font-size:10px;color:#888;text-align:center;margin-bottom:12px">Score normalized across ${d.hazardCount > 0 ? '3' : '2'} criteria with verified data.</p>
<table>
  <tr><th>Criterion</th><th>Weight</th><th>Score</th><th>Detail</th></tr>
  <tr><td>Take-back rate</td><td>30%</td><td>${d.takeBackScore}/100</td><td>${d.takeBackRate.toFixed(1)}% vs ${EPR_GOAL}% goal (included in score)</td></tr>
  <tr><td>Hazardous handling</td><td>20%</td><td>${d.hazardCount > 0 ? d.hazardScore + '/100' : 'N/A'}</td><td>${d.hazardCount} hazardous disposal(s) &nbsp;·&nbsp; ${d.hazardCount > 0 ? 'included' : 'no data — excluded'}</td></tr>
  <tr><td>Registration completeness</td><td>15%</td><td>${d.regScore}/100</td><td>${d.withSerial}/${d.devicesTotal} devices with serial numbers (included)</td></tr>
  <tr><td>Levy payment promptness</td><td>20%</td><td>N/A</td><td>No levy records — excluded from score</td></tr>
  <tr><td>Self-reporting accuracy</td><td>15%</td><td>N/A</td><td>No correction records — excluded from score</td></tr>
</table>

<h2>SECTION 4 — ON-CHAIN EVIDENCE SUMMARY</h2>
<table>
  <tr><th>Quarter</th><th>EPR Events</th><th>On-Chain Verified</th><th>Sample Tx Hash</th></tr>
  ${d.quarters.map(q => `
  <tr>
    <td>${q.q} (${q.period})</td>
    <td>${q.count}</td>
    <td>${q.txSample ? 'Yes' : q.count > 0 ? 'Pending' : '—'}</td>
    <td style="font-family:monospace;font-size:9px">${q.txSample ? q.txSample.slice(0, 22) + '…' : '—'}</td>
  </tr>`).join('')}
  <tr style="font-weight:bold"><td>FY Total</td><td>${d.devicesReturned}</td><td>${d.onChainCount}</td><td></td></tr>
</table>

<h2>SECTION 5 — CERTIFICATION</h2>
<p>I certify that the information provided in this report is true, accurate and complete to the best of my knowledge and belief, in accordance with the Environmental Protection Agency Act (2003) and the Extended Producer Responsibility Regulations of Liberia.</p>
<br>
<table style="border:none;margin-top:8px">
  <tr>
    <td style="border:none;width:55%;padding-left:0">
      <div class="sign-line"></div><br>
      <p><b>Authorized Signatory:</b> ${d.name}</p>
      <p><b>Title:</b> EPR Compliance Officer</p>
    </td>
    <td style="border:none;width:45%">
      <div class="sign-line" style="width:160px"></div><br>
      <p><b>Date:</b> ${today}</p>
      <p><b>Organization Stamp:</b></p>
    </td>
  </tr>
</table>

<div class="footer">
  <p>Environmental Protection Agency Liberia &nbsp;·&nbsp; EPA Form EPR-104 &nbsp;·&nbsp; Generated by EcoLedger Platform</p>
  <p>All on-chain events verifiable at sepolia.etherscan.io &nbsp;·&nbsp; Reference: ${regId}</p>
</div>`
}

function genHazardManifest(d: ReportData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalMass = d.hazardDisposals.reduce((s, r) => s + (r.final_mass_kg ?? 0), 0)
  return `
<div class="header-block">
  <h1>HAZARDOUS ELECTRONIC WASTE ROUTING MANIFEST</h1>
  <p class="sub">Basel Convention Annex VII Evidence &nbsp;·&nbsp; Transboundary Movement Documentation</p>
  <p class="sub">Producer: ${d.name} &nbsp;·&nbsp; ${d.org ?? ''} &nbsp;·&nbsp; Generated: ${today}</p>
</div>

<h2>PRODUCER IDENTIFICATION</h2>
<table>
  <tr><td style="width:200px"><b>Producer</b></td><td>${d.name}</td></tr>
  <tr><td><b>Organization</b></td><td>${d.org ?? '—'}</td></tr>
  <tr><td><b>EPR Registration</b></td><td>EPA-LR-EPR-${d.profileId.slice(0, 8).toUpperCase()}</td></tr>
  <tr><td><b>Report Date</b></td><td>${today}</td></tr>
</table>

<h2>HAZARDOUS DISPOSAL RECORDS</h2>
${d.hazardDisposals.length === 0 ? '<p>No hazardous disposal records found.</p>' : `
<table>
  <tr>
    <th>Device ID</th><th>Date</th><th>Hazard Class</th><th>Mass (kg)</th><th>Disposal Type</th><th>On-Chain Tx</th>
  </tr>
  ${d.hazardDisposals.map(r => `
  <tr>
    <td style="font-family:monospace;font-size:10px">${r.device_id.slice(0, 12)}…</td>
    <td>${r.created_at.slice(0, 10)}</td>
    <td>${(r.hazard_class ?? '—').replace(/_/g, ' ')}</td>
    <td>${r.final_mass_kg?.toFixed(3) ?? '—'}</td>
    <td>${(r.disposal_type ?? '—').replace(/_/g, ' ')}</td>
    <td style="font-family:monospace;font-size:9px">${r.tx_hash ? r.tx_hash.slice(0, 18) + '…' : 'Pending'}</td>
  </tr>`).join('')}
</table>`}

<h2>SUMMARY</h2>
<table>
  <tr><td style="width:260px">Total hazardous disposal records</td><td>${d.hazardDisposals.length}</td></tr>
  <tr><td>Total mass recovered</td><td>${totalMass.toFixed(3)} kg</td></tr>
  <tr><td>On-chain verified</td><td>${d.hazardDisposals.filter(r => r.tx_hash).length} of ${d.hazardDisposals.length}</td></tr>
</table>

<h2>CERTIFICATION</h2>
<p>This manifest certifies that all hazardous electronic waste items listed above were routed to licensed recycling facilities in compliance with the Basel Convention and EPA Liberia regulations.</p>
<br>
<div class="sign-line"></div>
<p style="margin-top:4px"><b>Authorized Signatory:</b> ${d.name} &nbsp;·&nbsp; <b>Date:</b> ${today}</p>

<div class="footer">
  <p>Environmental Protection Agency Liberia &nbsp;·&nbsp; Basel Annex VII Evidence &nbsp;·&nbsp; Generated by EcoLedger Platform</p>
</div>`
}

function genCSR(d: ReportData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
<div class="header-block">
  <h1>${d.org ?? d.name}</h1>
  <p class="sub">Corporate Sustainability & Environmental Impact Report</p>
  <p class="sub">Fiscal Year 2025/26 &nbsp;·&nbsp; Prepared by: ${d.name} &nbsp;·&nbsp; Generated: ${today}</p>
</div>

<h2>EXECUTIVE SUMMARY</h2>
<div class="two-col">
  <table>
    <tr><td style="width:200px"><b>Devices placed (FY)</b></td><td>${fmt(d.devicesYTD)}</td></tr>
    <tr><td><b>Devices taken back</b></td><td>${fmt(d.devicesReturned)}</td></tr>
    <tr><td><b>Take-back rate</b></td><td>${d.takeBackRate.toFixed(1)}% (goal ${EPR_GOAL}%)</td></tr>
    <tr><td><b>CO₂ avoided</b></td><td>${(d.totalMassKg * 1.5 / 1000).toFixed(4)} tonnes</td></tr>
    <tr><td><b>Mass recovered</b></td><td>${d.totalMassKg.toFixed(2)} kg</td></tr>
  </table>
  <div style="text-align:center;padding-top:12px">
    <div class="score-box">
      <div class="num">${d.eprScore}</div>
      <div class="lbl">EPR Score / 100</div>
      <div style="margin-top:6px"><span class="stamp">${scoreLabel(d.eprScore)}</span></div>
    </div>
  </div>
</div>

<h2>MATERIAL RECOVERY CONTRIBUTION</h2>
<table>
  <tr><th>Material</th><th>Estimated Recoverable (g)</th><th>Environmental Value</th></tr>
  ${d.materials.map(m => `<tr><td>${m.label}</td><td>${m.value.toFixed(2)}</td><td>—</td></tr>`).join('')}
  <tr style="font-weight:bold"><td>Total</td><td>${d.materials.reduce((s, m) => s + m.value, 0).toFixed(2)}</td><td></td></tr>
</table>

<h2>BLOCKCHAIN TRANSPARENCY</h2>
<p style="margin-bottom:8px">All device registrations and disposal events are immutably recorded on the Ethereum Sepolia testnet via the EcoLedger smart contract, ensuring tamper-proof lifecycle tracking.</p>
<table>
  <tr><td style="width:260px">Total devices registered on-chain</td><td>${fmt(d.devicesTotal)}</td></tr>
  <tr><td>Disposal events submitted on-chain</td><td>${fmt(d.onChainCount)}</td></tr>
  <tr><td>Pending chain synchronization</td><td>${fmt(d.devicesReturned - d.onChainCount)}</td></tr>
</table>

<h2>COMPLIANCE STATUS</h2>
<table>
  <tr><th>Quarter</th><th>EPR Events</th><th>On-Chain</th></tr>
  ${d.quarters.map(q => `<tr><td>${q.q} · ${q.period}</td><td>${q.count}</td><td>${q.txSample ? 'Verified' : q.count > 0 ? 'Pending' : '—'}</td></tr>`).join('')}
</table>

<h2>STATEMENT OF COMMITMENT</h2>
<p>${d.org ?? d.name} is committed to responsible e-waste management in accordance with the Environmental Protection Agency Act (2003) and the Extended Producer Responsibility Regulations of Liberia. We will continue to invest in certified recycling partnerships to meet and exceed the national ${EPR_GOAL}% take-back goal.</p>
<br>
<div class="sign-line"></div>
<p style="margin-top:4px"><b>Authorized by:</b> ${d.name} &nbsp;·&nbsp; <b>Date:</b> ${today}</p>

<div class="footer">
  <p>This report is prepared for internal use and external sustainability disclosure. It is not an official EPA submission.</p>
  <p>Generated by EcoLedger Platform &nbsp;·&nbsp; ${new Date().getFullYear()}</p>
</div>`
}

function genAnnualEPR201(d: ReportData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
<div class="header-block">
  <h1>ENVIRONMENTAL PROTECTION AGENCY — LIBERIA</h1>
  <p class="sub">Annual Extended Producer Responsibility Disclosure</p>
  <p class="sub">EPA Form EPR-201 &nbsp;·&nbsp; Full Year FY 2025/26 (Jul 2025 – Jun 2026)</p>
  <p class="sub">Generated: ${today}</p>
</div>

<h2>SECTION 1 — PRODUCER IDENTIFICATION</h2>
<table>
  <tr><td style="width:220px"><b>Producer Name</b></td><td>${d.name}</td></tr>
  <tr><td><b>Organization</b></td><td>${d.org ?? '—'}</td></tr>
  <tr><td><b>EPR Registration No.</b></td><td>EPA-LR-EPR-${d.profileId.slice(0, 8).toUpperCase()}</td></tr>
  <tr><td><b>Fiscal Year</b></td><td>2025/2026 (01 Jul 2025 – 30 Jun 2026)</td></tr>
  <tr><td><b>Submission Date</b></td><td>${today}</td></tr>
  <tr><td><b>Due Date</b></td><td>31 July 2026</td></tr>
</table>

<h2>SECTION 2 — FULL-YEAR PERFORMANCE</h2>
<table>
  <tr><th>Metric</th><th>FY 2025/26</th><th>EPR Target</th><th>Status</th></tr>
  <tr><td>Devices placed on market</td><td>${fmt(d.devicesYTD)}</td><td>—</td><td>—</td></tr>
  <tr><td>Devices taken back</td><td>${fmt(d.devicesReturned)}</td><td>—</td><td>—</td></tr>
  <tr><td>Take-back rate</td><td><b>${d.takeBackRate.toFixed(1)}%</b></td><td>${EPR_GOAL}%</td><td>${d.takeBackRate >= EPR_GOAL ? '✓ MET' : '✗ BELOW TARGET'}</td></tr>
  <tr><td>Mass recovered</td><td>${d.totalMassKg.toFixed(2)} kg</td><td>—</td><td>—</td></tr>
  <tr><td>Estimated CO₂ avoided</td><td>${(d.totalMassKg * 1.5 / 1000).toFixed(4)} t</td><td>—</td><td>—</td></tr>
  <tr><td>Overall EPR Score</td><td><b>${d.eprScore}/100</b></td><td>≥ 70</td><td>${d.eprScore >= 70 ? '✓ COMPLIANT' : d.eprScore >= 40 ? '⚠ AT RISK' : '✗ NON-COMPLIANT'}</td></tr>
</table>

<h2>SECTION 3 — QUARTERLY BREAKDOWN</h2>
<table>
  <tr><th>Quarter</th><th>Period</th><th>EPR Events</th><th>On-Chain Tx</th></tr>
  ${d.quarters.map(q => `
  <tr>
    <td>${q.q}</td><td>${q.period}</td><td>${q.count}</td>
    <td style="font-family:monospace;font-size:9px">${q.txSample ? q.txSample.slice(0, 20) + '…' : q.count > 0 ? 'Pending sync' : '—'}</td>
  </tr>`).join('')}
  <tr style="font-weight:bold"><td colspan="2">Annual Total</td><td>${d.devicesReturned}</td><td>${d.onChainCount} verified</td></tr>
</table>

<h2>SECTION 4 — MATERIAL RECOVERY DECLARATION</h2>
<table>
  <tr><th>Material</th><th>Recoverable per Unit (g)</th><th>Estimated FY Recovery (g)</th></tr>
  ${d.materials.map(m => `<tr><td>${m.label}</td><td>—</td><td>${m.value.toFixed(2)}</td></tr>`).join('')}
</table>

<h2>SECTION 5 — LEVY DECLARATION</h2>
<p>EPR levy payment records are not yet available on-chain. This section will be completed when the levy payment system is operational.</p>
<table>
  <tr><td style="width:260px">Levy payments recorded</td><td>0</td></tr>
  <tr><td>Outstanding arrears</td><td>None on record</td></tr>
</table>

<h2>SECTION 6 — ANNUAL CERTIFICATION</h2>
<p>I, the undersigned, certify that the information provided in this Annual EPR Disclosure is true, complete and accurate, prepared in accordance with the Environmental Protection Agency Act (2003) and the Extended Producer Responsibility Regulations of Liberia.</p>
<br>
<table style="border:none">
  <tr>
    <td style="border:none;width:55%;padding-left:0">
      <div class="sign-line"></div><br>
      <p><b>Authorized Signatory:</b> ${d.name}</p>
      <p><b>Title:</b> EPR Compliance Officer</p>
    </td>
    <td style="border:none;width:45%">
      <div class="sign-line" style="width:160px"></div><br>
      <p><b>Date:</b> ${today}</p>
      <p><b>Organization Stamp:</b></p>
    </td>
  </tr>
</table>

<div class="footer">
  <p>Environmental Protection Agency Liberia &nbsp;·&nbsp; EPA Form EPR-201 &nbsp;·&nbsp; Annual Disclosure &nbsp;·&nbsp; Generated by EcoLedger Platform</p>
  <p>Submit to: epr@epa.gov.lr &nbsp;·&nbsp; Deadline: 31 July 2026 &nbsp;·&nbsp; Reference: EPA-LR-EPR-${d.profileId.slice(0, 8).toUpperCase()}</p>
</div>`
}

// ── Circular score badge ──────────────────────────────────────────────────────

function CircularScore({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = scoreColor(score)
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center relative z-10">
        <div className="text-4xl font-bold text-white">{score}</div>
        <div className="text-xs text-white/40 mt-0.5">/ 100</div>
      </div>
    </div>
  )
}

// ── Score criterion row ───────────────────────────────────────────────────────

function CriterionRow({ c }: { c: ScoreCriterion }) {
  const pct = c.target > 0 ? Math.min(100, (c.value / c.target) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{c.label}</span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            WEIGHT {c.weight} %
          </span>
          {!c.included && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              EXCLUDED — NO DATA
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm flex-shrink-0">
          {c.included
            ? <span className="font-semibold">{fmt(c.value, 1)}</span>
            : <span className="text-muted-foreground">—</span>
          }
          <span className="text-muted-foreground">/ {c.target}</span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        {c.included && (
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: barColor(pct) }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{c.note}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function EPRReportsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [disposals, setDisposals] = useState<DisposalRow[]>([])
  const [flags, setFlags] = useState<FlagRow[]>([])

  const load = useCallback(async () => {
    if (!profile) return

    const [devRes, flagRes] = await Promise.all([
      supabase
        .from('devices')
        .select('id, created_at, status, serial_number, material_gold_g, material_copper_g, material_aluminum_g, material_lithium_g, material_cobalt_g, material_lead_g, co2_kg_avoided')
        .eq('original_owner_id', profile.id),
      supabase
        .from('compliance_flags')
        .select('id, created_at, flag_type, description, status, severity')
        .eq('subject_id', profile.id)
        .eq('status', 'open'),
    ])

    const allDevices = devRes.data ?? []
    setDevices(allDevices)
    setFlags(flagRes.data ?? [])

    if (allDevices.length > 0) {
      const { data: dispData } = await supabase
        .from('disposals')
        .select('id, device_id, created_at, final_mass_kg, eco_credits_awarded, tx_hash, status, hazard_class, disposal_type')
        .in('device_id', allDevices.map(d => d.id))
        .order('created_at', { ascending: false })
      setDisposals(dispData ?? [])
    }

    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  // ── Computed metrics ───────────────────────────────────────────────────────

  const devicesYTD = devices.filter(d => new Date(d.created_at) >= FY_START).length
  const takeBackRate = devices.length > 0 ? (disposals.length / devices.length) * 100 : 0
  const totalMassKg = disposals.reduce((s, d) => s + (d.final_mass_kg ?? 0), 0)
  const co2Avoided = (totalMassKg * 1.5) / 1000
  const onChainCount = disposals.filter(d => d.tx_hash).length

  const withSerial = devices.filter(d => d.serial_number).length
  const regScore = devices.length > 0 ? Math.min(100, Math.round((withSerial / devices.length) * 100)) : 0
  const hazardCount = disposals.filter(d => d.hazard_class).length
  const hazardScore = disposals.length > 0 ? Math.min(100, Math.round((hazardCount / disposals.length) * 100)) : 0
  const takeBackScore = devices.length > 0 ? Math.min(100, Math.round((takeBackRate / EPR_GOAL) * 100)) : 0

  const eprScore = computeEPRScore(takeBackScore, hazardScore, regScore, devices.length > 0, disposals.length > 0)

  // Real quarterly change: compare current score vs score 90 days ago
  const t90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const devicesAt90 = devices.filter(d => new Date(d.created_at) <= t90)
  const disposalsAt90 = disposals.filter(d => new Date(d.created_at) <= t90)
  const tbRateAt90 = devicesAt90.length > 0 ? (disposalsAt90.length / devicesAt90.length) * 100 : 0
  const tbScoreAt90 = Math.min(100, Math.round((tbRateAt90 / EPR_GOAL) * 100))
  const regScoreAt90 = devicesAt90.length > 0 ? Math.min(100, Math.round((devicesAt90.filter(d => d.serial_number).length / devicesAt90.length) * 100)) : 0
  const hazAt90 = disposalsAt90.filter(d => d.hazard_class).length
  const hazScoreAt90 = disposalsAt90.length > 0 ? Math.min(100, Math.round((hazAt90 / disposalsAt90.length) * 100)) : 0
  const scoreAt90 = computeEPRScore(tbScoreAt90, hazScoreAt90, regScoreAt90, devicesAt90.length > 0, disposalsAt90.length > 0)
  const quarterlyChange = devices.length > 0 ? eprScore - scoreAt90 : null

  // Criteria
  const criteria: ScoreCriterion[] = [
    {
      label: 'Take-back rate', weight: 30,
      value: Math.round(takeBackRate * 10) / 10, target: EPR_GOAL,
      note: `${fmt(disposals.length)} of ${fmt(devices.length)} placed devices returned · goal ${EPR_GOAL}%`,
      included: devices.length > 0,
    },
    {
      label: 'Levy payment promptness', weight: 20,
      value: 0, target: 100,
      note: 'No levy payment records in system — excluded from EPR score calculation',
      included: false,
    },
    {
      label: 'Hazardous handling', weight: 20,
      value: hazardScore, target: 100,
      note: `${hazardCount} hazardous disposal${hazardCount !== 1 ? 's' : ''} logged · Basel-compliant routing`,
      included: disposals.length > 0,
    },
    {
      label: 'Registration completeness', weight: 15,
      value: regScore, target: 100,
      note: `${fmt(withSerial)} / ${fmt(devices.length)} placed devices have serial numbers logged`,
      included: devices.length > 0,
    },
    {
      label: 'Self-reporting accuracy', weight: 15,
      value: 0, target: 100,
      note: 'No correction audit records in system — excluded from EPR score calculation',
      included: false,
    },
  ]

  // Quarterly ledger
  const quarterSummaries = QUARTERS.map(({ q, period, start, end }) => {
    const qDisp = disposals.filter(d => {
      const t = new Date(d.created_at)
      return t >= start && t < end
    })
    return {
      q, period,
      isPast: new Date() >= end,
      count: qDisp.length,
      massKg: qDisp.reduce((s, d) => s + (d.final_mass_kg ?? 0), 0),
      txSample: qDisp.find(d => d.tx_hash)?.tx_hash ?? null,
    }
  })

  // Materials for reports
  const materials = [
    { label: 'Gold',     value: devices.reduce((s, d) => s + d.material_gold_g, 0) },
    { label: 'Copper',   value: devices.reduce((s, d) => s + d.material_copper_g, 0) },
    { label: 'Aluminum', value: devices.reduce((s, d) => s + d.material_aluminum_g, 0) },
    { label: 'Lithium',  value: devices.reduce((s, d) => s + d.material_lithium_g, 0) },
    { label: 'Cobalt',   value: devices.reduce((s, d) => s + d.material_cobalt_g, 0) },
    { label: 'Lead',     value: devices.reduce((s, d) => s + d.material_lead_g, 0) },
  ]

  // Shared report data bundle
  const rd: ReportData = {
    name: profile?.full_name ?? profile?.email ?? 'Unknown',
    org: profile?.organization ?? null,
    profileId: profile?.id ?? '00000000',
    devicesYTD,
    devicesTotal: devices.length,
    devicesReturned: disposals.length,
    takeBackRate,
    takeBackScore,
    hazardScore,
    regScore,
    withSerial,
    hazardCount,
    eprScore,
    totalMassKg,
    onChainCount,
    quarters: quarterSummaries,
    hazardDisposals: disposals.filter(d => d.hazard_class),
    materials,
  }

  // CSV export: take-back audit trail
  const exportAuditTrail = () => {
    if (disposals.length === 0) { toast.error('No disposal records to export'); return }
    const headers = ['Device ID', 'Date', 'Quarter', 'Mass (kg)', 'Hazard Class', 'Disposal Type', 'EcoCredits', 'Tx Hash']
    const rows = disposals.map(d => [
      d.device_id, d.created_at.slice(0, 10), quarterLabel(d.created_at),
      d.final_mass_kg ?? 0, d.hazard_class ?? '—', d.disposal_type ?? '—',
      d.eco_credits_awarded ?? 0, d.tx_hash ?? 'Pending',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `take-back-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Audit trail exported')
  }

  // Submit to EPA via email
  const submitToEPA = (reportTitle: string) => {
    const subject = encodeURIComponent(`EPR Submission — ${reportTitle} — ${rd.org ?? rd.name}`)
    const body = encodeURIComponent(
      `Dear EPA Liberia Compliance Team,\n\nPlease find attached our ${reportTitle} for FY 2025/26.\n\n` +
      `Producer: ${rd.name}\nOrganization: ${rd.org ?? '—'}\nEPR Ref: EPA-LR-EPR-${rd.profileId.slice(0, 8).toUpperCase()}\n` +
      `EPR Score: ${rd.eprScore}/100 (${scoreLabel(rd.eprScore)})\nTake-back rate: ${rd.takeBackRate.toFixed(1)}%\n\n` +
      `Please download and attach the PDF report from the EcoLedger platform before sending.\n\nRegards,\n${rd.name}`
    )
    window.open(`mailto:epr@epa.gov.lr?subject=${subject}&body=${body}`)
  }

  // Report definitions
  const now = new Date()
  const reports: Report[] = [
    {
      title: 'Q3 2025/26 EPR Report', form: 'EPA Form EPR-104',
      note: 'Generated live', status: 'ready',
      fileType: 'PDF', fileSize: 'Print / Save as PDF',
      onDownload: () => openPrintWindow('Q3 EPR-104 · EcoLedger', genEPR104('Q3', 'Jan–Mar 2026', rd)),
    },
    {
      title: 'Q4 2025/26 EPR Report', form: 'EPA Form EPR-104',
      note: now >= new Date('2026-04-01') ? 'Generated live' : 'Available from 1 Apr 2026',
      status: now >= new Date('2026-04-01') ? 'ready' : 'pending',
      fileType: 'PDF', fileSize: 'Print / Save as PDF',
      onDownload: () => openPrintWindow('Q4 EPR-104 · EcoLedger', genEPR104('Q4', 'Apr–Jun 2026', rd)),
    },
    {
      title: 'Annual EPR Disclosure', form: 'EPA Form EPR-201',
      note: 'Due 31 Jul 2026 — available now (partial year)',
      status: 'ready',
      fileType: 'PDF', fileSize: 'Print / Save as PDF',
      onDownload: () => openPrintWindow('Annual EPR-201 · EcoLedger', genAnnualEPR201(rd)),
    },
    {
      title: 'Take-back Audit Trail', form: 'Per-device chain of custody',
      note: 'Live · regenerates on demand', status: 'ready',
      fileType: 'CSV', fileSize: `${disposals.length} records`,
      onDownload: exportAuditTrail,
    },
    {
      title: 'Hazardous Routing Manifest', form: 'Basel Annex VII evidence',
      note: 'Live · regenerates on demand',
      status: hazardCount > 0 ? 'ready' : 'pending',
      fileType: 'PDF', fileSize: 'Print / Save as PDF',
      onDownload: () => hazardCount > 0
        ? openPrintWindow('Hazardous Manifest · EcoLedger', genHazardManifest(rd))
        : toast.error('No hazardous disposals logged yet'),
    },
    {
      title: 'CSR / Sustainability Report', form: 'Internal use · branded',
      note: `Generated ${fmtDate(new Date().toISOString())}`,
      status: 'ready', fileType: 'PDF', fileSize: 'Print / Save as PDF',
      onDownload: () => openPrintWindow('CSR Report · EcoLedger', genCSR(rd)),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const scoreCol = scoreColor(eprScore)
  const includedCount = criteria.filter(c => c.included).length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Manufacturer</p>
          <h1 className="text-2xl font-semibold">EPR Compliance Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your Extended Producer Responsibility scorecard, levy ledger, and downloadable reports for submission to EPA Liberia.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <div className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground bg-white">
            Period: FY 2025/26
          </div>
          <button
            type="button"
            onClick={exportAuditTrail}
            className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground bg-white hover:bg-muted/50 transition-colors"
          >
            Export ledger
          </button>
          <button
            type="button"
            onClick={() => openPrintWindow('Q3 EPR-104 · EcoLedger', genEPR104('Q3', 'Jan–Mar 2026', rd))}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
            style={{ background: '#0f1410' }}
          >
            <Download className="w-3.5 h-3.5" />
            Download Q3 report (PDF)
          </button>
        </div>
      </div>

      {/* ── Hero score card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8"
        style={{ background: '#0f1410' }}
      >
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-6">EPR Compliance Score</p>
        <div className="flex flex-wrap gap-8 items-center">
          <CircularScore score={eprScore} />

          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: scoreCol + '22', color: scoreCol }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: scoreCol }} />
                {scoreLabel(eprScore)}
              </span>
            </div>
            <p className="text-white/70 text-sm max-w-sm">
              {devices.length === 0
                ? 'No devices registered yet. Register your first batch to start building your EPR record.'
                : eprScore >= 70
                  ? 'Top quartile among registered producers. Score updated daily from on-chain events.'
                  : `Take-back rate ${takeBackRate.toFixed(1)}% vs ${EPR_GOAL}% goal. Improve certified recycler partnerships to raise score.`}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Score based on {includedCount} of 5 criteria with verified data
            </p>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {[
                {
                  label: 'Quarterly change',
                  value: quarterlyChange === null ? '—'
                    : quarterlyChange === 0 ? 'No change'
                    : quarterlyChange > 0 ? `+${quarterlyChange} pts`
                    : `${quarterlyChange} pts`,
                },
                { label: 'Next report due', value: '31 Jul 2026' },
                { label: 'EPR Registration', value: `EPA-LR-EPR-${(profile?.id ?? '').slice(0, 6).toUpperCase()}` },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-sm text-white/80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">Devices placed YTD</p>
          <p className="text-3xl font-semibold">{fmt(devicesYTD)}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{fmt(devices.length)} total registered</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">Take-back rate</p>
          <p className="text-3xl font-semibold">
            {devices.length > 0 ? takeBackRate.toFixed(1) : '—'}
            {devices.length > 0 && <span className="text-lg font-normal ml-1">%</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {devices.length > 0
              ? takeBackRate >= EPR_GOAL ? `↑ above ${EPR_GOAL}% goal` : `↓ goal ${EPR_GOAL}%`
              : 'No devices registered'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">EPR levies paid (FY)</p>
          <p className="text-3xl font-semibold text-muted-foreground/50">—</p>
          <p className="text-xs text-muted-foreground mt-1.5">No levy records on-chain yet</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">CO₂ avoided</p>
          <p className="text-3xl font-semibold">
            {co2Avoided >= 0.01
              ? <>{co2Avoided.toFixed(1)}<span className="text-lg font-normal ml-1">t</span></>
              : disposals.length > 0 ? '<0.1 t' : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {disposals.length > 0 ? 'from compliant returns' : 'No disposals recorded'}
          </p>
        </div>
      </div>

      {/* ── Score breakdown + Levy ledger ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-4">

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold">Score breakdown</h2>
            <span className="text-xs text-muted-foreground">{includedCount} of 5 criteria with data</span>
          </div>
          <div className="space-y-5">
            {criteria.map(c => <CriterionRow key={c.label} c={c} />)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold">EPR levy ledger</h2>
            <span className="text-xs text-muted-foreground">FY 2025/26</span>
          </div>

          <div className="space-y-2.5">
            {quarterSummaries.map(q => (
              <div key={q.q} className="rounded-lg border border-border p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{q.q} · {q.period}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.count > 0
                        ? `${q.count} disposal${q.count !== 1 ? 's' : ''} · ${q.massKg >= 1000 ? (q.massKg / 1000).toFixed(1) + ' t' : q.massKg.toFixed(1) + ' kg'} recovered`
                        : q.isPast ? 'No EPR events this quarter' : 'Period not yet started'}
                    </p>
                  </div>
                  {!q.isPast && q.count === 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">UPCOMING</span>
                  )}
                  {q.isPast && q.count === 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">NIL</span>
                  )}
                  {q.count > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-eco-50 text-eco-700 border border-eco-200 flex-shrink-0">
                      {q.txSample ? 'ON-CHAIN' : 'LOGGED'}
                    </span>
                  )}
                </div>
                {q.txSample && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${q.txSample}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span className="truncate">{q.txSample.slice(0, 20)}…{q.txSample.slice(-6)}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">FY total EPR events</span>
            <span className="text-sm font-semibold">{disposals.length}</span>
          </div>
        </div>
      </div>

      {/* ── Downloadable reports ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Downloadable reports</h2>
          <span className="text-xs text-muted-foreground">Opens formatted report in new tab · Save as PDF from print dialog</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => (
            <div key={r.title} className="rounded-xl border border-border bg-white p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-12 rounded border border-border flex flex-col items-center justify-center gap-0.5 bg-muted/30">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-muted-foreground">{r.fileType}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  r.status === 'ready'
                    ? 'bg-eco-50 text-eco-700 border border-eco-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {r.status === 'ready' ? 'READY' : 'PENDING'}
                </span>
              </div>

              <p className="text-sm font-medium leading-snug">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.form}</p>
              <p className="text-xs text-muted-foreground mt-2">{r.note}</p>
              {r.fileSize && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">{r.fileType} · {r.fileSize}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-4">
                {r.status === 'ready' ? (
                  <>
                    <button
                      type="button"
                      onClick={r.onDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: '#0f1410' }}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => submitToEPA(r.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Submit to EPA
                    </button>
                  </>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border">
                    Awaiting period
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Enforcement notices ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Enforcement notices</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            flags.length > 0
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-eco-50 text-eco-700 border border-eco-200'
          }`}>
            {flags.length} active
          </span>
        </div>

        {flags.length === 0 ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <CheckCircle2 className="w-5 h-5 text-eco-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">No active enforcement notices</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Enforcement notices are issued under Section 14 of the EPR Act when a producer's take-back
                rate falls below the minimum threshold for two consecutive quarters, or when a compliance
                audit identifies a material breach.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map(f => (
              <div key={f.id} className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-red-800">{f.flag_type?.replace(/_/g, ' ')}</p>
                    {f.severity && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        {f.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-700">{f.description ?? 'Compliance review required. Contact EPA Liberia.'}</p>
                  <p className="text-[10px] text-red-400 mt-1">{fmtDate(f.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
