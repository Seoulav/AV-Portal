// A documented format is converted before the W-019, 4K60-only evaluator runs.
// Do not infer an arbitrary pixel dimension or an HD/4K mixed-resource cost.
import {prepareTileGuide} from './analogway-tile-guide.mjs';
const documentedFormats = new Map([
  ['1920x1080@60', [1, 1, '1', '1080p60 출력 1개']],
  ['2560x1600@60', [1, 1, '1', '출력 1개']],
  ['3840x2160@60', [1, 2, '1', '4K60 출력 1개']],
  ['7680x2160@60', [2, 2, '2x1', '4K60 출력 2개']],
  ['5760x1080@60', [3, 1, '3', '1080p60 출력 3개']],
  ['7680x1080@60', [4, 1, '4', '1080p60 출력 4개']],
  ['7680x4320@60', [4, 2, '2x2', '4K60 출력 4개']],
  ['5120x2880@60', [1, 4, '1', '단일 용량 4 출력']],
  ['7680x4320@30', [1, 4, '1', '단일 용량 4 출력']],
]);

export function deriveScreenFormat(width, height, refresh = 60) {
  const key = `${width}x${height}@${refresh}`;
  const documented = documentedFormats.get(key);
  if (!documented) return {confirmed:false, reason:'공식 자료 미확인 · 이 화면 크기와 주사율의 출력 배치·용량을 확정할 수 없습니다.'};
  const [outputs,capacity,layout,description] = documented;
  return {confirmed:true, outputs, capacity, layout, label:`${width}×${height}@${refresh} · ${description}`};
}

export function prepareGuideInput(state, evaluator) {
  if (!state || !Array.isArray(state.screens) || state.screens.length === 0) {
    return {status:'unconfirmed', reason:'공식 자료 미확인 · 화면 입력을 확인해 주세요.', result:null, derivedScreens:[]};
  }
  if (state.screens.some(screen => screen.inputMode === 'tiles')) {
    if (state.screens.length !== 1 || state.screens[0].inputMode !== 'tiles') {
      return {status:'unconfirmed', reason:'타일 입력은 화면 하나씩 선택해 주세요.', result:null, derivedScreens:[]};
    }
    const screen = state.screens[0];
    const tile = prepareTileGuide({columns:Number(screen.tileColumns), rows:Number(screen.tileRows),
      layers:Number(screen.layers), auxOutputs:Number(state.auxOutputs), inputs4k:Number(state.inputs4k), wallLayers:true}, evaluator);
    if (tile.status !== 'calculated') return {status:'unconfirmed',reason:tile.reason,result:null,derivedScreens:[]};
    return {status:'calculated',tile,input:tile.input,result:tile.result,
      derivedScreens:[{confirmed:true,outputs:tile.outputs,capacity:2,layout:`${tile.columns}x${tile.rows}`,
        label:`${tile.columns}×${tile.rows} · ${tile.width}×${tile.height}@60 · 4K60 출력 ${tile.outputs}개`}]};
  }
  const derivedScreens = state.screens.map(screen => {
    if (screen.inputMode === 'resolution') return deriveScreenFormat(Number(screen.width), Number(screen.height), Number(screen.refresh));
    return {confirmed:true, outputs:Number(screen.outputs), capacity:2, layout:screen.layout, label:`4K60 출력 ${screen.outputs}개`};
  });
  if (state.screens.some(screen => !Number.isInteger(Number(screen.hdLayers)) || Number(screen.hdLayers) < 0)) {
    return {status:'unconfirmed', reason:'입력 오류 · HD 레이어 수는 0 이상의 정수로 입력해 주세요.', result:null, derivedScreens};
  }
  const unknown = derivedScreens.find(format => !format.confirmed);
  if (unknown) return {status:'unconfirmed', reason:unknown.reason, result:null, derivedScreens};
  if (derivedScreens.some(format => format.capacity === 4)) {
    return {status:'unconfirmed', reason:'미확인 · 용량 4 출력의 모델별 레이어 비용은 이 4K60 계산에 포함되지 않습니다. 제조사 시뮬레이터로 확인하세요.', result:null, derivedScreens};
  }
  if (state.screens.some(screen => Number(screen.hdLayers) > 0) || derivedScreens.some(format => format.capacity === 1)) {
    const mixed = state.screens.some(screen => Number(screen.hdLayers) > 0 && Number(screen.layers) > 0) ||
      state.screens.some((screen,index) => derivedScreens[index].capacity === 1 && Number(screen.layers) > 0);
    const detail = mixed ? 'HD(용량 1)와 4K(용량 2) 레이어의 혼합 비용' : 'HD 출력·레이어의 모델별 배분';
    return {status:'unconfirmed', reason:`미확인 · Aquilon에 한해 용량 1에서 VPU당 HD 믹싱 8개(또는 분할 8쌍)를 지원합니다(출력 링크 4개 이하 영역 기준). ${detail}은 이 4K60 계산으로 판정하지 않습니다(매뉴얼 66·69쪽, 시뮬레이터 실측 2026-10-17). 제조사 시뮬레이터로 확인하세요.`, result:null, derivedScreens};
  }
  const input = {
    screens:state.screens.map((screen,index) => ({outputs:derivedScreens[index].outputs, layerType:screen.layerType, layers:Number(screen.layers)})),
    auxOutputs:Number(state.auxOutputs),
    inputs4k:Number(state.inputs4k),
  };
  return {status:'calculated', input, result:evaluator(input), derivedScreens};
}

export function buildGuideExportText(state, prepared) {
  const lines = ['Analog Way 화면·레이어 설계 가이드', '구성'];
  state.screens.forEach((screen,index) => {
    const format = prepared.derivedScreens[index];
    const hdLayers = Number(screen.hdLayers);
    const hdLabel = Number.isInteger(hdLayers) && hdLayers >= 0 ? `HD 레이어 ${hdLayers}개` : 'HD 레이어 입력 오류';
    lines.push(`화면 ${index + 1}: ${format?.label ?? '미확인'} · ${screen.inputMode === 'tiles' ? '믹싱' : screen.layerType === 'split' ? '분할' : '믹싱'} 4K 레이어 ${screen.layers}개${screen.inputMode === 'tiles' ? ' · 벽 전체 PIP 창' : ''} · ${hdLabel}`);
  });
  lines.push(`보조 출력 ${state.auxOutputs}개 · 4K 입력 소스 ${state.inputs4k}개`);
  if (prepared.status === 'calculated' && prepared.result?.valid) {
    const recommended = prepared.result.models.find(model => model.recommended);
    lines.push(recommended ? `추천 모델: ${recommended.name}` : '추천 모델: 없음');
    lines.push(`가능 모델: ${prepared.result.models.filter(model => model.possible).map(model => model.name).join(', ') || '없음'}`);
    for (const model of prepared.result.models) {
      lines.push(`${model.name}: ${model.possible ? '가능' : `불가 · ${model.reasons.join(' / ')}`}`);
    }
  } else if (prepared.status === 'calculated') {
    lines.push(`입력 오류: ${prepared.result?.error ?? '입력값을 확인해 주세요.'}`);
  } else {
    lines.push(`판정: ${prepared.reason ?? '미확인'}`);
  }
  lines.push('최종 구성은 Analog Way 공식 시뮬레이터에서 확인하세요.');
  return lines.join('\n');
}
