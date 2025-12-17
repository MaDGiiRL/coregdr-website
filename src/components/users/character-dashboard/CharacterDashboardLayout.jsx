export default function CharacterDashboardLayout({ sidebar, main }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {sidebar}
      {main}
    </div>
  );
}
