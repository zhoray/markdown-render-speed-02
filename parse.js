// A small, dependency-free CommonMark/GFM renderer.

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  let out = '';
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    let replacement = null;
    if (c === 38) replacement = '&amp;';
    else if (c === 60) replacement = '&lt;';
    else if (c === 62) replacement = '&gt;';
    else if (c === 34) replacement = '&quot;';
    else if (c === 39) replacement = '&#39;';
    if (replacement !== null) {
      if (i > start) out += value.slice(start, i);
      out += replacement;
      start = i + 1;
    }
  }
  return start === 0 ? value : out + value.slice(start);
}

function escapeAttr(value) {
  let out = '';
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    let replacement = null;
    if (c === 38) {
      let j = i + 1;
      while (j < value.length && /[A-Za-z0-9#]/.test(value[j])) j++;
      if (j > i + 1 && value.charCodeAt(j) === 59) continue;
      replacement = '&amp;';
    }
    else if (c === 34) replacement = '&quot;';
    else if (c === 60) replacement = '&lt;';
    else if (c === 62) replacement = '&gt;';
    if (replacement !== null) {
      if (i > start) out += value.slice(start, i);
      out += replacement;
      start = i + 1;
    }
  }
  return start === 0 ? value : out + value.slice(start);
}

const ENTITIES = {
  amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>', quot: '"', QUOT: '"',
  apos: "'", nbsp: '\u00a0', copy: '\u00a9', COPY: '\u00a9', reg: '\u00ae', REG: '\u00ae',
  trade: '\u2122', TRADE: '\u2122', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d', sbquo: '\u201a',
  bdquo: '\u201e', laquo: '\u00ab', raquo: '\u00bb', lsaquo: '\u2039', rsaquo: '\u203a',
  bull: '\u2022', dagger: '\u2020', Dagger: '\u2021', permil: '\u2030', prime: '\u2032',
  Prime: '\u2033', oline: '\u203e', frasl: '\u2044', euro: '\u20ac', pound: '\u00a3',
  yen: '\u00a5', cent: '\u00a2', curren: '\u00a4', brvbar: '\u00a6', uml: '\u00a8',
  ordf: '\u00aa', ordm: '\u00ba', not: '\u00ac', shy: '\u00ad', macr: '\u00af',
  deg: '\u00b0', plusmn: '\u00b1', sup2: '\u00b2', sup3: '\u00b3', acute: '\u00b4',
  micro: '\u00b5', para: '\u00b6', middot: '\u00b7', cedil: '\u00b8', sup1: '\u00b9',
  frac14: '\u00bc', frac12: '\u00bd', frac34: '\u00be', iquest: '\u00bf',
  times: '\u00d7', divide: '\u00f7', iexcl: '\u00a1', szlig: '\u00df',
  Agrave: '\u00c0', Aacute: '\u00c1', Acirc: '\u00c2', Atilde: '\u00c3', Auml: '\u00c4',
  Aring: '\u00c5', AElig: '\u00c6', Ccedil: '\u00c7', Egrave: '\u00c8', Eacute: '\u00c9',
  Ecirc: '\u00ca', Euml: '\u00cb', Igrave: '\u00cc', Iacute: '\u00cd', Icirc: '\u00ce',
  Iuml: '\u00cf', ETH: '\u00d0', Ntilde: '\u00d1', Ograve: '\u00d2', Oacute: '\u00d3',
  Ocirc: '\u00d4', Otilde: '\u00d5', Ouml: '\u00d6', Oslash: '\u00d8', Ugrave: '\u00d9',
  Uacute: '\u00da', Ucirc: '\u00db', Uuml: '\u00dc', Yacute: '\u00dd', THORN: '\u00de',
  agrave: '\u00e0', aacute: '\u00e1', acirc: '\u00e2', atilde: '\u00e3', auml: '\u00e4',
  aring: '\u00e5', aelig: '\u00e6', ccedil: '\u00e7', egrave: '\u00e8', eacute: '\u00e9',
  ecirc: '\u00ea', euml: '\u00eb', igrave: '\u00ec', iacute: '\u00ed', icirc: '\u00ee',
  iuml: '\u00ef', eth: '\u00f0', ntilde: '\u00f1', ograve: '\u00f2', oacute: '\u00f3',
  ocirc: '\u00f4', otilde: '\u00f5', ouml: '\u00f6', oslash: '\u00f8', ugrave: '\u00f9',
  uacute: '\u00fa', ucirc: '\u00fb', uuml: '\u00fc', yacute: '\u00fd', thorn: '\u00fe',
  yuml: '\u00ff', OElig: '\u0152', oelig: '\u0153', Scaron: '\u0160', scaron: '\u0161',
  Yuml: '\u0178', fnof: '\u0192', circ: '\u02c6', tilde: '\u02dc', Alpha: '\u0391',
  Beta: '\u0392', Gamma: '\u0393', Delta: '\u0394', Epsilon: '\u0395', Zeta: '\u0396',
  Eta: '\u0397', Theta: '\u0398', Iota: '\u0399', Kappa: '\u039a', Lambda: '\u039b',
  Mu: '\u039c', Nu: '\u039d', Xi: '\u039e', Omicron: '\u039f', Pi: '\u03a0', Rho: '\u03a1',
  Sigma: '\u03a3', Tau: '\u03a4', Upsilon: '\u03a5', Phi: '\u03a6', Chi: '\u03a7',
  Psi: '\u03a8', Omega: '\u03a9', alpha: '\u03b1', beta: '\u03b2', gamma: '\u03b3',
  delta: '\u03b4', epsilon: '\u03b5', zeta: '\u03b6', eta: '\u03b7', theta: '\u03b8',
  iota: '\u03b9', kappa: '\u03ba', lambda: '\u03bb', mu: '\u03bc', nu: '\u03bd',
  xi: '\u03be', omicron: '\u03bf', pi: '\u03c0', rho: '\u03c1', sigmaf: '\u03c2',
  sigma: '\u03c3', tau: '\u03c4', upsilon: '\u03c5', phi: '\u03c6', chi: '\u03c7',
  psi: '\u03c8', omega: '\u03c9', thetasym: '\u03d1', upsih: '\u03d2', piv: '\u03d6',
  ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009', zwnj: '\u200c', zwj: '\u200d',
  lrm: '\u200e', rlm: '\u200f', hyphen: '\u2010', dash: '\u2010', horbar: '\u2015',
  Vert: '\u2016', lceil: '\u2308', rceil: '\u2309', lfloor: '\u230a', rfloor: '\u230b',
  lang: '\u27e8', rang: '\u27e9', loz: '\u25ca', spades: '\u2660', clubs: '\u2663',
  hearts: '\u2665', diams: '\u2666', star: '\u2606', starf: '\u2605', check: '\u2713',
  cross: '\u2717', phone: '\u260e', female: '\u2640', male: '\u2642',
  forall: '\u2200', part: '\u2202', exist: '\u2203', empty: '\u2205', nabla: '\u2207',
  isin: '\u2208', notin: '\u2209', ni: '\u220b', prod: '\u220f', sum: '\u2211',
  minus: '\u2212', lowast: '\u2217', radic: '\u221a', prop: '\u221d', infin: '\u221e',
  ang: '\u2220', and: '\u2227', or: '\u2228', cap: '\u2229', cup: '\u222a', int: '\u222b',
  there4: '\u2234', sim: '\u223c', cong: '\u2245', asymp: '\u2248', ne: '\u2260',
  equiv: '\u2261', le: '\u2264', ge: '\u2265', sub: '\u2282', sup: '\u2283',
  nsub: '\u2284', sube: '\u2286', supe: '\u2287', oplus: '\u2295', otimes: '\u2297',
  perp: '\u22a5', sdot: '\u22c5', larr: '\u2190', uarr: '\u2191', rarr: '\u2192',
  darr: '\u2193', harr: '\u2194', crarr: '\u21b5', lArr: '\u21d0', uArr: '\u21d1',
  rArr: '\u21d2', dArr: '\u21d3', hArr: '\u21d4', image: '\u2111', real: '\u211c',
  weierp: '\u2118', alefsym: '\u2135', larrhk: '\u21a9', rarrhk: '\u21aa',
  Dcaron: '\u010e', dcaron: '\u010f', HilbertSpace: '\u210b', DifferentialD: '\u2146',
  ClockwiseContourIntegral: '\u2232', ngE: '\u2267\u0338', ngeq: '\u2267\u0338',
  frac13: '\u2153', frac23: '\u2154', frac15: '\u2155', frac25: '\u2156',
  frac35: '\u2157', frac45: '\u2158', frac16: '\u2159', frac56: '\u215a',
  frac18: '\u215b', frac38: '\u215c', frac58: '\u215d', frac78: '\u215e',
  Tab: '\u0009', NewLine: '\u000a', excl: '!', num: '#', dollar: '$', percnt: '%',
  lpar: '(', rpar: ')', ast: '*', plus: '+', comma: ',', period: '.', sol: '/',
  colon: ':', semi: ';', equals: '=', quest: '?', commat: '@', lsqb: '[',
  bsol: '\\', rsqb: ']', lowbar: '_', grave: '`', lcub: '{', verbar: '|',
  rcub: '}', tilde: '\u02dc',
};

function decodeNumericEntity(code) {
  if (!Number.isFinite(code) || code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
    return '\ufffd';
  }
  try {
    return String.fromCodePoint(code);
  } catch {
    return '\ufffd';
  }
}

function decodeEntityAt(source, index) {
  if (source.charCodeAt(index) !== 38) return null;
  let i = index + 1;
  if (source.charCodeAt(i) === 35) {
    i++;
    let hex = false;
    if (source.charCodeAt(i) === 120 || source.charCodeAt(i) === 88) {
      hex = true;
      i++;
    }
    const start = i;
    if (hex) {
      while (i < source.length) {
        const c = source.charCodeAt(i);
        if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) break;
        i++;
      }
    } else {
      while (i < source.length) {
        const c = source.charCodeAt(i);
        if (c < 48 || c > 57) break;
        i++;
      }
    }
    if (i === start || source.charCodeAt(i) !== 59) return null;
    const digits = source.slice(start, i);
    const code = parseInt(digits, hex ? 16 : 10);
    if (code > 0x10ffff) return null;
    return { value: decodeNumericEntity(code), end: i + 1 };
  }
  const start = i;
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122))) break;
    i++;
  }
  if (i === start || source.charCodeAt(i) !== 59) return null;
  const name = source.slice(start, i);
  return { value: source.slice(index, i + 1), end: i + 1, named: true };
}

function unescapeString(value) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const c = value.charCodeAt(i);
    if (c === 92 && i + 1 < value.length && isAsciiPunctuation(value.charCodeAt(i + 1))) {
      out += value[i + 1];
      i += 2;
      continue;
    }
    out += value[i++];
  }
  return out;
}

function cleanUrl(href) {
  if (/&[A-Za-z0-9#]+;/.test(href)) return href;
  if (href.indexOf('%') === -1 && href.indexOf(' ') === -1 && !/[^\x20-\x7e]/.test(href) && !/[<>"`{}|\\^]/.test(href)) {
    return href;
  }
  try {
    return encodeURI(href).replace(/%25/g, '%');
  } catch {
    return href;
  }
}

function cleanAngleUrl(href) {
  let out = '';
  for (let i = 0; i < href.length; i++) {
    const ch = href[i];
    const code = href.charCodeAt(i);
    if (ch === '%' && /^[0-9A-Fa-f]{2}$/.test(href.slice(i + 1, i + 3))) {
      out += ch;
    } else if (ch === '\\' || ch === '[' || ch === ']') {
      out += '%' + code.toString(16).toUpperCase().padStart(2, '0');
    } else {
      out += ch;
    }
  }
  return cleanUrl(out);
}

function normalizeLabel(label) {
  let out = label.trim().replace(/\s+/g, ' ').toUpperCase().toLowerCase();
  out = out.replace(/ß/g, 'ss').replace(/ẞ/g, 'ss');
  return out;
}

function isAsciiPunctuation(c) {
  return (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
}

function isWhiteSpace(c) {
  return c === 0 || /\p{White_Space}/u.test(String.fromCodePoint(c));
}

function isPunctuationCode(c) {
  if (isAsciiPunctuation(c)) return true;
  return /[\p{P}\p{S}]/u.test(String.fromCodePoint(c));
}

function expandTabsColumn(line, initialColumn = 0) {
  if (line.indexOf('\t') === -1) return line;
  let out = '';
  let col = initialColumn;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\t') {
      const n = 4 - (col % 4);
      out += '    '.slice(0, n);
      col += n;
    } else {
      out += ch;
      col++;
    }
  }
  return out;
}

function expandTabs(line) {
  if (line.indexOf('\t') === -1) return line;
  let out = '';
  let col = 0;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === ' ') {
      out += ' ';
      col++;
    } else if (ch === '\t') {
      const n = 4 - (col % 4);
      out += ' '.repeat(n);
      col += n;
    } else {
      break;
    }
    i++;
  }
  return out + line.slice(i);
}

function expandLeadingTabs(value, initialColumn) {
  let col = initialColumn;
  let i = 0;
  let out = '';
  while (i < value.length) {
    const ch = value.charCodeAt(i);
    if (ch === 32) { out += ' '; col++; i++; }
    else if (ch === 9) { const n = 4 - (col % 4); out += ' '.repeat(n); col += n; i++; }
    else break;
  }
  return out + value.slice(i);
}

function restoreTabs(value) {
  return value;
}

function leadingSpaces(line) {
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32) i++;
  return i;
}

function isBlank(line) {
  for (let i = 0; i < line.length; i++) {
    if (line.charCodeAt(i) !== 32 && line.charCodeAt(i) !== 9) return false;
  }
  return true;
}

function stripUpTo3Spaces(line) {
  const n = leadingSpaces(line);
  return n <= 3 ? line.slice(n) : null;
}

function matchAtxHeading(line) {
  const rest = stripUpTo3Spaces(line);
  if (!rest || rest.charCodeAt(0) !== 35) return null;
  let i = 0;
  while (i < rest.length && rest.charCodeAt(i) === 35) i++;
  if (i > 6) return null;
  if (i < rest.length && rest.charCodeAt(i) !== 32 && rest.charCodeAt(i) !== 9) return null;
  let content = rest.slice(i).replace(/^[ \t]+/, '');
  content = content.replace(/[ \t]+#+[ \t]*$/, '');
  if (/^#+[ \t]*$/.test(content)) content = '';
  content = content.replace(/[ \t]+$/, '');
  return { level: i, text: content };
}

function matchSetext(line) {
  const rest = stripUpTo3Spaces(line);
  if (!rest) return 0;
  if (/^=+[ \t]*$/.test(rest)) return 1;
  if (/^-+[ \t]*$/.test(rest)) return 2;
  return 0;
}

function isThematicBreak(line) {
  const rest = stripUpTo3Spaces(line);
  if (!rest) return false;
  let marker = 0;
  let count = 0;
  for (let i = 0; i < rest.length; i++) {
    const c = rest.charCodeAt(i);
    if (c === 32 || c === 9) continue;
    if (c !== 42 && c !== 45 && c !== 95) return false;
    if (marker === 0) marker = c;
    else if (c !== marker) return false;
    count++;
  }
  return count >= 3;
}

function matchFence(line) {
  const rest = stripUpTo3Spaces(line);
  if (!rest) return null;
  const c = rest.charCodeAt(0);
  if (c !== 96 && c !== 126) return null;
  let i = 0;
  while (i < rest.length && rest.charCodeAt(i) === c) i++;
  if (i < 3) return null;
  const info = rest.slice(i);
  if (c === 96 && info.indexOf('`') !== -1) return null;
  return { indent: line.length - rest.length, char: c, length: i, info: info.trim() };
}

function isFenceClose(line, fence) {
  const rest = stripUpTo3Spaces(line);
  if (!rest) return false;
  let i = 0;
  while (i < rest.length && rest.charCodeAt(i) === fence.char) i++;
  if (i < fence.length) return false;
  while (i < rest.length) {
    const c = rest.charCodeAt(i++);
    if (c !== 32 && c !== 9) return false;
  }
  return true;
}

function matchListMarker(line) {
  const indent = leadingSpaces(line);
  if (indent > 3) return null;
  const rest = line.slice(indent);
  if (!rest.length) return null;
  const first = rest.charCodeAt(0);
  let ordered = false;
  let markerWidth = 1;
  let bullet = 0;
  let start = 1;
  let delimiter = 0;
  if (first === 42 || first === 43 || first === 45) {
    bullet = first;
  } else if (first >= 48 && first <= 57) {
    let n = 0;
    while (n < rest.length && n < 10) {
      const c = rest.charCodeAt(n);
      if (c < 48 || c > 57) break;
      n++;
    }
    if (n === 0 || n > 9) return null;
    const d = rest.charCodeAt(n);
    if (d !== 41 && d !== 46) return null;
    ordered = true;
    delimiter = d;
    markerWidth = n + 1;
    start = parseInt(rest.slice(0, n), 10);
  } else {
    return null;
  }
  const after = rest.charCodeAt(markerWidth);
  if (!(markerWidth >= rest.length || after === 32 || after === 9)) return null;
  let spaces = 0;
  let p = markerWidth;
  while (p < rest.length && rest.charCodeAt(p) === 32) {
    spaces++;
    p++;
  }
  let contentIndent;
  let contentStart;
  if (spaces === 0) {
    contentIndent = indent + markerWidth + 1;
    contentStart = indent + markerWidth;
  } else if (spaces <= 4 && p < rest.length) {
    contentIndent = indent + markerWidth + spaces;
    contentStart = indent + markerWidth + spaces;
  } else {
    contentIndent = indent + markerWidth + 1;
    contentStart = indent + markerWidth + 1;
  }
  return { ordered, bullet, delimiter, start, indent, markerWidth, contentIndent, contentStart };
}

const BLOCK_TAGS = new Set(('address article aside base basefont blockquote body caption center col colgroup dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html iframe legend li link main menu menuitem nav noframes ol optgroup option p param search section summary table tbody td tfoot th thead title tr track ul').split(' '));

function htmlBlockStart(line, canInterruptParagraph) {
  const rest = stripUpTo3Spaces(line);
  if (!rest || rest.charCodeAt(0) !== 60) return null;
  const lower = rest.toLowerCase();
  for (const tag of ['script', 'pre', 'style', 'textarea']) {
    if (lower.startsWith('<' + tag)) {
      const c = lower.charCodeAt(tag.length + 1);
      if (Number.isNaN(c) || c === 62 || c === 32 || c === 9) return { type: 1, endTag: tag };
    }
  }
  if (rest.startsWith('<!--')) return { type: 2, end: '-->' };
  if (rest.startsWith('<?')) return { type: 3, end: '?>' };
  if (rest.startsWith('<![CDATA[')) return { type: 5, end: ']]>' };
  if (/^<![A-Z]/.test(rest)) return { type: 4, end: '>' };
  const tagMatch = /^<\/?([A-Za-z][A-Za-z0-9-]*)(?:[ \t]|\/?>|$)/.exec(rest);
  if (tagMatch && BLOCK_TAGS.has(tagMatch[1].toLowerCase())) return { type: 6 };
  if (!canInterruptParagraph && isCompleteOpenOrCloseTag(rest)) return { type: 7 };
  return null;
}

function scanHtmlTag(source, index, allowNewline) {
  const n = source.length;
  let i = index + 1;
  if (source.charCodeAt(index) !== 60 || i >= n) return null;
  const c = source.charCodeAt(i);
  if (c === 47) {
    i++;
    const start = i;
    while (i < n && /[A-Za-z0-9-]/.test(source[i])) i++;
    if (i === start || i >= n) return null;
    while (i < n && (source[i] === ' ' || source[i] === '\t' || source[i] === '\n')) i++;
    if (source.charCodeAt(i) !== 62) return null;
    return { end: i + 1, name: source.slice(start, index + 2 + 0).toLowerCase() };
  }
  if (c === 33) {
    if (source.startsWith('!--', i)) {
      if (source.charCodeAt(i + 3) === 62) return { end: i + 4, name: '!--' };
      if (source.charCodeAt(i + 3) === 45 && source.charCodeAt(i + 4) === 62) return { end: i + 5, name: '!--' };
      const end = source.indexOf('-->', i + 3);
      return end === -1 ? null : { end: end + 3, name: '!--' };
    }
    if (source.startsWith('![CDATA[', i)) {
      const end = source.indexOf(']]>', i + 8);
      return end === -1 ? null : { end: end + 3, name: '![CDATA[' };
    }
    if (i + 1 < n && /[A-Z]/.test(source[i + 1])) {
      let j = i + 2;
      while (j < n && source[j] !== '>') j++;
      return j < n ? { end: j + 1, name: '!' } : null;
    }
    return null;
  }
  if (c === 63) {
    const end = source.indexOf('?>', i + 1);
    return end === -1 ? null : { end: end + 2, name: '?' };
  }
  if (!/[A-Za-z]/.test(source[i])) return null;
  const nameStart = i;
  while (i < n && /[A-Za-z0-9-]/.test(source[i])) i++;
  const name = source.slice(nameStart, i).toLowerCase();
  let sawSpace = false;
  while (i < n) {
    const ch = source.charCodeAt(i);
    if (ch === 62) return { end: i + 1, name, open: true };
    if (ch === 47 && source.charCodeAt(i + 1) === 62) return { end: i + 2, name, open: true };
    if (ch === 32 || ch === 9 || (allowNewline && ch === 10)) {
      sawSpace = true;
      i++;
      continue;
    }
    if (!sawSpace) return null;
    const attrStart = i;
    while (i < n && /[A-Za-z0-9_:.-]/.test(source[i])) i++;
    if (i === attrStart) return null;
    while (i < n && (source[i] === ' ' || source[i] === '\t' || (allowNewline && source[i] === '\n'))) i++;
    sawSpace = true;
    if (source.charCodeAt(i) === 61) {
      i++;
      while (i < n && (source[i] === ' ' || source[i] === '\t' || (allowNewline && source[i] === '\n'))) i++;
      const q = source.charCodeAt(i);
      if (q === 34 || q === 39) {
        const end = source.indexOf(source[i], i + 1);
        if (end === -1) return null;
        i = end + 1;
      } else {
        const valueStart = i;
        while (i < n) {
          const a = source.charCodeAt(i);
          if (a === 32 || a === 9 || a === 10 || a === 34 || a === 39 || a === 61 || a === 60 || a === 62 || a === 96) break;
          i++;
        }
        if (i === valueStart) return null;
      }
      sawSpace = false;
    }
  }
  return null;
}

function isCompleteOpenOrCloseTag(source) {
  const tag = scanHtmlTag(source, 0, false);
  return tag !== null && /^[ \t]*$/.test(source.slice(tag.end));
}

function parseReferenceDefinitionOld(lines, index) {
  let pos = index;
  let line = lines[pos];
  let rest = stripUpTo3Spaces(line);
  if (!rest || rest.charCodeAt(0) !== 91) return null;
  let labelText = '';
  let p = 0;
  let complete = false;
  while (pos < lines.length) {
    const source = pos === index ? rest : lines[pos];
    let i = pos === index ? 1 : 0;
    while (i < source.length) {
      const c = source.charCodeAt(i);
      if (c === 93) {
        complete = true;
        p = i + 1;
        break;
      }
      if (c === 91) return null;
      if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
        labelText += source.slice(i, i + 2);
        i += 2;
        continue;
      }
      labelText += source[i++];
    }
    if (complete) break;
    labelText += '\n';
    pos++;
  }
  if (!complete) return null;
  const label = normalizeLabel(labelText);
  if (!label || label.length > 999) return null;
  line = lines[pos];
  rest = pos === index ? rest : line;
  if (rest.charCodeAt(p) !== 58) return null;
  let i = p + 1;
  while (i < rest.length && (rest[i] === ' ' || rest[i] === '\t')) i++;
  if (i >= rest.length) {
    pos++;
    if (pos >= lines.length || isBlank(lines[pos])) return null;
    rest = lines[pos].replace(/^[ \t]*/, '');
    i = 0;
  }
  let dest = '';
  if (rest.charCodeAt(i) === 60) {
    let j = i + 1;
    while (j < rest.length && rest[j] !== '>') {
      if (rest[j] === '<' || rest[j] === '\n') return null;
      if (rest[j] === '\\' && j + 1 < rest.length && isAsciiPunctuation(rest.charCodeAt(j + 1))) j++;
      j++;
    }
    if (rest.charCodeAt(j) !== 62) return null;
    dest = rest.slice(i + 1, j);
    i = j + 1;
  } else {
    const j = scanLinkDestination(rest, i);
    if (j === null || j === i) return null;
    dest = rest.slice(i, j);
    i = j;
  }
  let title = null;
  const afterDestination = i;
  while (i < rest.length && (rest[i] === ' ' || rest[i] === '\t')) i++;
  const titleSeparated = i > afterDestination;
  if (i >= rest.length) {
    pos++;
    if (pos < lines.length && !isBlank(lines[pos])) { rest = lines[pos].replace(/^[ \t]*/, ''); i = 0; }
  }
  if (i < rest.length) {
    const open = rest.charCodeAt(i);
    const closer = open === 34 ? '"' : open === 39 ? "'" : open === 40 ? ')' : '';
    if (!closer || (pos === index && !titleSeparated)) return null;
    let body = '';
    let cursor = i + 1;
    let found = false;
    while (pos < lines.length) {
      const end = rest.indexOf(closer, cursor);
      if (end !== -1) {
        body += rest.slice(cursor, end);
        if (!/^[ \t]*$/.test(rest.slice(end + 1))) return null;
        i = end + 1;
        found = true;
        break;
      }
      body += rest.slice(cursor) + '\n';
      pos++;
      if (pos >= lines.length || isBlank(lines[pos])) return null;
      rest = lines[pos];
      cursor = 0;
    }
    if (!found) return null;
    title = body;
  }
  if (i < rest.length && !/^[ \t]*$/.test(rest.slice(i))) return null;
  return { label, dest: unescapeString(dest), title: title === null ? null : unescapeString(title), next: pos + 1 };
}

function parseReferenceTitle(rest, start, pos, lines) {
  const opener = rest.charCodeAt(start);
  const closer = opener === 34 ? '"' : opener === 39 ? "'" : opener === 40 ? ')' : '';
  if (!closer) return null;
  let body = '';
  let i = start + 1;
  while (true) {
    while (i < rest.length) {
      const c = rest.charCodeAt(i);
      if (c === 92 && i + 1 < rest.length && isAsciiPunctuation(rest.charCodeAt(i + 1))) {
        body += rest[i + 1];
        i += 2;
        continue;
      }
      if (rest[i] === closer) {
        return { title: body, end: i + 1, pos, rest };
      }
      if (opener === 40 && rest[i] === '(') return null;
      body += rest[i++];
    }
    body += '\n';
    pos++;
    if (pos >= lines.length || isBlank(lines[pos])) return null;
    rest = lines[pos];
    i = 0;
  }
}

function parseReferenceDefinition(lines, index) {
  let pos = index;
  let rest = lines[pos];
  const indent = leadingSpaces(rest);
  if (indent > 3) return null;
  rest = rest.slice(indent);
  if (rest.charCodeAt(0) !== 91) return null;
  let labelText = '';
  let i = 1;
  let closed = false;
  while (true) {
    while (i < rest.length) {
      const c = rest.charCodeAt(i);
      if (c === 93) { closed = true; i++; break; }
      if (c === 91) return null;
      if (c === 92 && i + 1 < rest.length && isAsciiPunctuation(rest.charCodeAt(i + 1))) {
        labelText += rest.slice(i, i + 2);
        i += 2;
        continue;
      }
      labelText += rest[i++];
    }
    if (closed) break;
    labelText += '\n';
    pos++;
    if (pos >= lines.length || isBlank(lines[pos]) || labelText.length > 999) return null;
    rest = lines[pos].replace(/^[ \t]*/, '');
    i = 0;
  }
  if (rest.charCodeAt(i) !== 58) return null;
  const label = normalizeLabel(labelText);
  if (!label || label.length > 999) return null;
  i++;
  while (i < rest.length && (rest[i] === ' ' || rest[i] === '\t')) i++;
  if (i >= rest.length) {
    pos++;
    if (pos >= lines.length || isBlank(lines[pos])) return null;
    rest = lines[pos].replace(/^[ \t]*/, '');
    i = 0;
  }
  let dest = '';
  if (rest.charCodeAt(i) === 60) {
    let j = i + 1;
    while (j < rest.length && rest[j] !== '>') {
      if (rest[j] === '<') return null;
      if (rest[j] === '\\' && j + 1 < rest.length && isAsciiPunctuation(rest.charCodeAt(j + 1))) j++;
      j++;
    }
    if (rest.charCodeAt(j) !== 62) return null;
    dest = rest.slice(i + 1, j);
    i = j + 1;
  } else {
    const j = scanLinkDestination(rest, i);
    if (j === null || j === i) return null;
    dest = rest.slice(i, j);
    i = j;
  }
  let separated = false;
  while (i < rest.length && (rest[i] === ' ' || rest[i] === '\t')) { separated = true; i++; }
  let result = null;
  if (i < rest.length) {
    if (!separated) return null;
    const c = rest.charCodeAt(i);
    if (c !== 34 && c !== 39 && c !== 40) return null;
    result = parseReferenceTitle(rest, i, pos, lines);
    if (!result) return null;
  } else if (pos + 1 < lines.length && !isBlank(lines[pos + 1])) {
    const candidate = lines[pos + 1].replace(/^[ \t]*/, '');
    const c = candidate.charCodeAt(0);
    if (c === 34 || c === 39 || c === 40) {
      result = parseReferenceTitle(candidate, 0, pos + 1, lines);
      if (result && !/^[ \t]*$/.test(result.rest.slice(result.end))) result = null;
    }
  }
  if (result) {
    if (!/^[ \t]*$/.test(result.rest.slice(result.end))) return null;
    pos = result.pos;
  }
  return { label, dest: unescapeString(dest), title: result ? unescapeString(result.title) : null, next: pos + 1 };
}

function parseLabelAt(source, index) {
  if (source.charCodeAt(index) !== 91) return null;
  let i = index + 1;
  let out = '';
  let count = 0;
  while (i < source.length && count <= 999) {
    const c = source.charCodeAt(i);
    if (c === 93) return { label: out, end: i + 1 };
    if (c === 91) return null;
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      out += source.slice(i, i + 2);
      i += 2;
      count++;
      continue;
    }
    out += source[i];
    i++;
    count++;
  }
  return null;
}

function scanLinkDestination(source, index) {
  let i = index;
  let depth = 0;
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      i += 2;
      continue;
    }
    if (c === 40) {
      depth++;
      if (depth > 32) return null;
    } else if (c === 41) {
      if (depth === 0) return i;
      depth--;
    } else if (c === 32 || c === 9 || c === 10 || c === 60) {
      return depth === 0 ? i : null;
    }
    i++;
  }
  return depth === 0 ? i : null;
}

function scanLinkTitle(source, index) {
  const open = source.charCodeAt(index);
  let close;
  if (open === 34) close = 34;
  else if (open === 39) close = 39;
  else if (open === 40) close = 41;
  else return null;
  let i = index + 1;
  let out = '';
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      out += source[i + 1];
      i += 2;
      continue;
    }
    if (c === close) return { title: out, end: i + 1 };
    if (open === 40 && c === 40) return null;
    out += source[i];
    i++;
  }
  return null;
}

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|') && !value.endsWith('\\|')) value = value.slice(0, -1);
  const cells = [];
  let current = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\' && i + 1 < value.length) {
      current += c + value[++i];
      continue;
    }
    if (c === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  cells.push(current.trim());
  return cells;
}

function matchTableDelimiter(line) {
  if (line.indexOf('|') === -1) return null;
  const cells = splitTableRow(line);
  if (cells.length < 1) return null;
  const align = [];
  for (const cell of cells) {
    if (!/^:?-+:?$/.test(cell)) return null;
    const left = cell.charCodeAt(0) === 58;
    const right = cell.charCodeAt(cell.length - 1) === 58;
    align.push(left && right ? 'center' : right ? 'right' : left ? 'left' : null);
  }
  return align;
}

function hasUnescapedPipe(line) {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\') i++;
    else if (line[i] === '|') return true;
  }
  return false;
}

function interruptsParagraph(line, anyOrderedStart) {
  if (isBlank(line)) return false;
  if (matchAtxHeading(line) || matchFence(line) || isThematicBreak(line)) return true;
  const rest = stripUpTo3Spaces(line);
  if (!rest) return false;
  if (rest.charCodeAt(0) === 62) return true;
  const marker = matchListMarker(line);
  if (marker && (!marker.ordered || marker.start === 1 || anyOrderedStart)) {
    const after = line.slice(marker.contentStart);
    if (!isBlank(after)) return true;
  }
  const html = htmlBlockStart(line, true);
  if (html) return true;
  return false;
}

function rawStripCodeIndent(line) {
  let col = 0;
  let idx = 0;
  while (idx < line.length && col < 4) {
    const ch = line.charCodeAt(idx);
    if (ch === 32) { col++; idx++; }
    else if (ch === 9) { col += 4 - (col % 4); idx++; }
    else break;
  }
  return line.slice(idx);
}

function parseBlocks(lines, refs, hasFinalNewline, rawLines, inListItem) {
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    if (isBlank(lines[i])) {
      i++;
      continue;
    }
    const def = parseReferenceDefinition(lines, i);
    if (def) {
      if (!refs.has(def.label)) refs.set(def.label, { href: def.dest, title: def.title });
      i = def.next;
      continue;
    }
    const fence = matchFence(lines[i]);
    if (fence) {
      const content = [];
      i++;
      while (i < lines.length && !isFenceClose(lines[i], fence)) {
        let line = rawLines && rawLines[i] != null ? rawLines[i] : lines[i];
        let strip = 0;
        while (strip < fence.indent && line.charCodeAt(strip) === 32) strip++;
        content.push(line.slice(strip));
        i++;
      }
      if (content.length && content[content.length - 1] === '') content.pop();
      if (i < lines.length) i++;
      nodes.push({ type: 'code', info: fence.info, text: content.length ? content.join('\n') + '\n' : '' });
      continue;
    }
    const htmlStart = htmlBlockStart(lines[i], false);
    if (htmlStart) {
      const content = [];
      let j = i;
      if (htmlStart.type === 6 || htmlStart.type === 7) {
        while (j < lines.length && !isBlank(lines[j])) { content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]); j++; }
      } else if (htmlStart.type === 1) {
        const end = '</' + htmlStart.endTag + '>';
        while (j < lines.length) {
          content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]);
          if (lines[j].toLowerCase().indexOf(end) !== -1) { j++; break; }
          j++;
        }
      } else if (htmlStart.type === 2) {
        while (j < lines.length) {
          content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]);
          if (lines[j].indexOf('-->') !== -1) { j++; break; }
          j++;
        }
      } else if (htmlStart.type === 3) {
        while (j < lines.length) {
          content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]);
          if (lines[j].indexOf('?>') !== -1) { j++; break; }
          j++;
        }
      } else if (htmlStart.type === 4) {
        while (j < lines.length) {
          content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]);
          if (lines[j].indexOf('>') !== -1) { j++; break; }
          j++;
        }
      } else {
        while (j < lines.length) {
          content.push(rawLines && rawLines[j] != null ? rawLines[j] : lines[j]);
          if (lines[j].indexOf(']]>') !== -1) { j++; break; }
          j++;
        }
      }
      nodes.push({ type: 'html', text: content.join('\n') + ((j < lines.length && lines[j].length > 0) || (j === lines.length && hasFinalNewline) ? '\n' : '') });
      i = j;
      continue;
    }
    const heading = matchAtxHeading(lines[i]);
    if (heading) {
      nodes.push({ type: 'heading', level: heading.level, text: heading.text });
      i++;
      continue;
    }
    if (isThematicBreak(lines[i])) {
      nodes.push({ type: 'hr' });
      i++;
      continue;
    }
    const quoteIndent = leadingSpaces(lines[i]);
    if (quoteIndent <= 3 && lines[i].charCodeAt(quoteIndent) === 62) {
      const quoteLines = [];
      let j = i;
      let quoteFence = null;
      while (j < lines.length) {
        const line = lines[j];
        const indent = leadingSpaces(line);
        if (indent <= 3 && line.charCodeAt(indent) === 62) {
          let content = line.slice(indent + 1);
          content = expandLeadingTabs(content, indent + 1);
          if (content.charCodeAt(0) === 32) content = content.slice(1);
          if (content === ' ' && quoteLines.length && !isBlank(quoteLines[quoteLines.length - 1])) {
            quoteLines[quoteLines.length - 1] += '\n ';
            j++;
            continue;
          }
          quoteLines.push(content);
          if (quoteFence && isFenceClose(content, quoteFence)) quoteFence = null;
          else if (!quoteFence) quoteFence = matchFence(content);
          j++;
          continue;
        }
        if (quoteFence) break;
        if (isBlank(line)) break;
        const previous = quoteLines[quoteLines.length - 1] || '';
        const lazyAllowed = !matchFence(previous) && leadingSpaces(previous) < 4 &&
          !htmlBlockStart(previous, false) && !matchAtxHeading(previous) && !isThematicBreak(previous) &&
          true;
        if (quoteLines.length && !isBlank(previous) && lazyAllowed && !interruptsParagraph(line)) {
          const continuation = line.replace(/^[ \t]+/, '');
          if (leadingSpaces(line) >= 4 && !matchSetext(line)) quoteLines[quoteLines.length - 1] += '\n' + continuation;
          else quoteLines.push(matchSetext(line) ? '    ' + line : continuation);
          j++;
          continue;
        }
        break;
      }
      nodes.push({ type: 'blockquote', children: parseBlocks(quoteLines, refs, undefined, undefined, inListItem) });
      i = j;
      continue;
    }
    const marker = matchListMarker(lines[i]);
    if (marker) {
      if (isThematicBreak(lines[i])) {
        nodes.push({ type: 'hr' });
        i++;
        continue;
      }
      const result = parseList(lines, i, marker, refs);
      nodes.push(result.node);
      i = result.next;
      continue;
    }
    const ind = leadingSpaces(lines[i]);
    if (ind >= 4) {
      const content = [];
      let j = i;
      while (j < lines.length && (isBlank(lines[j]) || leadingSpaces(lines[j]) >= 4)) {
        if (isBlank(lines[j])) content.push(lines[j].slice(4));
        else if (rawLines && rawLines[j] != null) content.push(rawStripCodeIndent(rawLines[j]));
        else content.push(lines[j].slice(4));
        j++;
      }
      while (content.length && isBlank(content[content.length - 1])) content.pop();
      nodes.push({ type: 'code', info: '', text: content.length ? content.join('\n') + '\n' : '' });
      i = j;
      continue;
    }
    if (i + 1 < lines.length) {
      const align = matchTableDelimiter(lines[i + 1]);
      if (align && align.length === splitTableRow(lines[i]).length && hasUnescapedPipe(lines[i])) {
        const header = splitTableRow(lines[i]);
        while (header.length < align.length) header.push('');
        header.length = align.length;
        const rows = [];
        let j = i + 2;
        while (j < lines.length && (!isBlank(lines[j]) || (rawLines && rawLines[j] != null && /^ *\t$/.test(rawLines[j])))) {
          if (interruptsParagraph(lines[j], inListItem)) break;
          const row = splitTableRow(lines[j]);
          while (row.length < align.length) row.push('');
          row.length = align.length;
          rows.push(row);
          j++;
        }
        nodes.push({ type: 'table', align, header, rows });
        i = j;
        continue;
      }
    }
    const paragraphLines = [];
    let setextLevel = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) break;
      if (paragraphLines.length) {
        const level = matchSetext(line);
        if (level) {
          setextLevel = level;
          i++;
          break;
        }
        if (interruptsParagraph(line, inListItem)) break;
      }
      paragraphLines.push(restoreTabs(line));
      i++;
    }
    if (setextLevel) {
      const headingText = paragraphLines.map(line => line.replace(/^[ \t]{0,3}/, '')).join('\n').replace(/[ \t]+$/, '');
      nodes.push({ type: 'heading', level: setextLevel, text: headingText });
    } else {
      nodes.push({ type: 'paragraph', text: paragraphLines.join('\n') });
    }
  }
  return nodes;
}

function sameListType(marker, base) {
  return marker.ordered === base.ordered && marker.bullet === base.bullet && marker.delimiter === base.delimiter;
}

function parseList(lines, startIndex, firstMarker, refs) {
  const items = [];
  let i = startIndex;
  let previousMarker = firstMarker;
  let loose = false;
  while (i < lines.length) {
    if (i !== startIndex && isThematicBreak(lines[i])) break;
    const marker = matchListMarker(lines[i]);
    if (!marker || !sameListType(marker, firstMarker) || (i !== startIndex && marker.indent >= previousMarker.contentIndent)) break;
    const itemLines = [];
    let j = i;
    let hadContent = false;
    let sawBlank = false;
    let innerBlank = false;
    let itemNestedList = false;
    let blankNested = false;
    let itemFence = null;
    while (j < lines.length) {
      const line = lines[j];
      if (isBlank(line)) {
        if (!hadContent) break;
        itemLines.push('');
        sawBlank = !itemFence;
        if (!itemFence) blankNested = itemNestedList;
        j++;
        continue;
      }
      if (j !== i) {
        if (isThematicBreak(line) && !(matchSetext(line) && itemLines.length && !isBlank(itemLines[itemLines.length - 1]))) break;
        const nextMarker = matchListMarker(line);
      if (nextMarker && nextMarker.indent < marker.contentIndent) {
          if (sameListType(nextMarker, firstMarker)) break;
          if (nextMarker.indent < marker.contentIndent) break;
        }
      }
      const indent = leadingSpaces(line);
      if (j === i) {
        let firstContent = line.slice(marker.contentStart);
        if (line.charCodeAt(marker.indent + marker.markerWidth) === 9) {
          firstContent = expandTabsColumn(firstContent, marker.indent + marker.markerWidth).slice(1);
        }
        itemLines.push(restoreTabs(firstContent));
        itemFence = matchFence(firstContent);
        if (itemFence) itemFence.inListItem = true;
        if (!isBlank(firstContent)) hadContent = true;
        j++;
        continue;
      }
      if (!hadContent) {
        if (indent < marker.contentIndent) break;
        const content = line.slice(marker.contentIndent);
        itemLines.push(restoreTabs(content));
        if (matchListMarker(content)) itemNestedList = true;
        itemFence = matchFence(content);
        if (itemFence) itemFence.inListItem = true;
        hadContent = true;
        sawBlank = false;
        j++;
        continue;
      }
      if (indent >= marker.contentIndent) {
        const nestedMarker = matchListMarker(line);
        if (nestedMarker && nestedMarker.indent >= marker.indent && nestedMarker.indent < marker.contentIndent) {
          if (sawBlank) break;
          itemLines.push(restoreTabs(line.slice(Math.min(indent, marker.contentIndent))));
          itemNestedList = true;
          j++;
          continue;
        }
        const content = line.slice(marker.contentIndent);
        itemLines.push(restoreTabs(content));
        if (matchListMarker(content)) itemNestedList = true;
        const fenceBefore = itemFence;
        if (itemFence) {
          if (isFenceClose(content, itemFence)) itemFence = null;
        } else {
          itemFence = matchFence(content);
          if (itemFence) itemFence.inListItem = true;
        }
        hadContent = true;
        if (sawBlank && !fenceBefore && ((indent === marker.contentIndent && !(blankNested && matchListMarker(content))) || (indent >= marker.contentIndent + 4 && !blankNested))) innerBlank = true;
        sawBlank = false;
        j++;
        continue;
      }
      if (sawBlank) break;
      if (!interruptsParagraph(line) && hadContent) {
        const continuation = restoreTabs(line.slice(Math.min(indent, marker.contentIndent)));
        itemLines[itemLines.length - 1] += '\n' + continuation;
        j++;
        continue;
      }
      break;
    }
    while (itemLines.length && isBlank(itemLines[itemLines.length - 1])) itemLines.pop();
    const children = parseBlocks(itemLines, refs, undefined, undefined, true);
    const hasMultiChild = children.some(child => child.length >= 2);
    items.push({ children });
    if (innerBlank) loose = true;
    if (sawBlank) {
      const next = j < lines.length ? matchListMarker(lines[j]) : null;
      if (next && next.indent < marker.contentIndent && sameListType(next, firstMarker)) loose = true;
    }
    previousMarker = marker;
    i = j;
    if (i < lines.length && isBlank(lines[i])) {
      let k = i;
      while (k < lines.length && isBlank(lines[k])) k++;
      const nextMarker2 = k < lines.length ? matchListMarker(lines[k]) : null;
      if (nextMarker2 && nextMarker2.indent < marker.contentIndent && sameListType(nextMarker2, firstMarker)) {
        loose = true;
        i = k;
      }
    }
  }
  if (items.length === 0) {
    return { node: { type: 'paragraph', text: '' }, next: startIndex + 1 };
  }
const tight = !loose;
  return { node: { type: 'list', ordered: firstMarker.ordered, start: firstMarker.start, tight, items }, next: i };
}

function renderBlocks(nodes, refs) {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'paragraph':
        out += '<p>' + renderInline(node.text, refs) + '</p>\n';
        break;
      case 'heading':
        out += '<h' + node.level + '>' + renderInline(node.text, refs) + '</h' + node.level + '>\n';
        break;
      case 'hr':
        out += '<hr>\n';
        break;
      case 'code': {
        const first = node.info ? unescapeString(node.info).split(/[ \t\n]+/)[0] : '';
        const cls = first ? ' class="language-' + escapeAttr(first) + '"' : '';
        out += '<pre><code' + cls + '>' + escapeHtml(node.text) + '</code></pre>\n';
        break;
      }
      case 'html':
        out += node.text;
        break;
      case 'blockquote':
        out += '<blockquote>\n' + renderBlocks(node.children, refs) + '</blockquote>\n';
        break;
      case 'list':
        out += renderList(node, refs);
        break;
      case 'table':
        out += renderTable(node, refs);
        break;
    }
  }
  return out;
}

function renderList(node, refs) {
  const tag = node.ordered ? 'ol' : 'ul';
  let out = '<' + tag + (node.ordered && node.start !== 1 ? ' start="' + node.start + '"' : '') + '>\n';
  for (const item of node.items) {
    out += renderListItem(item, node.tight, refs);
  }
  out += '</' + tag + '>\n';
  return out;
}

function renderListItem(item, tight, refs) {
  let task = null;
  let checked = false;
  if (item.children.length && item.children[0].type === 'paragraph') {
    const first = item.children[0];
    const m = /^\[([ xX])\](?:[ \t]+|$)/.exec(first.text);
    if (m) {
      task = true;
      checked = m[1] !== ' ';
      first.text = first.text.slice(m[0].length);
      first.task = true;
      first.checked = checked;
    }
  }
  const checkbox = task ? '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"> ' : '';
  if (tight) {
    let body = '';
    for (let k = 0; k < item.children.length; k++) {
      const child = item.children[k];
      if (child.type === 'paragraph') {
        body += checkbox + renderInline(child.text, refs);
        task = false;
      } else {
        body += renderBlocks([child], refs);
      }
    }
    return '<li>' + body + '</li>\n';
  }
  let body = '';
  for (let k = 0; k < item.children.length; k++) {
    const child = item.children[k];
    if (child.type === 'paragraph' && task) {
      body += '<p>' + checkbox + renderInline(child.text, refs) + '</p>\n';
      task = false;
    } else {
      body += renderBlocks([child], refs);
    }
  }
  return '<li>' + body + '</li>\n';
}

function renderTable(node, refs) {
  let out = '<table>\n<thead>\n<tr>\n';
  for (let i = 0; i < node.align.length; i++) {
    const align = node.align[i];
        out += '<th' + (align ? ' align="' + align + '"' : '') + '>' + renderInline(node.header[i].replace(/\\\|/g, '|'), refs) + '</th>\n';
  }
  out += '</tr>\n</thead>\n';
  if (node.rows.length) {
    out += '<tbody>';
    for (const row of node.rows) {
      out += '<tr>\n';
      for (let i = 0; i < node.align.length; i++) {
        const align = node.align[i];
        out += '<td' + (align ? ' align="' + align + '"' : '') + '>' + renderInline(row[i].replace(/\\\|/g, '|'), refs) + '</td>\n';
      }
      out += '</tr>\n';
    }
    out += '</tbody>';
  }
  out += '</table>\n';
  return out;
}

function findClosingBracket(source, openIndex) {
  let depth = 0;
  let i = openIndex;
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      i += 2;
      continue;
    }
    if (c === 96) {
      let run = 1;
      while (source.charCodeAt(i + run) === 96) run++;
      const close = findCodeSpanEnd(source, i + run, run);
      if (close !== -1 && (source.indexOf('\n', i) === -1 || source.indexOf('\n', i) > close)) {
        const afterClose = source.indexOf(']', close + run);
        const lineEnd = source.indexOf('\n', close + run);
        if (afterClose !== -1 && (lineEnd === -1 || afterClose < lineEnd)) {
          i = close + run;
          continue;
        }
      }
      i += run;
      continue;
    }
    if (c === 91) depth++;
    else if (c === 93) {
      depth--;
      if (depth === 0) return i;
    }
    else if (c === 60) {
      const auto = parseAngleAutolink(source, i);
      if (auto) { i = auto.end; continue; }
      const tag = scanHtmlTag(source, i, true);
      if (tag) { i = tag.end; continue; }
    }
    i++;
  }
  return -1;
}

function findCodeSpanEnd(source, start, run) {
  let i = start;
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (c === 96) {
      let n = 1;
      while (source.charCodeAt(i + n) === 96) n++;
      if (n === run) return i;
      i += n;
      continue;
    }
    i++;
  }
  return -1;
}

function scanInlineDestination(source, index) {
  let i = index;
  if (source.charCodeAt(i) === 60) {
    i++;
    const start = i;
    while (i < source.length && source[i] !== '>' && source[i] !== '<' && source[i] !== '\n') {
      if (source[i] === '\\' && i + 1 < source.length) i++;
      i++;
    }
    if (source.charCodeAt(i) !== 62) return null;
    return { dest: source.slice(start, i), end: i + 1 };
  }
  const start = i;
  let depth = 0;
  while (i < source.length) {
    const c = source.charCodeAt(i);
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      i += 2;
      continue;
    }
    if (c === 40) {
      depth++;
      if (depth > 32) return null;
    } else if (c === 41) {
      if (depth === 0) break;
      depth--;
    } else if (c === 32 || c === 9 || c === 10 || c === 60) {
      break;
    }
    i++;
  }
  if (depth !== 0 || i === start) return null;
  return { dest: source.slice(start, i), end: i };
}

function skipInlineSpace(source, index) {
  let i = index;
  while (i < source.length && (source[i] === ' ' || source[i] === '\t' || source[i] === '\n')) i++;
  return i;
}

function parseInlineLinkDestination(source, index) {
  let i = skipInlineSpace(source, index + 1);
  let dest = '';
  if (source.charCodeAt(i) !== 41) {
    const d = scanInlineDestination(source, i);
    if (!d) return null;
    dest = d.dest;
    i = d.end;
  }
  const afterDest = i;
  i = skipInlineSpace(source, i);
  let title = null;
  if (i < source.length && source.charCodeAt(i) !== 41) {
    if (i === afterDest) return null;
    const t = scanLinkTitle(source, i);
    if (!t) return null;
    title = t.title;
    i = skipInlineSpace(source, t.end);
  }
  if (source.charCodeAt(i) !== 41) return null;
  return { dest: unescapeString(dest), title: title === null ? null : unescapeString(title), end: i + 1 };
}

function tryParseLink(source, index, image, refs, allowLinks) {
  if (!image && !allowLinks) return null;
  const open = image ? index + 1 : index;
  if (source.charCodeAt(open) !== 91) return null;
  const close = findClosingBracket(source, open);
  if (close === -1) return null;
  const labelSource = source.slice(open + 1, close);
  let unclosedTicks = 0;
  for (let q = labelSource.indexOf('`'); q !== -1 && q < labelSource.length; q++) {
    const qc = labelSource.charCodeAt(q);
    if (qc === 92) { q++; continue; }
    if (qc === 96) {
      let run = 1;
      while (q + run < labelSource.length && labelSource.charCodeAt(q + run) === 96) run++;
      const tickClose = findCodeSpanEnd(labelSource, q + run, run);
      if (tickClose !== -1) { q = tickClose + run - 1; continue; }
      unclosedTicks++;
      q += run - 1;
    }
  }
  if (unclosedTicks === 1) return null;
  if (!image && containsLinkSyntax(labelSource, refs)) return null;
  let destination = null;
  let end = close + 1;
  if (source.charCodeAt(end) === 40) {
    destination = parseInlineLinkDestination(source, end);
    if (destination) end = destination.end;
  }
  if (!destination && source.charCodeAt(end) === 91) {
    const r = parseLabelAt(source, end);
    if (r) {
      const refLabel = r.label === '' ? labelSource : r.label;
      const ref = refs.get(normalizeLabel(refLabel));
      if (ref) {
        destination = { dest: ref.href, title: ref.title, end: r.end };
        end = r.end;
      }
    }
  }
  if (!destination && !(source.charCodeAt(end) === 91 && parseLabelAt(source, end))) {
    const ref = refs.get(normalizeLabel(labelSource));
    if (ref) destination = { dest: ref.href, title: ref.title };
  }
  if (!destination) return null;
  const inner = image ? '' : renderInline(labelSource, refs, false);
  if (image) {
    const alt = plainInline(labelSource, refs);
    return {
      end,
      html: '<img src="' + escapeAttr(cleanUrl(destination.dest)) + '" alt="' + escapeAttr(alt) + '"' +
        (destination.title !== null && destination.title !== undefined ? ' title="' + escapeAttr(destination.title) + '"' : '') + '>',
    };
  }
  return {
    end,
    html: '<a href="' + escapeAttr(cleanUrl(destination.dest)) + '"' +
      (destination.title !== null && destination.title !== undefined ? ' title="' + escapeAttr(destination.title) + '"' : '') + '>' +
      inner + '</a>',
  };
}

function containsLinkSyntax(source, refs) {
  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (c === 92) { i++; continue; }
    if (c === 33 && source.charCodeAt(i + 1) === 91) {
      const imageClose = findClosingBracket(source, i + 1);
      if (imageClose !== -1) {
        i = imageClose;
        if (source.charCodeAt(i + 1) === 40) {
          const imageDestination = parseInlineLinkDestination(source, i + 1);
          if (imageDestination) i = imageDestination.end - 1;
        } else if (source.charCodeAt(i + 1) === 91) {
          const imageReference = parseLabelAt(source, i + 1);
          if (imageReference) i = imageReference.end - 1;
        }
        continue;
      }
    }
    if (c === 91) {
      const close = findClosingBracket(source, i);
      if (close !== -1) {
        const label = source.slice(i + 1, close);
        let after = close + 1;
        if (source.charCodeAt(after) === 40) {
          if (parseInlineLinkDestination(source, after)) return true;
        } else if (source.charCodeAt(after) === 91) {
          const innerRef = parseLabelAt(source, after);
          if (innerRef) {
            const resolved = innerRef.label === '' ? label : innerRef.label;
            if (refs.has(normalizeLabel(resolved))) return true;
            i = innerRef.end - 1;
            continue;
          }
        }
        if (refs.has(normalizeLabel(label))) return true;
      }
    }
  }
  return false;
}

function plainInline(source, refs) {
  let out = '';
  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (c === 92 && i + 1 < source.length && isAsciiPunctuation(source.charCodeAt(i + 1))) {
      out += source[++i];
      continue;
    }
    if (c === 38) {
      const entity = decodeEntityAt(source, i);
      if (entity) {
        out += entity.value;
        i = entity.end - 1;
        continue;
      }
    }
    if (c === 96) {
      let run = 1;
      while (source.charCodeAt(i + run) === 96) run++;
      const close = findCodeSpanEnd(source, i + run, run);
      if (close !== -1) {
        let code = source.slice(i + run, close).replace(/\n/g, ' ');
        if (code.length > 1 && code[0] === ' ' && code[code.length - 1] === ' ' && /[^ ]/.test(code)) code = code.slice(1, -1);
        out += code;
        i = close + run - 1;
        continue;
      }
      out += '`'.repeat(run);
      i += run - 1;
      continue;
    }
    if (c === 42 || c === 95 || (c === 126 && source.charCodeAt(i + 1) === 126)) {
      continue;
    }
    if (c === 33 && source.charCodeAt(i + 1) === 91) {
      const image = tryParseLink(source, i, true, refs, true);
      if (image) {
        const m = /alt="([\s\S]*?)"/.exec(image.html);
        if (m) out += m[1];
        i = image.end - 1;
        continue;
      }
    }
    if (c === 91) {
      const link = tryParseLink(source, i, false, refs, true);
      if (link) {
        const open = source.indexOf(']', i);
        if (open !== -1) {
          out += plainInline(source.slice(i + 1, open), refs);
          i = link.end - 1;
          continue;
        }
      }
    }
    if (c === 10) {
      out += '\n';
      continue;
    }
    out += source[i];
  }
  return out;
}

function trimAutoUrl(value) {
  let end = value.length;
  while (end > 0) {
    const ch = value[end - 1];
    if ('?!.,:*_~'.indexOf(ch) !== -1) {
      end--;
      continue;
    }
    if (ch === ')' && (value.slice(0, end).split(')').length > value.slice(0, end).split('(').length)) {
      end--;
      continue;
    }
    if (ch === ';') {
      let j = end - 2;
      while (j >= 0 && /[A-Za-z0-9#]/.test(value[j])) j--;
      if (j >= 0 && value[j] === '&' && end - j > 2) {
        end = j;
        continue;
      }
      end--;
      continue;
    }
    break;
  }
  return value.slice(0, end);
}

const EMAIL_SCAN_RE = /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9])?)+/iy;
const EMAIL_SCAN_RE_MAILTO = /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+/iy;
const XMPP_SCAN_RE = /xmpp:[^\s<>/]+(?:\/[^\s<>/]*)?/iy;
const HTTP_SCAN_RE = /https?:\/\/[^\s<>]+/iy;
const WWW_SCAN_RE = /www\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+[^\s<>]*/y;

function scanExtendedAutolink(source, index, insideUnderscore) {
  if (index > 0) {
    const bc = source.charCodeAt(index - 1);
    if ((bc >= 48 && bc <= 57) || (bc >= 65 && bc <= 90) || (bc >= 97 && bc <= 122) || bc === 95) return null;
  }
  let match;
  if (source.slice(index, index + 7).toLowerCase() === 'mailto:') {
    EMAIL_SCAN_RE_MAILTO.lastIndex = index + 7;
    match = EMAIL_SCAN_RE_MAILTO.exec(source);
    if (match && !/[-_]$/.test(match[0]) && !/[-_]/.test(source[index + 7 + match[0].length] || '')) {
      const raw = 'mailto:' + match[0];
      return { end: index + raw.length, display: raw, href: raw };
    }
    return null;
  }
  if (source.slice(index, index + 5).toLowerCase() === 'xmpp:') {
    XMPP_SCAN_RE.lastIndex = index;
    match = XMPP_SCAN_RE.exec(source);
    if (match) {
      const raw = trimAutoUrl(match[0]);
      return { end: index + raw.length, display: raw, href: raw };
    }
    return null;
  }
  HTTP_SCAN_RE.lastIndex = index;
  match = HTTP_SCAN_RE.exec(source);
  if (match) {
    const raw = trimAutoUrl(match[0]);
    if (raw.length <= 7) return null;
    return { end: index + raw.length, display: raw, href: raw };
  }
  if (source.startsWith('www.', index)) {
    WWW_SCAN_RE.lastIndex = index;
    match = WWW_SCAN_RE.exec(source);
    if (match) {
      const raw = trimAutoUrl(match[0]);
      return { end: index + raw.length, display: raw, href: 'http://' + raw };
    }
  }
  {
    EMAIL_SCAN_RE.lastIndex = index;
    match = EMAIL_SCAN_RE.exec(source);
    if (match) {
      const raw = trimAutoUrl(match[0]);
      const after = source[index + raw.length] || '';
      if (/[-_]/.test(after) && !(insideUnderscore && after === '_')) return null;
      return { end: index + raw.length, display: raw, href: 'mailto:' + raw };
    }
  }
  EMAIL_SCAN_RE_MAILTO.lastIndex = index;
  match = EMAIL_SCAN_RE_MAILTO.exec(source);
  if (match) {
    const raw = trimAutoUrl(match[0]);
    if (/[-_]/.test(source[index + raw.length] || '')) return null;
    return { end: index + raw.length, display: raw, href: 'mailto:' + raw };
  }
  return null;
}

function parseAngleAutolink(source, index) {
  const close = source.indexOf('>', index + 1);
  if (close === -1) return null;
  const body = source.slice(index + 1, close);
  if (!body || /[\s<]/.test(body)) return null;
  if (/^[A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*$/.test(body)) {
    return { end: close + 1, href: body, display: body };
  }
  if (/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(body)) {
    return { end: close + 1, href: 'mailto:' + body, display: body };
  }
  return null;
}

const DISALLOWED_HTML = new Set(['title', 'textarea', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'script']);

function inlineHtmlAt(source, index) {
  const tag = scanHtmlTag(source, index, true);
  if (!tag) return null;
  const raw = source.slice(index, tag.end);
  let name = tag.name;
  if (raw.charCodeAt(1) === 47) name = raw.slice(2, -1).trim().toLowerCase();
  if (DISALLOWED_HTML.has(name)) return { end: tag.end, html: raw };
  return { end: tag.end, html: raw };
}

function pushText(tokens, value) {
  if (!value) return;
  const last = tokens[tokens.length - 1];
  if (last && last.type === 'text') last.value += value;
  else tokens.push({ type: 'text', value });
}

function delimiterFlanking(source, start, end) {
  const before = start > 0 ? source.charCodeAt(start - 1) : 10;
  const after = end < source.length ? source.charCodeAt(end) : 10;
  const beforeWhite = isWhiteSpace(before);
  const afterWhite = isWhiteSpace(after);
  const beforePunct = !beforeWhite && isPunctuationCode(before);
  const afterPunct = !afterWhite && isPunctuationCode(after);
  const left = !afterWhite && (!afterPunct || beforeWhite || beforePunct);
  const right = !beforeWhite && (!beforePunct || afterWhite || afterPunct);
  return { left, right, beforePunct, afterPunct };
}

function tokenizeInline(source, refs, allowLinks) {
  const tokens = [];
  let i = 0;
  let underscoreDepth = 0;
  const n = source.length;
  while (i < n) {
    const c = source.charCodeAt(i);
    if (c === 92) {
      if (source.charCodeAt(i + 1) === 10) {
        tokens.push({ type: 'raw', html: '<br>' });
        i += 2;
        let spaces = 0;
        while (source.charCodeAt(i) === 32) { i++; }
        continue;
      }
      if (i + 1 < n && isAsciiPunctuation(source.charCodeAt(i + 1))) {
        pushText(tokens, source[i + 1]);
        i += 2;
        continue;
      }
      pushText(tokens, '\\');
      i++;
      continue;
    }
    if (c === 96) {
      let run = 1;
      while (i + run < n && source.charCodeAt(i + run) === 96) run++;
      const close = findCodeSpanEnd(source, i + run, run);
      if (close !== -1) {
        let code = source.slice(i + run, close).replace(/\n/g, ' ');
        if (code.length > 1 && code.charCodeAt(0) === 32 && code.charCodeAt(code.length - 1) === 32 && /[^ ]/.test(code)) {
          code = code.slice(1, -1);
        }
        tokens.push({ type: 'raw', html: '<code>' + escapeHtml(code) + '</code>' });
        i = close + run;
        continue;
      }
      pushText(tokens, '`'.repeat(run));
      i += run;
      continue;
    }
    if (c === 38) {
      const entity = decodeEntityAt(source, i);
      if (entity) {
        if (entity.named) tokens.push({ type: 'raw', html: entity.value });
        else pushText(tokens, entity.value);
        i = entity.end;
      } else {
        pushText(tokens, '&');
        i++;
      }
      continue;
    }
    if (c === 60) {
      const auto = parseAngleAutolink(source, i);
      if (auto) {
        tokens.push({ type: 'raw', html: '<a href="' + escapeAttr(cleanAngleUrl(auto.href)) + '">' + escapeHtml(auto.display) + '</a>' });
        i = auto.end;
        continue;
      }
      const html = inlineHtmlAt(source, i);
      if (html) {
        tokens.push({ type: 'raw', html: html.html });
        i = html.end;
        continue;
      }
      pushText(tokens, '<');
      i++;
      continue;
    }
    if (c === 33 && source.charCodeAt(i + 1) === 91) {
      const link = tryParseLink(source, i, true, refs, allowLinks);
      if (link) {
        tokens.push({ type: 'raw', html: link.html });
        i = link.end;
        continue;
      }
      pushText(tokens, '!');
      i++;
      continue;
    }
    if (c === 91) {
      const link = tryParseLink(source, i, false, refs, allowLinks);
      if (link) {
        tokens.push({ type: 'raw', html: link.html });
        i = link.end;
        continue;
      }
      pushText(tokens, '[');
      i++;
      continue;
    }
    if (c === 42 || c === 95 || c === 126) {
      let run = 1;
      while (i + run < n && source.charCodeAt(i + run) === c) run++;
      const flank = delimiterFlanking(source, i, i + run);
      let canOpen = flank.left;
      let canClose = flank.right;
      if (c === 95) {
        canOpen = flank.left && (!flank.right || flank.beforePunct);
        canClose = flank.right && (!flank.left || flank.afterPunct);
      }
      if (c === 126 && run > 2) {
        pushText(tokens, '~'.repeat(run));
      } else {
        tokens.push({ type: 'delim', char: c, count: run, canOpen, canClose });
        if (c === 95) {
          if (canClose && underscoreDepth > 0) underscoreDepth--;
          else if (canOpen) underscoreDepth++;
        }
      }
      i += run;
      continue;
    }
    if (c === 10) {
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'text') {
        const m = /[ ]+$/.exec(last.value);
        if (m && m[0].length >= 2) {
          last.value = last.value.slice(0, -m[0].length);
          tokens.push({ type: 'raw', html: '<br>' });
          i++;
          let spaces = 0;
          while (source.charCodeAt(i) === 32) { i++; }
          continue;
        }
      }
      pushText(tokens, '\n');
      i++;
      continue;
    }
    let j = i + 1;
    while (j < n) {
      const d = source.charCodeAt(j);
      if (d === 92 || d === 96 || d === 38 || d === 60 || d === 91 || d === 33 || d === 42 || d === 95 || d === 126 || d === 10) break;
      j++;
    }
    let candidate = -1;
    let auto = null;
    for (let k = allowLinks ? i : j; k < j; k++) {
      if (k > 0) {
        const bc = source.charCodeAt(k - 1);
        if ((bc >= 48 && bc <= 57) || (bc >= 65 && bc <= 90) || (bc >= 97 && bc <= 122) || bc === 95) continue;
      }
      const ch = source.charCodeAt(k);
      if (!((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122))) continue;
      const found = scanExtendedAutolink(source, k, underscoreDepth > 0);
      if (found) { candidate = k; auto = found; break; }
    }
    if (candidate !== -1) {
      if (candidate > i) pushText(tokens, source.slice(i, candidate));
      tokens.push({ type: 'raw', html: '<a href="' + escapeAttr(cleanUrl(auto.href)) + '">' + escapeHtml(auto.display) + '</a>' });
      i = auto.end;
      continue;
    }
    pushText(tokens, source.slice(i, j));
    i = j;
  }
  return tokens;
}

function ruleOfThree(opener, closer) {
  if (!(opener.canClose || closer.canOpen)) return true;
  if ((opener.count + closer.count) % 3 !== 0) return true;
  return opener.count % 3 === 0 && closer.count % 3 === 0;
}

function processEmphasis(tokens) {
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 10000) {
    changed = false;
    for (let closeIndex = 0; closeIndex < tokens.length; closeIndex++) {
      const closer = tokens[closeIndex];
      if (!closer || closer.type !== 'delim' || !closer.canClose || closer.count === 0) continue;
      let openIndex = -1;
      for (let k = closeIndex - 1; k >= 0; k--) {
        const opener = tokens[k];
        if (!opener || opener.type !== 'delim' || opener.char !== closer.char || !opener.canOpen || opener.count === 0) continue;
        if (!ruleOfThree(opener, closer)) continue;
        openIndex = k;
        break;
      }
      if (openIndex === -1) continue;
      const opener = tokens[openIndex];
      let use;
      let tag;
      let closeTag;
      if (closer.char === 126) {
        use = opener.count >= 2 && closer.count >= 2 ? 2 : 1;
        tag = '<del>';
        closeTag = '</del>';
      } else if (opener.count >= 2 && closer.count >= 2) {
        use = 2;
        tag = '<strong>';
        closeTag = '</strong>';
      } else {
        use = 1;
        tag = '<em>';
        closeTag = '</em>';
      }
      opener.count -= use;
      closer.count -= use;
      const inner = tokens.slice(openIndex + 1, closeIndex);
      const replacement = [];
      if (opener.count > 0) replacement.push({ type: 'delim', char: opener.char, count: opener.count, canOpen: opener.canOpen, canClose: opener.canClose });
      replacement.push({ type: 'raw', html: tag + renderTokens(inner) + closeTag });
      if (closer.count > 0) replacement.push({ type: 'delim', char: closer.char, count: closer.count, canOpen: closer.canOpen, canClose: closer.canClose });
      tokens.splice(openIndex, closeIndex - openIndex + 1, ...replacement);
      changed = true;
      break;
    }
  }
  return tokens;
}

function renderTokens(tokens) {
  let out = '';
  for (const token of tokens) {
    if (token.type === 'text') out += escapeHtmlText(token.value);
    else if (token.type === 'raw') out += token.html;
    else if (token.type === 'delim') out += token.char === 42 ? '*'.repeat(token.count) : token.char === 95 ? '_'.repeat(token.count) : '~'.repeat(token.count);
  }
  return out;
}

function escapeHtmlText(value) {
  let out = '';
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    let replacement = c === 38 ? '&amp;' : c === 60 ? '&lt;' : c === 62 ? '&gt;' : c === 34 ? '&quot;' : c === 39 ? '&#39;' : null;
    if (replacement !== null) {
      if (i > start) out += value.slice(start, i);
      out += replacement;
      start = i + 1;
    }
  }
  return start === 0 ? value : out + value.slice(start);
}

function renderInline(source, refs, allowLinks = true) {
  const tokens = tokenizeInline(source, refs, allowLinks);
  processEmphasis(tokens);
  return renderTokens(tokens);
}

export function parse(markdown) {
  let source = String(markdown).replace(/\r\n?/g, '\n');
  source = source.replace(/\u0000/g, '\ufffd');
  const hasFinalNewline = source.endsWith('\n');
  const rawLines = source.split('\n');
  const lines = rawLines.map(expandTabs);
  if (lines.length && lines[lines.length - 1] === '' && source.endsWith('\n')) { lines.pop(); rawLines.pop(); }
  const refs = new Map();
  const nodes = parseBlocks(lines, refs, hasFinalNewline, rawLines);
  return renderBlocks(nodes, refs);
}

