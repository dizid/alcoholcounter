/**
 * POST /api/csp-report (T-0636)
 *
 * Collects Content-Security-Policy violation reports from browsers. The policy
 * runs in report-only mode first (netlify.toml), so nothing is blocked: this
 * endpoint only writes one short line per violation to the Netlify function
 * log, to see what a stricter policy would break before enforcing it.
 *
 * Accepts the classic `report-uri` body ({"csp-report": {...}}) and the newer
 * Reporting API body ([{ type: "csp-violation", body: {...} }]). Always answers
 * 204: browsers ignore the response, and a reporter must never get an error page.
 * Same collector as StatPilot/TuneCraft/Foreground (T-0634).
 */

// Bodies are small; anything larger is not a real CSP report.
const MAX_BODY_BYTES = 16_000

/** Keep log lines short and single-line (report fields are browser/attacker controlled). */
function clean(value, maxLength = 160) {
  return String(value ?? '-').replace(/[\r\n\t]+/g, ' ').slice(0, maxLength)
}

/** Drop query strings and fragments: URLs in reports can carry tokens. */
function stripQuery(value) {
  return clean(value, 300).split(/[?#]/)[0]
}

/** Returns the violation objects from either report format; anything else gives []. */
export function toReports(payload) {
  if (Array.isArray(payload)) {
    return payload
      .filter((item) => typeof item === 'object' && item !== null)
      .filter((item) => item.type === 'csp-violation' && typeof item.body === 'object' && item.body !== null)
      .map((item) => item.body)
  }
  if (typeof payload === 'object' && payload !== null && 'csp-report' in payload) {
    const report = payload['csp-report']
    return typeof report === 'object' && report !== null ? [report] : []
  }
  return []
}

/** One log line for one violation (field names differ between the two formats). */
export function formatReport(report) {
  const directive = report['effective-directive'] ?? report.effectiveDirective ?? report['violated-directive']
  const blocked = report['blocked-uri'] ?? report.blockedURL
  const page = report['document-uri'] ?? report.documentURL
  const source = report['source-file'] ?? report.sourceFile
  const line = report['line-number'] ?? report.lineNumber
  const sample = report['script-sample'] ?? report.sample
  return (
    `csp-report: ${clean(report.disposition ?? 'report')} ${clean(directive, 40)}` +
    ` blocked=${stripQuery(blocked)} page=${stripQuery(page)}` +
    ` source=${stripQuery(source)}:${clean(line, 8)} sample=${clean(sample, 60)}`
  )
}

export default async (request) => {
  const noContent = new Response(null, { status: 204 })
  if (request.method !== 'POST') return noContent

  const text = await request.text().catch(() => '')
  if (!text || text.length > MAX_BODY_BYTES) return noContent

  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return noContent
  }

  // Max 5 lines per request, so one big batch can't flood the log.
  for (const report of toReports(payload).slice(0, 5)) {
    console.warn(formatReport(report))
  }
  return noContent
}

export const config = {
  path: '/api/csp-report',
  // Per visitor: real pages send a handful of reports; stops log flooding.
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
