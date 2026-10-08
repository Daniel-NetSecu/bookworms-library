"""Build small, on-demand ECDICT shards. Usage: python build-study-dictionary.py SOURCE.csv LICENSE"""
import csv,json,re,sys,shutil,string
from pathlib import Path
out=Path('vendor/ecdict');out.mkdir(parents=True,exist_ok=True)
records={};forms={}
def num(value):
 try:return int(value or 0)
 except ValueError:return 0
for row in csv.DictReader(open(sys.argv[1],encoding='utf-8-sig')):
 word=row['word'].strip().lower()
 if not re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",word) or len(word)>32:continue
 ranks=[num(row.get(k)) for k in ['bnc','frq']];rank=min((x for x in ranks if x>0),default=0)
 if not ((rank and rank<=60000) or row.get('tag') or num(row.get('oxford')) or num(row.get('collins'))):continue
 translation=row.get('translation','').replace('\\n','\n').strip()
 if not translation or not re.search(r'[\u4e00-\u9fff]',translation):continue
 if len(translation)>360:translation=translation[:357]+'…'
 exchange=dict(x.split(':',1) for x in row.get('exchange','').split('/') if ':' in x)
 records[word]=[row.get('phonetic',''),translation,rank,exchange.get('0','')]
 for kind,value in exchange.items():
  if kind not in ['p','d','i','3','r','t','s']:continue
  for form in value.split(','):
   if re.fullmatch(r'[a-z]+',form):forms.setdefault(form,word)
# Repair the source's self-referencing irregular lemma.
if 'snuck' in records and 'sneak' in records:records['snuck'][3]='sneak'
for form,lemma in forms.items():
 if form not in records:records[form]=['','',records[lemma][2],lemma]
shards={a+b:{} for a in string.ascii_lowercase for b in string.ascii_lowercase}
for word,record in sorted(records.items()):
 prefix=re.sub('[^a-z]','',word)[:2]
 if len(prefix)<2:continue
 shards[prefix][word]=record
for prefix,rows in shards.items():
 (out/(prefix+'.json')).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
shutil.copyfile(sys.argv[2],out/'LICENSE')
(out/'NOTICE.txt').write_text('English–Chinese data: ECDICT, https://github.com/skywind3000/ECDICT\nMIT license; see LICENSE.\nSubset: frequency rank <= 60000 or tagged/core entries; derived inflections included.\nDefinitions longer than 360 characters are abbreviated. Sharded for on-demand lookup.\n',encoding='utf-8')
print(json.dumps({'entries':len(records),'shards':len(shards),'bytes':sum(p.stat().st_size for p in out.iterdir()),'samples':{w:records.get(w) for w in ['bait','snuck','wedge','curb','rococo','unavoidably']}},ensure_ascii=False))
