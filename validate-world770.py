from pathlib import Path
import json,re,urllib.parse,posixpath
from lxml import html
ROOT=Path(__file__).parent;errors=[];cache={};counts={'catalogLinks':0,'assetLinks':0,'documentLinks':0}
def ids(p):
 if p not in cache:
  d=html.fromstring(p.read_bytes());cache[p]=set(d.xpath('//@id')+d.xpath('//a/@name'))
 return cache[p]
def check(path,frag,kind,origin):
 if not path.is_file():errors.append([kind,'missing',str(origin),str(path),frag])
 elif frag and path.suffix.lower() in ['.htm','.html','.xhtml'] and frag not in ids(path):errors.append([kind,'fragment',str(origin),str(path),frag])
def walk(n):
 if 'href' in n:
  u=urllib.parse.urlsplit(n['href']);check(ROOT/urllib.parse.unquote(u.path),urllib.parse.unquote(u.fragment),'catalog',n['title']);counts['catalogLinks']+=1
 for c in n.get('children',[]):walk(c)
for fn in ['catalog.json','classics.json','world770.json']:
 a=json.loads((ROOT/fn).read_text());a=a if isinstance(a,list) else [a]
 for l in a:walk(l)
for p in (ROOT/'content/world770').rglob('*'):
 if p.suffix.lower() not in ['.html','.htm','.xhtml','.css']:continue
 if p.suffix=='.css':urls=[('asset',v[1]) for v in re.findall(r'url\(\s*([\"\']?)(.*?)\1\s*\)',p.read_text())]
 else:
  d=html.fromstring(p.read_bytes());urls=[]
  for el in d.iter():
   for attr in ['src','href','{http://www.w3.org/1999/xlink}href']:
    if el.get(attr):urls.append(('document' if el.tag=='a' else 'asset',el.get(attr)))
 for kind,url in urls:
  u=urllib.parse.urlsplit(url)
  if u.scheme or u.netloc or url.startswith('data:'):continue
  path=(p.parent/urllib.parse.unquote(u.path)).resolve() if u.path else p
  check(path,urllib.parse.unquote(u.fragment),kind,p);counts[kind+'Links']+=1
result={'counts':counts,'errors':errors,'sizeBytes':sum(p.stat().st_size for folder in ['content','vendor'] for p in (ROOT/folder).rglob('*') if p.is_file())+sum((ROOT/f).stat().st_size for f in ['index.html','app.js','style.css','catalog.json','classics.json','world770.json'])}
json.dump(result,open(ROOT/'WORLD770-VALIDATION.json','w'),ensure_ascii=False,indent=2);print(counts,'errors',len(errors),'bytes',result['sizeBytes']);print(errors[:10])

assert not errors, "Broken local links"
assert result["sizeBytes"] < 1_000_000_000, "Pages capacity exceeded"
