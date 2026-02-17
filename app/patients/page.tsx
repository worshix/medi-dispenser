"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, Edit, Copy } from "lucide-react";
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

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });

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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-500">Manage patient information and medication</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="medication">Medication</Label>
                  <Input
                    id="medication"
                    value={formData.medication}
                    onChange={(e) =>
                      setFormData({ ...formData, medication: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <Label htmlFor="pill1">Pill 1</Label>
                    <Input
                      id="pill1"
                      type="number"
                      value={formData.pill1Count}
                      onChange={(e) =>
                        setFormData({ ...formData, pill1Count: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pill2">Pill 2</Label>
                    <Input
                      id="pill2"
                      type="number"
                      value={formData.pill2Count}
                      onChange={(e) =>
                        setFormData({ ...formData, pill2Count: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pill3">Pill 3</Label>
                    <Input
                      id="pill3"
                      type="number"
                      value={formData.pill3Count}
                      onChange={(e) =>
                        setFormData({ ...formData, pill3Count: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pill4">Pill 4</Label>
                    <Input
                      id="pill4"
                      type="number"
                      value={formData.pill4Count}
                      onChange={(e) =>
                        setFormData({ ...formData, pill4Count: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pill5">Pill 5</Label>
                    <Input
                      id="pill5"
                      type="number"
                      value={formData.pill5Count}
                      onChange={(e) =>
                        setFormData({ ...formData, pill5Count: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Add Patient
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Patients Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {patient.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">Age: {patient.age}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      patient.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {patient.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Condition</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.condition}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Medication</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.medication}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pill Counts</p>
                  <div className="mt-1 flex gap-2">
                    {[
                      patient.pill1Count,
                      patient.pill2Count,
                      patient.pill3Count,
                      patient.pill4Count,
                      patient.pill5Count,
                    ].map((count, idx) => (
                      <div
                        key={idx}
                        className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-700"
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Patient ID (Controller Key)</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs">
                      {patient.id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPatientId(patient.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(patient.id)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {patients.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">No patients yet</p>
                <p className="text-sm text-gray-500">
                  Add your first patient to get started
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
