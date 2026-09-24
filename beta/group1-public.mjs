const STATUS = new Set(['VERIFIED', 'FOUND', 'READY', 'PARTIAL', 'MISSING', 'REVIEW REQUIRED', 'CONFLICTED']);
const SOURCE_NAMES = {
  P: '제조사 공식 제품 페이지', M: '제조사 사용 안내', RM: '제조사 Reference Manual',
  S: '제조사 사양 자료', R: '제조사 자료 목록', F: '제조사 기술 자료',
  TD: '제조사 Technical Data Sheet', IMG: '제조사 이미지 자료',
  H: '제조사 한국어 도움말', HS: '제조사 한국어 사양', HC: '제조사 커넥터 안내',
  PP: '제조사 제품 페이지 PDF', SP: '제조사 지원 페이지'
};
const QUICK_TYPES = new Set(['User Manual', 'Independent Specification', 'Specification', 'Technical Document']);
function safeUrl(raw) {
  if (!raw) return undefined;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('공개 출처는 자격정보가 없는 HTTPS URL이어야 합니다.');
  return url.href;
}
function state(value) {
  if (!STATUS.has(value)) throw new Error(`알 수 없는 검증 상태: ${value}`);
  return value;
}
function sourceCodes(raw) {
  return [...new Set(String(raw ?? '').match(/\b(?:RM|TD|IMG|HS|HC|PP|SP|P|M|S|R|F|H)\b/g) ?? [])].join(', ');
}
const text = value => String(value ?? '').trim();
const publicWording = value => text(value)
  .replaceAll('기존 통합 근거에 모델별 값 미기록', '모델별 값 미확인')
  .replaceAll('기존 결과에 미기록', '모델별 수량 미확인')
  .replaceAll('기존 확인 시점 기준', '지원 버전은 변경될 수 있음')
  .replaceAll('기존 공식 비교표에는', '제조사 공식 비교표에는')
  .replaceAll('기존 자료에는 물리 영상 입력 단자표가 충분히 기록되지 않아', '현재 확인된 공식 근거에는 물리 영상 입력 단자표가 충분하지 않아');

export function projectPublicDetail(input, { summary, issues, series, seriesNote } = {}) {
  if (!input?.manufacturer || !input?.model || !summary || !Array.isArray(issues)) throw new Error('제품 식별·공개 검증 요약·검토 항목이 필요합니다.');
  const page = input.documents.find(document => document.type === 'Official Product Page');
  if (!page?.url) throw new Error('공식 제품 페이지가 필요합니다.');
  const officialPage = safeUrl(page.url);
  const documents = input.documents.map(document => {
    const status = state(document.status);
    return {
      type: text(document.type), title: text(document.title), language: text(document.language) || '언어 미확인', status,
      ...(status !== 'MISSING' && document.url ? { url: safeUrl(document.url) } : {})
    };
  });
  if (documents.filter(document => QUICK_TYPES.has(document.type)).length !== 4) throw new Error('Quick Documents 네 종류가 필요합니다.');
  const sources = input.sources.map(source => ({
    code: text(source.code), name: SOURCE_NAMES[source.code] ?? '제조사 공식 자료',
    ...(source.url ? { url: safeUrl(source.url) } : {}),
    scope: source.code === 'P' && page.status !== 'VERIFIED' ? '모델·지역 표기 검토 중' : source.url ? '제조사 공식 출처' : '공개 원문 링크 미확인'
  }));
  const specifications = input.specifications.map(item => ({
    group: text(item.group), name: text(item.name), value: text(item.value), unit: text(item.unit),
    condition: publicWording(item.condition), source: sourceCodes(item.source), verification: state(item.verification)
  }));
  const io = input.io.map(item => ({
    group: text(item.group), connector: text(item.connector), signal: text(item.signal), direction: text(item.direction),
    quantity: text(item.quantity), protocol: text(item.protocol), availability: text(item.availability),
    condition: publicWording(item.condition), source: sourceCodes(item.source), verification: state(item.verification)
  }));
  return {
    manufacturer: text(input.manufacturer), productName: text(input.productName || input.model), model: text(input.model),
    series: text(series ?? input.series), seriesNote: text(seriesNote), itemType: text(input.itemType || 'PRODUCT'),
    categories: input.categories.map(text), english: text(input.english), korean: text(input.korean),
    verificationSummary: text(summary), packageStatus: 'REVIEW REQUIRED',
    overview: publicWording(input.overview || input.korean),
    images: [],
    imageStatuses: input.imageStatuses.map(image => ({ role: text(image.role), status: state(image.status), sourceUrl: officialPage })),
    documents,
    features: input.features.map(feature => ({ text: text(feature.text), source: sourceCodes(feature.source) })),
    specifications, io, sources,
    issues: issues.map(issue => ({ code: text(issue.code), status: state(issue.status), title: text(issue.title), detail: text(issue.detail) })),
    presentation: {
      galleryRightsBadge: '이미지 권한 검토 중',
      galleryRights: '이미지 게시·재사용 권한은 확인되지 않았습니다. 제조사 공식 출처에서 확인해 주세요.',
      specIntro: '값·조건·검증 상태를 함께 표시합니다.',
      ioIntro: '확인된 단자와 미확인 항목을 구분합니다.',
      supplementalNote: '제조사 공식 출처와 검토 상태를 구분해 표시합니다.',
      footerNote: `${text(input.manufacturer)} ${text(input.model)} · 공식 출처 기반`
    }
  };
}
