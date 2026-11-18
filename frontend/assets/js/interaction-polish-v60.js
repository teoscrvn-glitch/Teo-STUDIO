(()=>{'use strict';
// Prevent the Android/iOS native image context menu only on TeoStudio cards and preview artwork.
const selector='.product-card,.product-thumb img,.tenant-note-card img,.note-card-art img,.note-preview-art img,.rank-avatar img,.rank-podium-avatar img,.social-card img';
document.addEventListener('contextmenu',event=>{if(event.target?.closest?.(selector))event.preventDefault()},{capture:true});
document.addEventListener('dragstart',event=>{if(event.target?.closest?.(selector))event.preventDefault()},{capture:true});
})();
