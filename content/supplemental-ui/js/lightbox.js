(function () {
  function closeLightbox(overlay) {
    document.removeEventListener('keydown', overlay._onKeydown);
    overlay.remove();
  }

  function openLightbox(src, alt) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.className = 'lightbox-image';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    overlay._onKeydown = function (e) {
      if (e.key === 'Escape') closeLightbox(overlay);
    };
    document.addEventListener('keydown', overlay._onKeydown);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === closeBtn) closeLightbox(overlay);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('.imageblock a.image');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var img = link.querySelector('img');
        openLightbox(link.getAttribute('href'), img ? img.alt : '');
      });
    });
  });
})();
