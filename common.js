const $=s=>document.querySelector(s);
let RT="";
const rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tgl=d=>d?new Date(d+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"-";
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const hariIni=()=>iso(new Date());
function toast(m,err){let b=$("#toasts");if(!b){b=document.createElement("div");b.id="toasts";document.body.append(b)}
 const t=document.createElement("div");t.className="toast"+(err?" err":"");t.textContent=m;b.append(t);setTimeout(()=>t.remove(),3500)}
function csv(nama,rows){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const teks="\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n");
 // Aplikasi Android (WebView) tidak bisa mengunduh blob; simpan lewat jembatan bila tersedia.
 if(window.AndroidBridge&&AndroidBridge.simpanCsv){try{AndroidBridge.simpanCsv(nama,btoa(unescape(encodeURIComponent(teks))));return}catch(e){}}
 const u=URL.createObjectURL(new Blob([teks],{type:"text/csv"})),a=document.createElement("a");a.href=u;a.download=nama;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
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
 el.innerHTML=`<div class="pre" id="pPre"><button class="btn btn-ghost btn-sm" data-p="hari">Hari ini</button><button class="btn btn-ghost btn-sm" data-p="minggu">Minggu ini</button><button class="btn btn-ghost btn-sm" data-p="lalu">Minggu lalu</button><button class="btn btn-ghost btn-sm" data-p="bulan">Bulan ini</button>
 </div><div class="dts"><input type="date" id="pA" class="inp" aria-label="Dari tanggal"><span class="mut">s/d</span><input type="date" id="pB" class="inp" aria-label="Sampai tanggal"></div><p id="pSum" class="mut" style="margin:0 0 10px"></p><div id="pList"></div>`;
 const set=p=>{const n=new Date(),d=new Date(n.getFullYear(),n.getMonth(),n.getDate()),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));let a=d,b=d;
  if(p==="minggu"){a=mon;b=new Date(mon);b.setDate(mon.getDate()+6)}
  if(p==="lalu"){a=new Date(mon);a.setDate(mon.getDate()-7);b=new Date(mon);b.setDate(mon.getDate()-1)}
  if(p==="bulan"){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
  $("#pA").value=iso(a);$("#pB").value=iso(b);muat()};
 async function muat(){const a=$("#pA").value,b=$("#pB").value;if(!a||!b)return;
  const{data,error}=await cq("per:"+a+":"+b,sb.from("transaksi").select("*,santri(nama)").gte("tanggal",a).lte("tanggal",b).order("tanggal",{ascending:false}).order("created_at",{ascending:false}).limit(500));
  if(error){$("#pSum").textContent="";$("#pList").innerHTML='<p class="empty">'+(errJaringan(error)?"Tidak ada koneksi dan data periode ini belum tersimpan di perangkat.":esc(error.message))+'</p>';return}
  const m=data.filter(r=>r.jenis==="masuk").reduce((t,r)=>t+Number(r.jumlah),0),k=data.filter(r=>r.jenis==="keluar").reduce((t,r)=>t+Number(r.jumlah),0);
  $("#pSum").innerHTML=`${data.length} transaksi &middot; setoran <b class="in">${rp(m)}</b> &middot; penarikan <b class="out">${rp(k)}</b>`;
  $("#pList").innerHTML=data.map(r=>trxRow(r,true)).join("")||'<p class="empty">Tidak ada transaksi pada periode ini.</p>'}
 el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>set(b.dataset.p));$("#pA").onchange=muat;$("#pB").onchange=muat;set("minggu");return muat}

// "5k", "10rb", "1,5jt", "25.000", "Rp 25000" -> angka rupiah (NaN jika tidak valid)
function parseNominal(s){s=String(s||"").toLowerCase().replace(/rp|\s/g,"");if(!s)return 0;
 const m=s.match(/^(\d[\d.,]*)(k|rb|ribu|jt|juta)?$/);if(!m)return NaN;let n=m[1];
 if(m[2]){n=parseFloat(n.replace(",","."))*(/^(k|rb|ribu)$/.test(m[2])?1e3:1e6)}else n=parseFloat(n.replace(/[.,]/g,""));
 return Math.round(n)}

// ---- Cache data untuk offline ----
const CK="tb:";
const simpan=(k,d)=>{try{localStorage.setItem(CK+k,JSON.stringify({t:Date.now(),d}))}catch(e){}pangkas("per:",8);pangkas("trx:",30)};
const baca=k=>{try{return JSON.parse(localStorage.getItem(CK+k))}catch(e){return null}};
function pangkas(pref,maks){try{Object.keys(localStorage).filter(k=>k.startsWith(CK+pref)).map(k=>[k,(JSON.parse(localStorage.getItem(k))||{}).t||0]).sort((a,b)=>b[1]-a[1]).slice(maks).forEach(([k])=>localStorage.removeItem(k))}catch(e){}}
// true jika galat disebabkan jaringan (bukan penolakan server)
const errJaringan=e=>!navigator.onLine||!e||(!e.code&&!e.status&&/fetch|network|load failed|offline|timeout/i.test(e.message||""));
// Jalankan permintaan Supabase; jika gagal karena jaringan, pakai data tersimpan terakhir.
async function cq(key,req){let r;try{r=await req}catch(e){r={data:null,error:e}}
 if(!r.error){simpan(key,r.data);if(STALE_T){STALE_T=0;netUI()}return r}
 if(errJaringan(r.error)){const c=baca(key);if(c){STALE_T=STALE_T?Math.min(STALE_T,c.t):c.t;netUI();return{data:c.d,error:null}}}
 return r}

// ---- Antrean transaksi offline (admin) ----
const OB_K=CK+"outbox";
const obGet=()=>{try{return JSON.parse(localStorage.getItem(OB_K))||[]}catch(e){return[]}};
const obSet=a=>{try{localStorage.setItem(OB_K,JSON.stringify(a));return true}catch(e){toast("Penyimpanan perangkat penuh.",1);return false}};
const uid=()=>crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:r&3|8).toString(16)});

// ---- Sesi admin yang tetap dikenali saat offline ----
async function sesiAdmin(){let s=null;try{const{data}=await sb.auth.getSession();s=data&&data.session}catch(e){}
 if(s&&s.user)return s.user.email||"admin";
 if(!navigator.onLine||SB_STUB){try{for(const k of Object.keys(localStorage)){if(/^sb-.+-auth-token$/.test(k)){const v=JSON.parse(localStorage.getItem(k)),u=v&&(v.user||(v.currentSession&&v.currentSession.user));if(u)return u.email||"admin"}}}catch(e){}}
 return null}

// ---- Indikator online/offline ----
let STALE_T=0;
const PESAN_OFF=location.pathname.indexOf("/admin/")>=0?"Anda sedang offline. Setoran/penarikan akan diantre dan disinkronkan otomatis saat online. Edit dan hapus data butuh internet.":"Anda sedang offline. Menampilkan data yang tersimpan di perangkat.";
function netUI(){const n=$("#net");if(!n)return;const off=!navigator.onLine,srv=["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(RT),st=off||srv?"off":RT==="SUBSCRIBED"?"on":"wait";
 n.className="net "+st;n.querySelector("span").textContent={off:"Offline",on:"Online",wait:"Menyambung"}[st];
 n.title={off:off?"Tidak ada koneksi internet":"Server tidak terjangkau, mencoba menyambung ulang",on:"Terhubung ke server (data realtime)",wait:"Menyambungkan ke server..."}[st];
 const b=$("#offBar");if(b){b.hidden=!(off||STALE_T);b.textContent=(off?PESAN_OFF:"Server tidak terjangkau. Menampilkan data yang tersimpan.")+(STALE_T?" Data terakhir diperbarui "+new Date(STALE_T).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})+".":"")}}
const setRT=s=>{RT=s;netUI()};
function initNet(){document.querySelector(".acts").insertAdjacentHTML("afterbegin",'<span id="net" class="net wait" role="status" aria-live="polite"><i></i><span>Menyambung</span></span>');
 document.body.insertAdjacentHTML("beforeend",'<div id="offBar" class="offbar" role="alert" hidden></div>');
 addEventListener("offline",netUI);addEventListener("online",()=>{netUI();toast("Kembali online");if(window.onBack)window.onBack()});netUI()}
function perluOnline(){if(navigator.onLine)return true;toast("Anda sedang offline. Coba lagi setelah tersambung.",1);return false}
