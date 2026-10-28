// Reads an image's pixel size from its first bytes. JPEG, PNG, WebP and GIF; no dependencies.
// Returns { type, width, height } or null if it isn't an image we recognise.
export function imageSize(buf) {
  const b = Buffer.from(buf);
  if (b.length < 12) return null;
  // PNG
  if (b.readUInt32BE(0) === 0x89504e47 && b.length >= 24) return { type: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  // GIF
  if (b.toString('latin1', 0, 3) === 'GIF') return { type: 'gif', width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  // WebP
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const k = b.toString('latin1', 12, 16);
    if (k === 'VP8X' && b.length >= 30) return { type: 'webp', width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (k === 'VP8 ' && b.length >= 30) return { type: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (k === 'VP8L' && b.length >= 25) {
      const v = b.readUInt32LE(21);
      return { type: 'webp', width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) };
    }
    return null;
  }
  // JPEG: walk the segments to the first start-of-frame
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const m = b[i + 1];
      if (m === 0xff) {
        i++;
        continue;
      }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { type: 'jpeg', width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) i += 2;
      else i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
