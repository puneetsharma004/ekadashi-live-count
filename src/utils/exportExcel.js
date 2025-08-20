/* exportExcel.js */
import { utils, writeFileXLSX } from 'xlsx';

/**
 * Export participants to an XLSX file
 * @param {Object[]} data            Array of participant objects
 * @param {string}   eventName       Event title (for heading / filename)
 * @param {Object[]} fields          Array of { key, label } objects
 *                                   key   → property name in each participant
 *                                   label → column header in the sheet
 */
export default function exportParticipantsToExcel(data, eventName, fields) {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data available to export');
    return;
  }

  /* 1. Build header row */
  const headers = fields.map(f => f.label);

  /* 2. Build body rows in the same order */
  const rows = data.map(p =>
    fields.map(f => p[f.key] ?? '')
  );

  /* 3. First two rows: big event heading + blank spacer */
  const sheetData = [
    [eventName],
    [],
    headers,
    ...rows
  ];

  /* 4. Convert to worksheet and workbook */
  const ws  = utils.aoa_to_sheet(sheetData);
  const wb  = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Participants');

  /* 5. Auto-width each column (optional quality-of-life) */
  const colWidths = headers.map((h, idx) => ({
    wch: Math.max(
      h.length,
      ...rows.map(r => String(r[idx]).length)
    ) + 2          // +2 for padding
  }));
  ws['!cols'] = colWidths;

  /* 6. Download */
  const safeName = eventName.replace(/[^a-z0-9]/gi, '_');
  writeFileXLSX(wb, `${safeName}_Participants.xlsx`, { compression: true });
}
