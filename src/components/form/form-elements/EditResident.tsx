"use client";

import { useEffect, useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "../Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "../../../icons";

export default function EditResident() {
  // ============================================
  // FIELD STATE
  // ============================================
  const [block, setBlock] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [note, setNotes] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const raw = localStorage.getItem("editResident");
    if (raw) {

      const parseRes = JSON.parse(raw)
      setBlock(parseRes.block);
      setNumber(parseRes.houseNumber);
      setName(parseRes.fullName);
      setNotes(parseRes.notes);
    }
  }, []);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async () => {
    if (!block || !number || !name) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("block", block);
      form.append("number", number);
      form.append("name", name);
      form.append("month", note);

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
          <Label>House Block</Label>
          <Input
            type="text"
            placeholder="Enter house number"
            defaultValue={block}
            onChange={(e) => setNumber(e.target.value)}
            disabled
          />
        </div>

        {/* House Number */}
        <div>
          <Label>House Number</Label>
          <Input
            type="text"
            placeholder="Enter house number"
            defaultValue={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled
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

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <Input
            type="text"
            placeholder="Notes"
            defaultValue={note}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>



        {/* Submit button */}
        <div className="pt-4">
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Update Payment"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
