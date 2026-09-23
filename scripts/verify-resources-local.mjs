import { isAbsolute } from 'node:path';
import { loadCatalog } from '../app/catalog.mjs';
import { loadResourceIndex } from '../app/resource-register.mjs';

const productPath = process.env.AV_PORTAL_PRODUCT_LIST_PATH;
const resourcePath = process.env.AV_PORTAL_RESOURCE_REGISTER_PATH;

if (!productPath || !resourcePath || !isAbsolute(productPath) || !isAbsolute(resourcePath)) {
  process.stderr.write('두 로컬 JSON의 절대 경로를 환경 변수로 지정하세요.\n');
  process.exitCode = 1;
} else {
  try {
    const catalog = await loadCatalog(productPath);
    const index = await loadResourceIndex(resourcePath, catalog);
    process.stdout.write(JSON.stringify({
      products: catalog.counts.catalog_entries,
      original_rows: catalog.counts.source_item_rows,
      register_products: index.productCount,
      resources: index.resourceCount,
      associations: index.associationCount
    }) + '\n');
  } catch {
    process.stderr.write('로컬 제품 목록 또는 자료대장 검증에 실패했습니다. 파일과 관계를 확인하세요.\n');
    process.exitCode = 1;
  }
}
