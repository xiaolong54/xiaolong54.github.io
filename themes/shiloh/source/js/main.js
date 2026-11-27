/* ============================================================
   main.js — 主题切换、移动端菜单、滚动揭示、目录高亮、代码复制、本地搜索
   纯原生脚本，无依赖。每个功能独立成一段，任何一段出错都不影响其它。
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 主题切换 ---------- */
  (function themeToggle() {
    var button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('shiloh-theme', next);
      } catch (e) {
        /* 隐私模式下写不进去，不影响本次切换 */
      }
    });
  })();

  /* ---------- 移动端菜单 ---------- */
  (function mobileMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    var setOpen = function (open) {
      menu.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    };

    button.addEventListener('click', function () {
      setOpen(!menu.classList.contains('is-open'));
    });

    // 点了任意链接就收起，避免跳转后面板还盖在内容上
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    // 拉宽到桌面尺寸时收起
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  })();

  /* ---------- 滚动揭示 ---------- */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-in');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      // 只缩下沿 80px，元素真正进入视口一段距离后再出现
      { rootMargin: '0px 0px -80px 0px' }
    );

    Array.prototype.forEach.call(items, function (item) {
      observer.observe(item);
    });
  })();

  /* ---------- 目录：跟随滚动高亮 ---------- */
  (function tableOfContents() {
    var links = document.querySelectorAll('.toc a[href^="#"]');
    if (!links.length) return;

    var targets = Array.prototype.map.call(links, function (link) {
      return document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
    });

    var setActive = function () {
      var current = 0;
      targets.forEach(function (node, index) {
        // 顶部已经滚过导航栏的最后一个标题，就是当前读到的位置
        if (node && node.getBoundingClientRect().top <= 140) current = index;
      });
      // 滚到页面底部时，最后几节可能永远到不了 140px 以上，兜底选最后一节
      var atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      var last = targets.length - 1;
      while (last > 0 && !targets[last]) last--;
      if (atEnd) current = last;

      links.forEach(function (link, index) {
        var on = index === current && Boolean(targets[index]);
        link.classList.toggle('is-active', on);
      });
    };

    var frame = 0;
    var onScroll = function () {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        setActive();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setActive();
  })();

  /* ---------- 代码块：语言名 + 复制按钮 ---------- */
  (function codeBlocks() {
    var blocks = document.querySelectorAll('.post-content figure.highlight, .page-content figure.highlight');
    if (!blocks.length) return;

    var labels = {
      bash: 'bash', sh: 'sh', shell: 'shell', js: 'javascript', javascript: 'javascript', ts: 'typescript',
      typescript: 'typescript', python: 'python', py: 'python', c: 'c', cpp: 'c++', 'c++': 'c++',
      java: 'java', go: 'go', rust: 'rust', html: 'html', xml: 'html', css: 'css', json: 'json',
      yaml: 'yaml', yml: 'yaml', md: 'markdown', markdown: 'markdown', sql: 'sql'
    };

    Array.prototype.forEach.call(blocks, function (block) {
      var code = block.querySelector('td.code pre') || block.querySelector('pre');
      if (!code) return;

      // 语言名是 figure 上除 highlight 以外的那个 class，比如 <figure class="highlight bash">
      var lang = (block.className.replace(/\bhighlight\b/g, '').trim().split(/\s+/)[0] || '').toLowerCase();
      var label = document.createElement('span');
      label.textContent = labels[lang] || lang || 'code';

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.setAttribute('aria-label', '复制代码');
      button.textContent = '复制';

      var bar = document.createElement('div');
      bar.className = 'code-bar';
      bar.appendChild(label);
      bar.appendChild(button);
      block.insertBefore(bar, block.firstChild);

      button.addEventListener('click', function () {
        var text = code.innerText.replace(/\n+$/, '');
        var done = function () {
          button.textContent = '已复制';
          button.classList.add('is-copied');
          setTimeout(function () {
            button.textContent = '复制';
            button.classList.remove('is-copied');
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  })();

  /* ---------- 本地搜索 ---------- */
  (function localSearch() {
    var dialog = document.getElementById('search-dialog');
    var openButton = document.querySelector('[data-search-open]');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    if (!dialog || !input || !results) return;

    var entries = null; // null = 还没加载
    var loading = null;
    var active = -1;
    var shown = [];

    var strip = function (html) {
      var div = document.createElement('div');
      div.innerHTML = html;
      return (div.textContent || '').replace(/\s+/g, ' ').trim();
    };

    var load = function () {
      if (entries) return Promise.resolve(entries);
      if (loading) return loading;
      loading = fetch(dialog.getAttribute('data-search-path'))
        .then(function (response) {
          if (!response.ok) throw new Error('search index ' + response.status);
          return response.text();
        })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'text/xml');
          // hexo-generator-search 的每个条目是 <title> / <link href> / <url> / <content>：
          // 地址是 <url> 元素的文本，<link> 元素上才是 href 属性。两个都读，哪个有用哪个。
          entries = Array.prototype.map.call(doc.querySelectorAll('entry'), function (entry) {
            var title = entry.querySelector('title');
            var link = entry.querySelector('link');
            var urlEl = entry.querySelector('url');
            var content = entry.querySelector('content');
            return {
              title: title ? title.textContent : '',
              url: (urlEl && urlEl.textContent.trim()) || (link && link.getAttribute('href')) || '',
              text: content ? strip(content.textContent) : ''
            };
          }).filter(function (item) {
            return item.url;
          });
          return entries;
        })
        .catch(function () {
          entries = [];
          return entries;
        });
      return loading;
    };

    var render = function () {
      results.innerHTML = '';
      if (!shown.length) {
        var empty = document.createElement('li');
        empty.className = 'search-results__empty';
        empty.textContent = entries && !entries.length ? '搜索索引没有加载成功。' : '没有匹配的文章。';
        results.appendChild(empty);
        return;
      }
      shown.forEach(function (item, index) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.className = 'search-result' + (index === active ? ' is-active' : '');
        link.href = item.url;

        var title = document.createElement('div');
        title.className = 'search-result__title';
        title.textContent = item.title;

        var meta = document.createElement('div');
        meta.className = 'search-result__meta';
        meta.textContent = item.snippet;

        link.appendChild(title);
        link.appendChild(meta);
        li.appendChild(link);
        results.appendChild(li);
      });
    };

    var search = function (query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        shown = entries.slice(0, 8).map(function (item) {
          return { title: item.title, url: item.url, snippet: item.text.slice(0, 60) };
        });
      } else {
        var hits = entries
          .map(function (item) {
            var titleHit = item.title.toLowerCase().indexOf(q) >= 0;
            var at = item.text.toLowerCase().indexOf(q);
            var score = titleHit ? 2 : at >= 0 ? 1 : 0;
            return { item: item, score: score, at: at };
          })
          .filter(function (hit) {
            return hit.score > 0;
          })
          .sort(function (a, b) {
            return b.score - a.score;
          })
          .slice(0, 20);
        shown = hits.map(function (hit) {
          // 摘要从匹配位置往前留一点上下文
          var start = Math.max(0, hit.at - 24);
          var snippet = start > 0 ? '…' + hit.item.text.slice(start, start + 90) : hit.item.text.slice(0, 90);
          return { title: hit.item.title, url: hit.item.url, snippet: snippet };
        });
      }
      // 有搜索词时默认选中第一条，回车即可跳转；只是列出最近文章时不高亮
      active = q && shown.length ? 0 : -1;
      render();
    };

    var open = function () {
      if (typeof dialog.showModal !== 'function') return;
      if (!dialog.open) dialog.showModal();
      input.value = '';
      results.innerHTML = '<li class="search-results__empty">输入关键词搜索文章…</li>';
      input.focus();
      load();
    };

    var close = function () {
      if (dialog.open) dialog.close();
    };

    if (openButton) openButton.addEventListener('click', open);

    document.addEventListener('keydown', function (event) {
      var key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        open();
      } else if (key === 'Escape' && dialog.open) {
        // 原生 dialog 自己会处理 Esc，这里只是保险
        close();
      }
    });

    input.addEventListener('input', function () {
      if (!entries) return;
      search(input.value);
    });

    results.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link) close();
    });

    // 点在弹窗外面（遮罩上）时关闭
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });

    input.addEventListener('keydown', function (event) {
      if (!shown.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        active = (active + 1) % shown.length;
        render();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        active = (active - 1 + shown.length) % shown.length;
        render();
      } else if (event.key === 'Enter' && shown[active]) {
        event.preventDefault();
        window.location.href = shown[active].url;
      }
    });
  })();
})();
