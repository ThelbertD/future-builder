"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_NOW } from "@/lib/utils";
import { WORKSPACE_ID } from "@/lib/mock";
import type { Appointment, LeadWithRelations, MeetingType } from "@/types";

const MEETING_TYPES: MeetingType[] = [
  "Discovery Call",
  "Strategy Session",
  "Demo",
  "Proposal Review",
  "Kickoff",
];

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: LeadWithRelations[];
  onCreate: (appointment: Appointment) => void;
}

export function NewAppointmentDialog({ open, onOpenChange, leads, onCreate }: NewAppointmentDialogProps) {
  const [leadId, setLeadId] = React.useState(leads[0]?.id ?? "");
  const [meetingType, setMeetingType] = React.useState<MeetingType>("Discovery Call");
  const [date, setDate] = React.useState(MOCK_NOW.toISOString().slice(0, 10));
  const [time, setTime] = React.useState("14:00");
  const [duration, setDuration] = React.useState("30");
  const [notes, setNotes] = React.useState("");

  const submit = () => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    const startsAt = new Date(`${date}T${time}:00.000Z`);
    const appointment: Appointment = {
      id: `apt_local_${Date.now()}`,
      workspaceId: WORKSPACE_ID,
      leadId: lead.id,
      companyId: lead.companyId,
      contactId: lead.contactId,
      title: `${meetingType} — ${lead.company.name}`,
      meetingType,
      status: "scheduled",
      startsAt: startsAt.toISOString(),
      endsAt: new Date(startsAt.getTime() + Number(duration) * 60_000).toISOString(),
      location: "Google Meet",
      notes: notes || undefined,
      bookedByAI: false,
      createdAt: new Date().toISOString(),
    };

    onCreate(appointment);
    onOpenChange(false);
    setNotes("");
    toast.success("Appointment scheduled", {
      description: `${meetingType} with ${lead.company.name} on ${date} at ${time} UTC.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Booked calls sync to the connected calendar and appear on the lead timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leads.slice(0, 25).map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Meeting type</Label>
              <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="appointment-date">Date</Label>
              <Input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="appointment-time">Time (UTC)</Label>
              <Input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-notes">Notes</Label>
            <Textarea
              id="appointment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What should you bring to this call?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!leadId}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
