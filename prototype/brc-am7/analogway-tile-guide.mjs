// Resource guide for a non-overlapping wall of identical 3840×2160@60 tiles.
// The existing evaluator accepts at most four outputs per logical Screen.
// Grouping tiles here does not establish a seamless single-Screen configuration.
export const TILE_REFERENCE = Object.freeze([
  [1,1],[2,1],[3,1],[2,2],[3,2],[4,2],[3,3],[3,4],[4,4],
]);

export function prepareTileGuide({columns, rows, layers, auxOutputs = 0, inputs4k = 1}, evaluator) {
  if (![columns,rows,layers,auxOutputs,inputs4k].every(Number.isInteger) ||
      columns < 1 || columns > 4 || rows < 1 || rows > 4 ||
      layers < 0 || layers > 8 || auxOutputs < 0 || inputs4k < 0) {
    return {status:'invalid', reason:'가로·세로는 각각 1~4판, 믹싱 레이어는 0~8개의 정수로 입력해 주세요.'};
  }
  const screens = [];
  if (columns === 1 || rows === 1) {
    screens.push({outputs:columns*rows,layerType:'mixing',layers});
  } else {
    for (let y = 0; y < rows; y += 2) {
      for (let x = 0; x < columns; x += 2) {
        screens.push({outputs:Math.min(2, columns-x) * Math.min(2, rows-y), layerType:'mixing', layers});
      }
    }
  }
  const input = {screens,auxOutputs,inputs4k};
  const outputs = columns * rows;
  const outputLinks = outputs * 2;
  return {
    status:'calculated', columns,rows,layers,
    width:columns * 3840,height:rows * 2160,outputs,outputLinks,
    requiredVpu:Math.ceil(outputLinks / 8),
    input,result:evaluator(input),
  };
}
