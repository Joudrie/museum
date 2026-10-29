# Contact sheet for checking turn families by eye: python3 tools/rotation_sheet.py <sheet name e.g. seating> <from> <to> [scale]
# Writes /tmp/<sheet>_<from>.png (set the OUT path below if needed). Never auto-group: look at every set.
import json,sys
from PIL import Image,ImageDraw
d=json.load(open('public/builder/pieces.json'))
name,a,b=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
g=[x for x in d['groups'] if x['sheet'].endswith(name+'.png')][0]
im=Image.open('public/'+g['sheet']).convert('RGBA')
ps=g['pieces'][a:b]
S=int(sys.argv[4]) if len(sys.argv)>4 else 2;cell=(max(p['w'] for p in ps)*S+4,max(p['h'] for p in ps)*S+14)
cols=min(10,len(ps));rows=(len(ps)+cols-1)//cols
out=Image.new('RGBA',(cols*cell[0],rows*cell[1]),(70,90,70,255))
dr=ImageDraw.Draw(out)
for i,p in enumerate(ps):
  c=im.crop((p['x'],p['y'],p['x']+p['w'],p['y']+p['h'])).resize((p['w']*S,p['h']*S),Image.NEAREST)
  x=(i%cols)*cell[0];y=(i//cols)*cell[1]
  out.alpha_composite(c,(x+2,y+12))
  dr.text((x+2,y),p['id'].split('/')[1],fill=(255,255,0,255))
out.convert('RGB').save(f'/tmp/{name}_{a}.png')
print(out.size)
