"use client";

import { useEffect, useState } from "react";
import EditButton from "./EditButton";

type Resident = {
  id: number;
  block: string;
  houseNumber: string;
  fullName: string;
  occupancyType: string;
  houseStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResidents() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/residents", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const json = await res.json();
        setResidents(json.data);
      } catch (err) {
        console.error("Failed to load residents", err);
      } finally {
        setLoading(false);
      }
    }

    loadResidents();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  }

  // ===============================
  //        STAT CALCULATIONS
  // ===============================

  const total = residents.length;
  const occupied = residents.filter((r) => r.houseStatus === "occupied").length;
  const empty = residents.filter((r) => r.houseStatus === "empty").length;

  const owners = residents.filter((r) => r.occupancyType === "owner").length;
  const renters = residents.filter((r) => r.occupancyType === "contract").length;

  // FIX: recent berdasarkan ID terbaru
  const recent = [...residents]
    .sort((a, b) => a.id - b.id)
    .slice(0, 50);

  // ===============================
  //           RENDER UI
  // ===============================

  return (
    <div className="p-6 space-y-8">

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <DashboardCard label="Total Warga" value={total} />
        <DashboardCard label="Rumah Terisi" value={occupied} />
        <DashboardCard label="Rumah Kosong" value={empty} />
        <DashboardCard label="Pemilik Rumah" value={owners} />
        <DashboardCard label="Kontrak / Sewa" value={renters} />
      </div>

      {/* Recent Updates */}
      <div className="bg-white shadow rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Update Terbaru
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse table-auto">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-3 py-2 text-left w-16">Blok</th>
                <th className="px-3 py-2 text-left w-12">No</th>

                {/* Nama kolom dibuat width terbatas */}
                <th className="px-4 py-2 text-left w-64">Nama</th>

                {/* Status jangan terlalu jauh */}
                <th className="px-3 py-2 text-left w-28">Status</th>

                {/* Note bisa medium */}
                <th className="px-4 py-2 text-left w-52">Note</th>

                {/* Updated tetap proporsional */}
                <th className="px-3 py-2 text-left w-40">Updated</th>

                {/* Edit kecil saja */}
                <th className="px-3 py-2 text-left w-20">Edit</th>
              </tr>
            </thead>

            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 text-gray-900">
                  <td className="px-3 py-2">{r.block}</td>
                  <td className="px-3 py-2">{r.houseNumber}</td>
                  <td className="px-4 py-2">{r.fullName}</td>
                  <td className="px-3 py-2 capitalize">{r.houseStatus}</td>
                  <td className="px-4 py-2 text-gray-600">{r.notes || "-"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.updatedAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-2">
                    <EditButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}

interface DashboardCardProps {
  label: string;
  value: number | string;
}

function DashboardCard({ label, value }: DashboardCardProps) {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
