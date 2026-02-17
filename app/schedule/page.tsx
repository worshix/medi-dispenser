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
import { Calendar, Clock, Plus, X } from "lucide-react";
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
        setPillQuantities({
          pill1: "0",
          pill2: "0",
          pill3: "0",
          pill4: "0",
          pill5: "0",
        });
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

  const addTimeSlot = () => {
    setTimes([...times, ""]);
  };

  const removeTimeSlot = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500">
            Set medication schedules for your patients
          </p>
        </div>

        {/* Schedule Form */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Create/Update Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <Label htmlFor="patient">Select Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                        {patient.schedule && " (Has Schedule)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Slots */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Medication Times</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addTimeSlot}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Time
                  </Button>
                </div>
                <div className="space-y-2">
                  {times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="flex-1"
                      />
                      {times.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pill Quantities */}
              <div>
                <Label>Pills per Dose</Label>
                <div className="mt-2 grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num}>
                      <Label htmlFor={`pill${num}`} className="text-xs">
                        Pill {num}
                      </Label>
                      <Input
                        id={`pill${num}`}
                        type="number"
                        min="0"
                        value={pillQuantities[`pill${num}` as keyof typeof pillQuantities]}
                        onChange={(e) =>
                          setPillQuantities({
                            ...pillQuantities,
                            [`pill${num}`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Calendar className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Schedules */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Current Schedules
          </h2>
          <div className="space-y-4">
            {patients
              .filter((p) => p.schedule)
              .map((patient) => (
                <Card key={patient.id} className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {patient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Medication Times</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {patient.schedule?.times.split(",").map((time, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                          >
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pills per Dose</p>
                      <div className="mt-1 flex gap-2">
                        {[
                          { label: "P1", value: patient.schedule?.pill1Quantity },
                          { label: "P2", value: patient.schedule?.pill2Quantity },
                          { label: "P3", value: patient.schedule?.pill3Quantity },
                          { label: "P4", value: patient.schedule?.pill4Quantity },
                          { label: "P5", value: patient.schedule?.pill5Quantity },
                        ].map((pill, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center rounded bg-gray-100 px-3 py-2"
                          >
                            <span className="text-xs text-gray-500">{pill.label}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {pill.value ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {patients.filter((p) => p.schedule).length === 0 && (
              <Card className="border-gray-200">
                <CardContent className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      No schedules created yet
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
