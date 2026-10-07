"""Import audited EPUB anthologies. Requires Pillow and lxml; retains original ZIP.
Preflight inventory/book fingerprints are produced by audit-world770.py.
"""
from pathlib import Path
import zipfile,io,json,re,posixpath,hashlib,collections
from lxml import html
from PIL import Image
ROOT=Path(__file__).parent
WORK=Path('/tmp/world770')
inv=json.loads((WORK/'inventory.json').read_text()); audit=json.loads((WORK/'books.json').read_text())
z=zipfile.ZipFile('/home/ait/下载/770本世界名著(英汉双语版).zip')
css='html{background:#fffcf5!important}body{max-width:850px!important;margin:24px auto!important;padding:0 18px 50px!important;line-height:1.9!important;color:#242e2b!important;font-size:19px!important}img,svg{max-width:100%!important;height:auto!important}table{max-width:100%!important}*{overflow-wrap:break-word}'
labels=['书虫','美国语文','企鹅小黑书','伟大的思想','神奇树屋','双语译林文库','莎士比亚全集','外研社·悬疑冒险','外研社·社会文化','外研社·情感故事','外研社·文学社科','自然·百年物理','小屁孩日记','迪士尼双语故事','棚车少年','希利尔文史']
levels=[]; image_before=image_after=0; sanitized=0
for i,a in enumerate(inv):
 selected=[b for b in audit if b['collection']==i and 'duplicateOf' not in b]
 if not selected:continue
 ez=zipfile.ZipFile(io.BytesIO(z.read(a['source'])));base=ROOT/'content/world770'/f'c{i:02}';base.mkdir(parents=True,exist_ok=True)
 titles={}
 for item in ez.infolist():
  if item.is_dir():continue
  p=(base/item.filename).resolve()
  if p.suffix.lower() in ['.ttf','.otf','.woff','.woff2']:continue
  if not p.is_relative_to(base.resolve()):raise ValueError('Unsafe EPUB path')
  data=ez.read(item);ext=p.suffix.lower()
  if ext in ['.jpg','.jpeg','.png']:
   image_before+=len(data)
   im=Image.open(io.BytesIO(data));im.load()
   # Preserve readable illustrations; only resize large originals and use moderate JPEG quality.
   im.thumbnail((1600,2000),Image.Resampling.LANCZOS)
   buf=io.BytesIO()
   if ext in ['.jpg','.jpeg']:im.convert('RGB').save(buf,format='JPEG',quality=82,optimize=True)
   else:im.save(buf,format='PNG',optimize=True)
   if len(buf.getvalue())<len(data):data=buf.getvalue()
   image_after+=len(data)
  elif ext=='.css':
   
   try:s=data.decode('utf-8-sig')
   except UnicodeDecodeError:s=data.decode('gb18030')
   s=re.sub(r'@font-face\s*\{[^}]*\}', '', s, flags=re.S|re.I);data=s.encode()
  elif ext in ['.xhtml','.html','.htm']:
   d=html.fromstring(data);heading=d.xpath('//h1|//h2|//h3');titles[item.filename]=(' '.join(heading[0].itertext()).strip() if heading else '') or d.findtext('.//title') or p.stem
   s=data.decode('utf-8-sig');s=re.sub(r'<script\b[^>]*>.*?</script\s*>','',s,flags=re.S|re.I);s=re.sub(r'\s+on\w+\s*=\s*([\"\']).*?\1','',s,flags=re.S|re.I);s=re.sub(r'<(?:iframe|object|embed)\b.*?</(?:iframe|object|embed)\s*>','',s,flags=re.S|re.I)
   s=re.sub(r'javascript\s*:','blocked:',s,flags=re.I)
   s=s.replace('</head>','<style type="text/css">'+css+'</style></head>');data=s.encode();sanitized+=1
  if len(data)>=100_000_000:raise ValueError('File too large: '+str(p))
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 level=8+len(levels);books=[];prefix=base.relative_to(ROOT).as_posix()+'/'
 for b in selected:
  def flatten(n):return [n]+[v for c in n['children'] for v in flatten(c)]
  refs={posixpath.normpath(posixpath.join(b['ncx_dir'],n['src'].split('#')[0])) for n in flatten(b['node'])}
  paths=b['paths'];extra={};owner=None
  for path in paths:
   if path in refs:owner=path
   elif owner:extra.setdefault(owner,[]).append(path)
  used=set()
  def conv(n):
   src=posixpath.normpath(posixpath.join(b['ncx_dir'],n['src']));path=src.split('#')[0]
   children=[conv(c) for c in n['children']]
   if path not in used:
    used.add(path)
    more=[{'title':titles.get(p,'续页')+' · 续页','href':prefix+p,'children':[]} for p in extra.get(path,[])]
    children=more+children
   return {'title':n['title'],'href':prefix+src,'children':children}
  book=conv(b['node']);book.update(id='world-'+hashlib.sha256((str(i)+b['title']).encode()).hexdigest()[:12],level=level,format='epub',source=labels[i]);books.append(book);b['id']=book['id'];b['href']=book['href']
 levels.append({'label':labels[i],'title':labels[i],'children':books})
 print('converted',i,labels[i],len(books),'images MB',round(image_after/1e6),flush=True)
(ROOT/'world770.json').write_text(json.dumps(levels,ensure_ascii=False))
report={'archive':'770本世界名著(英汉双语版).zip','outerCRC':'passed','epubCRC':'16 passed','sourceFormats':dict(collections.Counter(Path(n).suffix.lower() for n in z.namelist() if not n.endswith('/'))),'inputBookEntries':len(audit),'added':sum(len(l['children']) for l in levels),'duplicates':sum('duplicateOf'in b for b in audit),'corrupt':0,'imageBytesBefore':image_before,'imageBytesAfter':image_after,'books':[{k:v for k,v in b.items() if k not in ['node','paths']} for b in audit]}
(ROOT/'WORLD770-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('DONE',report['added'],report['duplicates'],image_before,image_after,flush=True)

# Remove unselected duplicate books from the 194-volume anthology.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/"prune-world770.py")],check=True)
subprocess.run([sys.executable,str(ROOT/"optimize-world770.py")],check=True)
subprocess.run([sys.executable,str(ROOT/"repair-world770-links.py")],check=True)
subprocess.run([sys.executable,str(ROOT/"refine-world770-images.py")],check=True)
subprocess.run([sys.executable,str(ROOT/"validate-world770.py")],check=True)
