export function beforeW20261016_019Styles(css) {
  const start = '\n/* W-20261016-019 Analog Way screen-to-model design guide. */';
  const end = '/* W-20261016-019 guide end. */';
  const startIndex = css.indexOf(start);
  const endIndex = css.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) throw new Error('W-019 guide style boundary changed');
  return css.slice(0, startIndex) + css.slice(endIndex + end.length);
}
