"use client";

import { useRouter } from "next/navigation";

export default function EditButton({ id }: { id: number }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/dashboard/edit/${id}`)}
      className="bg-blue-600 text-white px-3 py-1 rounded"
    >
      Edit
    </button>
  );
}
