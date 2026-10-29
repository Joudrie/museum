// One-tap room styles, kept apart from decor.js so Node tests and the hall presets can read them.
export const THEMES = {
  classical: { name: 'Classical gallery', decor: { pattern: 'marble', floor: '#e9e6df', paperStyle: 'damask', paper: '#7a3a3e', wainscotStyle: 'panels', wainscot: '#3e2a20', carpet: true, carpetColor: '#7a2232', light: 'warm', music: 'gallery' } },
  egyptian: { name: 'Egyptian', decor: { pattern: 'sand', floor: '#d9c7a8', paperStyle: 'hieroglyph', paper: '#d9b878', wainscotStyle: 'none', wainscot: '#a8862e', carpet: false, light: 'warm', music: 'egypt' } },
  japanese: { name: 'Japanese', decor: { pattern: 'parquet', floor: '#cfae80', paperStyle: 'sakura', paper: '#f0ece2', wainscotStyle: 'panels', wainscot: '#5c3a26', carpet: false, light: 'day', music: 'japan' } },
  science: { name: 'Natural history', decor: { pattern: 'stone', floor: '#9a968f', paperStyle: 'plain', paper: '#8a9a8a', wainscotStyle: 'panels', wainscot: '#3e2a20', carpet: false, light: 'cool', music: 'science' } },
  modern: { name: 'Modern white', decor: { pattern: 'tile', floor: '#e9e6df', paperStyle: 'plain', paper: '#f0ece2', wainscotStyle: 'none', wainscot: '#cfcfcf', carpet: false, light: 'day', music: 'none' } },
  moody: { name: 'Moody', decor: { pattern: 'herringbone', floor: '#5c3a26', paperStyle: 'stripes', paper: '#2f4a3a', wainscotStyle: 'panels', wainscot: '#1e1e22', carpet: true, carpetColor: '#c9a23f', light: 'moody', music: 'gallery' } },
};
