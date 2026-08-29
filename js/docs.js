var DOCS = [
  { slug: 'readme', file: 'README.md', label: 'Overview' },
  { slug: 'spec', file: 'SPEC.md', label: 'Specification' },
  { slug: 'scoring', file: 'SCORING.md', label: 'Scoring methodology' },
  { slug: 'copy', file: 'COPY.md', label: 'Interface copy' }
];

function docsCurrentSlug() {
  var params = new URLSearchParams(window.location.search);
  var requested = (params.get('doc') || '').toLowerCase();
  var found = DOCS.some(function (doc) { return doc.slug === requested; });
  return found ? requested : DOCS[0].slug;
}

function docsRenderNav(activeSlug) {
  var nav = document.getElementById('docs-nav-list');
  nav.innerHTML = '';
  DOCS.forEach(function (doc) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = 'docs.html?doc=' + doc.slug;
    a.textContent = doc.label;
    if (doc.slug === activeSlug) {
      a.setAttribute('aria-current', 'page');
    }
    li.appendChild(a);
    nav.appendChild(li);
  });
}

function docsLoad() {
  var slug = docsCurrentSlug();
  var doc = DOCS.filter(function (d) { return d.slug === slug; })[0];
  var content = document.getElementById('doc-content');
  var status = document.getElementById('docs-status');

  docsRenderNav(slug);
  document.title = doc.label + ' – Comms Clarity Scorer docs';
  status.textContent = 'Loading ' + doc.file + '…';
  content.innerHTML = '';

  fetch(doc.file)
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function (source) {
      content.innerHTML = markdownToHtml(source);
      status.textContent = '';
    })
    .catch(function () {
      status.textContent = '';
      content.innerHTML = '<p>Could not load ' + doc.file + '. Try refreshing the page.</p>';
    });
}

docsLoad();
