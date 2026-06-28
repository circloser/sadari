// SADARI Worker — 결과 공유 링크(API + /r/:id 결과/리플레이 페이지). 그 외 요청은 정적 자산으로 위임.
const ALPH = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 글자 제외
const KIND = { win:"#34d399", lose:"#f87171", neutral:"#c084fc" };
const GA = "G-GX8871G3D0";
const ADS = "ca-pub-6947130056543786";

function genId(n = 8){
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  let s = ""; for (let i = 0; i < n; i++) s += ALPH[a[i] % ALPH.length];
  return s;
}
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}
function jsonForHtml(obj){ return JSON.stringify(obj).replace(/</g, "\\u003c"); }
function hexA(hex, a){
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function json(obj, status = 200){
  return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json; charset=utf-8" } });
}
function clampInt(v, lo, hi){ v = v|0; return v<lo?lo:(v>hi?hi:v); }

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    const p = url.pathname;

    // ===== 결과 저장 API =====
    if (p === "/api/share" && request.method === "POST"){
      try {
        const body = await request.text();
        if (body.length > 64000) return json({ error:"too_large" }, 413);
        let data; try { data = JSON.parse(body); } catch { return json({ error:"bad_json" }, 400); }
        if (!data || !Array.isArray(data.rows) || data.rows.length < 1 || data.rows.length > 60)
          return json({ error:"invalid" }, 400);
        const rec = {
          v: 2,
          mode: typeof data.mode === "string" ? data.mode.slice(0, 16) : "",
          sender: typeof data.sender === "string" ? data.sender.slice(0, 40) : "",
          rows: data.rows.slice(0, 60).map(r => ({
            n: String(r.n == null ? "" : r.n).slice(0, 40),
            r: String(r.r == null ? "" : r.r).slice(0, 40),
            k: (r.k === "win" || r.k === "lose" || r.k === "neutral") ? r.k : "neutral"
          })),
          ts: Date.now()
        };
        // 사다리 재현용 보드 데이터(선택)
        const b = data.board;
        if (b && typeof b === "object" && Array.isArray(b.rungs) && Array.isArray(b.names) && Array.isArray(b.results)){
          const n = clampInt(b.n, 2, 30);
          rec.board = {
            n,
            lrows: clampInt(b.lrows, 1, 160),
            diagonal: !!b.diagonal,
            rungs: b.rungs.slice(0, 160).map(row => Array.isArray(row)
              ? row.slice(0, 40).map(pair => [ pair[0]|0, (pair[1] === -1 || pair[1] === 1) ? pair[1] : 0 ]).filter(pr => pr[0] >= 0 && pr[0] < n-1)
              : []),
            names: b.names.slice(0, 30).map(x => String(x == null ? "" : x).slice(0, 40)),
            results: b.results.slice(0, 30).map(r => ({
              l: String(r && r.l != null ? r.l : "").slice(0, 40),
              k: (r && (r.k === "win" || r.k === "lose" || r.k === "neutral")) ? r.k : "neutral",
              c: String(r && r.c != null ? r.c : "#38bdf8").slice(0, 32)
            }))
          };
        }
        let id = genId();
        for (let t = 0; t < 5; t++){ if (!(await env.SHARE.get("r:" + id))) break; id = genId(); }
        await env.SHARE.put("r:" + id, JSON.stringify(rec));
        return json({ id, url: url.origin + "/r/" + id });
      } catch { return json({ error:"server" }, 500); }
    }

    // ===== 결과 페이지 =====
    if (p.startsWith("/r/")){
      const id = p.slice(3).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
      if (!id) return Response.redirect(url.origin + "/", 302);
      const raw = await env.SHARE.get("r:" + id);
      if (!raw) return new Response(notFoundHtml(), { status:404, headers:{ "content-type":"text/html; charset=utf-8" } });
      let rec; try { rec = JSON.parse(raw); } catch { return new Response(notFoundHtml(), { status:404, headers:{ "content-type":"text/html; charset=utf-8" } }); }
      return new Response(resultHtml(rec, url.origin), {
        headers:{ "content-type":"text/html; charset=utf-8", "cache-control":"public, max-age=600" }
      });
    }

    // ===== 그 외: 정적 자산 =====
    return env.ASSETS.fetch(request);
  }
};

const STYLE = `*{box-sizing:border-box}body{margin:0;font-family:"Pretendard","Segoe UI",-apple-system,sans-serif;background:radial-gradient(1200px 600px at 50% -10%,#1e293b,#0f172a);color:#e2e8f0;min-height:100vh;padding:30px 18px 60px}
.wrap{max-width:620px;margin:0 auto}
.brand{display:flex;align-items:center;justify-content:center;gap:8px;font-size:26px;font-weight:800;letter-spacing:-.5px;text-decoration:none;background:linear-gradient(135deg,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:4px}
.tagline{text-align:center;color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 22px}
.card{background:linear-gradient(180deg,#1e293b,#273449);border:1px solid #334155;border-radius:18px;padding:24px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
h1{font-size:20px;margin:0 0 16px;text-align:center}
table{width:100%;border-collapse:collapse;font-size:15px}
td{border-bottom:1px solid #334155;padding:11px 8px}
.nm{font-weight:700}
.pill{padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700}
.cta{display:block;text-align:center;margin:22px auto 0;background:linear-gradient(135deg,#38bdf8,#a78bfa);color:#0b1220;font-weight:800;font-size:16px;text-decoration:none;padding:15px;border-radius:14px}
summary{cursor:pointer;color:#94a3b8;font-size:13px}
footer{max-width:620px;margin:22px auto 0;text-align:center;color:#94a3b8;font-size:12px}
footer a{color:#38bdf8}`;

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2338bdf8'/%3E%3Cstop offset='1' stop-color='%23a78bfa'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='15' fill='url(%23g)'/%3E%3Cg stroke='%230b1220' stroke-width='4.5' stroke-linecap='round' fill='none'%3E%3Cline x1='22' y1='22' x2='22' y2='50'/%3E%3Cline x1='42' y1='22' x2='42' y2='50'/%3E%3Cline x1='22' y1='31' x2='42' y2='31'/%3E%3Cline x1='22' y1='41' x2='42' y2='41'/%3E%3C/g%3E%3Cpolygon points='32,4 34,9.2 39.6,9.5 35.2,13 36.7,18.5 32,15.4 27.3,18.5 28.8,13 24.4,9.5 30,9.2' fill='%23fde047'/%3E%3C/svg%3E";

function head(title, desc, origin, extra){
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0f172a">
<meta property="og:type" content="website"><meta property="og:title" content="${title}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${origin}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="${FAVICON}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>
<style>${STYLE}</style>${extra||""}`;
}

function tableRows(rec){
  return rec.rows.map(r => {
    const c = KIND[r.k] || KIND.neutral;
    return `<tr><td class="nm">${esc(r.n)}</td><td><span class="pill" style="background:${hexA(c,0.18)};color:${c}">${esc(r.r)}</span></td></tr>`;
  }).join("");
}

function resultHtml(rec, origin){
  const sender = rec.sender ? esc(rec.sender) : "";
  const who = sender ? sender + "님이 보낸 " : "";
  const title = who + "사다리타기 결과 · SADARI";
  const desc = rec.rows.slice(0, 8).map(r => esc(r.n) + ": " + esc(r.r)).join(" · ");
  const rows = tableRows(rec);

  if (rec.board){
    // 사다리 재현(인터랙티브 리플레이) + 결과 표(접기)
    return `<!DOCTYPE html><html lang="ko"><head>${head(title, desc, origin, '<script src="/replay.js" defer></script>')}</head><body>
<div class="wrap">
<a class="brand" href="/">🪜 SADARI</a><p class="tagline">Climb your luck.</p>
<div class="card">
<h1>${who}🪜 사다리타기</h1>
<div id="replay-root"></div>
<details style="margin-top:18px"><summary>결과 표로 보기</summary><table style="margin-top:10px"><tbody>${rows}</tbody></table></details>
<a class="cta" href="/">나도 사다리 돌려보기 →</a>
</div></div>
<footer>이 결과는 <a href="/">SADARI</a> 에서 생성되었습니다 · sa-da-ri.com</footer>
<script id="sadari-data" type="application/json">${jsonForHtml(rec.board)}</script>
</body></html>`;
  }

  // 보드 데이터 없는 구버전 링크 → 결과 표만
  return `<!DOCTYPE html><html lang="ko"><head>${head(title, desc, origin, "")}</head><body>
<div class="wrap">
<a class="brand" href="/">🪜 SADARI</a><p class="tagline">Climb your luck.</p>
<div class="card">
<h1>${who}🪜 사다리타기 결과</h1>
<table><tbody>${rows}</tbody></table>
<a class="cta" href="/">나도 사다리 돌려보기 →</a>
</div></div>
<footer>이 결과는 <a href="/">SADARI</a> 에서 생성되었습니다 · sa-da-ri.com</footer>
</body></html>`;
}

function notFoundHtml(){
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>결과를 찾을 수 없습니다 · SADARI</title>
<style>body{margin:0;font-family:"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:20px}a{color:#38bdf8;font-weight:700}</style></head>
<body><div><h1>🔍 결과를 찾을 수 없어요</h1><p>링크가 만료되었거나 잘못된 주소입니다.</p><p><a href="/">🪜 SADARI 홈으로</a></p></div></body></html>`;
}
