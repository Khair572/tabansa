const $=s=>document.querySelector(s);
const rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tgl=d=>d?new Date(d+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"-";
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const hariIni=()=>iso(new Date());
function toast(m,err){let b=$("#toasts");if(!b){b=document.createElement("div");b.id="toasts";document.body.append(b)}
 const t=document.createElement("div");t.className="toast"+(err?" err":"");t.textContent=m;b.append(t);setTimeout(()=>t.remove(),3500)}
function csv(nama,rows){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const a=document.createElement("a");
 a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}));a.download=nama;a.click()}
const jenisTxt=j=>j==="masuk"?'<b class="in">Setoran</b>':'<b class="out">Penarikan</b>';
const statusPill=x=>x.aktif?'<span class="pill ok">Aktif</span>':'<span class="pill">Tidak aktif</span>';
const inisial=n=>esc((n||"?").trim().charAt(0).toUpperCase());
const jml=r=>`<b class="${r.jenis==="masuk"?"in":"out"}">${r.jenis==="masuk"?"+":"-"}${rp(r.jumlah)}</b>`;
const trxRow=(r,nama)=>`<div class="trx"><div><p>${nama?`<b>${esc(r.santri?.nama||r.nis)}</b> <small>${esc(r.nis)}</small>`:jenisTxt(r.jenis)}</p><small>${tgl(r.tanggal)}${nama?" · "+(r.jenis==="masuk"?"Setoran":"Penarikan"):""}${r.keterangan?" · "+esc(r.keterangan):""}</small></div><div class="v">${jml(r)}</div></div>`;
function filterSantri(S,q,st,sa,so){q=q.toLowerCase();
 const d=S.filter(x=>(x.nis+" "+x.nama+" "+(x.alamat||"")+" "+(x.keterangan||"")).toLowerCase().includes(q)&&(st===""||(st==="aktif")===x.aktif)&&(sa===""||(sa==="ada")===(x.saldo>0)));
 const c={nama:(a,b)=>a.nama.localeCompare(b.nama),nis:(a,b)=>a.nis.localeCompare(b.nis,undefined,{numeric:true}),saldo:(a,b)=>b.saldo-a.saldo,masuk:(a,b)=>(b.tanggal_masuk||"").localeCompare(a.tanggal_masuk||""),baru:(a,b)=>new Date(b.created_at)-new Date(a.created_at)}[so];
 return d.sort(c)}
const FILTER_HTML=`<input id="q" class="inp" style="flex:1;min-width:170px" placeholder="Cari NIS, nama, alamat, ket...">
<select id="fSt" class="inp"><option value="">Semua status</option><option value="aktif">Aktif</option><option value="nonaktif">Tidak aktif</option></select>
<select id="fSa" class="inp"><option value="">Semua saldo</option><option value="ada">Ada saldo</option><option value="kosong">Saldo kosong</option></select>
<select id="fSo" class="inp"><option value="nama">Nama A-Z</option><option value="nis">NIS</option><option value="saldo">Saldo terbesar</option><option value="masuk">Tgl masuk terbaru</option><option value="baru">Terbaru diinput</option></select>`;
// ---- Transaksi per periode ----
function initPeriode(el){
 el.innerHTML=`<div class="per" id="pPre"><button class="btn btn-ghost btn-sm" data-p="hari">Hari ini</button><button class="btn btn-ghost btn-sm" data-p="minggu">Minggu ini</button><button class="btn btn-ghost btn-sm" data-p="lalu">Minggu lalu</button><button class="btn btn-ghost btn-sm" data-p="bulan">Bulan ini</button>
 <input type="date" id="pA" class="inp" aria-label="Dari tanggal"><span class="mut">s/d</span><input type="date" id="pB" class="inp" aria-label="Sampai tanggal"></div><p id="pSum" class="mut" style="margin:0 0 10px"></p><div id="pList"></div>`;
 const set=p=>{const n=new Date(),d=new Date(n.getFullYear(),n.getMonth(),n.getDate()),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));let a=d,b=d;
  if(p==="minggu"){a=mon;b=new Date(mon);b.setDate(mon.getDate()+6)}
  if(p==="lalu"){a=new Date(mon);a.setDate(mon.getDate()-7);b=new Date(mon);b.setDate(mon.getDate()-1)}
  if(p==="bulan"){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
  $("#pA").value=iso(a);$("#pB").value=iso(b);muat()};
 async function muat(){const a=$("#pA").value,b=$("#pB").value;if(!a||!b)return;
  const{data,error}=await sb.from("transaksi").select("*,santri(nama)").gte("tanggal",a).lte("tanggal",b).order("tanggal",{ascending:false}).order("created_at",{ascending:false}).limit(500);
  if(error){$("#pList").innerHTML='<p class="empty">'+esc(error.message)+'</p>';return}
  const m=data.filter(r=>r.jenis==="masuk").reduce((t,r)=>t+Number(r.jumlah),0),k=data.filter(r=>r.jenis==="keluar").reduce((t,r)=>t+Number(r.jumlah),0);
  $("#pSum").innerHTML=`${data.length} transaksi &middot; setoran <b class="in">${rp(m)}</b> &middot; penarikan <b class="out">${rp(k)}</b>`;
  $("#pList").innerHTML=data.map(r=>trxRow(r,true)).join("")||'<p class="empty">Tidak ada transaksi pada periode ini.</p>'}
 el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>set(b.dataset.p));$("#pA").onchange=muat;$("#pB").onchange=muat;set("minggu");return muat}
