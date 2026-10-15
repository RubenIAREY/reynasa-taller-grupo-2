/* Taller de automatismos · Reynasa. Interacciones propias de la página.
   El motor (scrollcraft.js) se monta al final y no se toca. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var BASE = doc.getAttribute('data-base') || location.href.split('#')[0].split('?')[0];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var movil = matchMedia('(max-width: 860px)').matches;
  if (movil) {
    // En el móvil el raíl horizontal y el método fijado se leen mejor como una página normal.
    Array.prototype.forEach.call(document.querySelectorAll('.rail-sec, .pico'), function (s) {
      s.setAttribute('data-sc-act', 'flow');
      s.removeAttribute('data-sc-span');
      s.classList.add('es-flujo');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-sc-pan]'), function (r) { r.removeAttribute('data-sc-pan'); });
  }

  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lee(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ------------------------------------------------ modo spoilers -- */
  var params = new URLSearchParams(location.search);
  var modo = params.get('modo') === 'completo' ? 'completo' : (params.get('modo') === 'seguro' ? 'seguro' : (lee('modo-taller') || 'seguro'));
  var linea = document.querySelector('.enfoque');

  function pinta() {
    doc.setAttribute('data-modo', modo);
    var on = modo === 'completo';
    $$('.modo').forEach(function (b) {
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      var t = b.querySelector('.modo__txt');
      if (t) t.textContent = on ? (b.dataset.on || 'Completo') : (b.dataset.off || 'Sin spoilers');
    });
    $$('[data-pdf]').forEach(function (a) {
      a.href = 'descargas/secciones/' + a.dataset.pdf + (on ? '-completo.pdf' : '-sin-spoilers.pdf');
      var v = a.querySelector('.pdf-version');
      if (v) v.textContent = on ? 'completa' : 'sin spoilers';
    });
    $$('.sp').forEach(function (sp) {
      var cuerpo = sp.querySelector('.sp__cuerpo');
      var cerrado = !on && !sp.classList.contains('sp--abierto');
      if (cerrado) { cuerpo.setAttribute('inert', ''); cuerpo.setAttribute('aria-hidden', 'true'); }
      else { cuerpo.removeAttribute('inert'); cuerpo.removeAttribute('aria-hidden'); }
    });
  }

  function cambia(nuevo) {
    if (nuevo === modo) return;
    var aCompleto = nuevo === 'completo';
    if (aCompleto && !reduce) {
      // La firma: una línea de enfoque recorre la pantalla y cada bloque velado
      // se enfoca justo cuando la línea pasa por encima.
      var vh = innerHeight;
      $$('.sp__cuerpo').forEach(function (c) {
        var top = c.getBoundingClientRect().top;
        var d = Math.max(0, Math.min(1, top / vh)) * 780;
        c.style.transitionDelay = d + 'ms';
      });
      if (linea) { linea.classList.remove('va'); void linea.offsetWidth; linea.classList.add('va'); }
      setTimeout(function () { $$('.sp__cuerpo').forEach(function (c) { c.style.transitionDelay = ''; }); }, 1500);
    }
    modo = nuevo;
    guarda('modo-taller', modo);
    pinta();
  }
  $$('.modo').forEach(function (b) {
    b.addEventListener('click', function () { cambia(modo === 'completo' ? 'seguro' : 'completo'); });
  });
  $$('[data-modo-completo]').forEach(function (b) { b.addEventListener('click', function () { cambia('completo'); }); });
  $$('.sp__abrir').forEach(function (b) {
    b.addEventListener('click', function () {
      var sp = b.closest('.sp');
      sp.classList.add('sp--abierto');
      pinta();
      var c = sp.querySelector('.sp__cuerpo');
      if (c) c.focus({ preventScroll: true });
    });
  });
  pinta();

  /* --------------------------------------------------------- folio -- */
  var folio = document.querySelector('.folio');
  var fNum = folio && folio.querySelector('.folio__num');
  var fTit = folio && folio.querySelector('.folio__tit');
  var fBarra = folio && folio.querySelector('.folio__barra i');
  var caps = $$('[data-cap]');
  var actual = null;
  var pendiente = false;

  function tintaEn(x, y) {
    var els = document.elementsFromPoint(x, y);
    for (var i = 0; i < els.length; i++) {
      if (folio.contains(els[i])) continue;
      var g = els[i].closest('.g-papel,.g-blanco,.g-noche,.g-azul,.g-rojo,.g-naranja,.portada');
      if (g) return getComputedStyle(g).getPropertyValue('--sc-ink').trim() || '#121417';
    }
    return '#121417';
  }
  function folioTick() {
    pendiente = false;
    if (!folio) return;
    var mid = innerHeight * 0.42, cur = null;
    for (var i = 0; i < caps.length; i++) {
      var r = caps[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { cur = caps[i]; break; }
    }
    if (cur !== actual) {
      actual = cur;
      if (cur) { fNum.textContent = cur.dataset.num; fTit.textContent = cur.dataset.titulo; folio.setAttribute('data-hay', ''); }
      else { fNum.textContent = ''; fTit.textContent = 'Índice'; folio.removeAttribute('data-hay'); }
    }
    if (fBarra) {
      var max = doc.scrollHeight - innerHeight;
      fBarra.parentNode.style.setProperty('--avance', max > 0 ? (scrollY / max).toFixed(3) : 0);
    }
    if (innerWidth > 1100) folio.style.setProperty('--folio-ink', tintaEn(30, innerHeight / 2));
  }
  var yPrev = scrollY;
  function barraMovil() {
    if (!folio || innerWidth > 1100) return;
    var y = scrollY, abajo = y > yPrev + 6, arriba = y < yPrev - 6;
    if (y < 120 || (innerHeight + y) >= doc.scrollHeight - 40) folio.removeAttribute('data-oculto');
    else if (abajo) folio.setAttribute('data-oculto', '');
    else if (arriba) folio.removeAttribute('data-oculto');
    if (abajo || arriba) yPrev = y;
  }
  function pide() { barraMovil(); if (!pendiente) { pendiente = true; requestAnimationFrame(folioTick); } }
  addEventListener('scroll', pide, { passive: true });
  addEventListener('resize', pide);
  folioTick();

  /* -------------------------------------------------------- índice -- */
  var indice = document.querySelector('.indice');
  var ultimoFoco = null;
  function abreIndice() { ultimoFoco = document.activeElement; indice.setAttribute('data-abierto', ''); indice.removeAttribute('inert'); var c = indice.querySelector('.indice__cerrar'); if (c) c.focus(); }
  function cierraIndice() { indice.removeAttribute('data-abierto'); indice.setAttribute('inert', ''); if (ultimoFoco) ultimoFoco.focus(); }
  if (indice) {
    $$('[data-abre-indice]').forEach(function (b) { b.addEventListener('click', abreIndice); });
    indice.querySelector('.indice__cerrar').addEventListener('click', cierraIndice);
    indice.addEventListener('click', function (e) { if (e.target === indice) cierraIndice(); });
    // Desde el índice se salta directo: un scroll suave de 30.000 px en el móvil se hace eterno.
    $$('a[href^="#"]', indice).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var destino = document.querySelector(a.getAttribute('href'));
        cierraIndice();
        if (!destino) return;
        e.preventDefault();
        doc.style.scrollBehavior = 'auto';
        destino.scrollIntoView({ block: 'start' });
        history.replaceState(null, '', a.getAttribute('href'));
        setTimeout(function () { doc.style.scrollBehavior = ''; }, 50);
      });
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && indice.hasAttribute('data-abierto')) cierraIndice(); });
  }

  /* ------------------------------------------- copiar enlace / imprimir -- */
  $$('[data-copiar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = BASE + (b.dataset.copiar ? b.dataset.copiar + '/' : '');
      var ok = function () { b.setAttribute('data-ok', '¡Copiado!'); setTimeout(function () { b.removeAttribute('data-ok'); }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt('Copia este enlace:', url); });
      else prompt('Copia este enlace:', url);
    });
  });

  /* --------------------------------------------------------- visor -- */
  var visor = document.querySelector('.visor');
  if (visor && visor.showModal) {
    var vImg = visor.querySelector('img'), vTxt = visor.querySelector('p');
    $$('[data-visor]').forEach(function (b) {
      b.addEventListener('click', function () {
        vImg.src = b.dataset.visor; vImg.alt = b.querySelector('img').alt; vTxt.textContent = b.dataset.pie || '';
        visor.showModal();
      });
    });
    visor.querySelector('button').addEventListener('click', function () { visor.close(); });
    visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
  }

  /* ---------------------------------------------------------- test -- */
  $$('.quiz').forEach(function (q) {
    $$('.quiz__btn', q).forEach(function (b) { b.addEventListener('click', function () { b.closest('li').classList.add('ver'); }); });
  });
  $$('[data-quiz-todo]').forEach(function (b) {
    b.addEventListener('click', function () { $$('#' + b.dataset.quizTodo + ' li').forEach(function (li) { li.classList.add('ver'); }); });
  });
  var reto = document.querySelector('.reto5');
  if (reto) {
    var preguntas = JSON.parse(reto.getAttribute('data-preguntas'));
    var rN = reto.querySelector('.reto5__n'), rQ = reto.querySelector('.reto5__q'), rT = reto.querySelector('.reto5__t i');
    var rPaso = reto.querySelector('.reto5__paso'), rFin = reto.querySelector('.reto5__fin'), timer = null, idx = 0;
    function muestra() {
      if (idx >= preguntas.length) { rPaso.hidden = true; rFin.hidden = false; return; }
      rN.textContent = 'Pregunta ' + (idx + 1) + ' de ' + preguntas.length + ' · 5 segundos';
      rQ.textContent = preguntas[idx].q;
      rT.classList.remove('corre'); void rT.offsetWidth; rT.classList.add('corre');
      timer = setTimeout(function () { idx++; muestra(); }, 5000);
    }
    $$('[data-reto5]').forEach(function (b) {
      b.addEventListener('click', function () {
        idx = 0; rPaso.hidden = false; rFin.hidden = true; reto.setAttribute('data-abierto', ''); reto.removeAttribute('inert');
        reto.querySelector('.reto5__x').focus(); muestra();
      });
    });
    reto.querySelector('.reto5__x').addEventListener('click', function () { clearTimeout(timer); reto.removeAttribute('data-abierto'); reto.setAttribute('inert', ''); });
  }

  /* -------------------------------------------------------- sesgos -- */
  $$('.sesgos').forEach(function (s) {
    var tabs = $$('[role="tab"]', s), grupos = $$('.sesgos__grupo', s);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x, j) { x.setAttribute('aria-selected', j === i ? 'true' : 'false'); x.tabIndex = j === i ? 0 : -1; });
        grupos.forEach(function (g, j) { g.hidden = j !== i; });
      });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus(); }
      });
    });
    $$('.sesgo__btn', s).forEach(function (b) { b.addEventListener('click', function () { b.closest('.sesgo').classList.add('ver'); }); });
    var todo = s.querySelector('.sesgos__todo');
    if (todo) todo.addEventListener('click', function () { $$('.sesgo', s).forEach(function (x) { x.classList.add('ver'); }); });
  });

  /* ----------------------------------------------------- checklist -- */
  $$('.check').forEach(function (lista) {
    var k = 'check-' + lista.dataset.id;
    var est = []; try { est = JSON.parse(lee(k) || '[]'); } catch (e) {}
    var cajas = $$('input', lista);
    var prog = document.querySelector('[data-prog="' + lista.dataset.id + '"]');
    function cuenta() {
      var n = cajas.filter(function (c) { return c.checked; }).length;
      if (prog) { prog.querySelector('b').textContent = n + ' de ' + cajas.length; prog.querySelector('i').parentNode.style.setProperty('--v', (n / cajas.length).toFixed(3)); }
    }
    cajas.forEach(function (c, i) {
      c.checked = !!est[i];
      c.addEventListener('change', function () { est[i] = c.checked; guarda(k, JSON.stringify(est)); cuenta(); });
    });
    cuenta();
  });

  /* ------------------------------------------------- pausa guiada -- */
  var resp = document.querySelector('.respira');
  if (resp) {
    var aro = resp.querySelector('.respira__aro'), rt = resp.querySelector('.respira__t'), rs = resp.querySelector('.respira__s');
    var pasos = [], tiempos = [];
    function limpia() { tiempos.forEach(clearTimeout); tiempos = []; }
    function cierra() { limpia(); resp.removeAttribute('data-abierto'); resp.setAttribute('inert', ''); }
    function abre() {
      limpia(); resp.setAttribute('data-abierto', ''); resp.removeAttribute('inert');
      resp.querySelector('button').focus();
      var t = 0, total = 30;
      aro.style.setProperty('--dur', '0s'); aro.style.setProperty('--s', '.55');
      for (var r = 0; r < 3; r++) {
        (function (r, t0) {
          tiempos.push(setTimeout(function () { rt.textContent = 'Inspira'; aro.style.setProperty('--dur', reduce ? '0s' : '4s'); aro.style.setProperty('--s', '1'); }, t0 * 1000));
          tiempos.push(setTimeout(function () { rt.textContent = 'Suelta despacio'; aro.style.setProperty('--dur', reduce ? '0s' : '6s'); aro.style.setProperty('--s', '.55'); }, (t0 + 4) * 1000));
        })(r, t);
        t += 10;
      }
      for (var s = 0; s <= total; s++) {
        (function (s) { tiempos.push(setTimeout(function () { rs.textContent = (total - s) + ' s · respiración ' + Math.min(3, Math.floor(s / 10) + 1) + ' de 3'; }, s * 1000)); })(s);
      }
      tiempos.push(setTimeout(function () { rt.textContent = 'Ahora, elige.'; rs.textContent = '¿Qué es lo que de verdad te preocupa?'; }, total * 1000));
    }
    $$('[data-pausa]').forEach(function (b) { b.addEventListener('click', abre); });
    resp.querySelector('button').addEventListener('click', cierra);
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && resp.hasAttribute('data-abierto')) cierra(); });
  }

  /* ---------------------------------------- portada: puntero y capas -- */
  var pieza = document.querySelector('.portada__pieza');
  var primer = document.querySelector('.portada__primer');
  if (pieza && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); }, { passive: true });
    (function bucle() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      if (scrollY < innerHeight * 1.2) {
        pieza.style.translate = (cx * -18).toFixed(2) + 'px ' + (cy * -12).toFixed(2) + 'px';
        pieza.style.rotate = (cx * 1.6).toFixed(2) + 'deg';
        if (primer) primer.style.translate = (cx * -42).toFixed(2) + 'px ' + (cy * -26).toFixed(2) + 'px';
      }
      requestAnimationFrame(bucle);
    })();
  }

  /* ---------------------------------------------------------- motor -- */
  if (window.ScrollCraft) ScrollCraft.mount(document.body);
})();
