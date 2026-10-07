"""Give the published Pages artifact headroom without changing illustration dimensions."""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
import io,json
ROOT=Path(__file__).parent;BASE=ROOT/'content/world770';BACKUP=Path('/tmp/world770/original-images')
def refine(p):
 source=BACKUP/p.relative_to(BASE);source=source.with_name(source.name[:-5]);im=Image.open(source);buf=io.BytesIO();im.save(buf,'WEBP',quality=58,method=2);data=buf.getvalue();before=p.stat().st_size
 if len(data)<before:p.write_bytes(data);return before-len(data)
 return 0
if __name__=='__main__':
 paths=list(BASE.rglob('*.webp'));saved=0
 with ProcessPoolExecutor(max_workers=2) as pool:
  for i,n in enumerate(pool.map(refine,paths,chunksize=20)):
   saved+=n
   if i%3000==0:print('refined',i,'/',len(paths),flush=True)
 (ROOT/'WORLD770-IMAGE-REFINEMENT.json').write_text(json.dumps({'images':len(paths),'savedBytes':saved,'quality':58,'dimensions':'unchanged','source':'local pre-WebP backup, not recompression of WebP'},indent=2));print('saved bytes',saved,flush=True)
