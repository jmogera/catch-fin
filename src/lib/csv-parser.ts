/**
 * Parse CSV file and return rows as objects
 */
export async function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        reject(new Error('Failed to read file'))
        return
      }

      const lines = text.split(/\r?\n/).filter((line) => line.trim())
      const rows: string[][] = []

      for (const line of lines) {
        const row: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = line[i + 1]

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"'
              i++ // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            row.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        // Add last field
        row.push(current.trim())
        rows.push(row)
      }

      resolve(rows)
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Parse date string to Date object
 * Supports common formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, etc.
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) return null

  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return new Date(isoMatch[1], parseInt(isoMatch[2]) - 1, isoMatch[3])
  }

  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const [, month, day, year] = slashMatch
    // Assume MM/DD/YYYY format (US)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try other formats
  const parsed = new Date(dateString)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

/**
 * Parse amount string to number
 * Handles currency symbols, commas, and negative amounts
 */
export function parseAmount(amountString: string): number | null {
  if (!amountString || !amountString.trim()) return null

  // Remove currency symbols, commas, and whitespace
  let cleaned = amountString
    .replace(/[$€£¥,]/g, '')
    .replace(/\s+/g, '')
    .trim()

  // Handle parentheses as negative (accounting format)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}
