"""Remove non-content dangling template and publisher placeholder links in the source EPUBs."""
from pathlib import Path
import re,json
ROOT=Path(__file__).parent;changed=0;removed=0
for p in (ROOT/'content/world770').rglob('*'):
 if p.suffix.lower() not in ['.html','.htm','.xhtml','.css']:continue
 s=p.read_text();before=s
 if p.suffix.lower()=='.css':
  s,n=re.subn(r'url\(\s*([\"\']?)(?:[^)\"\']*/)?hei\.jpg\1\s*\)','none',s);removed+=n
 else:
  s,n=re.subn(r'<link\b[^>]*href=[\"\'](?:[^\"\']*(?:page-template(?:-\d+)?\.xpgt|/css/template\.css)|X{8,})[\"\'][^>]*>','',s,flags=re.I);removed+=n
  s,n=re.subn(r'\s+href=([\"\'])X{8,}\1','',s);removed+=n
 if s!=before:p.write_text(s);changed+=1
(ROOT/'WORLD770-LINK-REPAIRS.json').write_text(json.dumps({'files':changed,'removedNonContentReferences':removed,'scope':'Absent XPGT/CSS templates, missing decorative hei.jpg backgrounds, publisher XXXXXX placeholders. No text or illustration pages removed.'},ensure_ascii=False,indent=2));print('repaired files',changed,'references',removed)
