import Papa from 'papaparse';

export interface StudentCsvRow {
  name: string;
  email: string;
  rollNumber?: string;
  batchName?: string;
}

export interface ParseCsvResult {
  rows: StudentCsvRow[];
  errors: string[];
}

const REQUIRED_HEADERS = ['name', 'email'];

// Real Excel-exported CSVs have quoting/escaping edge cases (embedded commas,
// stray whitespace, BOMs) not worth hand-rolling a parser for — papaparse
// handles those; this just maps the expected columns and reports anything
// that can be caught before a network call.
export function parseStudentCsv(fileContents: string): ParseCsvResult {
  const parsed = Papa.parse<Record<string, string>>(fileContents, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const errors: string[] = parsed.errors.map(
    (err) => `Row ${err.row ?? '?'}: ${err.message}`
  );

  const headers = parsed.meta.fields ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { rows: [], errors: [`Missing required column(s): ${missingHeaders.join(', ')}`] };
  }

  const rows: StudentCsvRow[] = [];
  parsed.data.forEach((record, i) => {
    const name = record.name?.trim();
    const email = record.email?.trim();
    if (!name || !email) {
      errors.push(`Row ${i + 2}: name and email are both required`);
      return;
    }
    rows.push({
      name,
      email,
      rollNumber: record.rollnumber?.trim() || record['roll number']?.trim() || undefined,
      batchName: record.batch?.trim() || undefined,
    });
  });

  return { rows, errors };
}
