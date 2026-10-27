(function(){var t;try{t=localStorage.getItem("tb-theme")}catch(e){}
t=t||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;
document.addEventListener("click",function(e){if(!e.target.closest("[data-theme-toggle]"))return;
t=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=t;try{localStorage.setItem("tb-theme",t)}catch(e){}})})();
