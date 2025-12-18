"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "../Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "../../../icons";

export default function InputTransactions() {
  // ============================================
  // FIELD STATES
  // ============================================
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [date, setDate] = useState("");

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================================
  // FETCH CATEGORY + TYPES
  // ============================================
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []))
      .catch(() => setCategories([]));

    fetch(process.env.NEXT_PUBLIC_API_URL + "/api/transaction-types")
      .then((r) => r.json())
      .then((json) => setTypes(json.data ?? []))
      .catch(() => setTypes([]));
  }, []);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async () => {
    if (!amount || !description || !categoryId || !typeId || !date) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amount: Number(amount),
        description,
        categoryId: Number(categoryId),
        typeId: Number(typeId),
        date,
      };

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/finance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Submit failed");

      alert("Transaction submitted!");

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
      setTypeId("");
      setDate("");

    } catch (err) {
      console.error(err);
      alert("Error submitting transaction.");
    } finally {
      setLoading(false);
    }
  };

  // Transform select options
  const categoryOptions = categories.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  const typeOptions = types.map((t: any) => ({
    value: t.id,
    label: t.name.toUpperCase(),
  }));

  return (
    <ComponentCard title="">
      <div className="space-y-6">

        {/* Amount */}
        <div>
          <Label>
            Amount <span className="text-error-500">*</span>
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Enter amount"
            defaultValue={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <Label>
            Description <span className="text-error-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Enter description"
            defaultValue={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <Label>
            Category <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Select
              options={categoryOptions}
              defaultValue={categoryId}
              placeholder="Select category"
              onChange={setCategoryId}
              className="dark:bg-dark-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <Label>
            Transaction Type <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Select
              options={typeOptions}
              defaultValue={typeId}
              placeholder="Select type"
              onChange={setTypeId}
              className="dark:bg-dark-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Date */}
        <div>
          <Label>
            Date <span className="text-error-500">*</span>
          </Label>
          <Input
            type="date"
            defaultValue={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Transaction"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
