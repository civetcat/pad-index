import { inflateRawSync } from "node:zlib";

// IOSCh: single-byte XOR of data[5] from offset 12, then raw inflate.
// Same method as MIT-licensed tactical-retreat/pad-resources src/models/bc.ts.
export function decryptIosc(data: Buffer) {
  if (data.subarray(0, 5).toString("latin1") !== "IOSCh") {
    throw new Error(`not IOSCh: ${data.subarray(0, 5).toString("hex")}`);
  }
  const key = data[5] ?? 0;
  const packed = Buffer.from(data.subarray(12));
  for (let i = 0; i < packed.length; i += 1) {
    packed[i] = (packed[i] ?? 0) ^ key;
  }
  return inflateRawSync(packed);
}
