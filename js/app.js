const $=s=>document.querySelector(s),rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tgl=d=>new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
const today=()=>new Date().toISOString().slice(0,10);

(async()=>{const{data:{session}}=await sb.auth.getSession();
 if(!session){location.href="login.html";return}
 $("#user").textContent=session.user.email;$("#t_tgl").value=today();show("dash")})();
$("#logout").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.t));
function show(t){document.querySelectorAll("main section").forEach(s=>s.hidden=s.id!==t);
 document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
 if(t==="dash")dash();if(t==="santri")santri()}

function trxTable(rows,withName,del){
 if(!rows.length)return'<p class="empty">Belum ada transaksi.</p>';
 return`<table><tr><th>Tanggal</th>${withName?"<th>NIS</th><th>Nama</th>":""}<th>Jenis</th><th>Jumlah</th><th>Keterangan</th>${del?"<th></th>":""}</tr>`+
 rows.map(r=>`<tr><td>${tgl(r.tanggal)}</td>${withName?`<td>${esc(r.nis)}</td><td>${esc(r.santri?.nama)}</td>`:""}
 <td class="${r.jenis==="masuk"?"in":"out"}">${r.jenis==="masuk"?"Setoran":"Penarikan"}</td><td>${rp(r.jumlah)}</td><td>${esc(r.keterangan)}</td>
 ${del?`<td class="noprint"><button class="btn sm del" onclick="hapusTrx('${r.id}')">Hapus</button></td>`:""}</tr>`).join("")+"</table>"}

async function dash(){
 const{data:s}=await sb.from("saldo_santri").select("*");
 const{data:t}=await sb.from("transaksi").select("*,santri(nama)").order("created_at",{ascending:false}).limit(10);
 const sum=k=>(s||[]).reduce((a,x)=>a+Number(x[k]),0);
 $("#cards").innerHTML=[["Total saldo",rp(sum("saldo"))],["Total setoran",rp(sum("total_masuk"))],["Total penarikan",rp(sum("total_keluar"))],["Jumlah santri",(s||[]).length]]
 .map(([l,v])=>`<div class="box"><span>${l}</span><b>${v}</b></div>`).join("");
 $("#recent").innerHTML=trxTable(t||[],true,false)}

let semua=[];
async function santri(){const{data,error}=await sb.from("saldo_santri").select("*").order("nama");
 if(error)return alert(error.message);semua=data||[];tampil()}
function tampil(){const q=$("#q").value.toLowerCase();
 const d=semua.filter(x=>x.nis.toLowerCase().includes(q)||x.nama.toLowerCase().includes(q));
 $("#list").innerHTML=d.length?`<table><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Saldo</th><th></th></tr>`+
 d.map(x=>`<tr><td>${esc(x.nis)}</td><td>${esc(x.nama)}</td><td>${esc(x.kelas)}</td><td>${rp(x.saldo)}</td>
 <td><button class="btn sm" onclick="lihat('${esc(x.nis)}')">Riwayat</button> <button class="btn sm del" onclick="hapusSantri('${esc(x.nis)}')">Hapus</button></td></tr>`).join("")+"</table>"
 :'<p class="empty">Belum ada santri. Tambahkan lewat form di atas.</p>'}
$("#q").oninput=tampil;
$("#fs").onsubmit=async e=>{e.preventDefault();
 const{error}=await sb.from("santri").insert({nis:$("#s_nis").value.trim(),nama:$("#s_nama").value.trim(),kelas:$("#s_kelas").value.trim()});
 if(error)return alert(error.code==="23505"?"NIS sudah terdaftar.":error.message);e.target.reset();santri()};
async function hapusSantri(nis){if(!confirm("Hapus santri "+nis+" beserta seluruh transaksinya?"))return;
 const{error}=await sb.from("santri").delete().eq("nis",nis);if(error)alert(error.message);santri()}
function lihat(nis){$("#r_nis").value=nis;show("riwayat");riwayat()}

async function cekNis(){const nis=$("#t_nis").value.trim();if(!nis){$("#t_info").textContent="Masukkan NIS untuk melihat nama dan saldo.";return null}
 const{data}=await sb.from("saldo_santri").select("*").eq("nis",nis).maybeSingle();
 $("#t_info").innerHTML=data?`<b>${esc(data.nama)}</b> (${esc(data.kelas||"-")}) — saldo ${rp(data.saldo)}`:"NIS tidak ditemukan.";return data}
$("#t_nis").onchange=cekNis;
$("#ft").onsubmit=async e=>{e.preventDefault();const s=await cekNis();if(!s)return alert("NIS tidak ditemukan.");
 const jumlah=Number($("#t_jml").value),jenis=$("#t_jenis").value;
 if(jenis==="keluar"&&jumlah>Number(s.saldo))return alert("Saldo tidak cukup. Saldo saat ini "+rp(s.saldo));
 const{error}=await sb.from("transaksi").insert({nis:s.nis,jenis,jumlah,tanggal:$("#t_tgl").value,keterangan:$("#t_ket").value.trim()});
 if(error)return alert(error.message);alert("Transaksi tersimpan.");const n=s.nis;e.target.reset();$("#t_tgl").value=today();$("#t_nis").value=n;cekNis()};

async function riwayat(){const nis=$("#r_nis").value.trim();if(!nis)return;
 const{data:s}=await sb.from("saldo_santri").select("*").eq("nis",nis).maybeSingle();
 if(!s){$("#r_out").innerHTML='<p class="empty">NIS tidak ditemukan.</p>';return}
 const{data:t}=await sb.from("transaksi").select("*").eq("nis",nis).order("tanggal",{ascending:false}).order("created_at",{ascending:false});
 $("#r_out").innerHTML=`<h3>${esc(s.nama)} — NIS ${esc(s.nis)}</h3><p class="info">Kelas ${esc(s.kelas||"-")} · Setoran ${rp(s.total_masuk)} · Penarikan ${rp(s.total_keluar)} · <b>Saldo ${rp(s.saldo)}</b></p><div class="tw">${trxTable(t||[],false,true)}</div>`}
$("#r_go").onclick=riwayat;$("#r_nis").onkeydown=e=>{if(e.key==="Enter")riwayat()};
async function hapusTrx(id){if(!confirm("Hapus transaksi ini?"))return;
 const{error}=await sb.from("transaksi").delete().eq("id",id);if(error)alert(error.message);riwayat()}
