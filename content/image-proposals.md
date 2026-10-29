# Image proposals (for the user to approve; nothing here is applied)

Checked 2026-10-29 against the live Commons API. Every candidate is a **Public domain** Commons file unless it says otherwise.
"Shape" is the candidate's width/height compared with the entry's stored `ratio` (the real canvas). Our rule is 3% or less.
To apply one: tell me the id, and I run `tools/host_paintings.mjs` on the new URL (1280px, under 500 KB, saved to `public/paintings/<slug>.jpg`).
Painting pages are `https://commons.wikimedia.org/wiki/File:<name>`.

## Broken links (3): the old Wikimedia thumbnail path returns 404
Same artwork, correct file. Wikimedia sometimes renames files; these are the current names.

| id | stored ratio | proposed file | source size | shape | licence |
|---|---|---|---|---|---|
| horse-fair (Rosa Bonheur) | 2.072 | `Rosa Bonheur, The Horse Fair, 1852–55.jpg` | 6324x2995 | +1.9% | Public domain |
| temeraire (Turner) | 1.341 | `Turner, J. M. W. - The Fighting Téméraire tugged to her last Berth to be broken.jpg` | 6000x4455 | +0.5% | Public domain |
| crossing-delaware (Leutze) | 1.711 | `Emanuel Leutze Washington Crossing the Delaware The Metropolitan Museum of Art.jpg` | 3888x2285 | -0.6% | Public domain |

Alternates: horse-fair `The Horse Fair MET DT44.jpg` (CC0, 3811x1962, -6.3%); temeraire `The Fighting Temeraire, JMW Turner, National Gallery.jpg` (5684x4223, +0.4%); crossing-delaware `Emanuel Leutze (American, Schwäbisch Gmünd 1816–1868 Washington, D.C.) - Washington Crossing the Delaware - Google Art Project.jpg` (3874x2269, -0.2%).
Cleveland's "Return from the Horse Fair" is a **different painting**; do not use it.

## Wrong shape (8)

| id | stored ratio / current image | proposed file | source size | shape | licence | note |
|---|---|---|---|---|---|---|
| school-athens (Raphael) | 1.540 / 1.29 (-16%) | `Raphael School of Athens.jpg` | 3697x2414 | -0.6% | Public domain | Current file includes extra wall around the fresco. |
| emmaus (Caravaggio) | 1.390 / 1.20 (-13.7%) | `Supper at Emmaus-Caravaggio (1601).jpg` | 11412x8117 | +1.1% | Public domain | I checked the current image by eye: it is the London 1601 picture, so it is the right work but a tighter crop than the canvas. Alt: `1602-3 Caravaggio,Supper at Emmaus National Gallery, London.jpg` (5946x4226, +1.2%). |
| water-lilies (Monet, 1906) | 0.945 / 1.04 (+10%) | **keep the image**; likely the stored ratio is wrong | 5610x5269 (`Claude Monet - Water Lilies - Google Art Project.jpg`) | +12.7% as stored | Public domain | The image is nearly square and Commons shows the 1906 canvas as near-square; I could not confirm the dimensions from a museum record (Commons was rate-limiting, the Art Institute of Chicago is off limits). Needs a canvas size from a museum page before changing `ratio`. Cleveland's CC0 "Water Lilies (Agapanthus)" is a **different painting**; do not use it. |
| cafe-terrace (van Gogh) | 0.809 / 0.76 (-5.8%) | `Van Gogh - Terrace of a Café at Night (Place du Forum) 1888.jpg` | 6415x8000 | -0.8% | Public domain | Alt: `Vincent Willem van Gogh - Cafe Terrace at Night (Yorck).jpg` (2348x2945, -1.4%). |
| creation-adam (Michelangelo) | 2.100 / 2.20 (+4.9%) | `The Creation of Adam perspective fix.jpg` | 3572x1663 | +2.3% | Public domain | The fresco is cropped from a ceiling bay; any crop is a choice. |
| anatomy-lesson (Rembrandt) | 1.277 / 1.33 (+4%) | `Den Haag - Mauritshuis - Rembrandt Harmensz. van Rijn (1606-1669) - The Anatomy Lesson of Dr. Nicolaes Tulp 1632.jpg` | 5877x4670 | -1.5% | **CC BY-SA 4.0** (photo credit needed) | Only candidate inside 3%. If you want public-domain only, keep the current image (+3.9% to +4.3% for every PD scan). |
| pearl-earring (Vermeer) | 0.876 / 0.84 (-3.7%) | `Meisje met de parel.jpg` | 4095x4794 | -2.5% | Public domain | Alt: `Johannes Vermeer - Girl with a Pearl Earring - 670 - Mauritshuis.jpg` (5068x6000, -3.6%). |
| wheatfield-crows (van Gogh) | 2.040 / 2.10 (+3%) | `Korenveld met kraaien - s0149V1962 - Van Gogh Museum.jpg` | 7762x3718 | +2.4% | Public domain | The Van Gogh Museum's own scan of the painting. |

## Already fixed without a swap
The 46 working images are now our own copies in `public/paintings/` (PR #113), the same pictures as before.
The 3 broken ones still point at the dead Wikimedia link, so the game shows their placeholder colour until you approve a file above.
