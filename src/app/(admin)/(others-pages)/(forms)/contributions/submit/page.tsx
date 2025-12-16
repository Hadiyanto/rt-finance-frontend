import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MonthlyInputs from "@/components/form/form-elements/MonthlyInputs";

export default function FormElements() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Pay Monthly Fee" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <MonthlyInputs />
        </div>
      </div>
    </div>
  );
}
