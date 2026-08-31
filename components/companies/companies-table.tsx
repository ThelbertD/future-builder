"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ScoreMeter } from "@/components/common/indicators";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INDUSTRIES } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import type { Company, CompanyStatus, Contact } from "@/types";

const STATUS_VARIANTS: Record<CompanyStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  prospect: "outline",
  engaged: "primary",
  client: "success",
  archived: "default",
};

interface CompaniesTableProps {
  companies: Company[];
  contacts: Contact[];
}

export function CompaniesTable({ companies, contacts }: CompaniesTableProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [industry, setIndustry] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const contactCount = React.useMemo(() => {
    return contacts.reduce<Record<string, number>>((totals, contact) => {
      totals[contact.companyId] = (totals[contact.companyId] ?? 0) + 1;
      return totals;
    }, {});
  }, [contacts]);

  const visible = companies.filter((company) => {
    if (industry !== "all" && company.industry !== industry) return false;
    if (status !== "all" && company.status !== status) return false;
    if (!query.trim()) return true;
    return `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies…"
            className="pl-8"
          />
        </div>

        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-auto min-w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {INDUSTRIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="engaged">Engaged</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-[12px] text-muted-foreground tabular-nums">{visible.length} companies</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies match"
          description="Adjust the filters, or discover new companies from the Lead Finder."
        />
      ) : (
        <>
          <div className="hidden rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Opportunities</TableHead>
                  <TableHead className="hidden xl:table-cell">Contacts</TableHead>
                  <TableHead>Lead score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/companies/${company.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-[12px] text-muted-foreground">{company.domain}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{company.industry}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{company.location}</TableCell>
                    <TableCell className="tabular-nums">{company.openOpportunities}</TableCell>
                    <TableCell className="hidden tabular-nums xl:table-cell">
                      {contactCount[company.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <ScoreMeter score={company.leadScore} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[company.status]} className="capitalize">
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRelative(company.lastActivityAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 md:hidden">
            {visible.map((company) => (
              <li key={company.id}>
                <Link
                  href={`/companies/${company.id}`}
                  className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{company.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {company.industry} · {company.location}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[company.status]} className="capitalize">
                      {company.status}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <ScoreMeter score={company.leadScore} />
                    <span className="text-[11px] text-muted-foreground">
                      {company.openOpportunities} open · {contactCount[company.id] ?? 0} contacts
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
