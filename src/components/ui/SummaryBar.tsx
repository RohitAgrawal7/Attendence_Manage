interface SummaryBarProps {
  items: { label: string; value: string }[];
}

export function SummaryBar({ items }: SummaryBarProps) {
  return (
    <div className="gradient-primary mx-4 rounded-xl p-4 sm:mx-6 sm:p-5">
      <div className="flex flex-wrap justify-around gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-xl font-bold text-white sm:text-2xl">{item.value}</p>
            <p className="text-xs text-white/75 sm:text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
