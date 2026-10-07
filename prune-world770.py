from pathlib import Path
import json,re,urllib.parse,shutil
from lxml import html
ROOT=Path(__file__).parent;base=ROOT/'content/world770/c10';audit=json.load(open('/tmp/world770/books.json'));paths={base/p for b in audit if b['collection']==10 and 'duplicateOf' not in b for p in b['paths']};keep=set(paths);queue=list(paths);rewritten=0
while queue:
 p=queue.pop();s=p.read_text();ext=p.suffix.lower();refs=[]
 if ext in ['.html','.htm','.xhtml']:
  d=html.fromstring(s.encode())
  for el in d.iter():
   for attr in ['src','href']:
    value=el.get(attr)
    if not value:continue
    u=urllib.parse.urlsplit(value)
    if u.scheme or u.netloc:continue
    target=(p.parent/urllib.parse.unquote(u.path)).resolve() if u.path else p
    if el.tag=='a' and target.suffix.lower() in ['.html','.htm','.xhtml'] and target not in paths:
     # Omit anthology-global navigation to duplicate books, never book text.
     s=s.replace('href="'+value+'"','href="#"').replace("href='"+value+"'","href='#'");rewritten+=1;continue
    refs.append(target)
  p.write_text(s)
 elif ext=='.css':
  for _,value in re.findall(r'url\(\s*([\"\']?)(.*?)\1\s*\)',s):
   u=urllib.parse.urlsplit(value)
   if not u.scheme and not u.netloc:refs.append((p.parent/urllib.parse.unquote(u.path)).resolve())
 for target in refs:
  if target.is_file() and target.is_relative_to(base) and target not in keep:
   keep.add(target)
   if target.suffix.lower() in ['.html','.htm','.xhtml','.css']:queue.append(target)
removed=0;backup=Path('/tmp/world770/omitted-c10')
for p in list(base.rglob('*')):
 if p.is_file() and p not in keep:
  removed+=p.stat().st_size;dest=backup/p.relative_to(base);dest.parent.mkdir(parents=True,exist_ok=True);shutil.move(p,dest)
print('c10 pruned bytes',removed,'kept files',len(keep),'global links removed',rewritten)
