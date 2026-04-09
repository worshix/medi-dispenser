"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Copy, Users } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  medication: string;
  email: string;
  status: string;
  pill1Count: number;
  pill2Count: number;
  pill3Count: number;
  pill4Count: number;
  pill5Count: number;
  schedule?: {
    times: string;
  };
}

const PILL_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    condition: "",
    medication: "",
    email: "",
    pill1Count: "0",
    pill2Count: "0",
    pill3Count: "0",
    pill4Count: "0",
    pill5Count: "0",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Patient added successfully!");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          age: "",
          condition: "",
          medication: "",
          email: "",
          pill1Count: "0",
          pill2Count: "0",
          pill3Count: "0",
          pill4Count: "0",
          pill5Count: "0",
        });
        fetchPatients();
      } else {
        toast.error("Failed to add patient");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      toast.error("Error adding patient");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    try {
      const response = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Patient deleted successfully!");
        fetchPatients();
      } else {
        toast.error("Failed to delete patient");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Error deleting patient");
    }
  };

  const copyPatientId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Patient ID copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-sm">Loading patients...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-xs text-slate-500">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Add New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs text-slate-600">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-xs text-slate-600">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="30"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="condition" className="text-xs text-slate-600">Condition</Label>
                  <Input
                    id="condition"
                    placeholder="e.g. Hypertension"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="medication" className="text-xs text-slate-600">Medication</Label>
                  <Input
                    id="medication"
                    placeholder="e.g. Amlodipine"
                    value={formData.medication}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-slate-600">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Initial Pill Counts</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="space-y-1">
                        <p className={`rounded-md px-2 py-0.5 text-center text-[10px] font-medium ${PILL_COLORS[num - 1]}`}>
                          Pill {num}
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData[`pill${num}Count` as keyof typeof formData]}
                          onChange={(e) =>
                            setFormData({ ...formData, [`pill${num}Count`]: e.target.value })
                          }
                          className="text-center text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                  Add Patient
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-8">
        {patients.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
            <Users className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No patients registered yet</p>
            <p className="text-xs text-slate-400">Click &quot;Add Patient&quot; to get started</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <Card key={patient.id} className="border-0 shadow-sm overflow-hidden">
                {/* Colored top accent */}
                <div className={`h-1 w-full ${patient.status === "Active" ? "bg-teal-500" : "bg-slate-300"}`} />
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{patient.name}</p>
                      <p className="text-xs text-slate-400">Age {patient.age}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        patient.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${patient.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {patient.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Condition</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{patient.condition}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Medication</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{patient.medication}</p>
                    </div>
                  </div>

                  {/* Pill counts */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Pill Inventory</p>
                    <div className="flex gap-1.5">
                      {[
                        patient.pill1Count,
                        patient.pill2Count,
                        patient.pill3Count,
                        patient.pill4Count,
                        patient.pill5Count,
                      ].map((count, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-1 flex-col items-center rounded-lg py-2 ${PILL_COLORS[idx]}`}
                        >
                          <span className="text-[10px] font-medium opacity-70">P{idx + 1}</span>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patient ID */}
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Device Key
                    </p>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
                      <code className="flex-1 truncate text-[10px] text-slate-500">{patient.id}</code>
                      <button
                        onClick={() => copyPatientId(patient.id)}
                        className="text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(patient.id)}
                    className="w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove Patient
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
