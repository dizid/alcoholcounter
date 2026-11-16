// CSV export of the user's own drinks (T-0588, Me > Export my data)
const COLUMNS = ['created_at', 'drink_type', 'size', 'std_drinks', 'trigger', 'mood', 'note', 'location', 'company']

// Quotes a value for CSV; a leading = + - @ is prefixed with ' so spreadsheets don't run it as a formula
function cell(value) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function drinksToCsv(rows) {
  const lines = [COLUMNS.join(',')]
  for (const row of rows) lines.push(COLUMNS.map(key => cell(row[key])).join(','))
  return lines.join('\n') + '\n'
}
