/* V60.3: pause infinite CSS animations off-screen and when the tab is hidden. */
(()=>{
  'use strict';
  // Admin pages contain very large management DOM trees. Scanning every node
  // and calling getAnimations() on each one can block mobile browsers during
  // startup. Keep this optimization on public pages only.
  if (document.body?.classList.contains('admin-body')) return;
  if(!('IntersectionObserver' in window)||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const states=new Map();
  const animationStates=new WeakMap();
  let scheduled=false;
  const sync=(animation,state)=>{
    if(document.hidden||!state.visible){try{animation.pause()}catch{};return}
    try{animation.play()}catch{}
  };
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const list=states.get(entry.target);if(!list)continue;
      for(const animation of list){const state=animationStates.get(animation);if(!state)continue;state.visible=entry.isIntersecting;sync(animation,state)}
    }
  },{root:null,rootMargin:'96px 0px',threshold:0.01});
  const inspect=el=>{
    if(!(el instanceof Element))return;
    let animations=[];try{animations=el.getAnimations()}catch{}
    for(const animation of animations){
      if(animationStates.has(animation))continue;
      let timing;try{timing=animation.effect?.getComputedTiming()}catch{}
      if(!timing||timing.iterations!==Infinity)continue;
      const state={visible:false};
      animationStates.set(animation,state);
      const list=states.get(el)||[];list.push(animation);states.set(el,list);
      if(list.length===1)observer.observe(el);
      sync(animation,state);
    }
  };
  const inspectTree=node=>{
    if(node instanceof Element)inspect(node);
    if(node?.querySelectorAll)node.querySelectorAll('*').forEach(inspect);
  };
  const scan=()=>{scheduled=false;inspectTree(document.documentElement)};
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(scan)};
  const mo=new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'){inspect(record.target);continue}for(const node of record.addedNodes)inspectTree(node)}});
  const start=()=>{scan();mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('visibilitychange',()=>{for(const [el,list] of states){for(const animation of list){const state=animationStates.get(animation);if(state)sync(animation,state)}}});
})();
