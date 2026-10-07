from pathlib import Path
import xml.etree.ElementTree as E,json,re
root=Path(__file__).parent
ns={'n':'http://www.daisy.org/z3986/2005/ncx/'}
r=E.parse(root/'content/OEBPS/toc.ncx')
def node(n):
 return {'title':n.findtext('n:navLabel/n:text',namespaces=ns),'href':'content/OEBPS/'+n.find('n:content',ns).get('src'),'children':[node(c) for c in n.findall('n:navPoint',ns)]}
levels=[node(n) for n in r.findall('.//n:navMap/n:navPoint/n:navPoint',ns)]
for i,l in enumerate(levels):
 l['label']='入门级' if i==0 else f'第 {i} 级'
 for j,b in enumerate(l['children']): b['id']=f'{i}-{j}';b['level']=i
(root/'catalog.json').write_text(json.dumps(levels,ensure_ascii=False),encoding='utf-8')
# Retain original XHTML, illustrations and translations. Responsive style only.
style='<style type="text/css">html{background:#fffcf5!important}body{max-width:850px!important;margin:24px auto!important;padding:0 20px 50px!important;line-height:1.9!important;color:#242e2b!important;font-size:19px!important}img,svg{max-width:100%!important;height:auto!important}p{line-height:1.9!important}a{color:#17694f!important}table{max-width:100%!important}*{overflow-wrap:break-word}</style>'
for p in (root/'content/OEBPS/Text').glob('*.xhtml'):
 s=p.read_text();s=s.replace('</head>',style+'</head>') if style not in s else s;p.write_text(s)
print('Generated',len(levels),'levels;',sum(len(l['children']) for l in levels),'books')
