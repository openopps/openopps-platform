var exports = module.exports = {};

var marked = require('marked');
var renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  if (href.startsWith('http')) {
    out += ' target="blank"'
  }
  out += '>' + text + '</a>';
  return out;
};

exports.renderer = renderer;
