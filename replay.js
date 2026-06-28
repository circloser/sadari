// SADARI 공유 결과 페이지용 읽기 전용 사다리 리플레이 렌더러
(function(){
  var el = document.getElementById("sadari-data");
  var root = document.getElementById("replay-root");
  if(!el || !root) return;
  var B; try { B = JSON.parse(el.textContent); } catch(e){ return; }

  var PALETTE = ["#38bdf8","#a78bfa","#f472b6","#34d399","#fbbf24","#fb923c","#60a5fa","#f87171","#2dd4bf","#c084fc"];
  var n = Math.max(2, B.n|0), lrows = Math.max(1, B.lrows|0);
  var names = B.names || [], results = B.results || [];
  var rungs = (B.rungs || []).map(function(row){
    var m = new Map(); (row||[]).forEach(function(p){ m.set(p[0]|0, p[1]); }); return m;
  });
  var G = { marginLeft:42, marginRight:42, marginTop:62, marginBottom:70, colSpacing:64, height:460 };

  var T = B._t || {};
  var hint = document.createElement("div");
  hint.style.cssText = "font-size:13px;color:#94a3b8;margin:0 0 10px";
  hint.textContent = T.hint || "상단 이름을 클릭하면 사다리를 타고 내려갑니다.";
  var scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;border-radius:14px;background:#0b1220;border:1px solid #334155";
  var canvas = document.createElement("canvas"); scroll.appendChild(canvas);
  var btn = document.createElement("button");
  btn.textContent = T.reveal || "👁️ 전체 결과 보기";
  btn.style.cssText = "margin-top:12px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer";
  root.appendChild(hint); root.appendChild(scroll); root.appendChild(btn);

  var ctx = canvas.getContext("2d"), DPR = Math.max(1, window.devicePixelRatio || 1);
  var paths = {}, traced = new Set(), revealed = new Set(), animating = false;

  function colX(c){ return G.marginLeft + c*G.colSpacing; }
  function soft(c){ return (""+c).indexOf("hsl(")===0 ? c.replace("hsl(","hsla(").replace(")",",0.18)") : c; }
  function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function fitText(t,maxW,base){ var s=base; ctx.font="bold "+s+"px Segoe UI"; while(ctx.measureText(t).width>maxW && s>9){ s--; ctx.font="bold "+s+"px Segoe UI"; } if(ctx.measureText(t).width>maxW){ var x=t; while(x.length>1 && ctx.measureText(x+"…").width>maxW) x=x.slice(0,-1); return x+"…"; } return t; }
  function pathLen(p){ var L=0; for(var i=1;i<p.length;i++) L+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y); return L; }

  function layout(){
    var w = scroll.clientWidth || 600, avail = w - G.marginLeft - G.marginRight - 4;
    var sp = n>1 ? avail/(n-1) : avail; sp = Math.max(46, Math.min(120, sp));
    G.colSpacing = Math.round(sp);
    var lw = G.marginLeft + G.marginRight + (n-1)*G.colSpacing;
    canvas.width = lw*DPR; canvas.height = G.height*DPR;
    canvas.style.width = lw+"px"; canvas.style.height = G.height+"px";
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function tracePath(start){
    var usable = G.height-G.marginTop-G.marginBottom, gap = usable/(lrows+1), amt = 0.7*gap;
    var col = start, pts = [{x:colX(col), y:G.marginTop}];
    for(var i=0;i<lrows;i++){
      var yi = G.marginTop+(i+1)*gap, m = rungs[i]||new Map(), cross=null;
      if(m.has(col-1)){ var o1=(m.get(col-1)||0)*amt/2; cross={entryY:yi+o1, exitCol:col-1, exitY:yi-o1}; }
      else if(m.has(col)){ var o2=(m.get(col)||0)*amt/2; cross={entryY:yi-o2, exitCol:col+1, exitY:yi+o2}; }
      if(cross){ pts.push({x:colX(col), y:cross.entryY}); col=cross.exitCol; pts.push({x:colX(col), y:cross.exitY}); }
    }
    pts.push({x:colX(col), y:G.height-G.marginBottom});
    return { points:pts, endCol:col };
  }
  function computeAll(){ paths={}; for(var c=0;c<n;c++) paths[c]=tracePath(c); }

  function drawLadder(){
    ctx.lineWidth=4; ctx.lineCap="round";
    for(var c=0;c<n;c++){ ctx.strokeStyle="#3b4a63"; ctx.beginPath(); ctx.moveTo(colX(c),G.marginTop); ctx.lineTo(colX(c),G.height-G.marginBottom); ctx.stroke(); }
    var usable=G.height-G.marginTop-G.marginBottom, gap=usable/(lrows+1), amt=0.7*gap;
    ctx.lineWidth=4; ctx.strokeStyle="#64748b";
    for(var i=0;i<lrows;i++){ var yi=G.marginTop+(i+1)*gap; (rungs[i]||new Map()).forEach(function(sl,cc){ var off=(sl||0)*amt/2; ctx.beginPath(); ctx.moveTo(colX(cc),yi-off); ctx.lineTo(colX(cc+1),yi+off); ctx.stroke(); }); }
  }
  function drawTrail(points,maxLen,color,withToken){
    ctx.lineWidth=5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y); var acc=0, tip=points[0];
    for(var i=1;i<points.length;i++){ var a=points[i-1], b=points[i], seg=Math.hypot(b.x-a.x,b.y-a.y);
      if(maxLen!==Infinity && acc+seg>=maxLen){ var t=(maxLen-acc)/seg; tip={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}; ctx.lineTo(tip.x,tip.y); acc=maxLen; break; }
      ctx.lineTo(b.x,b.y); acc+=seg; tip=b; }
    ctx.stroke(); ctx.shadowBlur=0;
    if(withToken){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(tip.x,tip.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#0b1220"; ctx.beginPath(); ctx.arc(tip.x,tip.y,3.5,0,Math.PI*2); ctx.fill(); }
  }
  function drawLabels(active){
    ctx.textAlign="center"; ctx.textBaseline="middle";
    var boxW=Math.max(38,Math.min(64,G.colSpacing-8));
    for(var c=0;c<n;c++){
      var x=colX(c), color=PALETTE[c%PALETTE.length], isA=active&&(c in active);
      ctx.fillStyle=isA?color:"#1e293b"; roundRect(x-boxW/2,12,boxW,32,9); ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=color; ctx.stroke();
      ctx.fillStyle=isA?"#0b1220":"#e2e8f0"; var nm=names[c]||("#"+(c+1)); ctx.fillText(fitText(nm,boxW-8,13),x,28);
      var r=results[c]||{l:"?",k:"neutral",c:"#64748b"}, rev=revealed.has(c), y0=G.height-44;
      var fill="#0f172a", txt="#94a3b8", label="?";
      if(rev){ label=r.l||"?"; txt=r.c||"#c084fc"; fill=soft(txt); }
      ctx.fillStyle=fill; var w=Math.max(42,Math.min(64,G.colSpacing-8)); roundRect(x-w/2,y0,w,32,9); ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=rev?txt:"#334155"; ctx.stroke();
      ctx.fillStyle=txt; ctx.fillText(fitText(label,w-8,12),x,y0+16);
    }
  }
  function draw(active){
    ctx.clearRect(0,0,canvas.width,canvas.height); drawLadder();
    traced.forEach(function(c){ if(active && (c in active)) return; drawTrail(paths[c].points, Infinity, (results[paths[c].endCol]||{}).c || "#38bdf8"); });
    if(active){ for(var c in active){ var col=+c; drawTrail(paths[col].points, active[c], PALETTE[col%PALETTE.length], true); } }
    drawLabels(active);
  }
  function animate(col){
    animating=true; var pts=paths[col].points, total=pathLen(pts), elapsed=0, last=null;
    function frame(ts){ if(last==null) last=ts; elapsed+=(ts-last)/1000; last=ts; var len=Math.min(total, elapsed*340);
      var a={}; a[col]=len; draw(a);
      if(len<total) requestAnimationFrame(frame);
      else { traced.add(col); revealed.add(paths[col].endCol); animating=false; draw(); } }
    requestAnimationFrame(frame);
  }
  canvas.addEventListener("click", function(e){
    if(animating) return;
    var rect=canvas.getBoundingClientRect(), x=e.clientX-rect.left, c=Math.round((x-G.marginLeft)/G.colSpacing);
    if(c<0||c>=n||traced.has(c)) return; animate(c);
  });
  btn.addEventListener("click", function(){ if(animating) return; for(var c=0;c<n;c++){ traced.add(c); revealed.add(paths[c].endCol); } draw(); });
  var rt; window.addEventListener("resize", function(){ if(animating) return; clearTimeout(rt); rt=setTimeout(function(){ layout(); computeAll(); draw(); },120); });

  layout(); computeAll(); draw();
})();
