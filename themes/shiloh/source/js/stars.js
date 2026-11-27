/* ============================================================
   stars.js — 首页首屏的星图
   每个分类 / 标签是一颗星球，卫星点绕着它们散开，三条倾斜的椭圆轨道缓慢自转。
   节点数据来自 <canvas data-stars="[...]">，由模板按站点内容生成。
   纯原生 canvas，无依赖；系统要求减少动效时只画一帧。
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.querySelector('.hero__canvas[data-stars]');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var seeds;
  try {
    seeds = JSON.parse(canvas.getAttribute('data-stars') || '[]');
  } catch (e) {
    return;
  }
  if (!seeds.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FONT = '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  var PALETTE = ['#7cc4ff', '#ff8fab', '#b39dff', '#ffb86b', '#6ee7b7', '#f3a2ff', '#ffd166', '#7ee0e0'];
  var RING_TIERS = [
    { rx: 0.2, ry: 0.3, speed: 0.018 },
    { rx: 0.29, ry: 0.42, speed: 0.012 },
    { rx: 0.38, ry: 0.55, speed: 0.008 }
  ];
  var RING_SHARE = [0.2, 0.33, 0.47];
  var RING_TILT = -0.08;

  var scene = null;
  var palette = null;
  var pointer = { x: 0, y: 0 };
  var hovered = -1;
  var frame = 0;
  var startedAt = 0;
  var visible = true;

  /* ---------- 纯函数 ---------- */

  // 确定性伪随机：同一个种子永远得到同一个数，刷新页面布局不跳位
  function hash(seed) {
    var value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  // 名字 → 稳定的颜色
  function colorFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973;
    return PALETTE[h % PALETTE.length];
  }

  // 名字 → 字标：中文取第一个字，西文取两个单词的首字母，否则取前两个字符
  function initialsFor(name) {
    var cleaned = String(name).replace(/[-_.]/g, ' ').trim();
    if (/[\u4e00-\u9fff]/.test(cleaned)) return cleaned.charAt(0);
    var parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return cleaned.slice(0, 2).toUpperCase();
  }

  // 把 #rrggbb 转成带透明度的 rgba()
  function withAlpha(color, alpha) {
    var raw = color.replace('#', '');
    var value = parseInt(raw.length === 3 ? raw.replace(/./g, '$&$&') : raw.slice(0, 6), 16);
    if (isNaN(value)) return color;
    return 'rgba(' + ((value >> 16) & 255) + ',' + ((value >> 8) & 255) + ',' + (value & 255) + ',' + alpha.toFixed(3) + ')';
  }

  function orbitRings(width, height) {
    return RING_TIERS.map(function (tier) {
      return { rx: width * tier.rx, ry: height * tier.ry, tilt: RING_TILT, speed: tier.speed };
    });
  }

  // 把星球沿轨道铺开：每圈的相位错开，避免径向对齐
  function placeStars(ringCount) {
    var perRing = RING_SHARE.map(function (share) { return Math.round(seeds.length * share); });
    var placed = [];
    var cursor = 0;
    for (var ring = 0; ring < ringCount; ring++) {
      var take = ring === ringCount - 1 ? seeds.length - cursor : perRing[ring];
      var offset = ring * 1.1 + 0.4;
      for (var index = 0; index < take; index++) {
        var seed = seeds[cursor + index];
        if (!seed) break;
        var phase = (index / Math.max(1, take)) * Math.PI * 2 + offset;
        var jitter = (hash(cursor + index * 3.7) - 0.5) * 0.22;
        placed.push({
          name: seed.name,
          hint: seed.count ? seed.count + ' 篇文章' : '',
          initials: initialsFor(seed.name),
          color: colorFor(seed.name),
          ring: ring,
          angle: phase + jitter,
          radius: 7.5 + hash(cursor * 5.1 + index) * 3
        });
      }
      cursor += take;
    }
    return placed;
  }

  // 给一颗星球铺开卫星点：若干束「触须」，每束由近到远串几颗
  function sprayDots(starIndex, seed) {
    var strands = 4 + Math.floor(hash(seed) * 3);
    var shown = 12 + Math.floor(hash(seed + 0.5) * 9);
    var dots = [];
    for (var index = 0; index < shown; index++) {
      var strand = index % strands;
      var tier = Math.floor(index / strands);
      var jitter = hash(seed + index * 17);
      var spread = hash(seed + strand * 31);
      dots.push({
        star: starIndex,
        angle: (strand / strands) * Math.PI * 2 + spread * 0.7 + (jitter - 0.5) * 0.35,
        radius: 15 + tier * 13 + jitter * 8,
        speed: 0.02 + hash(seed + index * 5) * 0.045,
        size: 0.8 + hash(seed + index * 11) * 0.9,
        alpha: 0.3 + hash(seed + index * 23) * 0.5,
        accent: hash(seed + index * 41) > 0.9,
        phase: hash(seed + index * 59) * Math.PI * 2
      });
    }
    return dots;
  }

  // 轨道上某颗星球在某一刻的坐标
  function starPoint(star, time) {
    var ring = scene.rings[star.ring];
    var angle = star.angle + time * ring.speed;
    var along = Math.cos(angle) * ring.rx;
    var across = Math.sin(angle) * ring.ry;
    var cos = Math.cos(ring.tilt);
    var sin = Math.sin(ring.tilt);
    return { x: scene.centerX + along * cos - across * sin, y: scene.centerY + along * sin + across * cos };
  }

  function dotPoint(dot, time) {
    var star = scene.stars[dot.star];
    if (!star) return { x: scene.centerX, y: scene.centerY };
    var origin = starPoint(star, time);
    var angle = dot.angle + time * dot.speed;
    return { x: origin.x + Math.cos(angle) * dot.radius, y: origin.y + Math.sin(angle) * dot.radius };
  }

  // 命中测试：鼠标附近最近的那颗星球，没有则 -1
  function pickStar(point, time) {
    var best = -1;
    var bestDistance = 26 * 26;
    scene.stars.forEach(function (star, index) {
      var origin = starPoint(star, time);
      var dx = origin.x - point.x;
      var dy = origin.y - point.y;
      var distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }

  /* ---------- 读主题配色 ---------- */

  function readPalette() {
    var style = getComputedStyle(document.documentElement);
    var pick = function (name, fallback) {
      var value = style.getPropertyValue(name).trim();
      return value || fallback;
    };
    return {
      dot: pick('--star-dot', '#fafafa'),
      ring: pick('--star-ring', 'rgba(255,255,255,0.11)'),
      link: pick('--star-link', 'rgba(255,255,255,0.07)'),
      labelBg: pick('--star-label-bg', 'rgba(10,10,10,0.94)'),
      labelBorder: pick('--star-label-border', 'rgba(255,255,255,0.12)'),
      labelFg: pick('--star-label-fg', '#fafafa'),
      accent: pick('--lime', '#c9f75b')
    };
  }

  /* ---------- 场景与尺寸 ---------- */

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(1, rect.width);
    var height = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rings = orbitRings(width, height);
    var stars = placeStars(rings.length);
    scene = {
      width: width,
      height: height,
      centerX: width * 0.66,
      centerY: height * 0.47,
      rings: rings,
      stars: stars,
      dots: []
    };
    stars.forEach(function (star, index) {
      scene.dots = scene.dots.concat(sprayDots(index, index * 37 + 11));
    });
  }

  /* ---------- 绘制 ---------- */

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function paint(time) {
    ctx.clearRect(0, 0, scene.width, scene.height);
    ctx.save();
    ctx.translate(pointer.x, pointer.y);

    // 轨道
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 1;
    scene.rings.forEach(function (ring) {
      ctx.beginPath();
      ctx.ellipse(scene.centerX, scene.centerY, ring.rx, ring.ry, ring.tilt + time * ring.speed, 0, Math.PI * 2);
      ctx.stroke();
    });

    var origins = scene.stars.map(function (star) { return starPoint(star, time); });

    // 辐射线
    ctx.strokeStyle = palette.link;
    ctx.beginPath();
    scene.dots.forEach(function (dot, index) {
      var origin = origins[dot.star];
      var point = dotPoint(dot, time);
      if (!origin) return;
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // 卫星点：小点带呼吸，少数套一圈青柠标记
    scene.dots.forEach(function (dot) {
      var point = dotPoint(dot, time);
      var breathe = 0.62 + 0.38 * Math.sin(time * 0.9 + dot.phase);
      var alpha = dot.alpha * breathe;
      ctx.beginPath();
      ctx.arc(point.x, point.y, dot.size, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(palette.dot, alpha);
      ctx.fill();
      if (!dot.accent) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, dot.size + 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(palette.accent, alpha * 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 星球：品牌色光晕 + 底色圆盘 + 描边 + 字标
    scene.stars.forEach(function (star, index) {
      var point = origins[index];
      var isHover = hovered === index;
      var radius = isHover ? star.radius + 2.5 : star.radius;

      var glow = ctx.createRadialGradient(point.x, point.y, 2, point.x, point.y, radius * 3);
      glow.addColorStop(0, withAlpha(star.color, isHover ? 0.3 : 0.17));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette.labelBg;
      ctx.fill();
      ctx.strokeStyle = isHover ? star.color : withAlpha(star.color, 0.6);
      ctx.lineWidth = isHover ? 1.6 : 1.1;
      ctx.stroke();

      ctx.fillStyle = palette.labelFg;
      ctx.font = '700 ' + Math.max(7, Math.round(radius * 0.92)) + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(star.initials, point.x, point.y + 0.5);
    });

    // 悬停标签：「名字 · 说明」
    if (hovered >= 0 && origins[hovered]) {
      var star = scene.stars[hovered];
      var point = origins[hovered];
      var text = star.hint ? star.name + ' · ' + star.hint : star.name;
      ctx.font = '500 11.5px ' + FONT;
      var w = ctx.measureText(text).width + 20;
      var left = point.x - w / 2;
      var top = point.y - star.radius - 30;
      roundedRect(left, top, w, 24, 12);
      ctx.fillStyle = palette.labelBg;
      ctx.fill();
      ctx.strokeStyle = palette.labelBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = palette.labelFg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, point.x, top + 12.5);
    }

    ctx.restore();
  }

  /* ---------- 循环 ---------- */

  function tick(now) {
    if (!startedAt) startedAt = now;
    // 滚出视口后停止绘制，别让 canvas 空转吃 CPU
    if (visible) paint(reduceMotion ? 0 : (now - startedAt) / 1000);
    if (reduceMotion) return;
    frame = requestAnimationFrame(tick);
  }

  function replay() {
    cancelAnimationFrame(frame);
    startedAt = 0;
    frame = requestAnimationFrame(tick);
  }

  function onPointerMove(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    // 左侧的星球被遮罩淡到几乎看不见（那里让位给标题），所以只在右侧 60% 的区域里响应悬停，
    // 否则鼠标经过标题附近会莫名弹出标签
    var inside = x >= rect.width * 0.4 && x <= rect.width && y >= 0 && y <= rect.height;
    if (!inside) {
      hovered = -1;
      pointer.x = 0;
      pointer.y = 0;
      return;
    }
    // 视差：鼠标在画布内移动，整体反向偏移约 ±6px
    pointer.x = (x / rect.width - 0.5) * -12;
    pointer.y = (y / rect.height - 0.5) * -8;
    hovered = pickStar({ x: x, y: y }, reduceMotion ? 0 : (performance.now() - startedAt) / 1000);
  }

  function onThemeChange() {
    palette = readPalette();
  }

  /* ---------- 启动 ---------- */

  resize();
  palette = readPalette();
  frame = requestAnimationFrame(tick);

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      resize();
    }).observe(canvas);
  } else {
    window.addEventListener('resize', function () {
      resize();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) { return entry.isIntersecting; });
    }).observe(canvas);
  }

  // 主题切换会改掉 CSS 变量里的配色，这里跟着刷新
  if ('MutationObserver' in window) {
    new MutationObserver(onThemeChange).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
})();
