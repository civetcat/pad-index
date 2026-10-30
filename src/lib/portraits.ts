const sheetBase = "https://mapaler.github.io/PADDashFormation/images/cards_ja";
const cardArtBase = "https://pazparty.com/b_img";
export const cardFrameSheet = "https://mapaler.github.io/PADDashFormation/images/CARDFRAME2.png";

export function cardArtUrl(monsterId: number) {
  if (!Number.isInteger(monsterId) || monsterId <= 0) {
    return null;
  }
  return `${cardArtBase}/${monsterId}.jpg`;
}

export function portraitPlacement(monsterId: number) {
  if (!Number.isInteger(monsterId) || monsterId <= 0) {
    return null;
  }
  const sheet = Math.ceil(monsterId / 100);
  const index = (monsterId - 1) % 100;
  return {
    url: `${sheetBase}/CARDS_${String(sheet).padStart(3, "0")}.PNG`,
    x: index % 10,
    y: Math.floor(index / 10),
  };
}

export function cardFramePlacement(attribute: number | null | undefined, slot: number) {
  if (attribute == null || !Number.isInteger(attribute) || attribute < 0 || attribute > 6) {
    return null;
  }
  if (slot < 0 || slot > 2 || (slot > 0 && attribute === 6)) {
    return null;
  }
  return { column: attribute, row: slot };
}
