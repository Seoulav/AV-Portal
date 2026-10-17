// Resource guide for a non-overlapping wall of identical 3840×2160@60 tiles.
// The existing evaluator accepts at most four outputs per logical Screen.
// Grouping tiles here does not establish a seamless single-Screen configuration.
export const TILE_REFERENCE = Object.freeze([
  [1,1],[2,1],[3,1],[2,2],[3,2],[4,2],[3,3],[3,4],[4,4],
]);
export const TILE_LAYER_INPUT_MAX = 8;

export function prepareTileGuide({columns, rows, layers, auxOutputs = 0, inputs4k = 1}, evaluator) {
  if (![columns,rows,layers,auxOutputs,inputs4k].every(Number.isInteger) ||
      columns < 1 || columns > 4 || rows < 1 || rows > 4 ||
      layers < 0 || layers > TILE_LAYER_INPUT_MAX || auxOutputs < 0 || inputs4k < 0) {
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

// Read the wall-wide simultaneous mixing count from each passing evaluator result.
// A split layer uses half a mixing layer's source links (Aquilon manual p. 66);
// beyond the per-group input limit, 2× is a conversion, not a direct evaluation.
export function calculateTileLayerMaximums(tile, evaluator) {
  const maximums = new Map();
  if (tile?.status !== 'calculated') return maximums;
  const {columns, rows} = tile;
  const {auxOutputs, inputs4k} = tile.input;
  for (let layers = 0; layers <= TILE_LAYER_INPUT_MAX; layers++) {
    const trial = prepareTileGuide({columns, rows, layers, auxOutputs, inputs4k}, evaluator);
    for (const model of trial.result.models) {
      if (!model.possible || !model.platform?.startsWith('aquilon')) continue;
      const mixing = model.used.layers;
      maximums.set(model.slug, {
        mixing,
        split: mixing * 2,
        perGroupMixing: layers,
        atInputCeiling: layers === TILE_LAYER_INPUT_MAX,
        splitConvertedBeyondEvaluator: layers * 2 > TILE_LAYER_INPUT_MAX,
      });
    }
  }
  return maximums;
}

export function formatTileLayerMaximum(maximum) {
  if (maximum.atInputCeiling) {
    return `4K60 믹싱 ${maximum.mixing}개까지 확인(평가 입력 상한) · 분할 ${maximum.split}개까지 확인 — 실제 한도는 이보다 클 수 있습니다`;
  }
  return `4K60 믹싱 최대 ${maximum.mixing}개 · 분할 최대 ${maximum.split}개`;
}
