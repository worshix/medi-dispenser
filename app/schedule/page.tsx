"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, X, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  schedule?: {
    times: string;
    pill1Quantity: number;
    pill2Quantity: number;
    pill3Quantity: number;
    pill4Quantity: number;
    pill5Quantity: number;
  };
}

const PILL_COLORS = [
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-sky-100 text-sky-700 border-sky-200",
];

export default function SchedulePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [times, setTimes] = useState<string[]>([""]);
  const [pillQuantities, setPillQuantities] = useState({
    pill1: "0",
    pill2: "0",
    pill3: "0",
    pill4: "0",
    pill5: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const patient = patients.find((p) => p.id === selectedPatient);
      if (patient?.schedule) {
        setTimes(patient.schedule.times.split(","));
        setPillQuantities({
          pill1: patient.schedule.pill1Quantity.toString(),
          pill2: patient.schedule.pill2Quantity.toString(),
          pill3: patient.schedule.pill3Quantity.toString(),
          pill4: patient.schedule.pill4Quantity.toString(),
          pill5: patient.schedule.pill5Quantity.toString(),
        });
      } else {
        setTimes([""]);
        setPillQuantities({ pill1: "0", pill2: "0", pill3: "0", pill4: "0", pill5: "0" });
      }
    }
  }, [selectedPatient, patients]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => setTimes([...times, ""]);
  const removeTimeSlot = (index: number) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    const validTimes = times.filter((t) => t !== "");
    if (validTimes.length === 0) {
      toast.error("Please add at least one time slot");
      return;
    }
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          times: validTimes,
          pill1Quantity: parseInt(pillQuantities.pill1),
          pill2Quantity: parseInt(pillQuantities.pill2),
          pill3Quantity: parseInt(pillQuantities.pill3),
          pill4Quantity: parseInt(pillQuantities.pill4),
          pill5Quantity: parseInt(pillQuantities.pill5),
        }),
      });
      if (response.ok) {
        toast.success("Schedule saved successfully!");
        fetchPatients();
      } else {
        toast.error("Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Error saving schedule");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-sm">Loading schedules...</span>
        </div>
      </div>
    );
  }

  const scheduledPatients = patients.filter((p) => p.schedule);

  return (
    <div className="h-screen overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-8 py-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-slate-900">Schedule</h1>
          <p className="text-xs text-slate-500">Set medication times and dosages per patient</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form — 2/5 width */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Configure Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Patient */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                            {patient.schedule && (
                              <span className="ml-1 text-teal-500">✓</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-500">Medication Times</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={addTimeSlot}
                        className="h-7 px-2 text-xs text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Time
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {times.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateTime(index, e.target.value)}
                            className="flex-1 text-sm"
                          />
                          {times.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(index)}
                              className="text-slate-300 hover:text-rose-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pill Quantities */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Pills per Dose</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="space-y-1">
                          <div className={`rounded-md border px-1 py-0.5 text-center text-[10px] font-semibold ${PILL_COLORS[num - 1]}`}>
                            P{num}
                          </div>
                          <Input
                            type="number"
                            min="0"
                            value={pillQuantities[`pill${num}` as keyof typeof pillQuantities]}
                            onChange={(e) =>
                              setPillQuantities({ ...pillQuantities, [`pill${num}`]: e.target.value })
                            }
                            className="text-center text-sm px-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Save Schedule
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Schedules — 3/5 width */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Active Schedules
                <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                  {scheduledPatients.length}
                </span>
              </h2>
            </div>

            {scheduledPatients.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
                <CalendarCheck className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">No schedules yet</p>
                <p className="text-xs text-slate-300">Configure a schedule using the form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPatients.map((patient) => (
                  <Card key={patient.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
                              <span className="text-xs font-bold text-white">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900">{patient.name}</p>
                          </div>

                          {/* Times */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Dose Times
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {patient.schedule?.times.split(",").map((time, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                                >
                                  <Clock className="h-2.5 w-2.5" />
                                  {time.trim()}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Pill quantities */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Dose Quantity
                            </p>
                            <div className="flex gap-1.5">
                              {[
                                { label: "P1", value: patient.schedule?.pill1Quantity },
                                { label: "P2", value: patient.schedule?.pill2Quantity },
                                { label: "P3", value: patient.schedule?.pill3Quantity },
                                { label: "P4", value: patient.schedule?.pill4Quantity },
                                { label: "P5", value: patient.schedule?.pill5Quantity },
                              ].map((pill, idx) => (
                                <div
                                  key={idx}
                                  className={`flex flex-col items-center rounded-lg border px-3 py-1.5 ${PILL_COLORS[idx]}`}
                                >
                                  <span className="text-[10px] font-medium opacity-70">{pill.label}</span>
                                  <span className="text-sm font-bold">{pill.value ?? 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
