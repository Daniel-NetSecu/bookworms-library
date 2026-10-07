from pathlib import Path,PurePosixPath
import zipfile,hashlib,json,io,xml.etree.ElementTree as E,posixpath,html,re,subprocess
root=Path(__file__).parent
z=zipfile.ZipFile('/home/ait/下载/《书虫 牛津英汉双语读物》全套.zip')
# Explicit title mapping keeps language editions together without conflating different books.
mapping=[('Flipped','怦然心动'),('HarryPotter','哈利·波特（英文合集）'),('Howl','哈尔的移动城堡'),("Sorcerer",'哈利·波特与魔法石'),('达·芬奇','达·芬奇密码'),('VI.归来记','福尔摩斯归来记'),('The Lord','魔戒'),('乱世佳人','乱世佳人'),('了不起','了不起的盖茨比'),('傲慢','傲慢与偏见'),('名利场','名利场'),('呼啸','呼啸山庄'),('基督山','基督山伯爵'),('小王子','小王子'),('巴黎','巴黎圣母院'),('德伯','德伯家的苔丝'),('挪威','挪威的森林'),('教父','教父'),('汤姆','汤姆索亚历险记'),('海底','海底两万里'),('百万','百万英镑'),('百年','百年孤独'),('福尔摩斯探案','福尔摩斯探案全集'),('简爱','简爱'),('罪与罚','罪与罚'),('老人与海','老人与海'),('荆棘','荆棘鸟'),('阿加莎','尼罗河上的惨案'),('鲁宾逊','鲁宾逊漂流记'),('麦田','麦田里的守望者')]
seen={};group={};report=[]
css='html{background:#fffcf5}body{max-width:850px;margin:24px auto;padding:0 20px 50px;line-height:1.9;font-size:19px;color:#242e2b}img{max-width:100%;height:auto}*{overflow-wrap:break-word}'
for n in z.namelist():
 if not n.startswith('1.') or n.endswith('/'):continue
 data=z.read(n);digest=hashlib.sha256(data).hexdigest()
 if digest in seen:report.append({'source':n,'duplicateOf':seen[digest]});continue
 seen[digest]=n
 replacement='罪与罚' in n
 if replacement:data=Path('/tmp/bookworms-import/crime.epub').read_bytes()
 title=next(v for k,v in mapping if k in n);bid='classic-'+hashlib.sha256(title.encode()).hexdigest()[:10]
 b=group.setdefault(title,{'id':bid,'title':title,'level':7,'children':[],'format':'','source':'看英文名著学英语'})
 directory=root/'content/classics'/bid;directory.mkdir(parents=True,exist_ok=True)
 lang='中文' if '中文' in n else '英文'
 entry={'title':lang+'版'+('（Project Gutenberg）' if replacement else ''),'children':[]}
 if replacement:b['note']='原 PDF 损坏；此处采用 Project Gutenberg #2554，Constance Garnett 英译。';b['sourceUrl']='https://www.gutenberg.org/ebooks/2554'
 if data.startswith(b'%PDF'):
  p=directory/(lang+'.pdf');p.write_bytes(data);entry.update(href=p.relative_to(root).as_posix(),format='pdf')
  info=subprocess.run(['pdfinfo',str(p)],capture_output=True,text=True)
  m=re.search(r'^Pages:\s+(\d+)',info.stdout,re.M);entry['pages']=int(m[1]) if m else None
 elif data[:2]==b'PK':
  ez=zipfile.ZipFile(io.BytesIO(data))
  for item in ez.infolist():
   p=(directory/item.filename).resolve()
   if not p.is_relative_to(directory.resolve()):raise ValueError('Invalid EPUB path')
   if not item.is_dir():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(ez.read(item))
  c=E.fromstring(ez.read('META-INF/container.xml'));opf=c.find('.//{*}rootfile').get('full-path');o=E.fromstring(ez.read(opf));od=posixpath.dirname(opf)
  manifest={i.get('id'):posixpath.normpath(posixpath.join(od,i.get('href'))) for i in o.findall('.//{*}manifest/{*}item')}
  ncx=next(i for i in o.findall('.//{*}manifest/{*}item') if i.get('media-type')=='application/x-dtbncx+xml');ncxpath=manifest[ncx.get('id')]
  nr=E.fromstring(ez.read(ncxpath));ns={'n':'http://www.daisy.org/z3986/2005/ncx/'}
  def conv(x):
   rel=posixpath.normpath(posixpath.join(posixpath.dirname(ncxpath),x.find('n:content',ns).get('src')))
   return {'title':x.findtext('n:navLabel/n:text',namespaces=ns),'href':(directory.relative_to(root)/rel).as_posix(),'children':[conv(c) for c in x.findall('n:navPoint',ns)]}
  chapters=[conv(x) for x in nr.findall('n:navMap/n:navPoint',ns)]
  if not chapters:raise ValueError('No EPUB navigation')
  entry.update(href=chapters[0]['href'],format='epub',children=chapters)
  # Check OPF spine integrity, strip active content; leave original text and relative assets.
  for ref in o.findall('.//{*}spine/{*}itemref'):assert (directory/manifest[ref.get('idref')]).exists()
  for p in directory.rglob('*'):
   if p.suffix.lower() not in ['.xhtml','.html','.htm']:continue
   s=p.read_text(encoding='utf-8');s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S|re.I);s=re.sub(r'\s+on\w+\s*=\s*([\"\']).*?\1','',s,flags=re.S|re.I)
   s=s.replace('</head>','<style type="text/css">'+css+'</style></head>');p.write_text(s)
 else:
  text=Path('/tmp/bookworms-import/return.txt').read_text();parts=re.split(r'(?m)^(The (?:Adventure|Return) of[^\n]+)\n',text);chapters=[]
  if len(parts)<3:raise ValueError('DOC headings missing')
  for i in range(1,len(parts),2):
   name=parts[i].strip();body=parts[i+1];p=directory/f'chapter-{len(chapters):02}.html'
   p.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+html.escape(name)+'</title><style>'+css+'</style></head><body><h1>'+html.escape(name)+'</h1>'+''.join('<p>'+html.escape(t)+'</p>' for t in body.splitlines() if t.strip())+'</body></html>')
   chapters.append({'title':name,'href':p.relative_to(root).as_posix(),'children':[]})
  entry.update(href=chapters[0]['href'],format='html',children=chapters)
 b['children'].append(entry);b['href']=b['children'][0]['href'];b['format']=entry['format'];report.append({'source':n,'book':title,'id':bid,'format':entry['format'],'sha256':digest,'href':entry['href']})
books=list(group.values())
for b in books:b['children'].sort(key=lambda e:e['title']!='英文版');b['href']=b['children'][0]['href']
(root/'classics.json').write_text(json.dumps({'label':'看英文名著学英语','title':'看英文名著学英语','children':books},ensure_ascii=False))
(root/'IMPORT-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('Titles',len(books),'versions',len(seen),'PDF',sum(r.get('format')=='pdf' for r in report),'EPUB',sum(r.get('format')=='epub' for r in report),'HTML',sum(r.get('format')=='html' for r in report))
