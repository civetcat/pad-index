import { AwakeningIcon } from "@/components/monster/awakening-picker";
import { displaySkillText, skillTokenIcon } from "@/lib/skills/tokens";

const orbSheet = "https://mapaler.github.io/PADDashFormation/images/icon-orbs.png";
const skillSheet = "https://mapaler.github.io/PADDashFormation/images/icon-skills.png";
const typeSheet = "https://mapaler.github.io/PADDashFormation/images/type.png";

export function SkillText({ text }: { text: string }) {
  const parts = displaySkillText(text).split(/(\[[^\]\n]+\])/g);
  return (
    <p lang="ja" className="mt-2 whitespace-pre-wrap text-sm leading-8">
      {parts.map((part, index) => {
        const name = part.match(/^\[([^\]\n]+)\]$/)?.[1];
        const icon = name ? skillTokenIcon(name) : null;
        if (!name || !icon) {
          return <span key={index}>{part}</span>;
        }
        return <TokenIcon key={index} name={name} />;
      })}
    </p>
  );
}

function spriteStyle(
  sheet: string,
  sheetWidth: number,
  sheetHeight: number,
  cell: number,
  column: number,
  row: number,
) {
  const size = 28;
  const scale = size / cell;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${sheet})`,
    backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
    backgroundPosition: `${-column * size}px ${-row * size}px`,
  };
}

function TokenIcon({ name }: { name: string }) {
  const icon = skillTokenIcon(name);
  if (!icon) {
    return <span>[{name}]</span>;
  }
  if (icon.kind === "awakening") {
    return (
      <span className="mx-0.5 inline-flex align-middle">
        <AwakeningIcon code={icon.code} compact />
      </span>
    );
  }
  const style =
    icon.kind === "orb"
      ? spriteStyle(orbSheet, 72, 360, 36, 0, icon.row)
      : icon.kind === "lock"
        ? spriteStyle(skillSheet, 108, 1836, 36, 2, 11)
        : icon.kind === "skill"
          ? spriteStyle(skillSheet, 108, 1836, 36, icon.column, icon.row)
          : spriteStyle(typeSheet, 64, 512, 32, 0, icon.row);
  return (
    <span
      role="img"
      aria-label={icon.label}
      title={icon.label}
      className="mx-0.5 inline-block align-middle bg-no-repeat"
      style={style}
    />
  );
}
