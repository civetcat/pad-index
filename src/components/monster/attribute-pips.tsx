import { attributeColors, attributeLabels, labelOrUnknown } from "@/lib/labels";

export function AttributePips({
  attributes,
}: {
  attributes: Array<number | null | undefined>;
}) {
  const visible = attributes.filter((value): value is number => typeof value === "number" && value >= 0);
  if (visible.length === 0) {
    return <span className="text-sm text-muted">無屬性</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {visible.map((attribute, index) => (
        <span
          key={`${attribute}-${index}`}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
          style={{ background: attributeColors[attribute] ?? "#6b6560" }}
        >
          {labelOrUnknown(attributeLabels, attribute, "屬性")}
        </span>
      ))}
    </span>
  );
}
