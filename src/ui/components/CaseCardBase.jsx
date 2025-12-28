export const CaseCardBase = ({ title, status, meta, right }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm w-full">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-body-bold text-neutral-900">{title}</div>
        <div className="mt-1 text-xs text-neutral-500">{meta}</div>
      </div>
      {right}
    </div>
  </div>
);
