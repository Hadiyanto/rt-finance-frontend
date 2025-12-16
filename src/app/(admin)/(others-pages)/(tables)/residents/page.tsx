"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ResidentsTable from "@/components/tables/ResidentsTable";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

export default function ResidentsPage() {
  useTokenAutoCheck();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResidents() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/residents", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        setData(json.data ?? []);
      } catch (error) {
        console.error("Error fetching residents:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResidents();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <PageBreadcrumb pageTitle="Residents" />
      <ResidentsTable data={data} />
    </div>
  );
}
