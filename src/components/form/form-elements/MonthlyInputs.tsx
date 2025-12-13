"use client";

import React, { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "../Select";
import FileInput from "../input/FileInput";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "../../../icons";

export default function MonthlyInputs() {
  // ============================================
  // FIELD STATE
  // ============================================
  const [block, setBlock] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const blockOptions = [
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "A3", label: "A3" },
    { value: "A4", label: "A4" },
    { value: "B1", label: "B1" },
  ];

  const monthOptions = [
    { value: "2025-01", label: "January 2025" },
    { value: "2025-02", label: "February 2025" },
    { value: "2025-03", label: "March 2025" },
    { value: "2025-04", label: "April 2025" },
  ];

  // ============================================
  // FILE INPUT HANDLER
  // ============================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async () => {
    if (!block || !number || !name || !month) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("block", block);
      form.append("number", number);
      form.append("name", name);
      form.append("month", month);

      if (file) {
        form.append("file", file);
      }

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/payment-entry",
        {
          method: "POST",
          body: form,
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to submit");
      }

      alert("Payment submitted successfully!");

      // Reset form
      setBlock("");
      setNumber("");
      setName("");
      setMonth("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error submitting payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Payment Entry">
      <div className="space-y-6">

        {/* Block */}
        <div>
          <Label>Block</Label>
          <div className="relative">
            <Select
              options={blockOptions}
              defaultValue={block}
              placeholder="Select block"
              onChange={setBlock}
              className="dark:bg-dark-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* House Number */}
        <div>
          <Label>House Number</Label>
          <Input
            type="text"
            placeholder="Enter house number"
            defaultValue={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        {/* Name */}
        <div>
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="Resident name"
            defaultValue={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Month */}
        <div>
          <Label>Select Month</Label>
          <div className="relative">
            <Select
              options={monthOptions}
              defaultValue={month}
              placeholder="Select month"
              onChange={setMonth}
              className="dark:bg-dark-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* File upload */}
        <div>
          <Label>Upload File (optional)</Label>
          <FileInput onChange={handleFileChange} />
          {file && (
            <p className="mt-1 text-sm text-gray-600">{file.name}</p>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Payment"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
