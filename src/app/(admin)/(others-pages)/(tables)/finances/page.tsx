"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FinancesTable from "@/components/tables/FinancesTable";

export default function ResidentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResidents() {
      try {

        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/finance", {
          headers: {
            "Content-Type": "application/json"
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
      <PageBreadcrumb pageTitle="Financial Records" />
      <FinancesTable data={data} />
    </div>
  );
}
