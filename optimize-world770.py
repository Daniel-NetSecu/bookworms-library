"""Convert new anthology illustrations to WebP when smaller; keep pixel dimensions.
Original JPEG/PNG remain in the user's untouched ZIP and temporary local backup.
"""
from pathlib import Path
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import io,json,re,urllib.parse,os,shutil
ROOT=Path(__file__).parent;BASE=ROOT/'content/world770';BACKUP=Path('/tmp/world770/original-images')
def convert(p):
 data=p.read_bytes();target=p.with_name(p.name+'.webp')
 if target.exists():
  try:
   Image.open(target).verify();return (str(p),True,len(data),target.stat().st_size)
  except Exception:pass
 im=Image.open(io.BytesIO(data));buf=io.BytesIO();im.save(buf,'WEBP',quality=68,method=2);out=buf.getvalue()
 if len(out)>=len(data):return (str(p),False,len(data),len(data))
 target=p.with_name(p.name+'.webp');target.write_bytes(out)
 return (str(p),True,len(data),len(out))
if __name__=='__main__':
 paths=[p for p in BASE.rglob('*') if p.suffix.lower() in ['.jpg','.jpeg','.png']];mapping={};before=after=0
 with ProcessPoolExecutor(max_workers=2) as pool:
  for i,(s,changed,a,b) in enumerate(pool.map(convert,paths,chunksize=10)):
   before+=a;after+=b
   if changed:mapping[Path(s).resolve()]=Path(s+'.webp').resolve()
   if i%500==0:print('images',i,'/',len(paths),flush=True)
 for p in BASE.rglob('*'):
  if p.suffix.lower() not in ['.xhtml','.html','.htm','.css','.opf','.ncx','.xml','.svg']:continue
  s=p.read_text()
  def rewrite(value):
   u=urllib.parse.urlsplit(value)
   if u.scheme or u.netloc:return value
   target=(p.parent/urllib.parse.unquote(u.path)).resolve()
   if target not in mapping:return value
   return urllib.parse.urlunsplit(('', '',u.path+'.webp',u.query,u.fragment))
  s=re.sub(r'((?:src|href|xlink:href)\s*=\s*)([\"\'])(.*?)\2',lambda m:m[1]+m[2]+rewrite(m[3])+m[2],s,flags=re.I)
  s=re.sub(r'(url\(\s*)([\"\']?)([^)\"\']+)\2(\s*\))',lambda m:m[1]+m[2]+rewrite(m[3])+m[2]+m[4],s,flags=re.I)
  p.write_text(s)
 for old in mapping:
  dest=BACKUP/old.relative_to(BASE);dest.parent.mkdir(parents=True,exist_ok=True);shutil.move(old,dest)
 report={'converted':len(mapping),'inputImages':len(paths),'beforeBytes':before,'afterBytes':after,'quality':68,'dimensions':'unchanged from responsive JPEG optimization'}
 (ROOT/'WORLD770-IMAGES.json').write_text(json.dumps(report,indent=2));print(report,flush=True)
