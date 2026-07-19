// SADARI Worker — 결과 공유 링크(API + /r/:id 결과/리플레이 페이지). 그 외 요청은 정적 자산으로 위임.
const ALPH = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 글자 제외
const KIND = { win:"#34d399", lose:"#f87171", neutral:"#c084fc" };
const GA = "G-GX8871G3D0";
const ADS = "ca-pub-6947130056543786";
const SUP = ["ko","en","ja","zh","es","de","fr","ru","pt"];
const W = {
  ko:{namedTpl:"{n}님이 보낸 사다리타기 결과",plain:"사다리타기 결과",toggle:"결과 표로 보기",cta:"나도 사다리 돌려보기 →",foot:"이 결과는 SADARI 에서 생성되었습니다",hint:"상단 이름을 클릭하면 사다리를 타고 내려갑니다.",reveal:"👁️ 전체 결과 보기"},
  en:{namedTpl:"{n}'s ladder result",plain:"Ladder result",toggle:"View as table",cta:"Try it yourself →",foot:"Generated with SADARI",hint:"Tap a name at the top to trace it down.",reveal:"👁️ Reveal all"},
  ja:{namedTpl:"{n}さんからのあみだくじ結果",plain:"あみだくじ結果",toggle:"結果を表で見る",cta:"自分でもやってみる →",foot:"この結果は SADARI で作成されました",hint:"上部の名前をタップすると下までたどります。",reveal:"👁️ 全結果を見る"},
  zh:{namedTpl:"{n}发来的梯子结果",plain:"梯子结果",toggle:"以表格查看",cta:"我也来试试 →",foot:"此结果由 SADARI 生成",hint:"点击顶部名字即可沿梯子下行。",reveal:"👁️ 查看全部结果"},
  es:{namedTpl:"Resultado de la escalera de {n}",plain:"Resultado de la escalera",toggle:"Ver como tabla",cta:"Pruébalo tú →",foot:"Generado con SADARI",hint:"Toca un nombre arriba para trazar su recorrido.",reveal:"👁️ Revelar todo"},
  de:{namedTpl:"Leiter-Ergebnis von {n}",plain:"Leiter-Ergebnis",toggle:"Als Tabelle ansehen",cta:"Selbst ausprobieren →",foot:"Erstellt mit SADARI",hint:"Tippe oben auf einen Namen, um zu verfolgen.",reveal:"👁️ Alle zeigen"},
  fr:{namedTpl:"Résultat de l'échelle de {n}",plain:"Résultat de l'échelle",toggle:"Voir en tableau",cta:"Essayez vous-même →",foot:"Généré avec SADARI",hint:"Touchez un nom en haut pour suivre le tracé.",reveal:"👁️ Tout révéler"},
  ru:{namedTpl:"Результат лестницы от {n}",plain:"Результат лестницы",toggle:"Показать таблицей",cta:"Попробовать самому →",foot:"Создано в SADARI",hint:"Нажмите имя вверху, чтобы проследить путь.",reveal:"👁️ Показать все"},
  pt:{namedTpl:"Resultado da escada de {n}",plain:"Resultado da escada",toggle:"Ver como tabela",cta:"Faça você também →",foot:"Gerado com SADARI",hint:"Toque num nome no topo para traçar.",reveal:"👁️ Revelar tudo"}
};

// 홈(/) 의 언어별 서버사이드 메타 — 크롤러가 ?lang=xx 로 오면 해당 언어 title/description 로 렌더해 다국어 색인 유도. ko 는 기본(정적) 이라 제외.
const HOME = {
  en:{lc:"en_US",og:"SADARI · Ladder Game & Random Picker",title:"SADARI — Free Ladder Game (Amidakuji / Ghost Leg) & Random Picker",desc:"Free online ladder game (Amidakuji / Ghost Leg), plus roulette, draw lots, coin, dice, seating and timer. Pick winners, form teams or split a bill — up to 50 people, no sign-up."},
  ja:{lc:"ja_JP",og:"SADARI · あみだくじ＆抽選ツール",title:"SADARI — 無料あみだくじ＆ルーレット・抽選ツール（最大50人）",desc:"あみだくじ（Ghost Leg）をオンラインで無料作成。ルーレット・くじ引き・コイン・サイコロ・席替え・タイマーも。順番決め・チーム分け・割り勘に、登録不要・最大50人。"},
  zh:{lc:"zh_CN",og:"SADARI · 鬼脚图＆抽签工具",title:"SADARI — 免费鬼脚图（阶梯抽签）与轮盘抽签工具（最多50人）",desc:"在线免费制作鬼脚图（阶梯抽签），还有轮盘、抽签、抛硬币、骰子、排座位、计时器。排顺序、随机分组、AA分摊，免注册，最多50人。"},
  es:{lc:"es_ES",og:"SADARI · Sorteo aleatorio online",title:"SADARI — Sorteo online gratis: escalera (Amidakuji), ruleta y más",desc:"Sorteo online gratis: escalera (Amidakuji / Ghost Leg), ruleta, sorteo de cartas, moneda, dados, asientos y temporizador. Elige ganadores, forma equipos o divide la cuenta. Hasta 50, sin registro."},
  de:{lc:"de_DE",og:"SADARI · Zufallsgenerator & Losspiel",title:"SADARI — Zufallsgenerator: Leiterspiel (Amidakuji), Glücksrad & mehr",desc:"Kostenloser Zufallsgenerator: Leiterspiel (Amidakuji / Ghost Leg), Glücksrad, Losziehung, Münze, Würfel, Sitzplätze und Timer. Gewinner ziehen, Teams bilden, Rechnung teilen. Bis 50, ohne Anmeldung."},
  fr:{lc:"fr_FR",og:"SADARI · Tirage au sort en ligne",title:"SADARI — Tirage au sort en ligne : échelle (Amidakuji), roue & plus",desc:"Tirage au sort en ligne gratuit : échelle (Amidakuji / Ghost Leg), roue, cartes, pile ou face, dés, places et minuteur. Désignez des gagnants, formez des équipes ou partagez l'addition. Jusqu'à 50, sans inscription."},
  ru:{lc:"ru_RU",og:"SADARI · Случайный выбор онлайн",title:"SADARI — Случайный выбор онлайн: лесенка (амидакудзи), колесо и др.",desc:"Бесплатный случайный выбор онлайн: лесенка (амидакудзи / Ghost Leg), колесо фортуны, жребий, монетка, кубики, места и таймер. Выбирайте победителей, делите на команды и счёт. До 50, без регистрации."},
  pt:{lc:"pt_BR",og:"SADARI · Sorteio online",title:"SADARI — Sorteio online grátis: escada (Amidakuji), roleta e mais",desc:"Sorteio online grátis: escada (Amidakuji / Ghost Leg), roleta, sorteio de cartas, moeda, dados, lugares e cronômetro. Escolha ganhadores, forme times ou divida a conta. Até 50, sem cadastro."}
};

// 언어→og:locale
const LOC = { ko:"ko_KR", en:"en_US", ja:"ja_JP", zh:"zh_CN", es:"es_ES", de:"de_DE", fr:"fr_FR", ru:"ru_RU", pt:"pt_BR" };

// 사다리 외 도구별·언어별 네이티브 키워드(=검색어). ?tool=X&lang=Y 로 진입한 크롤러에게 해당 도구/언어 메타를 렌더해 각 도구를 각 언어로 색인시킨다.
const TOOL_KW = {
  roulette:{ko:"룰렛 돌리기",en:"Spinner Wheel · Wheel of Names",ja:"ルーレット",zh:"转盘抽奖",es:"Ruleta de nombres",de:"Glücksrad",fr:"Roue aléatoire",ru:"Колесо фортуны",pt:"Roleta de nomes"},
  draw:{ko:"제비뽑기",en:"Draw Lots",ja:"くじ引き",zh:"在线抽签",es:"Echar a suertes",de:"Lose ziehen",fr:"Tirer à la courte paille",ru:"Жребий онлайн",pt:"Tirar a sorte"},
  coin:{ko:"동전 던지기",en:"Flip a Coin",ja:"コイントス",zh:"抛硬币",es:"Cara o Cruz",de:"Münzwurf",fr:"Pile ou Face",ru:"Орёл или решка",pt:"Cara ou Coroa"},
  dice:{ko:"주사위 굴리기",en:"Dice Roller",ja:"サイコロ",zh:"掷骰子",es:"Lanzar dados",de:"Würfeln",fr:"Lancer de dés",ru:"Бросить кубик",pt:"Rolar dados"},
  seats:{ko:"자리 배치",en:"Random Seating Chart",ja:"席替え",zh:"随机排座位",es:"Asientos al azar",de:"Zufällige Sitzordnung",fr:"Plan de table aléatoire",ru:"Случайная рассадка",pt:"Mapa de lugares aleatório"},
  timer:{ko:"타이머",en:"Online Timer",ja:"タイマー",zh:"在线计时器",es:"Temporizador online",de:"Timer online",fr:"Minuteur en ligne",ru:"Таймер онлайн",pt:"Cronômetro online"}
};
const TOOL_TPL = {
  ko:{t:n=>`${n} — 무료 온라인 · SADARI`, d:n=>`${n}을(를) 회원가입 없이 무료로 바로 사용. 결과는 링크·이미지로 공유, 모바일 지원. SADARI의 랜덤 추첨 도구 모음.`},
  en:{t:n=>`${n} — Free Online, No Sign-up · SADARI`, d:n=>`${n} online — free, instant and fair. Share the result by link or image, works on mobile. From SADARI's random picker toolkit.`},
  ja:{t:n=>`${n} — 無料オンライン · SADARI`, d:n=>`${n}を登録なしで無料に。結果はリンク・画像で共有、スマホ対応。SADARIの抽選ツール集。`},
  zh:{t:n=>`${n} — 免费在线 · SADARI`, d:n=>`${n}，免注册免费即用。结果可用链接或图片分享，支持手机。SADARI 随机工具集。`},
  es:{t:n=>`${n} online gratis · SADARI`, d:n=>`${n} online, gratis y al instante. Comparte el resultado por enlace o imagen, funciona en el móvil. Del kit de sorteos SADARI.`},
  de:{t:n=>`${n} online kostenlos · SADARI`, d:n=>`${n} online, kostenlos und sofort. Ergebnis per Link oder Bild teilen, mobil nutzbar. Aus dem Zufalls-Toolkit von SADARI.`},
  fr:{t:n=>`${n} en ligne gratuit · SADARI`, d:n=>`${n} en ligne, gratuit et instantané. Partagez le résultat par lien ou image, compatible mobile. De la boîte à outils aléatoire SADARI.`},
  ru:{t:n=>`${n} — бесплатно онлайн · SADARI`, d:n=>`${n} онлайн, бесплатно и сразу. Поделитесь результатом ссылкой или картинкой, работает на телефоне. Из набора рандомайзеров SADARI.`},
  pt:{t:n=>`${n} online grátis · SADARI`, d:n=>`${n} online, grátis e na hora. Compartilhe o resultado por link ou imagem, funciona no celular. Do kit de sorteios SADARI.`}
};
// 플래그십 도구의 언어별 전용 콘텐츠 페이지 — 존재하면 앱 URL(?tool=X&lang=L)의 canonical/hreflang 을 이 페이지로 넘겨 중복(cannibalization) 방지.
const TOOL_PAGE = {
  roulette:{ en:"https://sa-da-ri.com/guide-wheel" },
  coin:{ en:"https://sa-da-ri.com/guide-coin-flip" },
  dice:{ en:"https://sa-da-ri.com/guide-dice" }
};

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

    // ===== 정식 도메인으로 통합 (중복 색인 방지) =====
    // workers.dev 미러로 들어온 요청은 sa-da-ri.com으로 301 리다이렉트한다.
    if (url.hostname === "sadari.singlena.workers.dev"){
      return Response.redirect("https://sa-da-ri.com" + p + url.search, 301);
    }

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
          lang: (typeof data.lang === "string" && SUP.includes(data.lang)) ? data.lang : "ko",
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
          const n = clampInt(b.n, 2, 50);
          rec.board = {
            n,
            lrows: clampInt(b.lrows, 1, 160),
            diagonal: !!b.diagonal,
            rungs: b.rungs.slice(0, 160).map(row => Array.isArray(row)
              ? row.slice(0, 40).map(pair => [ pair[0]|0, (pair[1] === -1 || pair[1] === 1) ? pair[1] : 0 ]).filter(pr => pr[0] >= 0 && pr[0] < n-1)
              : []),
            names: b.names.slice(0, 50).map(x => String(x == null ? "" : x).slice(0, 40)),
            results: b.results.slice(0, 50).map(r => ({
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

    // ===== 도구: ?tool=X (&lang=Y) 별 서버사이드 메타 (도구별 다국어 색인) =====
    if ((p === "/" || p === "/index.html") && request.method === "GET"){
      const tool = (url.searchParams.get("tool") || "").replace(/[^a-z]/g, "");
      if (TOOL_KW[tool]){
        const lr = url.searchParams.get("lang");
        const lang = (lr && SUP.includes(lr)) ? lr : "ko";
        const resp = await env.ASSETS.fetch(request);
        if ((resp.headers.get("content-type") || "").includes("text/html")){
          const base = "https://sa-da-ri.com/?tool=" + tool;
          const pages = TOOL_PAGE[tool] || {};
          const langUrl = l => pages[l] || (l === "ko" ? base : base + "&lang=" + l);
          // 이 언어에 전용 콘텐츠 페이지가 있으면 canonical 을 그쪽으로 넘긴다.
          const canon = pages[lang] || (lang === "ko" ? base : base + "&lang=" + lang);
          const name = TOOL_KW[tool][lang] || TOOL_KW[tool].en;
          const tpl = TOOL_TPL[lang] || TOOL_TPL.en;
          const title = tpl.t(name), desc = tpl.d(name), og = name + " · SADARI";
          return new HTMLRewriter()
            .on("html", { element(e){ e.setAttribute("lang", lang); } })
            .on("title", { element(e){ e.setInnerContent(title); } })
            .on('meta[name="description"]', { element(e){ e.setAttribute("content", desc); } })
            .on('meta[property="og:title"]', { element(e){ e.setAttribute("content", og); } })
            .on('meta[property="og:description"]', { element(e){ e.setAttribute("content", desc); } })
            .on('meta[name="twitter:title"]', { element(e){ e.setAttribute("content", og); } })
            .on('meta[name="twitter:description"]', { element(e){ e.setAttribute("content", desc); } })
            .on('meta[property="og:url"]', { element(e){ e.setAttribute("content", canon); } })
            .on('meta[property="og:locale"]', { element(e){ e.setAttribute("content", LOC[lang]); } })
            .on('link[rel="canonical"]', { element(e){ e.setAttribute("href", canon); } })
            .on('link[rel="alternate"]', { element(e){
              const hl = e.getAttribute("hreflang"); if (!hl) return;
              e.setAttribute("href", hl === "x-default" ? langUrl("en") : langUrl(hl));
            } })
            .transform(resp);
        }
        return resp;
      }
    }

    // ===== 홈: ?lang 별 서버사이드 메타 (다국어 색인) =====
    if ((p === "/" || p === "/index.html") && request.method === "GET"){
      const lang = url.searchParams.get("lang");
      const m = lang && HOME[lang];
      if (m){
        const resp = await env.ASSETS.fetch(request);
        if ((resp.headers.get("content-type") || "").includes("text/html")){
          const canon = "https://sa-da-ri.com/?lang=" + lang;
          return new HTMLRewriter()
            .on("html", { element(e){ e.setAttribute("lang", lang); } })
            .on("title", { element(e){ e.setInnerContent(m.title); } })
            .on('meta[name="description"]', { element(e){ e.setAttribute("content", m.desc); } })
            .on('meta[property="og:title"]', { element(e){ e.setAttribute("content", m.og); } })
            .on('meta[property="og:description"]', { element(e){ e.setAttribute("content", m.desc); } })
            .on('meta[name="twitter:title"]', { element(e){ e.setAttribute("content", m.og); } })
            .on('meta[name="twitter:description"]', { element(e){ e.setAttribute("content", m.desc); } })
            .on('meta[property="og:url"]', { element(e){ e.setAttribute("content", canon); } })
            .on('meta[property="og:locale"]', { element(e){ e.setAttribute("content", m.lc); } })
            .on('link[rel="canonical"]', { element(e){ e.setAttribute("href", canon); } })
            .transform(resp);
        }
        return resp;
      }
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
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');gtag('event','shared_result_view',{content_type:'ladder'});</script>
<style>${STYLE}</style>${extra||""}`;
}

function tableRows(rec){
  return rec.rows.map(r => {
    const c = KIND[r.k] || KIND.neutral;
    return `<tr><td class="nm">${esc(r.n)}</td><td><span class="pill" style="background:${hexA(c,0.18)};color:${c}">${esc(r.r)}</span></td></tr>`;
  }).join("");
}

function resultHtml(rec, origin){
  const lang = (rec.lang && W[rec.lang]) ? rec.lang : "ko";
  const t = W[lang];
  const T = t.plain;
  const title = T + " · SADARI";
  const desc = rec.rows.slice(0, 8).map(r => esc(r.n) + ": " + esc(r.r)).join(" · ");
  const rows = tableRows(rec);

  if (rec.board){
    // 사다리 재현(인터랙티브 리플레이) + 결과 표(접기)
    const board = Object.assign({}, rec.board, { _t: { hint: t.hint, reveal: t.reveal } });
    return `<!DOCTYPE html><html lang="${lang}"><head>${head(title, desc, origin, '<script src="/replay.js" defer></script>')}</head><body>
<div class="wrap">
<a class="brand" href="/">🪜 SADARI</a><p class="tagline">Climb your luck.</p>
<div class="card">
<h1>🪜 ${T}</h1>
<div id="replay-root"></div>
<details style="margin-top:18px"><summary>${t.toggle}</summary><table style="margin-top:10px"><tbody>${rows}</tbody></table></details>
<a class="cta" href="/">${t.cta}</a>
</div></div>
<footer>${t.foot} · sa-da-ri.com</footer>
<script id="sadari-data" type="application/json">${jsonForHtml(board)}</script>
</body></html>`;
  }

  // 보드 데이터 없는 구버전 링크 → 결과 표만
  return `<!DOCTYPE html><html lang="${lang}"><head>${head(title, desc, origin, "")}</head><body>
<div class="wrap">
<a class="brand" href="/">🪜 SADARI</a><p class="tagline">Climb your luck.</p>
<div class="card">
<h1>🪜 ${T}</h1>
<table><tbody>${rows}</tbody></table>
<a class="cta" href="/">${t.cta}</a>
</div></div>
<footer>${t.foot} · sa-da-ri.com</footer>
</body></html>`;
}

function notFoundHtml(){
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>결과를 찾을 수 없습니다 · SADARI</title>
<style>body{margin:0;font-family:"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:20px}a{color:#38bdf8;font-weight:700}</style></head>
<body><div><h1>🔍 결과를 찾을 수 없어요</h1><p>링크가 만료되었거나 잘못된 주소입니다.</p><p><a href="/">🪜 SADARI 홈으로</a></p></div></body></html>`;
}
