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
  const [block, setBlock] = useState("");
  const [number, setNumber] = useState("");
  const [month, setMonth] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(Date.now());

  const blockOptions = [
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "A3", label: "A3" },
    { value: "A4", label: "A4" },
    { value: "B1", label: "B1" },
  ];

  const monthOptions = [
    // 2025
    { value: "2025-12", label: "December 2025" },

    // 2026
    { value: "2026-01", label: "January 2026" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-03", label: "March 2026" },
    { value: "2026-04", label: "April 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-06", label: "June 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-10", label: "October 2026" },
    { value: "2026-11", label: "November 2026" },
    { value: "2026-12", label: "December 2026" },
  ];


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!block || !number || !month) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("block", block);
      form.append("houseNumber", number);
      form.append("date", month); // YYYY-MM → backend akan convert

      if (file) {
        form.append("image", file);
      }

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/monthly-fee",
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
      setMonth("");
      setFile(null);
      setFileKey(Date.now());
    } catch (err) {
      console.error(err);
      alert("Error submitting payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="">
      <div className="space-y-6">

        {/* Block */}
        <div>
          <Label>Block</Label>
          <div className="relative">
            <Select
              options={blockOptions}
              value={block}
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
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        {/* Month */}
        <div>
          <Label>Select Month</Label>
          <div className="relative">
            <Select
              options={monthOptions}
              value={month}
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
          <Label>Upload Transfer Proof (optional)</Label>
          <FileInput key={fileKey} onChange={handleFileChange} />
          {file && <p className="mt-1 text-sm text-gray-600">{file.name}</p>}
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
