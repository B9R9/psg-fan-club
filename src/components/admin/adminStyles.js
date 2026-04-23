export const s = {
  label:      { fontFamily:'Barlow Condensed,sans-serif', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(200,200,192,0.5)', display:'block', marginBottom:5 },
  input:      { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, color:'#f4f4f2', fontFamily:'Barlow,sans-serif', fontSize:14, padding:'9px 12px', outline:'none', width:'100%', transition:'border-color 0.2s' },
  select:     { background:'#04133b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, color:'#f4f4f2', fontFamily:'Barlow,sans-serif', fontSize:14, padding:'9px 12px', outline:'none' },
  btn:        { fontFamily:'Barlow Condensed,sans-serif', fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', border:'none', borderRadius:2, padding:'9px 18px', cursor:'pointer', transition:'background 0.2s' },
  btnPrimary: { background:'#e8001d', color:'#fff' },
  btnSecondary:{ background:'rgba(255,255,255,0.08)', color:'#f4f4f2' },
  btnDanger:  { background:'rgba(232,0,29,0.15)', color:'#e8001d', border:'1px solid rgba(232,0,29,0.3)' },
  card:       { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:24, marginBottom:16 },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { fontFamily:'Barlow Condensed,sans-serif', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(200,200,192,0.45)', textAlign:'left', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  td:         { fontFamily:'Barlow,sans-serif', fontSize:13, color:'#c8c8c0', padding:'12px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle' },
  chip:       { display:'inline-block', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', borderRadius:2, padding:'2px 7px' },
  pageTitle:  { fontFamily:'Bebas Neue,sans-serif', fontSize:36, letterSpacing:'0.06em', color:'#f4f4f2', marginBottom:28 },
  viewLink:   { color:'#c8a84b', textDecoration:'none', fontFamily:'Barlow Condensed,sans-serif', fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap' },
}

export function toast(msg) {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#04133b;border:1px solid rgba(232,0,29,0.4);color:#f4f4f2;font-family:Barlow Condensed,sans-serif;font-size:13px;letter-spacing:.1em;padding:12px 24px;border-radius:3px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5);`
  el.textContent = '✓  ' + msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}
