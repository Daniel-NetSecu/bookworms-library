const $=s=>document.querySelector(s);
let levels=[],books=[],chosen=-1,current=null,entries=[],font=19,onlyFavorites=false,loadToken=0;
const colors=['#657d50','#247466','#b28445','#7b708e','#567c99','#995e55','#4d6572','#93662f'];
const readStore=k=>{try{return localStorage.getItem(k)}catch{return null}},writeStore=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const readJSON=(k,f)=>{try{return JSON.parse(readStore(k))||f}catch{return f}};
let favorites=new Set(readJSON('bookworms-favorites',[])),history=readJSON('bookworms-history',{}),night=readStore('bookworms-theme')==='dark';
const normalize=s=>s.toLowerCase().replace(/[\s·•・—:：]/g,'');
const flatten=n=>[n,...(n.children||[]).flatMap(flatten)];
function closeMenu(){$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')}
$('#menu').onclick=()=>{let open=$('#sidebar').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open))};
function theme(){document.documentElement.dataset.theme=night?'dark':'light';$('#theme').textContent=night?'☀ 日间':'☾ 夜间';$('#theme').setAttribute('aria-pressed',String(night));writeStore('bookworms-theme',night?'dark':'light');styleContent()}
$('#theme').onclick=()=>{night=!night;theme()};
function styleContent(d=$('#page').contentDocument){if(!d?.body||(d===$('#page').contentDocument&&$('#page').dataset.kind==='pdf'))return;let style=d.getElementById('reading-preferences');if(!style){style=d.createElement('style');style.id='reading-preferences';d.head.append(style)}style.textContent=`html{overscroll-behavior-y:contain}html,body{background:${night?'#18251f':'#fffcf5'}!important;color:${night?'#dce5dc':'#242e2b'}!important}body,p,div,li{font-size:${font}px!important;line-height:1.9!important}${night?'p,div,span,h1,h2,h3{color:#dce5dc!important}a{color:#a3d7b6!important}':''}`}
function draw(){const q=normalize($('#search').value.trim());let shown=books.filter(b=>(chosen<0||b.level===chosen)&&(!onlyFavorites||favorites.has(b.id))&&flatten(b).some(n=>normalize(n.title).includes(q)));if($('#sort').value==='recent')shown.sort((a,b)=>(history[b.id]?.time||0)-(history[a.id]?.time||0));if($('#sort').value==='title')shown.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));$('#books').replaceChildren();for(const b of shown){const a=document.createElement('a');a.className='card';a.href=history[b.id]?.hash||'#book='+b.id;a.style.setProperty('--accent',colors[b.level%colors.length]);const s=document.createElement('small');s.textContent=levels[b.level].label+(favorites.has(b.id)?' · ★':'');const h=document.createElement('h3');h.textContent=b.title;const p=document.createElement('span');p.textContent=(history[b.id]?'继续阅读':'打开阅读')+' ↗'+(b.level===7?' · '+b.children.map(v=>v.title.replace('版','')).join(' / '):'');a.append(s,h,p);$('#books').append(a)}$('#count').textContent=`${shown.length} 个书目`;$('#empty').hidden=shown.length>0;$('#shelfTitle').textContent=onlyFavorites?'我的收藏':chosen<0?'全部读物':levels[chosen].label;document.querySelectorAll('#filters button').forEach((x,i)=>{x.classList.toggle('active',i-1===chosen);x.setAttribute('aria-pressed',String(i-1===chosen))});document.querySelectorAll('.tree-books a').forEach(a=>{a.hidden=!shown.some(b=>b.id===a.dataset.id)});document.querySelectorAll('#tree details').forEach(d=>{d.hidden=![...d.querySelectorAll('a')].some(a=>!a.hidden);if(q)d.open=true});$('#favorites').setAttribute('aria-pressed',String(onlyFavorites));$('#favorites').textContent=onlyFavorites?'★ 显示全部':'☆ 只看收藏'}
function savePosition(hash=location.hash){if(!current)return;history[current.id]={hash,time:Date.now()};writeStore('bookworms-history',JSON.stringify(history));writeStore('bookworms-last',hash);$('#resume').href=hash;$('#resume').hidden=false}
function star(){$('#bookmark').textContent=favorites.has(current?.id)?'★ 已收藏':'☆ 收藏本书';$('#bookmark').setAttribute('aria-pressed',String(favorites.has(current?.id)))}
$('#bookmark').onclick=()=>{if(!current)return;if(favorites.has(current.id))favorites.delete(current.id);else favorites.add(current.id);writeStore('bookworms-favorites',JSON.stringify([...favorites]));star();draw()};
$('#favorites').onclick=()=>{onlyFavorites=!onlyFavorites;draw()};$('#sort').onchange=draw;
function route(){window.ReaderStudy?.reset();$('#page').contentDocument?._saveReading?.();activePagingAbort?.abort();setTools(false);setJump(false);$('#marksDialog').close();setPagerPending('正在打开…');$('#screenPrev').disabled=$('#screenNext').disabled=true;const token=++loadToken,p=new URLSearchParams(location.hash.slice(1));current=books.find(b=>b.id===p.get('book'));document.body.classList.toggle('reading',!!current);if(!current)document.body.classList.remove('focus-reading');$('#home').hidden=!!current;$('#reader').hidden=!current;if(!current){bookPagination?.controller.abort();bookPagination=null;discardPrefetchedFrame();document.title='书虫 · 双语阅读书房';$('#page').src='about:blank';draw();return}closeMenu();entries=current.level===7?current.children.flatMap(flatten):flatten(current);let i=Math.max(0,Math.min(entries.length-1,Math.floor(Number(p.get('chapter'))||0)));$('#bookTitle').textContent=current.title;document.title=current.title+' · 书虫双语书房';$('#breadcrumb').textContent=levels[current.level].label+' / '+current.title;$('#chapters').replaceChildren();entries.forEach((n,j)=>{$('#chapters').add(new Option((current.level!==7&&j===0?'封面 · ':'')+n.title,String(j)))});$('#chapters').value=i;$('#prev').disabled=i===0;$('#next').disabled=i===entries.length-1;$('#readStatus').textContent='正在打开：'+entries[i].title;const e=entries[i],isPDF=e.format==='pdf',frame=takePrefetchedFrame(e.href)||$('#page');frame.dataset.kind=isPDF?'pdf':'html';frame.setAttribute('sandbox',isPDF?'allow-same-origin allow-scripts allow-downloads allow-modals':'allow-same-origin');$('#smaller').hidden=$('#larger').hidden=isPDF;$('#position').textContent='';$('#original').href=e.href;$('#original').hidden=!isPDF;$('#readingHint').textContent=isPDF?'PDF 支持搜索、页码跳转和缩放。阅读页码保存在当前浏览器。':(current.note||'原文、译文和练习按原目录保留。')+' 章节位置保存在当前浏览器；图片页不受字号按钮影响。';let page=Math.max(1,parseInt(p.get('page'))||Number(readStore('pdf-page:'+e.href))||1);frame.onload=()=>onFrameLoad(token,e,i);$('#screenPrev').textContent='上一页';$('#screenNext').textContent='下一页';$('#screenPosition').textContent='';const sameDocument=!isPDF&&frame.src.split('#')[0]===new URL(e.href,location.href).href.split('#')[0]&&frame.contentDocument?.readyState==='complete';if(!frame.dataset.preloaded)frame.src=isPDF?'vendor/pdfjs/web/viewer.html?file='+encodeURIComponent(new URL(e.href,location.href).pathname)+'#page='+page+'&zoom=page-width':e.href;if(sameDocument)requestAnimationFrame(()=>onFrameLoad(token,e,i));delete frame.dataset.preloaded;savePosition();star();renderMark();document.querySelectorAll('.tree-books a').forEach(a=>{a.classList.toggle('active',a.dataset.id===current.id);if(a.dataset.id===current.id){a.hidden=false;a.closest('details').hidden=false;a.closest('details').open=true}})}
async function onFrameLoad(token,e,i){if(token!==loadToken||!current)return;const frame=$('#page'),d=frame.contentDocument;if(!d)return;if(e.format==='pdf'){bookPagination?.controller.abort();bookPagination=null;try{const app=frame.contentWindow.PDFViewerApplication;if(!app)throw Error('阅读器初始化失败');await app.initializedPromise;if(token!==loadToken)return;window.ReaderStudy?.bind(d);const update=()=>{if(token!==loadToken||!current)return;const p=app.page||1;$('#readStatus').textContent='已打开 · '+e.title+' · PDF';$('#position').textContent=`第 ${p} / ${app.pagesCount} 页`;renderPages(p,app.pagesCount,true);writeStore('pdf-page:'+e.href,String(p));const hash='#book='+current.id+'&chapter='+i+'&page='+p;window.history.replaceState(null,'',hash);savePosition(hash);window.ReaderStudy?.schedule()};app.eventBus.on('pagesloaded',update);app.eventBus.on('pagechanging',update);if(app.pagesCount)update()}catch(err){$('#readStatus').textContent='PDF 加载失败，可点击“打开原文件”重试';console.error(err)}return}styleContent();installPaging(d,e,token);window.ReaderStudy?.bind(d);d.addEventListener('pointerdown',()=>setTools(false),{signal:d._pagingAbort.signal});prefetchNextSection(i,token);$('#readStatus').textContent='已打开 · '+(d.title||current.title);d.addEventListener('click',ev=>{const a=ev.target.closest('a[href]');if(!a)return;const u=new URL(a.getAttribute('href'),d.URL),base=new URL('content/',location.href);if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname)){ev.preventDefault();return}const j=entries.findIndex(x=>new URL(x.href,location.href).href===u.href);if(j>=0){ev.preventDefault();go(j)}})}
function go(i){$('#page').contentDocument?._saveReading?.();location.hash='book='+current.id+'&chapter='+i}
$('#chapters').onchange=e=>go(e.target.value);$('#prev').onclick=()=>go(Number($('#chapters').value)-1);$('#next').onclick=()=>go(Number($('#chapters').value)+1);
function changeFont(delta){
 const d=$('#page').contentDocument,anchor=captureReadingAnchor(d);
 font=Math.max(14,Math.min(32,font+delta));writeStore('bookworms-font',String(font));styleContent();
 requestAnimationFrame(()=>{if(d===$('#page').contentDocument){restoreReadingAnchor(d,anchor);d._saveReading?.();updateScreenPosition()}});
}
$('#larger').onclick=()=>changeFont(2);$('#smaller').onclick=()=>changeFont(-2);
$('#search').oninput=()=>{if(current)location.hash='';draw()};window.onhashchange=route;
Promise.all(['catalog.json','classics.json','world770.json'].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error('目录加载失败');return r.json()}))).then(([data,extra,world])=>{levels=[...data,extra,...world];books=levels.flatMap(l=>l.children);$('#total').textContent=books.length+' 个书目';$('#statTotal').textContent=books.length;$('#statWorld').textContent=world.reduce((n,l)=>n+l.children.length,0);[-1,...levels.keys()].forEach(i=>{const b=document.createElement('button');b.textContent=i<0?'全部':levels[i].label;b.onclick=()=>{chosen=i;draw()};$('#filters').append(b)});levels.forEach(l=>{const d=document.createElement('details'),s=document.createElement('summary'),list=document.createElement('div');s.textContent=l.label+' · '+l.children.length;list.className='tree-books';l.children.forEach(b=>{const a=document.createElement('a');a.href='#book='+b.id;a.dataset.id=b.id;a.textContent=b.title;list.append(a)});d.append(s,list);$('#tree').append(d)});const last=readStore('bookworms-last');if(last&&last.startsWith('#book=')){$('#resume').href=last;$('#resume').hidden=false}font=Math.min(32,Math.max(14,Number(readStore('bookworms-font'))||19));theme();draw();route()}).catch(e=>{$('#count').textContent='加载失败，请刷新重试';console.error(e)});

let scrollSaveTimer, pendingBottom=false, pendingContinuation=null;
let preparedFrame=null,activePagingAbort=null;
const prefetchedSections=new Set();
function nextDocumentIndex(index,direction){
 const url=href=>new URL(href,location.href).href.split('#')[0],base=url(entries[index].href);
 let next=index+direction;
 while(next>=0&&next<entries.length&&url(entries[next].href)===base)next+=direction;
 return next;
}
function discardPrefetchedFrame(){preparedFrame?.node.remove();preparedFrame=null}
function takePrefetchedFrame(href){
 const url=new URL(href,location.href);
 const warm=preparedFrame;
 if(!warm?.ready||warm.url!==url.href.split('#')[0]){discardPrefetchedFrame();return null}
 // Keep the already loaded iframe in place. Moving it would reload its document.
 preparedFrame=null;const old=$('#page'),node=warm.node;
 old.removeAttribute('id');node.id='page';node.title='书籍正文';node.hidden=false;node.style.display='';
 node.removeAttribute('aria-hidden');node.removeAttribute('tabindex');node.dataset.preloaded='true';
 old.remove();
 if(url.hash){let id=url.hash.slice(1);try{id=decodeURIComponent(id)}catch{}
  (node.contentDocument.getElementById(id)||node.contentDocument.getElementsByName(id)[0])?.scrollIntoView();}
 return node;
}
function prefetchNextSection(index,token){
 const next=nextDocumentIndex(index,1),connection=navigator.connection;
 if(next>=entries.length||entries[next].format==='pdf'||connection?.saveData||/^(slow-)?2g$/.test(connection?.effectiveType))return;
 const url=new URL(entries[next].href,location.href);url.hash='';
 if(url.origin!==location.origin)return;
 const warm=()=>{
  if(token!==loadToken)return;
  discardPrefetchedFrame();
  const node=document.createElement('iframe');node.hidden=true;node.style.display='none';
  node.title='下一节预加载';node.setAttribute('aria-hidden','true');node.tabIndex=-1;
  node.setAttribute('sandbox','allow-same-origin');
  const state={node,url:url.href,ready:false};preparedFrame=state;
  node.onload=()=>{if(preparedFrame!==state)return;state.ready=true;prefetchedSections.add(url.href);
   if(prefetchedSections.size>8)prefetchedSections.delete(prefetchedSections.values().next().value);};
  node.src=url.href;$('#page').after(node);
 };
 if(window.requestIdleCallback)requestIdleCallback(warm,{timeout:1200});else setTimeout(warm,300);
}
// Paragraph-relative positions survive text reflow better than raw scroll pixels.
// Keep the old pixel value as a fallback for older saves or changed documents.
function captureReadingAnchor(d){
 const el=d?.scrollingElement;if(!el||!d.body)return null;
 const max=el.scrollHeight-el.clientHeight,top=el.scrollTop;
 if(top<=1)return {version:1,edge:'start',top};
 if(max>0&&top>=max-2)return {version:1,edge:'end',top};
 let target=[...d.querySelectorAll('p,li,h1,h2,h3,h4,blockquote,pre,img,svg')].find(node=>{
  const rect=node.getBoundingClientRect();return rect.height>0&&rect.bottom>1&&rect.top<el.clientHeight;
 })||d.body;
 const rect=target.getBoundingClientRect(),path=[];
 for(let node=target;node!==d.body;node=node.parentElement){
  if(!node?.parentElement)return {version:1,top};
  path.unshift(Array.prototype.indexOf.call(node.parentElement.children,node));
 }
 return {version:1,path,tag:target.tagName,text:target.textContent.trim().slice(0,48),ratio:-rect.top/Math.max(1,rect.height),top};
}
function restoreReadingAnchor(d,anchor){
 const el=d?.scrollingElement;if(!el||!anchor||anchor.version!==1)return false;
 if(anchor.edge){el.scrollTop=anchor.edge==='end'?el.scrollHeight:0;return true}
 let target=d.body;
 if(Array.isArray(anchor.path)&&anchor.path.length<64){
  for(const n of anchor.path)target=Number.isInteger(n)&&n>=0?target?.children[n]:null;
  if(target&&target.tagName===anchor.tag&&target.textContent.trim().slice(0,48)===anchor.text&&Number.isFinite(anchor.ratio)){
   const rect=target.getBoundingClientRect();el.scrollTop+=rect.top+rect.height*anchor.ratio;return true;
  }
 }
 if(Number.isFinite(anchor.top)){el.scrollTop=anchor.top;return true}return false;
}

$('#focus').onclick=()=>{setTools(false);const on=document.body.classList.toggle('focus-reading');$('#focus').textContent=on?'↙ 退出专注':'⛶ 专注阅读';setTimeout(updateScreenPosition,100)};
function updateScreenPosition(){const d=$('#page').contentDocument;if(!d||$('#page').dataset.kind==='pdf')return;const el=d.scrollingElement;if(!el)return;const h=el.clientHeight||$('#page').clientHeight;const step=Math.max(80,h-35),max=Math.max(0,el.scrollHeight-h),total=Math.ceil(max/step)+1;const index=el.scrollTop>=max-3?total:Math.round(el.scrollTop/step)+1;renderPages(Math.min(total,index),total)}
function turnScreen(direction){if(!current)return;const frame=$('#page');if(frame.dataset.kind==='pdf'){const a=frame.contentWindow.PDFViewerApplication;if(a?.pagesCount)a.page=Math.max(1,Math.min(a.pagesCount,a.page+direction));return}const d=frame.contentDocument,el=d?.scrollingElement;if(!el)return;const max=el.scrollHeight-el.clientHeight,step=Math.max(80,el.clientHeight-35);if(direction>0&&el.scrollTop>=max-3){const next=nextDocumentIndex(Number($('#chapters').value),1);if(next<entries.length){pendingContinuation={href:entries[next].href,direction:1};go(next)}}else if(direction<0&&el.scrollTop<=2){const prev=nextDocumentIndex(Number($('#chapters').value),-1);if(prev>=0){pendingBottom=true;go(prev)}}else{el.scrollTo({top:Math.max(0,Math.min(max,el.scrollTop+direction*step)),behavior:'smooth'})}}
$('#screenPrev').onclick=()=>turnScreen(-1);$('#screenNext').onclick=()=>turnScreen(1);
function pageKey(e){if(!current||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(e.target.tagName)||e.target.isContentEditable)return;let dir=0;if(['ArrowRight','PageDown',' '].includes(e.key))dir=e.shiftKey?-1:1;if(['ArrowLeft','PageUp'].includes(e.key))dir=-1;if(dir){e.preventDefault();turnScreen(dir)}}
document.addEventListener('keydown',pageKey);
// Continue across document boundaries using native wheel/touch input, without
// turning a restored position or a programmatic page jump into navigation.
function installPaging(d,entry,token){
 d._pagingAbort?.abort();const ctrl=new AbortController();d._pagingAbort=ctrl;activePagingAbort=ctrl;
 const opts={passive:true,signal:ctrl.signal};
 d.addEventListener('keydown',pageKey,{signal:ctrl.signal});
 const el=d.scrollingElement,key='bookworms-scroll:'+entry.href;
 const savedValue=readStore(key),saved=Number(savedValue)||0,anchorKey='bookworms-anchor:'+entry.href;
 const bookJump=pendingBookJump?.url===documentURL(entry.href)?pendingBookJump:null;
 pendingBookJump=null;
 const mark=pendingMark?.href===entry.href?pendingMark:null;
 pendingMark=null;
 const savedAnchor=mark?.anchor||readJSON(anchorKey,null);
 const continuation=pendingContinuation?.href===entry.href?pendingContinuation:null;
 pendingContinuation=null;
 let ready=false,leaving=false,readyAt=0,lastAnchor=null;
 const saveReading=()=>{
  if(!ready||leaving||token!==loadToken)return;
  lastAnchor=captureReadingAnchor(d);
  writeStore(key,String(el.scrollTop));
  if(lastAnchor)writeStore(anchorKey,JSON.stringify(lastAnchor));
 };
 d._saveReading=saveReading;
 d.defaultView.addEventListener('pagehide',saveReading,{signal:ctrl.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)saveReading()},{signal:ctrl.signal});
 window.addEventListener('pagehide',saveReading,{signal:ctrl.signal});
 requestAnimationFrame(()=>{
  if(token!==loadToken)return;
  if(bookJump)el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,(bookJump.page-1)*Math.max(80,el.clientHeight-35));
  else if(mark){if(!restoreReadingAnchor(d,mark.anchor))el.scrollTop=((mark.localPage||mark.page)-1)*Math.max(80,el.clientHeight-35)}
  else if(pendingBottom||continuation?.direction<0)el.scrollTop=el.scrollHeight;
  else if(continuation){
   el.scrollTop=0;
   const fragment=new URL(entry.href,location.href).hash.slice(1);
   if(fragment){let id=fragment;try{id=decodeURIComponent(fragment)}catch{}
    (d.getElementById(id)||d.getElementsByName(id)[0])?.scrollIntoView();}
  }else if(!restoreReadingAnchor(d,savedAnchor)&&savedValue!==null)el.scrollTop=saved;
  pendingBottom=false;ready=true;readyAt=performance.now();lastAnchor=captureReadingAnchor(d);updateScreenPosition();
 });
 const atEdge=dir=>dir>0?el.scrollTop>=el.scrollHeight-el.clientHeight-3:el.scrollTop<=2;
 const continueReading=dir=>{
  if(!ready||leaving||token!==loadToken||!atEdge(dir)||performance.now()-readyAt<400)return false;
  const next=nextDocumentIndex(Number($('#chapters').value),dir);
  if(next<0||next>=entries.length||entries[next].format==='pdf')return false;
  saveReading();leaving=true;clearTimeout(scrollSaveTimer);
  pendingContinuation={href:entries[next].href,direction:dir};go(next);return true;
 };
 d.addEventListener('wheel',ev=>{
  if(ev.ctrlKey||ev.metaKey||Math.abs(ev.deltaY)<=Math.abs(ev.deltaX)||d.getSelection()?.toString())return;
  if(continueReading(Math.sign(ev.deltaY)))ev.preventDefault();
 },{passive:false,signal:ctrl.signal});
 d.addEventListener('scroll',()=>{
  updateScreenPosition();clearTimeout(scrollSaveTimer);
  scrollSaveTimer=setTimeout(saveReading,150);
 },opts);
 const reflow=()=>{if(ready&&!leaving&&token===loadToken){restoreReadingAnchor(d,lastAnchor);updateScreenPosition()}};
 d.defaultView.addEventListener('resize',reflow,opts);
 for(const img of d.images)if(!img.complete)img.addEventListener('load',reflow,{once:true,signal:ctrl.signal});
 let start=null;
 d.addEventListener('touchstart',ev=>{
  start=ev.touches.length===1?{x:ev.touches[0].clientX,y:ev.touches[0].clientY,top:atEdge(-1),bottom:atEdge(1)}:null;
 },opts);
 d.addEventListener('touchend',ev=>{
  if(!start||!ev.changedTouches.length)return;
  const gesture=start;start=null;
  const dx=ev.changedTouches[0].clientX-gesture.x,dy=ev.changedTouches[0].clientY-gesture.y;
  if(d.getSelection()?.toString())return;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)turnScreen(dx<0?1:-1);
  else if(Math.abs(dy)>50&&Math.abs(dy)>Math.abs(dx)*1.5&&((dy<0&&gesture.bottom)||(dy>0&&gesture.top)))continueReading(dy<0?1:-1);
 },opts);
 d.addEventListener('touchcancel',()=>{start=null},opts);
}
window.addEventListener('resize',updateScreenPosition);

function setTools(open){if(open)setJump(false);$('#readerTools').hidden=!open;$('#toolsToggle').setAttribute('aria-expanded',String(open));$('#toolsToggle').setAttribute('aria-label',open?'收起阅读工具':'展开阅读工具');$('#toolsToggle').textContent=open?'×':'⋯'}
$('#toolsToggle').onclick=()=>setTools($('#readerTools').hidden);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setTools(false);setJump(false)}});
$('#page').addEventListener('load',()=>{try{$('#page').contentDocument?.addEventListener('pointerdown',()=>setTools(false))}catch{}});

let pagerState={index:1,total:1},pagerSignature='';
let pendingMark=null,pendingBookJump=null;
let localPagerState={index:1,total:1};
function renderPages(index,total,pdf=false){
 total=Math.max(1,total||1);index=Math.max(1,Math.min(total,index));localPagerState={index,total};
 const chapter=Number($('#chapters').value)||0;
 if(!pdf){
  const state=ensureBookPagination();
  if(!state?.ready){setPagerPending(state?.error?'页码计算失败':'正在计算全书页码…');return}
  const doc=state.docs.find(x=>x.url===documentURL(entries[chapter].href));if(!doc)return;
  doc.count=total;recountBookPages(state);index+=doc.offset;total=state.total;
 }
 pagerState={index,total,ready:true};
 $('#quickPage').disabled=$('#quickJump button').disabled=$('#setMark').disabled=false;
 $('#retryPages').hidden=true;
 $('#screenPrev').disabled=index===1;
 $('#screenNext').disabled=index===total;
 $('#screenPosition').textContent=`第 ${index} / ${total} 页`;
 $('#screenPosition').title=pdf?'当前 PDF 的实际页码':'整本书连续页码；字号或窗口变化后重新分页';
 $('#quickPage').max=total;$('#quickPage').title=`输入 1–${total} 的整数页码`;
 $('#quickPage').setCustomValidity('');
 $('#quickJump').setAttribute('aria-label',pdf?'跳至 PDF 页码':'跳至全书页码');
 $('#pageMore').setAttribute('aria-label',`更多页码，当前第 ${index} 页，共 ${total} 页`);
 $('#jumpTotal').textContent=`（共 ${total} 页）`;$('#jumpNumber').max=total;
 renderMark();
 const signature=`${index}:${total}`;if(signature===pagerSignature)return;pagerSignature=signature;
 const start=Math.max(1,Math.min(index-1,total-2));$('#pageNumbers').replaceChildren();
 for(let n=start;n<=Math.min(total,start+2);n++){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-label',`第 ${n} 页`);if(n===index)b.setAttribute('aria-current','page');b.onclick=()=>jumpPage(n);$('#pageNumbers').append(b)}
}
function jumpPage(n){
 if(!current||!Number.isInteger(n)||n<1||n>pagerState.total)return;
 const f=$('#page');if(f.dataset.kind==='pdf'){const a=f.contentWindow.PDFViewerApplication;if(a?.pagesCount)a.page=n}
 else{
  const state=ensureBookPagination();if(!state?.ready)return;
  const doc=state.docs.find(x=>n>x.offset&&n<=x.offset+x.count);if(!doc)return;
  const localPage=n-doc.offset;
  if(documentURL(entries[Number($('#chapters').value)].href)===doc.url)jumpLocalPage(localPage);
  else{pendingBottom=false;pendingContinuation=null;pendingBookJump={url:doc.url,page:localPage};go(doc.chapter)}
 }
 $('#page').contentDocument?._saveReading?.();
 setJump(false);
}
function setJump(open){$('#pageJump').hidden=!open;$('#pageMore').setAttribute('aria-expanded',String(open));if(open){setTools(false);$('#jumpNumber').value=pagerState.index;$('#jumpNumber').focus();$('#jumpNumber').select()}}
$('#pageMore').onclick=()=>setJump($('#pageJump').hidden);
$('#pageJump').onsubmit=e=>{e.preventDefault();jumpPage(Number($('#jumpNumber').value));$('#pageMore').focus()};
$('#jumpClose').onclick=()=>{setJump(false);$('#pageMore').focus()};

// Native Pointer Events cover mouse, pen and touch without another dependency.
const shelfGrip=$('#shelfResize'),shelfMobile=matchMedia('(max-width:760px)');
let shelfDrag=null;
const shelfKey=()=> 'bookworms-shelf-width:'+(shelfMobile.matches?'mobile':'desktop');
const shelfDefault=()=>shelfMobile.matches?Math.min(innerWidth*.88,330):145;
const shelfMax=()=>Math.max(120,Math.min(420,innerWidth-(shelfMobile.matches?32:320)));
function setShelfWidth(width,persist=false){
 const value=Math.round(Math.max(120,Math.min(shelfMax(),width)));
 document.documentElement.style.setProperty('--shelf-width',value+'px');
 shelfGrip.setAttribute('aria-valuemin','120');shelfGrip.setAttribute('aria-valuemax',String(shelfMax()));
 shelfGrip.setAttribute('aria-valuenow',String(value));shelfGrip.setAttribute('aria-valuetext',value+' 像素');
 if(persist)writeStore(shelfKey(),String(value));
 requestAnimationFrame(updateScreenPosition);
}
function restoreShelfWidth(){setShelfWidth(Number(readStore(shelfKey()))||shelfDefault())}
shelfGrip.addEventListener('pointerdown',e=>{
 if(e.button!==0||shelfDrag)return;e.preventDefault();
 shelfDrag={id:e.pointerId,x:e.clientX,width:$('#sidebar').getBoundingClientRect().width};
 document.body.classList.add('resizing-shelf');
 try{shelfGrip.setPointerCapture(e.pointerId)}catch{}
});
window.addEventListener('pointermove',e=>{if(shelfDrag?.id===e.pointerId){e.preventDefault();setShelfWidth(shelfDrag.width+e.clientX-shelfDrag.x)}},{passive:false});
function finishShelfDrag(e){
 if(!shelfDrag||e.pointerId!==shelfDrag.id)return;
 shelfDrag=null;document.body.classList.remove('resizing-shelf');
 setShelfWidth($('#sidebar').getBoundingClientRect().width,true);
 if(shelfGrip.hasPointerCapture(e.pointerId))shelfGrip.releasePointerCapture(e.pointerId);
}
for(const name of ['pointerup','pointercancel'])window.addEventListener(name,finishShelfDrag);
shelfGrip.addEventListener('lostpointercapture',finishShelfDrag);
shelfGrip.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();e.stopPropagation();
 const width=$('#sidebar').getBoundingClientRect().width;
 setShelfWidth(e.key==='Home'?120:e.key==='End'?shelfMax():width+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?40:10),true);
});
shelfGrip.addEventListener('dblclick',()=>setShelfWidth(shelfDefault(),true));
window.addEventListener('resize',restoreShelfWidth);restoreShelfWidth();

// Manual marks are independent of the automatically updated reading position.
function markKey(){return 'bookworms-mark:'+current.id}
function marksKey(){return 'bookworms-marks:'+current.id}
function readMarks(){
 if(!current)return [];
 const saved=readJSON(marksKey(),null);
 if(Array.isArray(saved))return saved;
 const old=readJSON(markKey(),null);
 return old?[{...old,id:'legacy'}]:[];
}
function writeMarks(marks){
 try{localStorage.setItem(marksKey(),JSON.stringify(marks));return true}
 catch{alert('无法保存书签，请允许浏览器保存网站数据。');return false}
}
function renderMark(){
 const marks=readMarks(),button=$('#returnMark');button.hidden=false;
 button.textContent=`书签 · ${marks.length}`;button.title='查看、跳转或删除本书书签';
 if($('#marksDialog').open)renderMarksList();
}
function renderMarksList(){
 const list=$('#marksList');list.replaceChildren();const marks=readMarks();
 $('#marksEmpty').hidden=marks.length>0;
 for(const mark of marks){
  const row=document.createElement('li'),go=document.createElement('button'),del=document.createElement('button');
  const page=markBookPage(mark);
  go.className='mark-go';go.textContent=(page?`第 ${page} 页`:'页码计算中')+' · '+mark.title;
  go.title='返回保存的原文位置';go.onclick=()=>{$('#marksDialog').close();returnToMark(mark)};
  del.className='mark-delete';del.textContent='删除';del.setAttribute('aria-label','删除书签：'+go.textContent);
  del.onclick=()=>{if(writeMarks(readMarks().filter(m=>m.id!==mark.id))){renderMark();$('#markStatus').textContent='书签已删除';$('#marksClose').focus()}};
  row.append(go,del);list.append(row);
 }
}
$('#returnMark').onclick=()=>{renderMarksList();$('#marksDialog').showModal()};
$('#marksClose').onclick=()=>$('#marksDialog').close();
$('#marksDialog').addEventListener('click',e=>{if(e.target===$('#marksDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#setMark').onclick=()=>{
 if(!current)return;
 const chapter=Number($('#chapters').value),entry=entries[chapter],f=$('#page');
 const pdf=entry.format==='pdf';
 if(pdf?!f.contentWindow.PDFViewerApplication?.pagesCount:!f.contentDocument?._saveReading)return;
 if(!pdf)updateScreenPosition();
 if(!pagerState.ready)return;
 const mark={id:crypto.randomUUID(),version:2,localPage:localPagerState.index,href:entry.href,chapter,title:entry.title,page:pagerState.index,anchor:pdf?null:captureReadingAnchor(f.contentDocument)};
 const marks=readMarks();
 if(marks.some(m=>m.href===mark.href&&markBookPage(m)===mark.page)){$('#markStatus').textContent='本页已有书签';return}
 if(writeMarks([...marks,mark])){renderMark();$('#markStatus').textContent='书签已添加'}
};
function returnToMark(mark){
 if(!current||!mark)return;
 const chapter=entries.findIndex(e=>e.href===mark.href);if(chapter<0)return;
 const frame=$('#page');frame.contentDocument?._saveReading?.();
 pendingBottom=false;pendingContinuation=null;pendingBookJump=null;
 if(chapter===Number($('#chapters').value)){
  if(entries[chapter].format==='pdf')jumpPage(Math.min(mark.page,pagerState.total));
  else{if(!restoreReadingAnchor(frame.contentDocument,mark.anchor))jumpLocalPage(mark.localPage||mark.page);frame.contentDocument?._saveReading?.();updateScreenPosition()}
 }else{
  pendingMark=entries[chapter].format==='pdf'?null:mark;
  location.hash='book='+current.id+'&chapter='+chapter+(entries[chapter].format==='pdf'?'&page='+mark.page:'');
 }
};
$('#quickPage').oninput=()=>$('#quickPage').setCustomValidity('');
$('#quickJump').onsubmit=e=>{
 e.preventDefault();const input=$('#quickPage'),n=Number(input.value);
 if(!Number.isInteger(n)||n<1||n>pagerState.total){input.setCustomValidity(`请输入 1 到 ${pagerState.total} 的整数`);input.reportValidity();return}
 input.setCustomValidity('');jumpPage(n);input.blur();
};
// Overlay tools stay above the actual footer, including wrapped mobile rows.
new ResizeObserver(([entry])=>{
 $('#reader').style.setProperty('--pager-height',Math.ceil(entry.target.getBoundingClientRect().height)+'px');
}).observe($('.page-turner'));

// Whole-book screen pagination. Measure only the selected book/edition, with at
// most three script-disabled frames; repeated fragment entries count once.
let bookPagination=null;
const paginationCache=new Map();
const documentURL=href=>new URL(href,location.href).href.split('#')[0];
function setPagerPending(text){
 pagerState={index:1,total:1,ready:false};pagerSignature='';
 $('#screenPosition').textContent=text;$('#pageNumbers').replaceChildren();
 $('#quickPage').disabled=$('#quickJump button').disabled=$('#setMark').disabled=true;
 $('#retryPages').hidden=!bookPagination?.error;
}
function bookPageSpec(){
 const f=$('#page'),chapter=Number($('#chapters').value)||0;
 if(!current||f.dataset.kind==='pdf'||!entries[chapter]||!f.clientWidth||!f.clientHeight)return null;
 let selected=entries.map((entry,chapter)=>({entry,chapter}));
 // A bilingual edition selector may contain separate full books/PDFs.
 if(current.level===7){
  const branch=current.children.find(x=>flatten(x).some(e=>e.href===entries[chapter].href));
  if(branch){const hrefs=new Set(flatten(branch).map(e=>e.href));selected=selected.filter(x=>hrefs.has(x.entry.href))}
 }
 const seen=new Set(),docs=[];
 for(const {entry,chapter} of selected){
  if(!entry.href||entry.format==='pdf')continue;
  const url=documentURL(entry.href);if(seen.has(url))continue;seen.add(url);
  docs.push({url,chapter,count:1,offset:0});
 }
 const width=f.clientWidth,height=f.clientHeight;
 return {key:JSON.stringify([current.id,docs[0]?.url,width,height,font]),docs,width,height};
}
function recountBookPages(state){let total=0;for(const doc of state.docs){doc.offset=total;total+=doc.count}state.total=total}
function screenCount(d){const el=d.scrollingElement;return Math.ceil(Math.max(0,el.scrollHeight-el.clientHeight)/Math.max(80,el.clientHeight-35))+1}
function anchorPage(d,anchor,total){
 if(!anchor)return null;
 const el=d.scrollingElement;if(!el)return null;
 if(anchor.edge)return anchor.edge==='end'?total:1;
 let top=anchor.top,node=d.body;
 if(Array.isArray(anchor.path)){
  for(const n of anchor.path)node=Number.isInteger(n)&&n>=0?node?.children[n]:null;
  if(node?.tagName===anchor.tag&&node.textContent.trim().slice(0,48)===anchor.text){const r=node.getBoundingClientRect();top=el.scrollTop+r.top+r.height*anchor.ratio}
 }
 if(!Number.isFinite(top))return null;
 return top>=el.scrollHeight-el.clientHeight-3?total:Math.max(1,Math.min(total,Math.round(top/Math.max(80,el.clientHeight-35))+1));
}
function markBookPage(mark){
 if(entries.find(e=>e.href===mark.href)?.format==='pdf')return mark.page;
 const state=bookPagination;if(!state?.ready)return null;
 const doc=state.docs.find(x=>x.url===documentURL(mark.href));if(!doc)return null;
 const signature=JSON.stringify(mark.anchor);
 doc.markPages ||= {};
 if(documentURL($('#page').src)===doc.url)doc.markPages[signature]=anchorPage($('#page').contentDocument,mark.anchor,doc.count);
 const local=doc.markPages[signature]||mark.localPage||mark.page;
 return doc.offset+Math.min(doc.count,local);
}
function ensureBookPagination(){
 const spec=bookPageSpec();if(!spec)return null;
 if(bookPagination?.key===spec.key)return bookPagination;
 bookPagination?.controller.abort();
 const state={...spec,ready:false,error:false,controller:new AbortController(),total:0};bookPagination=state;
 let cached=paginationCache.get(spec.key);
 const marks=readMarks();
 if(marks.some(mark=>cached?.some(doc=>doc.url===documentURL(mark.href)&&!doc.markPages?.[JSON.stringify(mark.anchor)])))cached=null;
 if(cached){state.docs=cached.map(x=>({...x}));state.ready=true;recountBookPages(state);return state}
 // Debounce resizing and footer reflow; old jobs are cancelled, not accumulated.
 setTimeout(()=>{if(bookPagination===state&&!state.controller.signal.aborted)measureBookPages(state)},180);
 return state;
}
async function measureBookPages(state){
 const {signal}=state.controller,frames=[];let cursor=0;
 const marks=readMarks();
 try{
  const worker=async()=>{
   const frame=document.createElement('iframe');frames.push(frame);
   frame.className='pagination-measure';frame.title='全书页码计算';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-same-origin');
   frame.style.cssText=`position:fixed;left:-100000px;top:0;width:${state.width}px;height:${state.height}px;border:0;visibility:hidden;pointer-events:none;box-sizing:content-box`;
   document.body.append(frame);
   while(cursor<state.docs.length&&!signal.aborted){
    const doc=state.docs[cursor++];
    await new Promise((resolve,reject)=>{
     const done=err=>{clearTimeout(timer);signal.removeEventListener('abort',abort);frame.onload=null;frame.onerror=null;err?reject(err):resolve()};
     const abort=()=>done(Error('cancelled'));const timer=setTimeout(()=>done(Error('page measurement timed out')),20000);
     signal.addEventListener('abort',abort,{once:true});frame.onload=()=>done();frame.onerror=()=>done(Error('page measurement failed'));frame.src=doc.url;
    });
    if(signal.aborted)throw Error('cancelled');
    const d=frame.contentDocument;
    if(!d?.body||d.title==='Error response')throw Error('document not available');
    styleContent(d);
    // Force final layout after reader styles; iframe load has awaited images/CSS.
    doc.count=screenCount(d);
    doc.markPages={};
    for(const mark of marks)if(documentURL(mark.href)===doc.url)doc.markPages[JSON.stringify(mark.anchor)]=anchorPage(d,mark.anchor,doc.count);
   }
  };
  await Promise.all(Array.from({length:Math.min(3,state.docs.length)},worker));
  if(signal.aborted||bookPagination!==state)return;
  recountBookPages(state);state.ready=true;
  paginationCache.set(state.key,state.docs.map(x=>({...x})));
  while(paginationCache.size>4)paginationCache.delete(paginationCache.keys().next().value);
  updateScreenPosition();renderMark();
 }catch(error){
  if(!signal.aborted&&bookPagination===state){state.error=true;state.controller.abort();setPagerPending('页码计算失败');renderMark()}
 }finally{for(const frame of frames)frame.remove()}
}
function jumpLocalPage(n){
 const d=$('#page').contentDocument,el=d?.scrollingElement;if(!el)return;
 el.scrollTop=Math.max(0,Math.min(el.scrollHeight-el.clientHeight,(n-1)*Math.max(80,el.clientHeight-35)));
 updateScreenPosition();d._saveReading?.();
}
$('#retryPages').onclick=()=>{bookPagination?.controller.abort();bookPagination=null;updateScreenPosition()};
new ResizeObserver(()=>{if(current&&$('#page').dataset.kind!=='pdf')updateScreenPosition()}).observe($('#reader'));
