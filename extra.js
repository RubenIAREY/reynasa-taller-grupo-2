/* Grupo II · movimiento propio de esta dirección: fundido lento de la foto de portada,
   entradas al llegar, fila de momentos y la aguja del reloj. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // Fundido lento entre las fotos de la sala (la firma de esta web). Se para con la pestaña oculta.
  var fundido = document.querySelector('[data-fundido]');
  if (fundido && !reduce) {
    var fotos = $$('img', fundido), i = 0, t = null;
    function siguiente() { if (document.hidden || fotos.length < 2) return; fotos[i].classList.remove('ve'); i = (i + 1) % fotos.length; fotos[i].classList.add('ve'); }
    function arranca() { clearInterval(t); t = setInterval(siguiente, 5600); }
    if (fotos.length > 1) { arranca(); document.addEventListener('visibilitychange', function () { if (!document.hidden) arranca(); }); }
  }

  // El vídeo de fondo es decorativo: con «menos movimiento» se queda quieto en su póster.
  if (reduce) $$('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });

  // Entradas: una vez, al llegar.
  var entra = $$('.entra');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('dentro'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    entra.forEach(function (el) { io.observe(el); });
  } else entra.forEach(function (el) { el.classList.add('dentro'); });

  // Fila de momentos: barra de avance y botones.
  var fila = document.querySelector('.momentos__fila');
  if (fila) {
    var barra = document.querySelector('.momentos__progreso i');
    function avance() { var max = fila.scrollWidth - fila.clientWidth; barra.style.setProperty('--v', max > 0 ? Math.max(0.08, fila.scrollLeft / max).toFixed(3) : 1); }
    fila.addEventListener('scroll', avance, { passive: true }); avance();
    $$('[data-mom]').forEach(function (b) { b.addEventListener('click', function () { fila.scrollBy({ left: (+b.dataset.mom) * 312, behavior: reduce ? 'auto' : 'smooth' }); }); });
  }

  // La aguja baja de la zona roja a la calma cuando la hoja entra en pantalla.
  $$('[data-reloj]').forEach(function (r) {
    if (!('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { r.style.setProperty('--ang', e.isIntersecting ? '-124deg' : '48deg'); }); }, { threshold: 0.6 });
    o.observe(r);
  });
})();
