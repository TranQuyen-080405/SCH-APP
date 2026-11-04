const LABEL = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const TONE = {
  low: "bg-low-bg text-low-fg",
  medium: "bg-medium-bg text-medium-fg",
  high: "bg-high-bg text-high-fg",
};

export default function PriorityBadge({ priority }) {
  const label = LABEL[priority];
  if (!label) return null;
  return (
    <span className={`inline-flex w-fit rounded-control px-2 py-1 text-sm ${TONE[priority]}`}>
      {label}
    </span>
  );
}
