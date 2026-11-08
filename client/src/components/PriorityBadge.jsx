const LABEL = {
  low: "Thấp",
  high: "Cao",
};

const TONE = {
  low: "bg-low-bg text-low-fg",
  high: "bg-high-bg text-high-fg",
};

export default function PriorityBadge({ priority }) {
  const label = LABEL[priority];
  if (!label) return null;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[12px] ${TONE[priority]}`}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
