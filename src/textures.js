// Placeholder pixel art, drawn in code so there are no image files to swap
// out later. Replace these with a real tileset when art is ready.
export const T = 16; // tile size in pixels

const C = {
  void: '#2a211d',
  trimDark: '#4a3a30',
  trim: '#6b5646',
  trimLight: '#8a7058',
  wall: '#b9b2a5',
  wallSeam: '#a69f92',
  wallLight: '#c6c0b4',
  stain: 'rgba(110, 84, 52, 0.35)',
  baseboard: '#4a3f37',
  baseboardLight: '#5d5047',
  floor: '#7d8085',
  floorLight: '#8b8e93',
  grout: '#626569',
  crack: '#4b4d51',
  dirt: 'rgba(92, 72, 50, 0.35)',
};

function canvasTexture(scene, key, w, h, draw) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const px = (x, y, pw = 1, ph = 1, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, pw, ph);
  };
  draw(px, ctx);
  tex.refresh();
}

function floorBase(px) {
  px(0, 0, T, T, C.floor);
  px(0, 0, T - 1, 1, C.floorLight);
  px(0, 0, 1, T - 1, C.floorLight);
  px(T - 1, 0, 1, T, C.grout);
  px(0, T - 1, T, 1, C.grout);
  px(5, 6, 1, 1, C.floorLight);
  px(11, 10, 1, 1, C.grout);
}

function wallBase(px) {
  px(0, 0, T, T, C.wall);
  px(T - 1, 0, 1, T, C.wallSeam);
  px(0, 0, 1, T, C.wallLight);
}

export function makeTextures(scene) {
  canvasTexture(scene, 'floor', T, T, floorBase);
  canvasTexture(scene, 'floor_crack', T, T, (px) => {
    floorBase(px);
    [[3, 4], [4, 5], [5, 5], [6, 6], [7, 7], [7, 8], [8, 9], [9, 9], [10, 10], [11, 11]].forEach(([x, y]) =>
      px(x, y, 1, 1, C.crack),
    );
    px(6, 7, 1, 1, C.crack);
    px(5, 8, 1, 1, C.crack);
  });
  canvasTexture(scene, 'floor_dirt', T, T, (px) => {
    floorBase(px);
    px(4, 5, 7, 4, C.dirt);
    px(5, 4, 5, 6, C.dirt);
  });

  // Back wall, upper row: crown molding at the top.
  canvasTexture(scene, 'wall_top', T, T, (px) => {
    wallBase(px);
    px(0, 0, T, 2, C.trim);
    px(0, 2, T, 1, C.trimLight);
  });
  // Back wall, lower row: baseboard at the bottom.
  canvasTexture(scene, 'wall_low', T, T, (px) => {
    wallBase(px);
    px(0, T - 3, T, 3, C.baseboard);
    px(0, T - 3, T, 1, C.baseboardLight);
  });

  canvasTexture(scene, 'ceiling', T, T, (px) => {
    px(0, 0, T, T, C.void);
    px(0, T - 2, T, 2, C.trimDark);
  });
  // Side walls are 2 tiles wide, drawn "folded down" like Pokémon interiors:
  // crown molding on the outer edge, baseboard on the edge touching the floor.
  const sideFace = (px) => {
    px(0, 0, T, T, C.wall);
    px(0, T - 1, T, 1, C.wallSeam);
    px(0, 0, T, 1, C.wallLight);
  };
  canvasTexture(scene, 'side_l_out', T, T, (px) => {
    sideFace(px);
    px(0, 0, 3, T, C.trim);
    px(3, 0, 1, T, C.trimLight);
  });
  canvasTexture(scene, 'side_l_base', T, T, (px) => {
    sideFace(px);
    px(T - 3, 0, 3, T, C.baseboard);
    px(T - 3, 0, 1, T, C.baseboardLight);
  });
  canvasTexture(scene, 'side_r_out', T, T, (px) => {
    sideFace(px);
    px(T - 3, 0, 3, T, C.trim);
    px(T - 4, 0, 1, T, C.trimLight);
  });
  canvasTexture(scene, 'side_r_base', T, T, (px) => {
    sideFace(px);
    px(0, 0, 3, T, C.baseboard);
    px(2, 0, 1, T, C.baseboardLight);
  });
  // Water stain overlay for the run-down look; placed on any wall tile.
  canvasTexture(scene, 'stain', T, T, (px) => {
    px(3, 4, 9, 3, C.stain);
    px(2, 5, 3, 2, C.stain);
    px(5, 7, 6, 2, C.stain);
    px(9, 7, 2, 4, C.stain);
    px(6, 9, 2, 2, C.stain);
  });
  canvasTexture(scene, 'doormat', T, T, (px) => {
    px(0, 0, T, T, C.void);
    px(0, 0, T, 2, C.trimDark);
    px(1, 3, T - 2, 8, '#5a3b2c');
    px(2, 4, T - 4, 6, '#6e4a37');
  });
  canvasTexture(scene, 'front', T, T, (px) => {
    px(0, 0, T, T, C.void);
    px(0, 0, T, 2, C.trimDark);
  });

  makePlayer(scene);
}

// 16x16 curator: maroon blazer, dark trousers.
function makePlayer(scene) {
  const hair = '#3b2a20';
  const skin = '#f1c39b';
  const coat = '#7a2e3a';
  const coatLight = '#954152';
  const shirt = '#eae3d2';
  const pants = '#2d2a3a';
  const shoes = '#16131a';
  const eye = '#1d1714';
  const outline = '#1d1714';

  const body = (px) => {
    // torso
    px(4, 8, 8, 5, outline);
    px(5, 8, 6, 4, coat);
    px(5, 8, 1, 4, coatLight);
    // legs
    px(5, 12, 6, 2, pants);
    px(5, 14, 2, 1, shoes);
    px(9, 14, 2, 1, shoes);
  };

  canvasTexture(scene, 'player_down', T, T, (px) => {
    px(4, 1, 8, 7, outline);
    px(5, 1, 6, 2, hair);
    px(5, 3, 6, 4, skin);
    px(5, 3, 1, 1, hair);
    px(10, 3, 1, 1, hair);
    px(6, 5, 1, 1, eye);
    px(9, 5, 1, 1, eye);
    body(px);
    px(7, 8, 2, 3, shirt);
  });
  canvasTexture(scene, 'player_up', T, T, (px) => {
    px(4, 1, 8, 7, outline);
    px(5, 1, 6, 6, hair);
    body(px);
  });
  canvasTexture(scene, 'player_side', T, T, (px) => {
    px(5, 1, 7, 7, outline);
    px(6, 1, 5, 2, hair);
    px(6, 3, 5, 4, skin);
    px(6, 3, 2, 3, hair);
    px(9, 5, 1, 1, eye);
    body(px);
    px(9, 8, 2, 2, shirt);
  });
}
