/**
 * CSV reading and writing, to RFC 4180.
 *
 * Spreadsheets export fields containing commas, quotes and line breaks all the
 * time — a company called "Smith, Jones & Co" or a note spanning two lines —
 * and a split on "," turns every one of those into a corrupt row. Quoting on
 * the way out and a real parser on the way back is what makes a file exported
 * here survive a round trip through Excel or Sheets.
 */

/** Quotes a field only when it needs it, which keeps the file readable. */
function encodeField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [headers.map(encodeField).join(",")];

  for (const row of rows) {
    lines.push(row.map((cell) => encodeField(cell === null || cell === undefined ? "" : String(cell))).join(","));
  }

  // Excel needs CRLF to treat the file as rows rather than one long line.
  return lines.join("\r\n");
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * Parses a CSV into headers and rows.
 *
 * Written as a character scanner rather than a regex because a quoted field can
 * contain the delimiter, the line break and an escaped quote, none of which a
 * line-by-line split can see.
 */
export function parseCsv(text: string): ParsedCsv {
  // A BOM from Excel would otherwise become part of the first header's name.
  const input = text.replace(/^﻿/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };

  const endRow = () => {
    endField();
    // A trailing newline would otherwise add a row of one empty string.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  while (index < input.length) {
    const char = input[index];

    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      index += 1;
      continue;
    }

    if (char === ",") {
      endField();
      index += 1;
      continue;
    }

    if (char === "\r" || char === "\n") {
      endRow();
      // Step over the second half of a CRLF pair.
      index += char === "\r" && input[index + 1] === "\n" ? 2 : 1;
      continue;
    }

    field += char;
    index += 1;
  }

  if (field !== "" || row.length > 0) endRow();

  const [headers = [], ...body] = rows;

  return {
    headers: headers.map((header) => header.trim()),
    // A row shorter than the header is padded so callers can index by column.
    rows: body.map((entry) => headers.map((_, column) => entry[column]?.trim() ?? "")),
  };
}

/**
 * Hands the browser a file to save.
 *
 * The object URL is revoked on the next frame; releasing it synchronously can
 * cancel the download before the browser has read it.
 */
export function downloadCsv(filename: string, contents: string): void {
  // The BOM is what makes Excel read the file as UTF-8 rather than mangling
  // any accented character in a company name.
  const blob = new Blob([`﻿${contents}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
