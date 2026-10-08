/* Page-local study aids. Book text stays in this browser; no translation/AI API. */
(()=>{
 const byId=id=>document.getElementById(id),panel=byId('studyPanel'),toggle=byId('studyToggle');
 const chunks=new Map(),stop=new Set(('a an the and or but so as if than of to for from in on at by with into out up down over under off not no yes all any some each every both either neither other another such only own same very too just even still also already again ever never always often sometimes here there now then today tomorrow yesterday this that these those it its he him his she her hers they them their theirs we us our ours you your yours i me my mine be am is are was were been being do does did doing done have has had having will would shall should can could may might must need dare ought get gets got go goes went gone come comes came say says said tell told think thought know knew see saw seen look looked make made take took taken give gave given want wanted like liked one two three four five six seven eight nine ten first second third mr mrs miss sir thing things something anything nothing everything someone somebody anyone anybody everyone everybody nobody much many more most less few little well good great bad new old long right left back away really quite perhaps how what when where why who whom whose which because although though while before after until since through about around between without within during against across along among enough almost yet once twice man woman boy girl day days time times year years people book page chapter').split(/\s+/));
 let opened=readStore('bookworms-study-open');opened=opened===null?innerWidth>980:opened==='true';
 let timer,serial=0,abort=null,lastKey='',pageText='',lastInfo=null,properNames=new Set();
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
 const normalize=s=>s.toLowerCase().replace(/[’‘]/g,"'").trim();
 const splitSentences=text=>(text.match(/[^.!?]+(?:[.!?]+|$)/g)||[]).map(x=>x.trim()).filter(Boolean);
 function excerpt(text,word){const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp('\\b'+escaped+'\\b','i');return splitSentences(text).find(s=>re.test(s))?.slice(0,360)||''}
 function quote(parent,text){if(!text)return;const details=node('details'),summary=node('summary','本页例句');details.append(summary,node('blockquote',text));parent.append(details)}
 function setOpen(value){opened=value;writeStore('bookworms-study-open',String(value));panel.hidden=!value;document.body.classList.toggle('study-open',value);toggle.setAttribute('aria-expanded',String(value));if(value)schedule(0);else{serial++;clearTimeout(timer)}}
 toggle.addEventListener('click',()=>setOpen(!opened));byId('studyClose').onclick=()=>{setOpen(false);toggle.focus()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){setOpen(false);toggle.focus()}});
 // Reuse the shelf's native Pointer Events interaction, with reversed drag direction.
 const grip=byId('studyResize'),reader=byId('reader'),mobile=matchMedia('(max-width:980px)');
 let drag=null;
 const widthKey=()=> 'bookworms-study-width-'+(mobile.matches?'mobile':'desktop');
 const defaultWidth=()=>mobile.matches?380:Math.max(270,Math.min(350,innerWidth*.27));
 const maxWidth=()=>Math.max(220,Math.min(640,reader.clientWidth-(mobile.matches?30:340)));
 function setWidth(width,persist=false){
  const value=Math.round(Math.max(220,Math.min(maxWidth(),width)));
  reader.style.setProperty('--study-width',value+'px');
  grip.setAttribute('aria-valuemin','220');grip.setAttribute('aria-valuemax',String(Math.floor(maxWidth())));
  grip.setAttribute('aria-valuenow',String(value));grip.setAttribute('aria-valuetext',value+' 像素');
  if(persist)writeStore(widthKey(),String(value));
  requestAnimationFrame(updateScreenPosition);
 }
 function restoreWidth(){if(reader.clientWidth)setWidth(Number(readStore(widthKey()))||defaultWidth())}
 function finishDrag(e){
  if(!drag||(e?.pointerId!==undefined&&e.pointerId!==drag.id))return;
  const id=drag.id;drag=null;document.body.classList.remove('resizing-study');
  setWidth(parseFloat(reader.style.getPropertyValue('--study-width')),true);
  if(grip.hasPointerCapture(id))grip.releasePointerCapture(id);
 }
 grip.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;e.preventDefault();
  drag={id:e.pointerId,x:e.clientX,width:panel.getBoundingClientRect().width};
  document.body.classList.add('resizing-study');try{grip.setPointerCapture(e.pointerId)}catch{}
 });
 window.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){e.preventDefault();setWidth(drag.width+drag.x-e.clientX)}},{passive:false});
 for(const name of ['pointerup','pointercancel'])window.addEventListener(name,finishDrag);
 grip.addEventListener('lostpointercapture',finishDrag);window.addEventListener('blur',()=>finishDrag());
 grip.addEventListener('dblclick',()=>setWidth(defaultWidth(),true));
 grip.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  setWidth(e.key==='Home'?220:e.key==='End'?maxWidth():panel.getBoundingClientRect().width+(e.key==='ArrowLeft'?1:-1)*(e.shiftKey?40:10),true);
 });
 new ResizeObserver(restoreWidth).observe(reader);window.addEventListener('resize',restoreWidth);restoreWidth();
 function reset(){serial++;lookupSerial++;lastKey='';pageText='';lastInfo=null;clearTimeout(timer);abort?.abort();byId('studyStatus').textContent='正在读取本页…';for(const id of ['studyWords','studyPhrases','studyGrammar','studyLookup'])byId(id).replaceChildren()}
 function schedule(delay=350){if(!opened)return;clearTimeout(timer);timer=setTimeout(refresh,delay)}
 function bind(d){abort?.abort();abort=new AbortController();const signal=abort.signal;
  d.addEventListener('scroll',()=>schedule(),{capture:true,passive:true,signal});
  d.defaultView.addEventListener('resize',()=>schedule(),{passive:true,signal});
  const selected=()=>{if(!opened)return;const value=d.getSelection()?.toString().trim();if(value&&value.length<=60&&/^[a-zA-Z'’ -]+$/.test(value))lookup(value)};
  d.addEventListener('mouseup',selected,{signal});d.addEventListener('keyup',selected,{signal});
  d.addEventListener('touchend',()=>setTimeout(selected,150),{passive:true,signal});schedule(0);
 }
 async function chunk(prefix){if(!/^[a-z]{2}$/.test(prefix))return {};
  if(!chunks.has(prefix))chunks.set(prefix,fetch('vendor/ecdict/'+prefix+'.json').then(r=>{if(!r.ok)throw Error('词典加载失败');return r.json()}).catch(e=>{chunks.delete(prefix);throw e}));
  return chunks.get(prefix);
 }
 async function dictionary(word,depth=0){word=normalize(word);
  const contractions={i:'pron. 我（第一人称单数主格）',a:'不定冠词：一个／一类中的任意一个，通常用于辅音音素开头的单数可数名词前',"don't":'do not 的缩写；一般现在时的否定',"doesn't":'does not 的缩写；第三人称单数的否定',"didn't":'did not 的缩写；一般过去时的否定',"wasn't":'was not 的缩写；be 动词过去式的否定',"weren't":'were not 的缩写；be 动词过去式的否定',"isn't":'is not 的缩写',"aren't":'are not 的缩写',"can't":'cannot 的缩写；不能／不会',"couldn't":'could not 的缩写',"won't":'will not 的缩写',"wouldn't":'would not 的缩写',"shouldn't":'should not 的缩写',"i'm":'I am 的缩写',"you're":'you are 的缩写',"we're":'we are 的缩写',"they're":'they are 的缩写',"i'd":'I had 或 I would 的缩写，需根据后面的动词形式和语境区分',"she'd":'she had 或 she would 的缩写，需结合语境',"he'd":'he had 或 he would 的缩写，需结合语境',"she's":'she is 或 she has 的缩写，需结合语境',"he's":'he is 或 he has 的缩写，需结合语境',"it's":'it is 或 it has 的缩写；区别于表示“它的”的 its',"that's":'that is 或 that has 的缩写，需结合语境'};
  if(Object.hasOwn(contractions,word))return {word,meaning:contractions[word],frequency:1};const prefix=word.replace(/[^a-z]/g,'').slice(0,2),rows=await chunk(prefix),value=Object.hasOwn(rows,word)?rows[word]:null;
  if(!value)return null;const [phonetic,meaning,frequency,lemma]=value;
  if(lemma&&lemma!==word&&depth<2){const base=await dictionary(lemma,depth+1);if(base)return {...base,form:word}}
  return meaning?{word,phonetic,meaning,frequency}:null;
 }
 async function source(){
  const frame=byId('page'),d=frame?.contentDocument;if(!current||!d?.body)return null;
  if(frame.dataset.kind==='pdf'){
   const app=frame.contentWindow.PDFViewerApplication,page=app?.page;
   if(!app?.pdfDocument||!page)return null;
   const pdfPage=await app.pdfDocument.getPage(page),content=await pdfPage.getTextContent();
   const text=content.items.map(x=>typeof x.str==='string'?x.str+(x.hasEOL?'\n':' '):'').join('').replace(/([a-z])-\n([a-z])/gi,'$1$2').replace(/\s+/g,' ').trim().slice(0,20000);
   return {text,key:current.id+':pdf:'+page,label:'PDF 第 '+page+' / '+app.pagesCount+' 页'};
  }
  const h=d.scrollingElement?.clientHeight||frame.clientHeight,walker=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT),range=d.createRange();let text='',n;
  while((n=walker.nextNode())&&text.length<12000){
   if(!n.textContent.trim()||n.parentElement.closest('script,style,noscript'))continue;
   range.selectNodeContents(n);const rects=range.getClientRects();
   if([...rects].some(r=>r.width>0&&r.bottom>0&&r.top<h))text+=n.textContent+' ';
  }
  text=text.replace(/\s+/g,' ').trim();return {text,key:current.id+':'+byId('chapters').value+':'+text,label:'当前屏幕附近的英文（含跨屏段落）'};
 }
 function displayWord(record,form,text){
  const item=node('article',undefined,'study-card'),head=node('div',undefined,'study-word');head.append(node('strong',form||record.word));
  if(record.phonetic)head.append(node('span',' /'+record.phonetic+'/','study-phonetic'));item.append(head);
  if(record.word!==form&&form)item.append(node('small','原形：'+record.word));
  item.append(node('p',record.meaning));quote(item,excerpt(text,form||record.word));return item;
 }
 function showPatterns(container,rules,text,max){const sentences=splitSentences(text);let count=0;
  for(const [title,re,meaning] of rules){const example=sentences.find(s=>re.test(s.replace(/[’‘]/g,"'")));if(!example)continue;
   const item=node('article',undefined,'study-card');item.append(node('strong',title),node('p',meaning));quote(item,example.slice(0,420));container.append(item);if(++count>=max)break;
  }
  if(!count)container.append(node('p','这一页暂未匹配到常用提示。','study-muted'));
 }
 async function refresh(){
  if(!opened||!current)return;const ticket=++serial;
  try{
   const info=await source();if(ticket!==serial||!opened)return;
   if(!info){byId('studyStatus').textContent='正文加载后会自动更新。';return}
   if(info.key===lastKey)return;
   lastInfo=info;pageText=info.text;panel.scrollTop=0;properNames=new Set();
   for(const match of info.text.matchAll(/\b[A-Z][a-z]+(?:['’-][a-z]+)*/g)){
    const before=info.text.slice(Math.max(0,match.index-20),match.index);
    if(before.trim()&&!/[.!?][\s“”"'‘’]*$/.test(before))properNames.add(normalize(match[0]));
   }byId('studyLocation').textContent=current.title+' · '+info.label;
   for(const id of ['studyWords','studyPhrases','studyGrammar','studyLookup'])byId(id).replaceChildren();
   if(!info.text){byId('studyStatus').textContent='本页没有可提取的文字，可能是扫描图片，暂时无法提供学习提示。';lastKey=info.key;return}
   const tokens=[...new Set((normalize(info.text).match(/[a-z]+(?:['-][a-z]+)*/g)||[]).filter(w=>w.length>2&&!w.includes("'")&&!stop.has(w)&&!properNames.has(w)))].slice(0,180);
   if(!tokens.length){byId('studyStatus').textContent='本页未检测到足够英文；中文页可切换到英文部分。';lastKey=info.key;return}
   byId('studyStatus').textContent='正在整理本页词汇…';
   showPatterns(byId('studyPhrases'),StudyRules.phrases,info.text,6);showPatterns(byId('studyGrammar'),StudyRules.grammar,info.text,5);
   const results=await Promise.all(tokens.map(async word=>({form:word,record:await dictionary(word)})));
   if(ticket!==serial||!opened)return;
   const unique=new Map();
   for(const result of results){const r=result.record;if(!r||stop.has(r.word)||(r.frequency&&r.frequency<1200)||/人名|姓氏|\[地名\]/.test(r.meaning))continue;if(!unique.has(r.word))unique.set(r.word,result)}
   const words=[...unique.values()].sort((a,b)=>(b.record.frequency||60000)-(a.record.frequency||60000)).slice(0,8);
   for(const {form,record} of words)byId('studyWords').append(displayWord(record,form,info.text));
   if(!words.length)byId('studyWords').append(node('p','暂未筛出建议词汇。可选中正文单词，或在上方输入查词。','study-muted'));
   byId('studyStatus').textContent='已随当前页更新 · '+words.length+' 个建议词汇';lastKey=info.key;
  }catch(e){if(ticket===serial)byId('studyStatus').textContent='学习提示暂未加载成功，请点“刷新本页”重试。'}
 }
 let lookupSerial=0;
 async function lookup(value){
  const word=normalize(value),box=byId('studyLookup'),ticket=++lookupSerial,pageTicket=lastInfo?.key;
  if(!word||word.length>60)return;panel.scrollTop=0;box.replaceChildren(node('p','正在查词…'));byId('studyQuery').value=word;
  try{
   const phrase=StudyRules.phrases.find(([,re])=>word.includes(' ')&&re.test(word));
   if(phrase){box.replaceChildren(node('h3','选词查询'),node('strong',word),node('p',phrase[2]));quote(box,excerpt(pageText,word));return}
   if(!/^[a-z]+(?:['-][a-z]+)*$/.test(word)){box.replaceChildren(node('p','请输入一个英文单词；常用短语会在下方自动提示。'));return}
   const record=await dictionary(word);if(ticket!==lookupSerial||pageTicket!==lastInfo?.key)return;
   box.replaceChildren(node('h3','选词查询'));
   if(record){if(properNames.has(word))box.append(node('p','本页可能用作人名或专名；下面是词典中的普通词义。','study-muted'));box.append(displayWord(record,word,pageText))}else box.append(node('p','常用词库未收录“'+word+'”。可试试原形，或检查拼写。'));
  }catch{if(ticket===lookupSerial)box.replaceChildren(node('p','词典暂时加载失败，请重试。'))}
 }
 document.querySelectorAll('[data-study-section]').forEach(button=>button.onclick=()=>{const heading=byId(button.dataset.studySection);panel.scrollTo({top:panel.scrollTop+heading.getBoundingClientRect().top-panel.getBoundingClientRect().top-82,behavior:'smooth'})});
 byId('studyForm').onsubmit=e=>{e.preventDefault();lookup(byId('studyQuery').value)};
 byId('studyRefresh').onclick=()=>{lastKey='';schedule(0)};
 window.ReaderStudy={bind,reset,schedule,setOpen};
 panel.hidden=!opened;document.body.classList.toggle('study-open',opened);toggle.setAttribute('aria-expanded',String(opened));
 const d=byId('page')?.contentDocument;if(current&&d?.readyState==='complete')bind(d);
})();
