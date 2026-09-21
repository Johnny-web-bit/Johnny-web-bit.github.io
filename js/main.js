/* Johnny's Portfolio — 交互脚本 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  /* 老设备保险丝：缺 IntersectionObserver 时全部走兜底路径，绝不让一行报错中断整个脚本 */
  var hasIO = typeof IntersectionObserver !== "undefined";

  /* ---------- 加载页 ---------- */
  var loader = document.getElementById("loader");
  var fill = document.getElementById("loaderFill");
  var pct = document.getElementById("loaderPct");
  var DURATION = 1600;

  function finishLoad() {
    if (loader) loader.classList.add("done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");
  }

  if (!loader || reduced) {
    finishLoad();
  } else {
    var start = performance.now();
    var w1 = false, w2 = false;
    (function tick(now) {
      var t = Math.min((now - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(eased * 100);
      fill.style.width = v + "%";
      pct.textContent = v;
      /* 文字两行随进度先后升起 */
      if (!w1 && v >= 35) { loader.classList.add("w1"); w1 = true; }
      if (!w2 && v >= 70) { loader.classList.add("w2"); w2 = true; }
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(finishLoad, 250);
    })(start);
  }

  /* ---------- 滚动进场 ---------- */
  if (hasIO) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contact 标题 line-mask 进场 ---------- */
  var contactTitle = document.querySelector(".contact-title");
  if (contactTitle) {
    if (!hasIO) {
      contactTitle.classList.add("l-in");
    } else {
      var ctIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            contactTitle.classList.add("l-in");
            ctIO.unobserve(contactTitle);
          }
        });
      }, { threshold: 0.35 });
      ctIO.observe(contactTitle);
    }
  }

  /* ---------- 项目经历：年份数字翻滚收敛（odometer） ---------- */
  if (!reduced && hasIO) {
    document.querySelectorAll(".rs-year").forEach(function (el) {
      var target = el.textContent;
      var yIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        yIO.disconnect();
        var t0 = performance.now(), DUR = 900;
        (function roll(now) {
          var t = Math.min((now - t0) / DUR, 1);
          var e = 1 - Math.pow(1 - t, 3);
          el.textContent = target.replace(/[0-9]/g, function (d) {
            return String((Math.floor((1 - e) * (13 + (+d) * 7)) + (+d)) % 10);
          });
          if (t < 1) requestAnimationFrame(roll);
          else el.textContent = target;
        })(t0);
      }, { threshold: 0.6 });
      yIO.observe(el);
    });
  }

  /* ---------- Dock 高亮当前区块 ---------- */
  var links = document.querySelectorAll(".dock-nav a");
  if (hasIO) {
    var secIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle("active", a.dataset.sec === e.target.id);
          });
        });
      },
      { rootMargin: "-42% 0px -52% 0px" }
    );
    ["about", "resume", "works", "services", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) secIO.observe(s);
    });
  }

  /* ---------- 全局滚动/指针动效循环 ---------- */
  var heroBg = document.getElementById("heroBg");
  var marquee = document.querySelector(".marquee");
  var dock = document.getElementById("dock");
  var rsImg = document.querySelector(".rs-photo .ph-frame img");

  if (!reduced) {
    var scrollY = window.scrollY, lastY = scrollY, velocity = 0, skew = 0;
    var mx = 0, my = 0, cx = 0, cy = 0; // 鼠标视差目标/当前

    if (finePointer) {
      window.addEventListener("mousemove", function (e) {
        mx = (e.clientX / innerWidth - 0.5) * 22;
        my = (e.clientY / innerHeight - 0.5) * 14;
      }, { passive: true });
    }

    var clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };

    (function loop() {
      scrollY = window.scrollY;

      /* 滚动速度 → marquee 斜切 */
      velocity = velocity * 0.85 + (scrollY - lastY) * 0.15;
      lastY = scrollY;
      var targetSkew = clamp(velocity * 0.35, -9, 9);
      skew += (targetSkew - skew) * 0.1;
      if (marquee) {
        var inView = marquee.getBoundingClientRect().top < innerHeight && marquee.getBoundingClientRect().bottom > 0;
        marquee.style.transform = inView
          ? "skewX(" + skew.toFixed(2) + "deg) scale(1.04)"
          : "none";
      }

      /* Dock 下滑隐藏 / 上滑显示 */
      if (dock && scrollY > 140) {
        var goingDown = scrollY > (loop.prevY || 0) + 2;
        var goingUp = scrollY < (loop.prevY || 0) - 2;
        if (goingDown) dock.classList.add("dock-hidden");
        else if (goingUp) dock.classList.remove("dock-hidden");
      }
      loop.prevY = scrollY;

      /* 项目经历：照片框内滚动视差（img 高 118%，translateY 在 [-18%, -6%] 推进） */
      if (rsImg) {
        var rr = rsImg.parentNode.getBoundingClientRect();
        if (rr.top < innerHeight && rr.bottom > 0) {
          var pr = Math.max(0, Math.min(1, (innerHeight - rr.top) / (innerHeight + rr.height)));
          rsImg.style.transform = "translateY(" + (-18 + pr * 12).toFixed(2) + "%)";
        }
      }

      /* Hero 背景：滚动 + 鼠标双重视差 */
      if (heroBg) {
        cx += (mx - cx) * 0.05;
        cy += (my - cy) * 0.05;
        heroBg.style.transform = "translate3d(" + cx.toFixed(2) + "px," + (scrollY * 0.22 + cy).toFixed(2) + "px,0)";
      }

      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 作品卡 3D 倾斜 ---------- */
  /* 进入时缓存未变换矩形（避免矩形随变换漂移导致反馈循环失稳），
     内联 transition 覆盖 .reveal 的 0.9s 过渡（消除延迟） */
  if (finePointer && !reduced) {
    document.querySelectorAll(".work-card").forEach(function (card) {
      var rect = null;
      card.addEventListener("mouseenter", function () {
        card.style.transition = "transform .12s ease-out";
        card.style.transform = "";
        rect = card.getBoundingClientRect();
      });
      card.addEventListener("mousemove", function (e) {
        /* 矩形过期检测：滚动页面或初次进入时重新缓存，避免比例失真 */
        if (!rect || e.clientX < rect.left - 40 || e.clientX > rect.right + 40 ||
            e.clientY < rect.top - 40 || e.clientY > rect.bottom + 40) {
          rect = card.getBoundingClientRect();
        }
        var px = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
        var py = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));
        card.style.transform =
          "perspective(1100px) rotateY(" + (px * 14).toFixed(2) + "deg) rotateX(" + (-py * 14).toFixed(2) + "deg) translate3d(" + (px * 16).toFixed(1) + "px," + (py * 10).toFixed(1) + "px,0) scale(1.03)";
      });
      card.addEventListener("mouseleave", function () {
        rect = null;
        card.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        card.style.transform = "";
      });
    });
  }

  /* ---------- 服务行整行跳转 ---------- */
  document.querySelectorAll(".service-row[data-href]").forEach(function (row) {
    row.addEventListener("click", function () {
      location.href = row.dataset.href;
    });
  });

  /* ---------- KV 纵向轮播（平面设计页）：三张横版 KV 纵向循环滚动 ---------- */
  /* 交互模型（kv7：指针主导 + 几何精确命中 + 图框上滚轮驱动）：
     1. 指针不在图框列上：缓慢自动向上滚动；滚轮驱动页面（不接管）
     2. 指针"真实移入"图框（横向限制在中轴图框列内、纵向精确到边缘）：
        暂停 + 放大。合成 mousemove（指针没动、内容在动——页面滚动或
        轮播自身滚动引发，特征是坐标不变）不算移入，首个来历不明的事件也不算
     3. 指针移出图框（横向或纵向任一越界即释放）：立即缩回 + 恢复滚动；
        图框滚过静止指针绝不自己放大
     4. 指针压在图框列上时滚轮驱动轮播（仅此刻 preventDefault，两侧留白
        滚轮照常滚页面）；滚轮后 150ms 内焦点按纯几何命中跟随接力
     5. 焦点只放大不移动卡片 → 判定与运动解耦，无反馈回路 */
  var kvRing = document.getElementById("kvRing");
  if (kvRing && !reduced) {
    var kvCards = Array.prototype.slice.call(kvRing.querySelectorAll(".kv-card"));
    var kvN = kvCards.length;
    var kvStage = kvRing.parentNode;
    var kvGap = 28;                       /* 卡间距（与 CSS 静态兜底位置同步） */
    var kvBase = 0;                       /* 滚动基准位移 */
    var kvFocus = -1;
    var kvPx = 0, kvPy = 0, kvInside = false;  /* 指针相对舞台中心的 x/y / 是否在舞台内 */
    var kvSeek = false;                   /* 指针真实移动过（等待捕获判定） */
    var kvLX = null, kvLY = null;         /* 上一事件的指针坐标（识别合成事件） */
    var kvMomentum = 0;                   /* 滚轮动量（deltaY>0 = 内容上移） */
    var kvWheelT = -1e4;                  /* 最近一次滚轮输入时刻 */
    var kvHold = false;                   /* 触屏按住暂停（手机上保持轮播形态，手指按住即停） */
    var kvSq = 0, kvVel = 0;              /* 触屏果冻挤压：拖动速度→软弹簧形变（越靠边缘压越深） */
    var kvLast = performance.now();
    /* 周期化取模：把卡的位置折到 ±半周期内（折返点在视窗外，循环无缝） */
    function kvY(i, ringH, period) {
      var y = (i * (ringH + kvGap) + kvBase) % period;
      if (y < 0) y += period;
      if (y > period / 2) y -= period;
      return y;
    }
    /* ---------- 长图完整展示：悬停时图框按原生比例生长 ----------
       竖长图（比例<1.32）纵向生长；横长图（比例>1.36，全景 KV）横向生长，
       图框精确贴合图片比例，完整显示不裁切 */
    var kvRatio = kvCards.map(function () { return 0; });  /* 图片原生宽高比（加载后填入） */
    var kvKeepH = 0;             /* 焦点卡当前纵向判定高度（0 = 用 resting ringH） */
    var kvKeepW = 0;             /* 焦点卡当前横向判定宽度（0 = 用 resting ringW） */
    kvCards.forEach(function (card, i) {
      var img = card.querySelector("img");
      function markRatio() {
        if (img.naturalWidth && img.naturalHeight) kvRatio[i] = img.naturalWidth / img.naturalHeight;
      }
      if (img.complete) markRatio();
      else img.addEventListener("load", markRatio);
    });
    /* 焦点卡应用/清除完整展示尺寸：图框精确贴合图片原生比例完整显示。
       竖长图宽度不变纵向生长；横长图（全景 KV）横向生长、高度随之收敛；
       ≈4:3 的普通横图维持原 scale 放大 */
    function kvSetHot(i) {
      var w = kvRing.offsetWidth;
      var restingH = kvRing.offsetHeight;
      var maxH = Math.max(kvStage.clientHeight * 0.96, restingH);
      var maxW = Math.max(kvStage.clientWidth * 0.94, w);
      kvKeepH = 0;
      kvKeepW = 0;
      kvCards.forEach(function (card, k) {
        var inner = card.querySelector(".kv-inner");
        var img = inner.querySelector("img");
        var r = kvRatio[k];
        if (k === i && r > 0 && r < 1.32) {
          /* 竖长图：宽度不变，高度按比例生长并钳制在舞台内 */
          var h = Math.min(maxH, Math.max(restingH, w / r));
          inner.style.height = h.toFixed(0) + "px";
          img.style.objectFit = "contain";
          inner.style.transform = "translate(-50%, -50%)";   /* 保持居中展开，不叠加 scale */
          kvKeepH = h;
        } else if (k === i && r > 1.36) {
          /* 横长图：宽度长到完整显示（钳制在舞台宽 94% 内），高度按比例收敛 */
          var tw = Math.min(maxW, restingH * r);
          var th = tw / r;
          inner.style.width = tw.toFixed(0) + "px";
          inner.style.height = th.toFixed(0) + "px";
          img.style.objectFit = "contain";
          inner.style.transform = "translate(-50%, -50%)";
          kvKeepH = th;
          kvKeepW = tw;
        } else {
          inner.style.width = "";
          inner.style.height = "";
          img.style.objectFit = "";
          inner.style.transform = "";
        }
      });
    }
    if (finePointer) {
      /* —— 桌面交互：指针主导 + 几何命中 + 图框列上滚轮驱动 —— */
      kvStage.addEventListener("mousemove", function (e) {
        var r = kvStage.getBoundingClientRect();
        kvPx = e.clientX - r.left - r.width / 2;
        kvPy = e.clientY - r.top - r.height / 2;
        kvInside = true;
        /* 坐标没变 = 滚动/轮播运动引发的合成事件，不算"主动移入"；
           首个事件来历不明，同样不算 */
        kvSeek = kvLX !== null && (e.clientX !== kvLX || e.clientY !== kvLY);
        kvLX = e.clientX; kvLY = e.clientY;
      }, { passive: true });
      kvStage.addEventListener("mouseleave", function () { kvInside = false; });
      kvStage.addEventListener("wheel", function (e) {
        /* 仅当指针压在中轴图框列内时接管滚轮驱动轮播；
           列外（两侧留白）滚轮照常滚动页面 */
        if (Math.abs(kvPx) > (kvKeepW || kvRing.offsetWidth) / 2) return;
        e.preventDefault();
        kvMomentum += e.deltaY;
        if (kvMomentum > 420) kvMomentum = 420;
        if (kvMomentum < -420) kvMomentum = -420;
        kvWheelT = performance.now();
      }, { passive: false });
    } else {
      /* —— 触屏交互：无 hover/滚轮。手指压在中轴图框列内 → 滑动直接
         拖动轮播（跟手，方向与拖拽直觉一致），两侧留白 → 放行页面滚动；
         按住即暂停自动滚，松开约 0.9s 后恢复 —— */
      var kvTX = null, kvTY = null;
      kvStage.addEventListener("touchstart", function (e) {
        var t = e.touches[0];
        kvTX = t.clientX; kvTY = t.clientY;
        kvHold = true;
      }, { passive: true });
      kvStage.addEventListener("touchmove", function (e) {
        if (kvTX === null) return;
        var t = e.touches[0];
        var dy = t.clientY - kvTY;
        kvTX = t.clientX; kvTY = t.clientY;
        kvVel = kvVel * 0.65 + dy * 0.35;   /* 拖动速度（低通滤波，供果冻形变用） */
        /* touch-action:none 已禁止浏览器接管（820 断点），preventDefault 双保险；
           整个舞台的手指拖动都驱动轮播，页面滚动走舞台以外区域 */
        e.preventDefault();
        kvBase += dy;                 /* 手指下滑=内容下移（拖拽语义），跟手 */
      }, { passive: false });
      var kvRelease = function () { setTimeout(function () { kvHold = false; }, 900); };
      kvStage.addEventListener("touchend", kvRelease, { passive: true });
      kvStage.addEventListener("touchcancel", kvRelease, { passive: true });
    }
    (function kvLoop(now) {
      var dt = Math.min(now - kvLast, 50);   /* 钳制切后台回来的大步进 */
      kvLast = now;
      var ringW = kvRing.offsetWidth;
      var ringH = kvRing.offsetHeight;
      var period = kvN * (ringH + kvGap);
      /* 滚轮动量释放：每帧释放剩余 14%、衰减 0.86（总位移≈累积 deltaY） */
      if (kvMomentum > 0.5 || kvMomentum < -0.5) {
        kvBase -= kvMomentum * 0.14;
        kvMomentum *= 0.86;
      } else {
        kvMomentum = 0;
      }
      if (kvFocus < 0 && kvMomentum === 0 && !kvHold) {
        kvBase -= dt * 0.03;                 /* ≈30px/s 缓慢自动滚动（不在图框上/未按住就滚） */
      }
      /* 焦点判定：横向必须在中轴图框列内（否则横向移出无法释放），
         纵向精确到卡带边缘；捕获仅由真实移入或滚轮窗口触发，移出立即释放 */
      var hit = -1;
      var halfW = (kvKeepW || ringW) / 2;   /* 横长图焦点展开后，横向判定宽度同步变大 */
      if (kvInside && Math.abs(kvPx) <= halfW) {
        if (now - kvWheelT < 150) {
          /* 滚轮窗口内：焦点纯几何跟随（图框从指针下滑过时自动接力） */
          for (var j = 0; j < kvN; j++) {
            if (Math.abs(kvPy - kvY(j, ringH, period)) <= ringH / 2) { hit = j; break; }
          }
        } else if (kvFocus >= 0) {
          /* 焦点卡长图生长后按生长后的高度判定（hotH ≥ ringH） */
          var keepH = kvKeepH || ringH;
          if (Math.abs(kvPy - kvY(kvFocus, ringH, period)) <= keepH / 2) hit = kvFocus;
        } else if (kvSeek) {
          for (var k = 0; k < kvN; k++) {
            if (Math.abs(kvPy - kvY(k, ringH, period)) <= ringH / 2) { hit = k; break; }
          }
        }
      }
      kvSeek = false;
      if (hit !== kvFocus) {
        kvFocus = hit;
        kvSetHot(hit);
        kvCards.forEach(function (c, kk) { c.classList.toggle("on", kk === hit); });
      }
      /* 纯纵向循环滚动：无透视变形（用户要求去除滚筒透视）。
         触屏拖动时叠加果冻挤压（软弹簧，体积守恒）——越靠舞台边缘压得越深，
         像被边缘"吸进去"的绵软形变；松手后自然回弹归零 */
      var sqT = (!finePointer && kvHold) ? Math.min(0.3, Math.abs(kvVel) * 0.014) : 0;
      kvSq += (sqT - kvSq) * 0.085;
      kvVel *= 0.9;
      var edgeHalf = (ringH + kvGap) * 2;
      for (var i = 0; i < kvN; i++) {
        var y = kvY(i, ringH, period);
        if (kvSq > 0.004) {
          var edge = Math.min(1, Math.abs(y) / edgeHalf);
          var sq = kvSq * (0.5 + edge * 0.5);
          kvCards[i].style.transform =
            "translateY(" + y.toFixed(1) + "px) scale(" + (1 + sq * 0.4).toFixed(3) + "," + (1 - sq).toFixed(3) + ")";
        } else {
          kvCards[i].style.transform = "translateY(" + y.toFixed(1) + "px)";
        }
      }
      requestAnimationFrame(kvLoop);
    })(kvLast);
  }

  /* ---------- 品牌设计页：果冻式自由落体（首次滚入播一次）+ 缓慢漂浮 ----------
     落定排布为 3×4 错落网格（CSS grid，中间两列下沉）。
     物理：重力加速下落 → 落地冲击转果冻挤压（软弹簧低频回正，不弹跳）→
     落定后每卡独立正弦漂浮（±6px，相位错开）+ 悬停微升起。 */
  var fallRing = document.getElementById("fallRing");
  if (fallRing && !reduced) {
    var fCards = Array.prototype.slice.call(fallRing.querySelectorAll(".fall-card"));
    var fN = fCards.length;
    var fSimple = innerWidth <= 820;          /* 窄屏退化为 CSS 交错淡入 */
    var fState = [];
    var fStarted = false, fT0 = 0;

    for (var fi = 0; fi < fN; fi++) {
      var fSt = {
        y: fSimple ? 0 : -(680 + Math.random() * 180),   /* 出发点在舞台上方界外 */
        v: 0,
        sq: 0, sqV: 0,                        /* 果冻挤压量及其速度 */
        rot: (Math.random() - 0.5) * 6,       /* 落定保留 ±3° 微倾 */
        delay: fi * 70,                       /* 错峰：左上→右下波浪 */
        phase: Math.random() * Math.PI * 2,   /* 漂浮相位错开 */
        mode: fSimple ? 2 : 0,                /* 0 等待 1 下落 2 漂浮 */
        hov: 0, hovT: 0
      };
      fState.push(fSt);
      if (!fSimple) {
        /* 首帧前写入初始位（舞台上方界外），避免 DOM 就绪到首帧间闪现 */
        fCards[fi].style.transform =
          "translate3d(0," + fSt.y.toFixed(0) + "px,0) rotate(" + fSt.rot.toFixed(2) + "deg)";
      } else {
        fCards[fi].style.animationDelay = (fi * 60) + "ms";
      }
    }
    if (fSimple) fallRing.classList.add("fall-simple");

    if (!fSimple) {
      var fIO = null;
      if (hasIO) {
        fIO = new IntersectionObserver(function (entries) {
          if (fStarted || !entries[0].isIntersecting) return;
          fStarted = true;
          fT0 = performance.now();
          fIO.disconnect();
        }, { threshold: 0.22 });
        fIO.observe(fallRing);
      } else {
        /* 无 IO 兜底：直接启动落体（若立即启动，进场时大部分卡还在视口外——
           改用一次性定时器等半秒，近似"滚入视口才开始"的效果） */
        setTimeout(function () {
          if (!fStarted) { fStarted = true; fT0 = performance.now(); }
        }, 600);
      }

      if (finePointer) {
        fCards.forEach(function (c, i) {
          c.addEventListener("pointerenter", function () { fState[i].hovT = 1; });
          c.addEventListener("pointerleave", function () { fState[i].hovT = 0; });
        });
      }

      var fLast = performance.now();
      (function fLoop(now) {
        var dt = Math.min((now - fLast) / 1000, 0.05);   /* 钳制切后台大步进 */
        fLast = now;
        if (fStarted) {
          for (var i = 0; i < fN; i++) {
            var st = fState[i];
            if (st.mode === 0) {
              if (now - fT0 >= st.delay) st.mode = 1;    /* 该卡起落 */
            } else if (st.mode === 1) {
              st.v += 3600 * dt;                         /* 重力加速 */
              st.y += st.v * dt;
              fCards[i].style.transform =
                "translate3d(0," + st.y.toFixed(1) + "px,0) rotate(" + st.rot.toFixed(2) + "deg)";
              if (st.y >= 0) {                           /* 落地：冲击转果冻挤压 */
                st.y = 0;
                st.sq = Math.min(0.45, st.v / 2600);
                st.sqV = 0;
                st.mode = 2;
              }
            } else {
              st.sqV += (0 - st.sq) * 0.10;              /* 软弹簧回正：绵软不弹跳 */
              st.sqV *= 0.55;
              st.sq += st.sqV;
              st.hov += (st.hovT - st.hov) * 0.12;
              var fy = Math.sin(now * 0.00126 + st.phase) * 6;   /* ±6px，周期约 5s */
              var lift = st.hov * -9;                    /* 悬停微升起 */
              fCards[i].style.transform =
                "translate3d(0," + (st.y + fy + lift).toFixed(2) + "px,0) rotate(" + st.rot.toFixed(2) + "deg) scale(" + (1 + st.sq * 0.5).toFixed(3) + "," + (1 - st.sq).toFixed(3) + ")";
            }
          }
        }
        requestAnimationFrame(fLoop);
      })(fLast);
    }
  }

  /* ---------- 平面设计页：作品长条（3D 扇形 + 滑出放大） ---------- */
  var strip = document.getElementById("strip");
  if (strip && finePointer && !reduced && innerWidth > 820) {
    var stripItems = Array.prototype.slice.call(strip.querySelectorAll(".strip-item"));
    var n = stripItems.length;
    var c = n / 2;                    /* 中心对：c-1 与 c（n 为偶数） */
    var S_GAP = 6;                    /* 相邻投影边缘间距（px，2x 布局） */
    var layoutX = [], tilts = [];
    var stage = strip.parentNode;

    function tiltAt(pos) {
      /* 中心转角最大（投影收窄成领结结），两侧渐平；正角=左缘朝前。
         无深度位移：透视梯形纯由 rotateY 产生（tz 放大只会显得"被拉长"） */
      var a = 48 + (1 - Math.abs(pos)) * 28;   /* 两侧 48°，中心 76° */
      return pos < 0 ? a : -a;
    }

    /* 测量法布局：先按静态姿态投影测宽，再按投影宽度递推 x，使相邻边缘等距相触 */
    function layoutStrip() {
      var half = (n - 1) / 2;
      for (var i = 0; i < n; i++) {
        var pos = (i - half) / half;
        tilts[i] = tiltAt(pos);
        stripItems[i].style.transition = "none";   /* 冻结过渡：过渡中的旧姿态会污染投影测量 */
        stripItems[i].style.transform =
          "translate3d(0,0,0) rotateY(" + tilts[i] + "deg)";
      }
      var ws = stripItems.map(function (it) { return it.getBoundingClientRect().width; });
      /* 对称化：镜像两卡姿态角度相同，投影理应等宽；实测出现的任何不对称
         （过渡残留/时序/渲染抖动）会在递推中单向累积成整条扇形右偏，取均值根治 */
      for (var m = 0; m < n / 2; m++) {
        var avg = (ws[m] + ws[n - 1 - m]) / 2;
        ws[m] = avg;
        ws[n - 1 - m] = avg;
      }
      layoutX[c] = ws[c] / 2 + S_GAP / 2;
      for (var r = c + 1; r < n; r++) layoutX[r] = layoutX[r - 1] + ws[r - 1] / 2 + S_GAP + ws[r] / 2;
      for (var l = c - 1; l >= 0; l--) layoutX[l] = layoutX[l + 1] - ws[l + 1] / 2 - S_GAP - ws[l] / 2;
      for (var k = 0; k < n; k++) {
        stripItems[k].style.transform =
          "translate3d(" + layoutX[k].toFixed(1) + "px,0,0) rotateY(" + tilts[k] + "deg)";
      }
      for (var t = 0; t < n; t++) stripItems[t].style.transition = "";
    }

    strip.classList.add("strip-3d");
    layoutStrip();

    /* 弹簧状态：初始为"合拢书页"收拢态（侧立在中缝、缩小），sq 为形变通道（独立欠阻尼弹簧 → 果冻震颤） */
    function paintItem(it, st) {
      it.style.transform =
        "translate3d(" + st.x.toFixed(1) + "px," + st.y.toFixed(1) + "px," + st.z.toFixed(1) + "px) rotateY(" + st.r.toFixed(2) + "deg) scale(" + (st.s * (1 + st.sq * 0.6)).toFixed(3) + "," + (st.s * (1 - st.sq)).toFixed(3) + ")";
    }
    var stripState = stripItems.map(function (_, i) {
      /* 收拢态 = 原位侧立的书页：x 固定在落位坐标，角度与落位同侧且更立。
         原地翻倒展开，卡面永不穿过邻卡空间——
         之前的"从中缝飞出+跨正面翻转"会让外侧卡平面穿过已落位卡平面，
         两平面相交导致渲染顺序每帧抖动 = 重叠闪烁的真正根源 */
      var cr = (tilts[i] < 0 ? -1 : 1) * Math.min(Math.abs(tilts[i]) + 20, 82);
      var st = { x: layoutX[i], y: 0, z: 0, s: 0.7, r: cr, vx: 0, vy: 0, vz: 0, vs: 0, vr: 0, sq: 0, sqv: 0 };
      paintItem(stripItems[i], st);
      return st;
    });

    /* 书页展开入场（CSS 过渡版）：首次进入视口时从中缝向两侧逐张释放。
       整个展开由合成器 transition 一次性插值完成，rAF 不写任何样式——
       根治每帧改写 transform 与透明度过渡争用合成层导致的延迟性闪烁残影。
       仅播一次，之后滚动往返不再重播；展开期间悬停交互不可用 */
    var entryDone = stripItems.map(function () { return false; });
    var entryCSS = stripItems.map(function () { return false; });
    var entryBusy = true;
    /* 释放序列提取为独立函数：IO 回调与无 IO 兜底共用 */
    var entryRelease = function () {
      entryBusy = true;
      stripItems.forEach(function (_, i) {
        var dist = Math.abs(i + 0.5 - c);
        setTimeout(function () {
          entryCSS[i] = true;
          var it = stripItems[i];
          it.style.transition = "transform 0.95s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease-out";
          it.classList.add("is-in");
          it.style.transform =
            "translate3d(" + layoutX[i].toFixed(1) + "px,0px,0px) rotateY(" + tilts[i].toFixed(2) + "deg)";
          setTimeout(function () {
            /* 过渡完成后把弹簧状态同步到落位值，交还 rAF 接管悬停交互 */
            var st = stripState[i];
            st.x = layoutX[i]; st.y = 0; st.z = 0; st.s = 1; st.r = tilts[i];
            st.vx = 0; st.vy = 0; st.vz = 0; st.vs = 0; st.vr = 0; st.sq = 0; st.sqv = 0;
            it.style.transition = "";
            entryCSS[i] = false;
            entryDone[i] = true;
          }, 1000);
        }, 150 + dist * 115);
      });
      setTimeout(function () { entryBusy = false; }, 150 + c * 115 + 1100);
    };
    if (hasIO) {
      var entryIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          entryIO.unobserve(strip);
          entryRelease();
        });
      }, { threshold: 0.4 });
      entryIO.observe(strip);
    } else {
      /* 无 IO 兜底：页面打开 0.8 秒后直接播放书页展开 */
      setTimeout(entryRelease, 800);
    }

    /* —— 槽位判定（根治频闪）：激活卡是指针坐标的纯函数，与卡片变换/展开态完全解耦 ——
       旧方案 mouseenter + elementFromPoint 的死穴：4:3 卡激活时 width 168→299px 有
       0.45s CSS 过渡，过渡期间逐帧重排，Chrome 每次重排后都会重派发 hover 边界事件
       （幽灵事件风暴），elementFromPoint 在两张交叠展开卡之间反复翻转 → activeIdx
       乒乓振荡 = 频闪。3:4 卡宽度不变（168→168）无过渡，故此前只有 4:3 出问题。
       槽位判定只读指针坐标与静态槽位区间，乒乓在数学上不可能发生 */
    var activeIdx = -1;
    var pX = -1e4, pY = -1e4;         /* 指针最新坐标 */
    var relL = [], relR = [];         /* 各卡静止态投影区间，相对 .strip 左缘（含舞台缩放，同系测量） */
    var slotsReady = false;
    window.addEventListener("mousemove", function (e) {
      pX = e.clientX; pY = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { activeIdx = -1; });

    /* 弹出框比例自适应（供 stripLoop 与槽位测量共用）：激活时容器宽度匹配图片原生比例 */
    function applyHotSize(it, st, hot) {
      if (hot) {
        var im = it.querySelector("img");
        var ar = im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0.75;
        ar = Math.max(0.5, ar);   /* 下限 0.5：极竖图弹出完整展示；上限不设 1.5——16:9/全景图曾被钳制导致 cover 裁切不完整 */
        var w = Math.round(224 * ar);
        var maxW = stage.clientWidth * 0.92;   /* 保险：超宽全景钳制在舞台内（正常图远触不到） */
        if (w > maxW) w = Math.round(maxW);
        it.style.width = w + "px";
        it.style.marginLeft = -(w / 2) + "px";
      } else {
        it.style.width = "";
        it.style.marginLeft = "";
      }
    }

    /* 测量槽位：临时还原静止姿态（并冻结过渡，排除热卡展开宽度的干扰）测投影区间，
       测完恢复当前状态。需在入场展开完成后调用（收拢态投影无意义） */
    function measureSlots() {
      for (var i = 0; i < n; i++) {
        var it = stripItems[i];
        it.style.transition = "none";
        it.style.width = "";
        it.style.marginLeft = "";
        it.style.transform =
          "translate3d(" + layoutX[i].toFixed(1) + "px,0px,0px) rotateY(" + tilts[i].toFixed(2) + "deg)";
      }
      var sr = strip.getBoundingClientRect();
      for (var j = 0; j < n; j++) {
        var r = stripItems[j].getBoundingClientRect();
        relL[j] = r.left - sr.left;
        relR[j] = r.right - sr.left;
      }
      for (var k = 0; k < n; k++) {
        var it2 = stripItems[k], st2 = stripState[k];
        if (st2.hot) applyHotSize(it2, st2, true);   /* 过渡冻结时瞬时恢复展开宽度 */
        it2.style.transition = "";
        paintItem(it2, st2);
      }
      slotsReady = true;
    }

    /* 每帧一次：指针坐标 → 应激活槽位。带内按 x 定槽；带上方（展示区）保持；
       带下方/水平出界清空；槽间缝隙保持 —— 无事件监听参与判定，无乒乓 */
    function resolveSlot() {
      if (!slotsReady || entryBusy || !strip.classList.contains("strip-3d")) return;
      var sr = strip.getBoundingClientRect();
      var spanL = sr.left + relL[0], spanR = sr.left + relR[n - 1];
      var want;
      if (pX < spanL - 24 || pX > spanR + 24 || pY > sr.bottom + 8) {
        want = -1;                                   /* 水平出界 / 长条下方 */
      } else if (pY < sr.top - 4) {
        want = activeIdx;                            /* 长条上方展示区：保持当前 */
      } else {
        want = -1;
        for (var i = 0; i < n; i++) {
          if (pX >= sr.left + relL[i] && pX <= sr.left + relR[i]) { want = i; break; }
        }
        if (want === -1) want = activeIdx;           /* 槽间缝隙：保持当前，杜绝边界抖动 */
      }
      if (want !== activeIdx) activeIdx = want;
    }

    /* 舞台自适应：按投影总宽缩放，保证扇形完整显示在视口内。
       入场前卡片处于收拢态（投影无意义），测量时临时写入落位姿态、测完恢复 */
    function fitStrip() {
      var f = parseFloat(stage.dataset.fit || "1");
      var target = Math.min(innerWidth * 0.96, 1370);   /* 2x 布局校准：视觉观感与旧版一致 */
      stripItems.forEach(function (it, j) {
        it.style.transform = "translate3d(" + layoutX[j].toFixed(1) + "px,0px,0px) rotateY(" + tilts[j].toFixed(2) + "deg)";
      });
      for (var k = 0; k < 3; k++) {
        var minL = 1e9, maxR = -1e9;
        for (var j = 0; j < stripItems.length; j++) {
          var rr = stripItems[j].getBoundingClientRect();
          if (rr.left < minL) minL = rr.left;
          if (rr.right > maxR) maxR = rr.right;
        }
        var span = maxR - minL;
        if (span < 10) break;
        f = Math.min(f * (target / span), 0.73);   /* 上限 0.73：卡显示 = 168×0.73 ≈ 旧版观感（84×1.45） */
        stage.style.transform = "scale(" + f.toFixed(4) + ")";
      }
      stage.dataset.fit = f;
      stripItems.forEach(function (it, j) { paintItem(it, stripState[j]); });
    }
    fitStrip();

    window.addEventListener("resize", function () {
      if (innerWidth <= 820) {
        strip.classList.remove("strip-3d");
        stripItems.forEach(function (it) { it.style.transform = ""; });
        stage.style.transform = "";
        stage.dataset.fit = "1";
      } else {
        strip.classList.add("strip-3d");
        layoutStrip();
        for (var i = 0; i < n; i++) stripState[i].r = tilts[i];
        fitStrip();
        if (slotsReady) measureSlots();   /* 缩放变化后槽位区间随动重测 */
      }
    });

    (function stripLoop() {
      if (!entryBusy && !slotsReady) measureSlots();   /* 入场刚结束：补测静止槽位区间 */
      resolveSlot();
      for (var i = 0; i < n; i++) {
        var it = stripItems[i];
        var st = stripState[i];
        if (!entryDone[i]) continue;       /* 收拢态与 CSS 展开期间 rAF 不写样式，杜绝合成层争用 */
        var f = (i === activeIdx) ? 1 : 0;
        /* 激活项：滑向舞台中轴并向上挤出展示 */
        var tx = layoutX[i] * (1 - f);
        var ty = -(f * 370);               /* 2x 布局：视觉上浮高度不变 */
        var ttz = f * 220;                 /* 抬到全场最前（2x 布局），杜绝 3D 遮挡冲突 */
        var ts = 1 + f * 0.45;
        var tr = tilts[i] * (1 - f);
        /* 位置通道：升快降慢的非对称弹簧 —— 激活卡迅速浮起接管（k=.2），
           失活卡缓缓沉回（k=.08）。若两侧对称，A 下落与 B 上升的 z 值必然
           逐帧相等（共面 z-fighting）→ 两图叠加频闪；非对称化后深度仅单次穿越 */
        var k = (f === 1) ? 0.2 : 0.08;
        var dmp = (f === 1) ? 0.7 : 0.76;
        st.vx = (st.vx + (tx - st.x) * k) * dmp;
        st.vy = (st.vy + (ty - st.y) * k) * dmp;
        st.vz = (st.vz + (ttz - st.z) * k) * dmp;
        st.vs = (st.vs + (ts - st.s) * k) * dmp;
        st.vr = (st.vr + (tr - st.r) * k) * dmp;
        st.x += st.vx;
        st.y += st.vy;
        st.z += st.vz;
        st.s += st.vs;
        st.r += st.vr;
        /* 果冻形变通道：目标由垂直速度驱动，独立软弹簧（k=.10, damp=.55）
           → 低频绵软的大幅拉伸与悠长震颤回弹 */
        var sqT = Math.max(-0.45, Math.min(0.45, st.vy * 0.01));
        st.sqv = (st.sqv + (sqT - st.sq) * 0.1) * 0.55;
        st.sq += st.sqv;
        /* 弹出框比例自适应：宽度切换共用 applyHotSize（4:3 横图弹出为横向比例） */
        var hot = f > 0.5;
        if (hot !== st.hot) {
          st.hot = hot;
          applyHotSize(it, st, hot);
        }
        paintItem(it, st);
        it.classList.toggle("is-hot", hot);
      }
      requestAnimationFrame(stripLoop);
    })();
  }

  /* ---------- 手机端：海报横滑列表的果冻挤压（触屏专属） ----------
     左右滑动横滑列表时，滑动速度经低通滤波驱动软弹簧形变：
     拖动方向压缩（横向压扁、纵向微胀，体积守恒），松手后缓慢回弹归零。
     桌面不受影响（finePointer 才有 3D 扇形）。 */
  if (!finePointer && !reduced) {
    document.querySelectorAll(".strip-scroll").forEach(function (sc) {
      var inner = sc.querySelector(".strip");
      if (!inner) return;
      var lastX = sc.scrollLeft, vel = 0, sq = 0, rafOn = false;
      sc.addEventListener("scroll", function () {
        var dx = sc.scrollLeft - lastX;
        lastX = sc.scrollLeft;
        vel = vel * 0.65 + dx * 0.35;
        if (!rafOn) { rafOn = true; requestAnimationFrame(jLoop); }
      }, { passive: true });
      function jLoop() {
        var sqT = Math.min(0.16, Math.abs(vel) * 0.0035);
        sq += (sqT - sq) * 0.11;
        vel *= 0.86;
        if (sq > 0.004) {
          inner.style.transform =
            "scale(" + (1 - sq).toFixed(3) + "," + (1 + sq * 0.7).toFixed(3) + ")";
          requestAnimationFrame(jLoop);
        } else {
          inner.style.transform = "";
          rafOn = false;
        }
      }
    });
  }

  /* ---------- 磁性按钮 ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.28;
        var dy = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transition = "transform .1s linear";
        el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .45s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------- 自定义光标 ---------- */
  var dot = document.querySelector(".cursor-dot");
  var ring = document.querySelector(".cursor-ring");
  if (finePointer && dot && ring && !reduced) {
    var rafMx = innerWidth / 2, rafMy = innerHeight / 2, rx = rafMx, ry = rafMy;
    document.addEventListener("mousemove", function (e) {
      rafMx = e.clientX; rafMy = e.clientY;
      dot.style.transform = "translate(" + (rafMx - 4) + "px," + (rafMy - 4) + "px)";
    });
    (function loop() {
      rx += (rafMx - rx) * 0.16;
      ry += (rafMy - ry) * 0.16;
      ring.style.transform =
        "translate(" + (rx - ring.offsetWidth / 2) + "px," + (ry - ring.offsetHeight / 2) + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      ring.classList.toggle("on", !!e.target.closest("a, button, .work-card, .service-row"));
    });
  }
})();

/* ---------- 作品灯箱：点击任意作品图全屏查看 ---------- */
/* 覆盖范围：首页/物料页作品卡、扇形 strip、品牌落体卡、KV 轮播卡。
   ←/→ 或方向键切换，ESC 或点击空白关闭，底部显示序号 */
(function () {
  var imgs = Array.prototype.slice.call(
    document.querySelectorAll(".work-card img, .strip-item img, .fall-card img, .kv-card img")
  );
  if (!imgs.length) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML =
    '<button class="lb-btn lb-close" aria-label="关闭">✕</button>' +
    '<button class="lb-btn lb-prev" aria-label="上一张">←</button>' +
    '<figure class="lb-stage"><img alt="" /></figure>' +
    '<button class="lb-btn lb-next" aria-label="下一张">→</button>' +
    '<div class="lb-count"></div>';
  document.body.appendChild(box);

  var big = box.querySelector(".lb-stage img");
  var count = box.querySelector(".lb-count");
  var idx = 0;
  var isOpen = false;

  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    var src = imgs[idx].currentSrc || imgs[idx].src;
    big.classList.remove("lb-in");
    big.src = src;
    big.alt = imgs[idx].alt || "";
    var done = function () { big.classList.add("lb-in"); };
    if (big.complete) requestAnimationFrame(done);
    else big.onload = done;
    count.textContent = (idx + 1) + " / " + imgs.length;
  }
  function openBox(i) {
    isOpen = true;
    box.classList.add("on");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    show(i);
  }
  function closeBox() {
    isOpen = false;
    box.classList.remove("on");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  imgs.forEach(function (img, i) {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openBox(i);
    });
  });
  box.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
  box.querySelector(".lb-close").addEventListener("click", closeBox);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.classList.contains("lb-stage")) closeBox();
  });
  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") closeBox();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();

/* ---------- 复制邮箱：点击联系按钮复制到剪贴板 ---------- */
/* 覆盖：首页 .talk-btn、全站 dock .dock-cta、子页底部 .sub-cta。
   talk-btn/dock-cta 文字置换为双行滚动（原文上滚出 / "已复制 ✓" 下滚入，
   0.5s 缓出曲线，还原同速）——不用弹窗；sub-cta 内部是既有滚动置换结构，
   只复制不置换。复制失败降级打开 mailto */
(function () {
  var EMAIL = "617111647@qq.com";

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    /* 旧浏览器降级：隐藏 textarea + execCommand */
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(new Error("copy failed")); }
      catch (err) { reject(err); }
      finally { document.body.removeChild(ta); }
    });
  }

  document.querySelectorAll(".talk-btn, .dock-cta").forEach(function (btn) {
    var original = btn.textContent;
    /* 构建双行文字置换结构：上行原文 / 下行"已复制 ✓" */
    btn.innerHTML =
      '<span class="copy-swap">' +
      '<span class="cs-line cs-a">' + original + '</span>' +
      '<span class="cs-line cs-b">已复制 ✓</span>' +
      '</span>';
    var swap = btn.querySelector(".copy-swap");
    btn.addEventListener("click", function (e) {
      e.preventDefault();   /* 拦截默认 mailto，改为复制 */
      copyText(EMAIL).then(function () {
        btn.classList.add("copied");
        swap.classList.add("swap");
        clearTimeout(btn.__copyT);
        btn.__copyT = setTimeout(function () {
          btn.classList.remove("copied");
          swap.classList.remove("swap");
        }, 1600);
      }).catch(function () {
        location.href = "mailto:" + EMAIL;   /* 剪贴板不可用时回退发邮件 */
      });
    });
  });

  /* 子页底部"开始项目"：只复制 + 变色，不动其内部滚动置换结构 */
  document.querySelectorAll(".sub-cta").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      copyText(EMAIL).then(function () {
        btn.classList.add("copied");
        clearTimeout(btn.__copyT);
        btn.__copyT = setTimeout(function () {
          btn.classList.remove("copied");
        }, 1600);
      }).catch(function () {
        location.href = "mailto:" + EMAIL;
      });
    });
  });
})();
