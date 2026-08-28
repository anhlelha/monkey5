"use client";

import { useRouter } from "next/navigation";

interface Props {
  currentSchool: string;
  schools: Array<{ id: string; short: string; name: string }>;
  className?: string;
}

export function SchoolProfileSelector({ currentSchool, schools, className }: Props) {
  const router = useRouter();

  return (
    <label className={className}>
      <span>Chọn trường</span>
      <select
        value={currentSchool}
        onChange={(event) => router.push(`/admin/readiness/${event.target.value}`)}
        aria-label="Chọn School Profile"
      >
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.short} · {school.name}
          </option>
        ))}
      </select>
    </label>
  );
}
