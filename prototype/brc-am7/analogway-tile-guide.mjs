// Resource guide for a non-overlapping wall of identical 3840×2160@60 tiles.
// The existing evaluator accepts at most four outputs per logical Screen.
// Grouping tiles here does not establish a seamless single-Screen configuration.
export const TILE_REFERENCE = Object.freeze([
  [1,1],[2,1],[3,1],[2,2],[3,2],[4,2],[3,3],[3,4],[4,4],
]);
export const TILE_LAYER_INPUT_MAX = 8;
export const TILE_SCREEN_INPUT_MAX = 8;

export function buildTileScreens(columns, rows, layers) {
  const screens = [];
  if (columns === 1 || rows === 1) {
    let remaining = columns * rows;
    while (remaining > 0) {
      const outputs = Math.min(4, remaining);
      screens.push({outputs,layerType:'mixing',layers});
      remaining -= outputs;
    }
  } else {
    for (let y = 0; y < rows; y += 2) {
      for (let x = 0; x < columns; x += 2) {
        screens.push({outputs:Math.min(2, columns-x) * Math.min(2, rows-y), layerType:'mixing', layers});
      }
    }
  }
  return screens;
}

export function prepareTileGuide({columns, rows, layers, auxOutputs = 0, inputs4k = 1, wallLayers = false}, evaluator) {
  if (![columns,rows,auxOutputs,inputs4k].every(Number.isInteger) ||
      columns < 1 || columns > 6 || rows < 1 || rows > 6 ||
      auxOutputs < 0 || inputs4k < 0) {
    return {status:'invalid', reason:'가로·세로는 각각 1~6판의 정수로 입력해 주세요.'};
  }
  const screens = buildTileScreens(columns, rows, layers);
  if (screens.length > TILE_SCREEN_INPUT_MAX) {
    return {status:'invalid', reason:`출력 그룹 ${screens.length}개가 평가 가능한 화면 수 한도 ${TILE_SCREEN_INPUT_MAX}개를 넘습니다.`};
  }
  const layerLimit = (wallLayers ? screens.length : 1) * TILE_LAYER_INPUT_MAX;
  if (!Number.isInteger(layers) || layers < 0 || layers > layerLimit) {
    return {status:'invalid', reason:wallLayers
      ? `벽 전체 PIP 창 수는 0~${layerLimit}개의 정수로 입력해 주세요.`
      : '그룹당 믹싱 레이어는 0~8개의 정수로 입력해 주세요.'};
  }
  if (wallLayers) {
    const perGroup = Math.floor(layers/screens.length);
    const remainder = layers % screens.length;
    screens.forEach((screen,index)=>{screen.layers=perGroup+(index<remainder?1:0);});
  }
  const input = {screens,auxOutputs,inputs4k};
  const outputs = columns * rows;
  const outputLinks = outputs * 2;
  return {
    status:'calculated', columns,rows,layers,wallLayers,
    width:columns * 3840,height:rows * 2160,outputs,outputLinks,
    requiredVpu:Math.ceil(outputLinks / 8),
    input,result:evaluator(input),
  };
}

// Read the wall-wide simultaneous mixing count from each passing evaluator result.
// A split layer uses half a mixing layer's source links (Aquilon manual p. 66).
// Distinguish a 2× conversion from a directly possible split configuration.
export function calculateTileLayerMaximums(tile, evaluator) {
  const maximums = new Map();
  if (tile?.status !== 'calculated') return maximums;
  const {columns, rows} = tile;
  const {auxOutputs, inputs4k} = tile.input;
  const layerLimit = (tile.wallLayers ? tile.input.screens.length : 1) * TILE_LAYER_INPUT_MAX;
  for (let layers = 0; layers <= layerLimit; layers++) {
    const trial = prepareTileGuide({columns, rows, layers, auxOutputs, inputs4k, wallLayers:tile.wallLayers}, evaluator);
    if (trial.status !== 'calculated' || !trial.result.valid) continue;
    for (const model of trial.result.models) {
      if (!model.possible || !model.platform?.startsWith('aquilon')) continue;
      const mixing = model.used.layers;
      maximums.set(model.slug, {
        mixing,
        split: mixing * 2,
        ...(tile.wallLayers ? {} : {perGroupMixing: layers}),
        wallLayers:tile.wallLayers,
        atInputCeiling: layers === layerLimit,
      });
    }
  }
  for (const [slug, maximum] of maximums) {
    if (!tile.wallLayers) {
      maximum.splitDirectEvaluation = maximum.perGroupMixing * 2 > layerLimit ? 'out-of-range' : 'within-input';
      maximum.splitConvertedBeyondEvaluator = maximum.splitDirectEvaluation === 'out-of-range';
      continue;
    }
    const splitInputLayers = maximum.split;
    if (splitInputLayers > layerLimit) {
      maximum.splitDirectEvaluation = 'out-of-range';
    } else {
      // Split layers consume resources in pairs: distribute whole pairs, not odd layers.
      const groupCount = tile.input.screens.length;
      const pairsPerGroup = Math.floor(maximum.mixing / groupCount);
      const extraPairs = maximum.mixing % groupCount;
      const splitScreens = tile.input.screens.map((screen,index) => ({...screen,
        layerType:'split',layers:2*(pairsPerGroup+(index<extraPairs?1:0))}));
      const splitResult = evaluator({screens:splitScreens,auxOutputs,inputs4k});
      maximum.splitDirectEvaluation = splitResult.models.find(model => model.slug === slug)?.possible ? 'possible' : 'not-possible';
    }
    maximum.splitConvertedBeyondEvaluator = maximum.splitDirectEvaluation !== 'possible';
  }
  return maximums;
}

export function formatTileLayerMaximum(maximum) {
  const splitLabel = maximum.splitDirectEvaluation === 'not-possible'
    ? `분할 ${maximum.split}개 환산(동일 창 배분 직접 평가 불가)`
    : maximum.atInputCeiling ? `분할 ${maximum.split}개까지 확인` : `분할 최대 ${maximum.split}개`;
  if (maximum.atInputCeiling) {
    return `4K60 믹싱 ${maximum.mixing}개까지 확인(평가 입력 상한) · ${splitLabel} — 실제 한도는 이보다 클 수 있습니다`;
  }
  return `4K60 믹싱 최대 ${maximum.mixing}개 · ${splitLabel}`;
}
