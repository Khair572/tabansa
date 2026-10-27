const $=s=>document.querySelector(s);
const rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tgl=d=>d?new Date(d+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"-";
const hariIni=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const inisial=n=>esc((n||"?").trim().charAt(0).toUpperCase());
function toast(msg,err){let b=$(".toasts");if(!b){b=document.createElement("div");b.className="toasts";document.body.append(b)}
 const t=document.createElement("div");t.className="toast"+(err?" err":"");t.textContent=msg;b.append(t);setTimeout(()=>t.remove(),3500)}
function csv(nama,rows){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}));a.download=nama;a.click()}
function ledger(rows){const a=[...rows].sort((x,y)=>(x.tanggal+x.created_at).localeCompare(y.tanggal+y.created_at));let s=0;
 a.forEach(r=>{s+=r.jenis==="masuk"?+r.jumlah:-r.jumlah;r._s=s});return a.reverse()}
const ledRow=(r,del)=>`<div class="led${del?" d":""}"><div><b>${tgl(r.tanggal)}</b><small>${esc(r.keterangan||(r.jenis==="masuk"?"Setoran":"Penarikan"))}${r.admin_email?" · "+esc(r.admin_email):""}</small></div><span class="amt num ${r.jenis==="masuk"?"pos":"neg"}">${r.jenis==="masuk"?"+":"−"}${rp(r.jumlah)}</span><span class="bal num">${rp(r._s)}</span>${del?`<button class="sbtn dng" onclick="hapusT('${r.id}')">Hapus</button>`:""}</div>`;
const sumBox=x=>`<div><span>Setoran</span><b class="pos num">${rp(x.total_masuk)}</b></div><div><span>Penarikan</span><b class="neg num">${rp(x.total_keluar)}</b></div><div><span>Saldo</span><b class="num">${rp(x.saldo)}</b></div>`;
document.addEventListener("click",e=>{const d=e.target;if(d.tagName==="DIALOG"&&d.classList.contains("sheet"))d.close()});
