"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Resident = {
  id: number;
  block: string;
  houseNumber: string;
  fullName: string;
  occupancyType: string;
  houseStatus: string;
  notes: string | null;
};

export default function EditResidentPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id; // ← ID yang diklik dari dashboard

  const [form, setForm] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD DATA WARGA
  // ==========================================
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`https://rt-finance-backend.onrender.com/residents/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const json = await res.json();
        setForm(json);
      } catch (err) {
        console.error("Failed to load resident", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading || !form) {
    return <div className="p-6">Loading data...</div>;
  }

  // ==========================================
  // HANDLE SAVE
  // ==========================================
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + `/residents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      alert("Data berhasil diperbarui!");
      router.push("/dashboard"); // kembali ke dashboard
    } catch (err) {
      console.error(err);
      alert("Gagal update data");
    }
  }

  // ==========================================
  // RENDER FORM
  // ==========================================
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">
        Edit Data Warga
      </h1>

      <form onSubmit={handleSave} className="space-y-5 bg-white shadow rounded-xl p-6">

        <div>
          <label className="block text-sm font-medium">Blok</label>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.block}
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Nomor Rumah</label>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.houseNumber}
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Nama Warga</label>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Status Rumah</label>
          <select
            className="border rounded w-full p-2 mt-1"
            value={form.houseStatus}
            onChange={(e) => setForm({ ...form, houseStatus: e.target.value })}
          >
            <option value="occupied">Occupied</option>
            <option value="empty">Empty</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Jenis Hunian</label>
          <select
            className="border rounded w-full p-2 mt-1"
            value={form.occupancyType}
            onChange={(e) =>
              setForm({ ...form, occupancyType: e.target.value })
            }
          >
            <option value="owner">Owner</option>
            <option value="contract">Contract / Rent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Catatan</label>
          <textarea
            className="border rounded w-full p-2 mt-1"
            rows={3}
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Simpan
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg"
          >
            Batal
          </button>
        </div>

      </form>
    </div>
  );
}
