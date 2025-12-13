"use client";

import { useState } from "react";

export default function InputKeuanganPage() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      amount,
      type,
      note,
      file,
    });

    alert("Data keuangan berhasil disubmit!");
  };

  return (
    <div className="p-6">

      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Input Keuangan
      </h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-4xl">

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Jumlah */}
          <div>
            <label className="block font-medium mb-1">Jumlah</label>
            <input
              type="number"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan jumlah uang"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Jenis */}
          <div>
            <label className="block font-medium mb-1">Jenis</label>
            <select
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label className="block font-medium mb-1">Catatan</label>
            <textarea
              rows={4}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="Tambahkan catatan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block font-medium mb-1">Lampiran (Opsional)</label>

            <input
              type="file"
              className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <p className="text-gray-500 text-sm mt-1">
              Bisa upload foto struk, bukti transfer, atau dokumen lainnya.
            </p>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition"
            >
              Submit
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
