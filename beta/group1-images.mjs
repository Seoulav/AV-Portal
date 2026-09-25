export const publicationStatus = '사용자 게시 승인 · 제조사 재사용 권리 미확인';

const image = (role, file, alt, provider, model, sourceUrl, originalSize, resolution, verificationStatus = 'FOUND') => ({
  role,
  file,
  alt,
  note: `${role} · 제조사 공식 이미지`,
  provider,
  model,
  sourceUrl,
  officialSource: true,
  verificationStatus,
  originalSize,
  resolution,
  publicationStatus
});

export const group1Images = {
  'brc-am7': [
    image('Main', 'brc-am7-main.webp', 'Sony BRC-AM7 검정색 본체 메인 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/826ea30c6742e760e0c500edc5787dff?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Front', 'brc-am7-front.webp', 'Sony BRC-AM7 검정색 본체 전면 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/90470eb5cd45473e16b04e7ff772fb9b?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Rear', 'brc-am7-rear.webp', 'Sony BRC-AM7 검정색 본체 후면 단자 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/ff7d8e54abe4d0be10dbd75baceaff7d?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Perspective', 'brc-am7-perspective.webp', 'Sony BRC-AM7 검정색 본체 원근 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/e7123a37278e1e6838d2a9d17326cbfc?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED')
  ],
  dm7: [
    image('Front', 'dm7-front.webp', 'Yamaha DM7 디지털 믹싱 콘솔 전면 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-front-4000_tcm144-2158404.jpg', '4000×4000', '1800×1800'),
    image('Rear', 'dm7-rear.webp', 'Yamaha DM7 디지털 믹싱 콘솔 후면 단자 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-rear_tcm144-2158567.jpg', '2000×2000', '1800×1800'),
    image('Perspective', 'dm7-perspective.webp', 'Yamaha DM7 디지털 믹싱 콘솔 원근 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-angle-left_tcm144-2159042.jpg', '2000×2000', '1800×1800')
  ],
  'ki-pro-go2': [
    image('Main', 'ki-pro-go2-main.webp', 'AJA Ki Pro GO2 메인 제품 이미지', 'AJA', 'Ki Pro GO2', 'https://d26ddnfpy9hzf8.cloudfront.net/aja-web/public/assets/products/img/728/ki_pro_go_2_product_3600.png', '3600×944', '1800×472'),
    image('Rear', 'ki-pro-go2-rear.webp', 'AJA Ki Pro GO2 후면 연결 단자 이미지', 'AJA', 'Ki Pro GO2', 'https://d26ddnfpy9hzf8.cloudfront.net/aja-web/public/assets/images/products/728/6346-Ki_Pro_Go2_feature_rear.png', '1140×450', '1140×450')
  ],
  'pt-mz17k': [
    image('Front', 'pt-mz17k-front.webp', 'Panasonic PT-MZ17K 프로젝터 전면 이미지', 'Panasonic', 'PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_front_low.jpg', '1250×755', '1250×755'),
    image('Perspective', 'pt-mz17k-perspective.webp', 'Panasonic PT-MZ17K 프로젝터 원근 이미지', 'Panasonic', 'PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_slant_l_high.jpg', '2500×1536', '1800×1106')
  ],
  'rally-bar': [
    image('Front', 'rally-bar-front.webp', 'Logitech Rally Bar 그래파이트 전면 이미지', 'Logitech', 'Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-01.png?v=1', '1384×1038', '1384×1038'),
    image('Perspective', 'rally-bar-perspective.webp', 'Logitech Rally Bar 그래파이트 원근 이미지', 'Logitech', 'Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-02.png?v=1', '1384×1038', '1384×1038')
  ]
};

export function applyPublishedImages(product, slug) {
  const images = group1Images[slug];
  if (!images) throw new Error(`Unknown Group 1 image set: ${slug}`);
  product.images = images;
  product.imageStatuses = product.imageStatuses.map(status => {
    const published = images.find(image => image.role === status.role);
    return published ? { ...status, status: published.verificationStatus, sourceUrl: published.sourceUrl } : status;
  });
  Object.assign(product.presentation, {
    visualVariant: 'official-product-images',
    galleryRightsBadge: '사용자 게시 승인 · 권리 확인 필요',
    galleryFootNote: '제조사 공식 제품 이미지',
    galleryRights: '사용자가 AV Portal 게시를 승인했습니다. 제조사 재사용 권리와 별도 재배포 권리는 미확인 상태입니다.'
  });
  return product;
}

// Library 카드에 쓰는 대표 이미지. group1Images의 파일명 중 하나여야 한다.
export const cardImages = {
  'brc-am7': 'brc-am7-main.webp',
  dm7: 'dm7-perspective.webp',
  'ki-pro-go2': 'ki-pro-go2-main.webp',
  'pt-mz17k': 'pt-mz17k-perspective.webp',
  'rally-bar': 'rally-bar-front.webp'
};
