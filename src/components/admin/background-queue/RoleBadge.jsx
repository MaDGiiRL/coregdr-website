import { rolePill } from "./ui";

export default function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] ${rolePill(
        role
      )}`}
    >
      <span className="font-semibold">{role}</span>
    </span>
  );
}
