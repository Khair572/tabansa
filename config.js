const SUPABASE_URL = "https://ptllucrmrpsypcjaosrg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_J-LQAD-Hp-FX7xwI9Jpiwg_MI9XfVDD";
const NAMA_LEMBAGA = "Tabungan Santri"; // ganti dengan nama pesantren bila perlu

// Jika pustaka Supabase gagal dimuat (offline dan belum pernah tersimpan), pakai klien kosong:
// semua permintaan dianggap gagal jaringan sehingga halaman tetap tampil dengan data tersimpan.
const SB_STUB = !window.supabase;
function stubSb() {
  const err = { message: "Failed to fetch (offline)", code: "" };
  const chain = new Proxy(function () {}, {
    get: (t, p) => (p === "then" ? res => res({ data: null, error: err }) : chain),
    apply: () => chain
  });
  return {
    from: () => chain,
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
      signInWithPassword: async () => ({ error: err })
    },
    channel: () => ({ on() { return this; }, subscribe(cb) { if (cb) setTimeout(() => cb("CLOSED")); return this; } })
  };
}
const sb = SB_STUB ? stubSb() : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
