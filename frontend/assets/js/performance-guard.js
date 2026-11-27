/* TeoStudio V60.6 — low-cost animation visibility guard.
   Only explicitly live elements are inspected. Never walk the complete DOM. */
(()=>{
  'use strict';
  const body=document.body;
  if(!body||body.classList.contains('admin-body'))return;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced||!('IntersectionObserver' in window))return;
  const selector='[data-live],.teo-sales-track';
  const states=new Map(),known=new WeakSet(),animationStates=new WeakMap();
  const sync=(animation,state)=>{
    if(document.hidden||!state.visible){try{animation.pause()}catch{};return;}
    try{animation.play()}catch{}
  };
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const list=states.get(entry.target);if(!list)continue;
      for(const animation of list){const state=animationStates.get(animation);if(state){state.visible=entry.isIntersecting;sync(animation,state)}}
    }
  },{root:null,rootMargin:'80px 0px',threshold:0.01});
  const inspect=el=>{
    if(!(el instanceof Element)||!el.matches(selector)||known.has(el))return;
    known.add(el);let animations=[];
    try{animations=el.getAnimations()}catch{}
    const live=[];
    for(const animation of animations){
      let timing;try{timing=animation.effect?.getComputedTiming()}catch{}
      if(!timing||timing.iterations!==Infinity)continue;
      const state={visible:false};
      animationStates.set(animation,state);
      live.push(animation);sync(animation,state);
    }
    if(live.length){states.set(el,live);observer.observe(el)}
  };
  const collect=node=>{
    if(!(node instanceof Element))return;
    if(node.matches(selector))inspect(node);
    node.querySelectorAll?.(selector).forEach(inspect);
  };
  body.querySelectorAll(selector).forEach(inspect);
  const mutation=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='attributes'){inspect(record.target);continue;}
      record.addedNodes.forEach(collect);
    }
  });
  mutation.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-live']});
  document.addEventListener('visibilitychange',()=>{
    for(const [el,list] of states){
      const visible=!!el.isConnected&&el.getBoundingClientRect().bottom>0&&el.getBoundingClientRect().top<innerHeight;
      for(const animation of list){const state=animationStates.get(animation);if(state){state.visible=visible;sync(animation,state)}}
    }
  },{passive:true});
})();
