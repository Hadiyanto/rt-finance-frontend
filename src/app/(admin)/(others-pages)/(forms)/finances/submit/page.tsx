"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MonthlyInputs from "@/components/form/form-elements/MonthlyInputs";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

export default function FormElements() {
  useTokenAutoCheck();

  return (
    <div>
      <PageBreadcrumb pageTitle="Submit Transaction" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <MonthlyInputs />
        </div>
      </div>
    </div>
  );
}
