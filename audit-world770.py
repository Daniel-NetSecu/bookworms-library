import zipfile,io,json,posixpath,xml.etree.ElementTree as E,hashlib,re
from lxml import html
from pathlib import Path
ROOT=Path(__file__).parent
WORK=Path('/tmp/world770');WORK.mkdir(parents=True,exist_ok=True)
z=zipfile.ZipFile('/home/ait/下载/770本世界名著(英汉双语版).zip')
assert z.testzip() is None,'Archive CRC failed'
inv=[]
for name in z.namelist():
 if not name.endswith('.epub'):continue
 data=z.read(name);ez=zipfile.ZipFile(io.BytesIO(data));assert ez.testzip() is None,name
 opf=E.fromstring(ez.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path');op=E.fromstring(ez.read(opf));ni=next(v for v in op.findall('.//{*}manifest/{*}item') if v.get('media-type')=='application/x-dtbncx+xml');np=posixpath.normpath(posixpath.join(posixpath.dirname(opf),ni.get('href')))
 def navtree(n):return {'title':n.findtext('{*}navLabel/{*}text'),'src':n.find('{*}content').get('src'),'children':[navtree(c) for c in n.findall('{*}navPoint')]}
 inv.append({'source':name,'bytes':len(data),'expanded':sum(v.file_size for v in ez.infolist()),'bad':None,'nav':[navtree(n) for n in E.fromstring(ez.read(np)).findall('{*}navMap/{*}navPoint')]})
(WORK/'inventory.json').write_text(json.dumps(inv,ensure_ascii=False,indent=2))
def text(data):
 d=html.fromstring(data); b=d.find('body'); b=b if b is not None else d
 for x in b.xpath('.//script|.//style'):x.drop_tree()
 return re.sub(r'\s+','',b.text_content()).replace('返回总目录','')
def select(i,nav):
 if i==0:return [b for l in nav[1]['children'] for b in l['children']]
 if i==2:return [b for x in nav for b in (x['children'] if '小黑书 第' in x['title'] else [x]) if re.match(r'^\d\d ',b['title'])]
 if i in [3,14]:return [b for x in nav for b in x['children']]
 if i==6:return nav[2:]
 return [x for x in nav if x['title'] not in ['总目录','正文目录']]
seen={};out=[]
for i,a in enumerate(inv):
 ez=zipfile.ZipFile(io.BytesIO(z.read(a['source'])));p=E.fromstring(ez.read('META-INF/container.xml')).find('.//{*}rootfile').get('full-path');o=E.fromstring(ez.read(p));od=posixpath.dirname(p);items={x.get('id'):posixpath.normpath(posixpath.join(od,x.get('href'))) for x in o.findall('.//{*}manifest/{*}item')};sp=[items[x.get('idref')] for x in o.findall('.//{*}spine/{*}itemref')];nc=next(x for x in o.findall('.//{*}manifest/{*}item') if x.get('media-type')=='application/x-dtbncx+xml');nd=posixpath.dirname(items[nc.get('id')]);books=select(i,a['nav']); starts=[sp.index(posixpath.normpath(posixpath.join(nd,b['src'].split('#')[0]))) for b in books];cache={}
 for k,b in enumerate(books):
  lo=starts[k];hi=min((v for v in starts if v>lo),default=len(sp));paths=sp[lo:hi];ts=[]
  for path in paths:
   t=text(ez.read(path));cache[path]=t
   if t:ts.append(t)
  fp=hashlib.sha256('\n'.join(ts).encode()).hexdigest();r={'collection':i,'title':b['title'],'paths':paths,'fingerprint':fp,'characters':sum(map(len,ts)),'node':b,'ncx_dir':nd}
  if i==0:
   # Compare source body text against the already published chapter at the same path.
   def flat(n):return [n]+[v for c in n['children'] for v in flat(c)]
   refs={posixpath.normpath(posixpath.join(nd,v['src'].split('#')[0])) for v in flat(b)}
   old=next(v for l in json.load(open(ROOT/'catalog.json')) for v in l['children'] if v['title']==b['title'])
   def oldflat(n):return [n]+[v for c in n['children'] for v in oldflat(c)]
   oldrefs=list(dict.fromkeys(v['href'].split('#')[0] for v in oldflat(old)))
   oldtext=''.join(text((ROOT/path).read_bytes()) for path in oldrefs)
   newtext=''.join(ts)
   # EPUB re-pagination can split one former chapter across many files.
   r['existingTextContained']=oldtext in newtext
   r['existingTextCharacters']=len(oldtext)
   if not r['existingTextContained']:
    r['matchingChunks']=sum(oldtext[j:j+200] in newtext for j in range(0,len(oldtext),200))
    r['totalChunks']=(len(oldtext)+199)//200
   assert r['existingTextContained'] or r['matchingChunks']/r['totalChunks']>0.98, 'Review source edition: '+b['title']
   r['duplicateOf']='existing-bookworms'
  elif fp in seen:r['duplicateOf']=seen[fp]
  else:seen[fp]=f'{i}:{b["title"]}'
  if i==7 and b['title']=='双重人格':
   wrong=next(v for v in out if v['collection']==7 and v['title']=='马丁·伊登')
   assert wrong['fingerprint']==fp
   wrong['duplicateOf']='7:双重人格';wrong['note']='原目录误标马丁·伊登，正文为双重人格；保留正确书名条目'
   r.pop('duplicateOf',None);seen[fp]='7:双重人格'
  out.append(r)
 print(i,'books',len(books),'duplicates',sum('duplicateOf'in x for x in out if x['collection']==i),flush=True)
json.dump(out,open('/tmp/world770/books.json','w'),ensure_ascii=False,indent=2)
