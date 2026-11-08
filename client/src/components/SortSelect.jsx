import Select from "./Select.jsx";

const OPTIONS = [
  ["due_asc", "Hạn gần nhất"],
  ["due_desc", "Hạn xa nhất"],
  ["newest", "Mới tạo"],
];

export default function SortSelect({ value, onChange }) {
  return <Select value={value} onChange={onChange} options={OPTIONS} label="Sắp xếp" aria-label="Sắp xếp công việc" />;
}
