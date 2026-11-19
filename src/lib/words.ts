const WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
]

export function numberWord(n: number, capitalise = false): string {
  const w = WORDS[n] ?? String(n)
  return capitalise ? w.charAt(0).toUpperCase() + w.slice(1) : w
}

export function summaryLine(total: number, shown: number): string {
  const noun = total === 1 ? 'memory' : 'memories'
  if (total === 0) return 'Nothing kept yet.'
  const start = `${numberWord(total, true)} ${noun}`
  if (shown === 0) return `${start}, none on your profile yet.`
  if (shown === total)
    return total === 1 ? `${start}, on your profile.` : `${start}, all on your profile.`
  return `${start}, ${numberWord(shown)} of them on your profile.`
}

export function formatMonthYear(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
