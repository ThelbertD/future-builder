"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { importLeadsFromCsvAction, type ImportCsvRow } from "@/app/(dashboard)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseCsv } from "@/lib/csv";
import { guessField, LEAD_CSV_COLUMNS, type LeadCsvField } from "@/lib/leads/csv-columns";
import { pluralize } from "@/lib/utils";

/** Sentinel for "do not import this column"; Select cannot hold an empty value. */
const IGNORE = "__ignore__";

const MAX_ROWS = 2000;

interface LoadedFile {
  name: string;
  headers: string[];
  rows: string[][];
}

/**
 * Only a CSV is accepted.
 *
 * The picker filters by extension and type, but a file can always be dragged in
 * or renamed, so the name is checked again here. An .xlsx is a zip archive:
 * reading it as text produces binary noise that would import as garbage rows
 * rather than failing outright, which is the worst of both outcomes.
 */
function isCsv(file: File): boolean {
  if (/\.csv$/i.test(file.name)) return true;
  return file.type === "text/csv" || file.type === "application/csv";
}

export function ImportCsvDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<LoadedFile | null>(null);
  const [mapping, setMapping] = React.useState<Record<number, LeadCsvField | typeof IGNORE>>({});
  const [importing, setImporting] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setMapping({});
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = (next: boolean) => {
    if (importing) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const load = async (picked: File) => {
    setFileError(null);

    if (!isCsv(picked)) {
      setFileError(
        `${picked.name} is not a CSV. Export your spreadsheet as CSV first — in Excel or Sheets, File → Save as → CSV.`,
      );
      return;
    }

    const text = await picked.text();
    const parsed = parseCsv(text);

    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setFileError("That file has a header row but no data, or is empty.");
      return;
    }

    // Pre-map by header name so a file exported from here needs no mapping.
    const taken = new Set<LeadCsvField>();
    const guessed: Record<number, LeadCsvField | typeof IGNORE> = {};

    parsed.headers.forEach((header, index) => {
      const field = guessField(header, taken);
      if (field) {
        taken.add(field);
        guessed[index] = field;
      } else {
        guessed[index] = IGNORE;
      }
    });

    setFile({ name: picked.name, headers: parsed.headers, rows: parsed.rows });
    setMapping(guessed);
  };

  const companyColumn = Object.entries(mapping).find(([, field]) => field === "companyName")?.[0];
  const mappedCount = Object.values(mapping).filter((field) => field !== IGNORE).length;
  const tooMany = (file?.rows.length ?? 0) > MAX_ROWS;

  const runImport = async () => {
    if (!file || companyColumn === undefined || importing) return;

    const rows: ImportCsvRow[] = file.rows.slice(0, MAX_ROWS).map((cells) => {
      const row: Record<string, string> = {};

      for (const [index, field] of Object.entries(mapping)) {
        if (field === IGNORE) continue;
        const value = cells[Number(index)];
        if (value) row[field] = value;
      }

      return row as unknown as ImportCsvRow;
    });

    // A row with no company has nothing to attach the lead to.
    const usable = rows.filter((row) => row.companyName?.trim());

    if (usable.length === 0) {
      setFileError("No row had a value in the column mapped to Company.");
      return;
    }

    setImporting(true);
    const result = await importLeadsFromCsvAction({ rows: usable });
    setImporting(false);

    if (!result.ok && result.imported === 0) {
      toast.error("Nothing was imported", { description: result.error ?? result.problems[0] });
      return;
    }

    close(false);
    toast.success(`${pluralize(result.imported, "lead")} imported`, {
      description:
        result.skipped > 0
          ? `${result.skipped} skipped. ${result.problems[0] ?? ""}`.trim()
          : "They are in the first stage of your default pipeline.",
    });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>
            {file
              ? "Check each column is going to the right field. Anything set to “Do not import” is ignored."
              : "CSV only. A file exported from here maps itself, so you can export, edit in a spreadsheet, and import it back."}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) void load(picked);
          }}
        />

        {fileError ? (
          <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            {fileError}
          </p>
        ) : null}

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
          >
            <FileSpreadsheet className="size-6 text-muted-foreground" />
            <span className="text-[13px] font-medium">Choose a CSV file</span>
            <span className="text-[12px] text-muted-foreground">
              The first row must be the column headers
            </span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{file.name}</span>
              <Badge variant="outline">
                {pluralize(file.rows.length, "row")} · {mappedCount} mapped
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                Change
              </Button>
            </div>

            {tooMany ? (
              <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                This file has {file.rows.length} rows. The first {MAX_ROWS} will be imported; split the file to
                bring in the rest.
              </p>
            ) : null}

            {companyColumn === undefined ? (
              <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Map one column to Company. A lead has to belong to a business.
              </p>
            ) : null}

            <div className="space-y-2">
              {file.headers.map((header, index) => {
                const sample = file.rows.find((row) => row[index])?.[index] ?? "";

                return (
                  <div key={`${header}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
                    <div className="min-w-0">
                      <Label className="truncate text-[13px]">{header || `Column ${index + 1}`}</Label>
                      {sample ? (
                        <p className="truncate text-[11px] text-muted-foreground">e.g. {sample}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/70">no values</p>
                      )}
                    </div>
                    <Select
                      value={mapping[index] ?? IGNORE}
                      onValueChange={(value) =>
                        setMapping((current) => ({ ...current, [index]: value as LeadCsvField }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE}>Do not import</SelectItem>
                        {LEAD_CSV_COLUMNS.map((column) => (
                          <SelectItem key={column.field} value={column.field}>
                            {column.header}
                            {column.required ? " (required)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => close(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void runImport()}
            loading={importing}
            disabled={!file || companyColumn === undefined}
          >
            <Upload />
            {file ? `Import ${pluralize(Math.min(file.rows.length, MAX_ROWS), "lead")}` : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
