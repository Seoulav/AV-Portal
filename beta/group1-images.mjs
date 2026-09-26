export const publicationStatus = '사용자 게시 승인 · 제조사 재사용 권리 미확인';
// Group 2에서 넘어온 사진은 조사 당시 확인된 권리 문구(공식 대리점 구매·계약 기반 사용)를 그대로 유지한다.
const group2PublicationStatus = '사용자 게시 승인 · 공식 대리점 구매·계약 기반 사용';

const imageWith = (rights) => (role, file, alt, provider, model, sourceUrl, originalSize, resolution, verificationStatus = 'FOUND') => ({
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
  publicationStatus: rights
});
const image = imageWith(publicationStatus);
// Group 2 카드 대표 사진 조사 기록(Work/기록/W-20260925-012-사진조사.md)에서 넘어온 8개 제품 전용.
const group2Image = imageWith(group2PublicationStatus);

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
  ],
  'mezzo-322-ad': [
    group2Image('Front', 'mezzo-322-ad-front.webp', 'Powersoft Mezzo 계열 공용 전면 패널 이미지(Mezzo 322 AD 제품 페이지 대표 이미지)', 'Powersoft', 'Mezzo 322 AD', 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', '1024×500', '509×127')
  ],
  'v-02hd-mk-ii': [
    group2Image('Perspective', 'v-02hd-mk-ii-perspective.webp', 'Roland V-02HD MK II 좌측 45도 원근 이미지', 'Roland', 'V-02HD MK II', 'https://static.roland.com/assets/media/zip/v-02hdmkii_hr_img.zip', '4048×2705', '1800×1203')
  ],
  'uvc-01': [
    group2Image('Perspective', 'uvc-01-perspective.webp', 'Roland UVC-01 우측 45도 원근 이미지', 'Roland', 'UVC-01', 'https://static.roland.com/assets/media/zip/uvc-01_hr_img.zip', '3840×2714', '1210×929')
  ],
  'eb-l530u': [
    group2Image('Main', 'eb-l530u-main.webp', 'Epson EB-L530U 프로젝터 정면 렌즈 방향 대표 이미지', 'Epson', 'EB-L530U (V11HA27040)', 'https://www.epson.co.kr/%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%EC%9A%A9-%EC%A0%9C%ED%92%88/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/%EC%A4%91%ED%98%95-%EA%B0%95%EB%8B%B9-%EB%AF%B8%ED%8C%85%EB%A3%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/EB-L530U/p/V11HA27040', '690×460', '686×294')
  ],
  'avio-usb-c': [
    group2Image('Main', 'avio-usb-c-main.webp', 'Audinate Dante AVIO USB-C 어댑터 RJ45·USB-C 케이블 이미지', 'Audinate', 'Dante AVIO USB-C (ADP-USBC-AU-2X2)', 'https://www.getdante.com/wp-content/uploads/2024/01/AVIO-2CH-USB-C-showConnectors-trans-layers-long-cable.png', '2448×1665', '1561×1071')
  ],
  mxcw640: [
    group2Image('Main', 'mxcw640-main.webp', 'Shure MXCW640 회의 단말 정면 이미지', 'Shure', 'MXCW640', 'https://www.shure.com/en-US/products/wireless-systems/mxcw/mxcw640', '3000×3000', '1573×675')
  ],
  gsm4248px: [
    group2Image('Rear', 'gsm4248px-rear.webp', 'NETGEAR GSM4248PX 후면 포트면 원근 이미지', 'NETGEAR', 'GSM4248PX', 'https://assets.netgear.com/transform/099b30e6-a6c9-4fcb-b29b-388a51fc3688/B6_gsm4248px_32', '779×536', '730×236')
  ],
  'aquilon-rs1': [
    group2Image('Front', 'aquilon-rs1-front.webp', 'Analog Way Aquilon RS1 전면 이미지', 'Analog Way', 'Aquilon RS1', 'https://dwn01.analogway.com/Site+Internet/Series/LivePremier/Products/Aquilon+RS1/High+Resolution+Pictures/aquilon-4u-rs1-fav-det.jpg', '3175×1772', '1800×768')
  ],
  'sx-1216-rti': [
    image('Front', 'sx-1216-rti-front.webp', 'SurgeX SX-1216-RTi 전면 이미지', 'SurgeX', 'SX-1216-RTi', 'https://www.ametekesp.com/-/media/ametekesp/products/surgex/remote-turn-on/groupimages/surgexi-sx1216-rti.jpg', '800×800(원본 합성 이미지에서 분리)', '798×111', 'VERIFIED'),
    image('Rear', 'sx-1216-rti-rear.webp', 'SurgeX SX-1216-RTi 후면 단자 이미지', 'SurgeX', 'SX-1216-RTi', 'https://www.ametekesp.com/-/media/ametekesp/products/surgex/remote-turn-on/groupimages/surgexi-sx1216-rti.jpg', '800×800(원본 합성 이미지에서 분리)', '740×120', 'FOUND')
  ],
  'led-780h': [
    image('Front', 'led-780h-front.webp', 'Magnimage LED-780H 전면 이미지', 'Magnimage', 'LED-780H', 'https://www.magnimage.com/article/ddddeffeefe', '880×278(제조사 제품 목록 대표 이미지)', '880×159', 'FOUND')
  ],
  'hdmi20-optj-tx90': [
    image('Front', 'hdmi20-optj-tx90-front.webp', 'Lightware HDMI20-OPTJ-TX90/RX90 공용 외관 이미지', 'Lightware', 'HDMI20-OPTJ-TX90', 'https://assets.prod.pim.lightware.com/assets/File-Downloads/Images-and-Drawings/Product-Pictures/HDMI20-OPTJ-TX90/4-WebImage/HDMI20-OPTJ-RX-TX90_Front.png', '1200×780', '905×177', 'FOUND')
  ],
  'hdmi20-optj-rx90': [
    image('Front', 'hdmi20-optj-rx90-front.webp', 'Lightware HDMI20-OPTJ-TX90/RX90 공용 외관 이미지', 'Lightware', 'HDMI20-OPTJ-RX90', 'https://assets.prod.pim.lightware.com/assets/File-Downloads/Images-and-Drawings/Product-Pictures/HDMI20-OPTJ-RX90/4-WebImage/HDMI20-OPTJ-RX-TX90_Front.png', '1200×780', '905×177', 'FOUND')
  ],
  'avio-bt': [
    image('Main', 'avio-bt-main.webp', 'Audinate Dante AVIO Bluetooth I/O Adapter 이미지', 'Audinate', 'Dante AVIO Bluetooth Adapter (ADP-BT-AU-2X1)', 'https://www.getdante.com/wp-content/uploads/2024/01/avio-bluetooth-crop.png', '약 460×346(WordPress 미디어)', '385×129', 'VERIFIED')
  ],
  'avio-2ch-in': [
    image('Main', 'avio-2ch-in-main.webp', 'Audinate Dante AVIO 2CH Analog Input Adapter 이미지', 'Audinate', 'Dante AVIO Analog Input Adapter, 2ch (ADP-DAI-AU-2x0)', 'https://www.getdante.com/wp-content/uploads/2024/01/avio-analog-input.png', '890×664(WordPress 미디어)', '890×664', 'VERIFIED')
  ],
  'avio-2ch-out': [
    image('Main', 'avio-2ch-out-main.webp', 'Audinate Dante AVIO 2CH Analog Output Adapter 이미지', 'Audinate', 'Dante AVIO Analog Output Adapter, 2ch (ADP-DAO-AU-0x2)', 'https://www.getdante.com/wp-content/uploads/2024/01/avio-analog-output.png', '772×626(WordPress 미디어)', '772×626', 'VERIFIED')
  ],
  'hyperdeck-studio-hd-pro': [
    image('Main', 'hyperdeck-studio-hd-pro-main.webp', 'Blackmagic Design HyperDeck Studio HD Pro 이미지', 'Blackmagic Design', 'HyperDeck Studio HD Pro', 'https://images.blackmagicdesign.com/images/products/hyperdeckstudio/product-grid/hyperdeck-studio-hd-pro.jpg?_v=1627443058', '306×215', '306×54', 'FOUND')
  ],
  'hyperdeck-studio-hd-plus': [
    image('Main', 'hyperdeck-studio-hd-plus-main.webp', 'Blackmagic Design HyperDeck Studio HD Plus 이미지', 'Blackmagic Design', 'HyperDeck Studio HD Plus', 'https://images.blackmagicdesign.com/images/products/hyperdeckstudio/product-grid/hyperdeck-studio-hd-plus.jpg?_v=1627443057', '306×215', '261×71', 'FOUND')
  ],
  'hyperdeck-studio-hd-mini': [
    image('Main', 'hyperdeck-studio-hd-mini-main.webp', 'Blackmagic Design HyperDeck Studio HD Mini 이미지', 'Blackmagic Design', 'HyperDeck Studio HD Mini', 'https://images.blackmagicdesign.com/images/products/hyperdeckstudio/product-grid/hyperdeck-studio-hd-mini.jpg?_v=1627443057', '306×215', '203×70', 'FOUND')
  ],
  'x100pro-7u': [
    image('Front', 'x100pro-7u-front.webp', 'Colorlight X100 Pro-7U 전면 이미지(전면 표시창에 모델명 표기)', 'Colorlight', 'X100 Pro-7U', 'https://support.colorlightinside.com/uploads/X100Pro-7U_1755598432.png', '2489×1886', '1800×1032', 'VERIFIED')
  ],
  'x100pro-4u': [
    image('Front', 'x100pro-4u-front.webp', 'Colorlight X100 Pro-4U 전면 이미지(전면 표시창에 모델명 표기)', 'Colorlight', 'X100 Pro-4U', 'https://support.colorlightinside.com/uploads/X100Pro-4USpecificationV2.0_1785395437.pdf', '2001×740(사양서 내장 이미지)', '1800×665', 'VERIFIED')
  ],
  'x100pro-2u': [
    image('Front', 'x100pro-2u-front.webp', 'Colorlight X100 Pro-2U 전면 이미지(전면 표시창에 모델명 표기)', 'Colorlight', 'X100 Pro-2U', 'https://support.colorlightinside.com/uploads/X100Pro-2USpecificationV2.0_1785395408.pdf', '2362×603(사양서 내장 이미지)', '1800×459', 'VERIFIED')
  ],
  'tio1608-d2': [
    image('Front', 'tio1608-d2-front.webp', 'Yamaha Tio1608-D2 전면 이미지', 'Yamaha', 'Tio1608-D2', 'https://kr.yamaha.com/ko/files/Tio1608-D2-front01_tcm144-1741118.jpg', '1200×1200', '1086×202', 'VERIFIED'),
    image('Rear', 'tio1608-d2-rear.webp', 'Yamaha Tio1608-D2 후면 단자 이미지', 'Yamaha', 'Tio1608-D2', 'https://kr.yamaha.com/ko/files/Tio1608-D2-rear_tcm144-1681743.jpg', '1200×1200', '1086×222', 'VERIFIED')
  ],
  dm3: [
    image('Front', 'dm3-front.webp', 'Yamaha DM3 전면 이미지', 'Yamaha', 'DM3', 'https://kr.yamaha.com/ko/files/DM3-front_tcm144-1729385.jpg', '1200×1200', '1076×1061', 'VERIFIED'),
    image('Rear', 'dm3-rear.webp', 'Yamaha DM3 후면 단자 이미지', 'Yamaha', 'DM3', 'https://kr.yamaha.com/ko/files/DM3-rear_tcm144-1735859.jpg', '1200×1200', '1082×476', 'VERIFIED')
  ],
  'rio1608-d3': [
    image('Front', 'rio1608-d3-front.webp', 'Yamaha Rio1608-D3 전면 이미지', 'Yamaha', 'Rio1608-D3', 'https://kr.yamaha.com/ko/files/Rio1608-D3-front01_tcm144-2339163.jpg', '1200×1200', '1086×373', 'VERIFIED'),
    image('Rear', 'rio1608-d3-rear.webp', 'Yamaha Rio1608-D3 후면 단자 이미지', 'Yamaha', 'Rio1608-D3', 'https://kr.yamaha.com/ko/files/Rio1608-D3-rear05_tcm144-2339161.jpg', '1200×1200', '1087×308', 'VERIFIED')
  ],
  'rio3224-d3': [
    image('Front', 'rio3224-d3-front.webp', 'Yamaha Rio3224-D3 전면 이미지', 'Yamaha', 'Rio3224-D3', 'https://kr.yamaha.com/ko/files/Rio3224-D3-front01_tcm144-2339162.jpg', '1200×1200', '1086×569', 'VERIFIED'),
    image('Rear', 'rio3224-d3-rear.webp', 'Yamaha Rio3224-D3 후면 단자 이미지', 'Yamaha', 'Rio3224-D3', 'https://kr.yamaha.com/ko/files/Rio3224-D3-rear05_tcm144-2339157.jpg', '1200×1200', '1084×515', 'VERIFIED')
  ],
  tr535n: [
    image('Front', 'tr535n-front.webp', 'AVer TR535N 전면 이미지', 'AVer', 'TR535N', 'https://www.averusa.com/images-aver/products/tr535n/ptz-front.png', '1200×1200', '360×417', 'FOUND'),
    image('Rear', 'tr535n-rear.webp', 'AVer TR535N 후면 단자 이미지', 'AVer', 'TR535N', 'https://www.averusa.com/images-aver/products/tr535n/ptz-back.png', '1200×1200', '351×392', 'FOUND')
  ],
  tr535: [
    image('Front', 'tr535-front.webp', 'AVer TR535 전면 이미지', 'AVer', 'TR535', 'https://kr.presentation.aver.com/Upload/Model/3259/LargeImg.png', '640×390', '296×385', 'FOUND')
  ],
  tr335: [
    image('Front', 'tr335-front.webp', 'AVer TR335 전면 이미지', 'AVer', 'TR335', 'https://www.averusa.com/images-aver/products/tr335-335n/ptz-front.png', '474×458', '338×381', 'FOUND'),
    image('Rear', 'tr335-rear.webp', 'AVer TR335 후면 단자 이미지', 'AVer', 'TR335', 'https://www.averusa.com/images-aver/products/tr335-335n/ptz-back.png', '474×458', '308×411', 'FOUND')
  ],
  tr315: [
    image('Perspective', 'tr315-perspective.webp', 'AVer TR315 원근 이미지(제조사 마케팅 이미지, NDI 배지 포함)', 'AVer', 'TR315', 'https://www.averusa.com/images-aver/products/tr315-315n/product-main-ptz-2.png', '1100×1000', '1053×982', 'FOUND')
  ],
  cl01: [
    image('Front', 'cl01-front.webp', 'AVer CL01 상단 조작부 이미지', 'AVer', 'CL01', 'https://www.averusa.com/images-aver/products/cl01/controller-top.png', '515×314', '515×301', 'FOUND'),
    image('Rear', 'cl01-rear.webp', 'AVer CL01 후면 단자 이미지', 'AVer', 'CL01', 'https://www.averusa.com/images-aver/products/cl01/controller-back.png', '515×314', '515×264', 'FOUND')
  ],
  vs5: [
    image('Front', 'lumantek-vs5-main.webp', 'Lumantek ez-Pro VS5 전면 조작부 이미지', 'Lumantek', 'VS5', 'https://lumantek.co.kr/uploads/product/935aceab0caf7fac17df7c43adf54046.png', '860×550', '743×550', 'VERIFIED')
  ],
  vs10: [
    image('Front', 'lumantek-vs10-main.webp', 'Lumantek ez-Pro VS10 전면 조작부 이미지', 'Lumantek', 'VS10', 'https://www.lumantek.com/uploads/product/2184f50a528aef5c943fc733a7d5b698.png', '860×550', '785×550', 'VERIFIED')
  ],
  'ez-md-plus': [
    image('Front', 'lumantek-ez-md-main.webp', 'Lumantek ez-MD+ 상단 라벨·단자 이미지', 'Lumantek', 'ez-MD+', 'https://lumantek.co.kr/uploads/product/8c299ed3858a91699c6a593c2f930d67.png', '609×330', '600×296', 'VERIFIED')
  ],
  'ez-shv-plus': [
    image('Front', 'lumantek-ez-shv-main.webp', 'Lumantek ez-SHV+ 전면 디스플레이·단자 이미지', 'Lumantek', 'ez-SHV+', 'https://lumantek.co.kr/uploads/product/1d6e7bf9fd8417dcbbb9af3fc15e32bb.png', '1063×500', '568×500', 'VERIFIED')
  ],
  'ez-hsv-plus': [
    image('Front', 'lumantek-ez-hsv-main.webp', 'Lumantek ez-HSV+ 전면 디스플레이·단자 이미지', 'Lumantek', 'ez-HSV+', 'https://lumantek.co.kr/uploads/product/a3d341a2299241436357289f2b6fdddd.png', '1063×500', '569×500', 'VERIFIED')
  ],
  'rally-mic-pod-hub': [
    image('Perspective', 'logitech-rally-mic-pod-hub-perspective.webp', 'Logitech Rally Mic Pod Hub 상단 원근 이미지', 'Logitech', 'Rally Mic Pod Hub', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/rally-mic-pod-hub/gallery/rally-mic-pod-hub-gallery-2.png', '1600×1374', '1528×814', 'FOUND'),
    image('Rear', 'logitech-rally-mic-pod-hub-front.webp', 'Logitech Rally Mic Pod Hub 하단 커넥터 이미지', 'Logitech', 'Rally Mic Pod Hub', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/rally-mic-pod-hub/gallery/rally-mic-pod-hub-gallery-1.png', '1600×1374', '1559×816', 'FOUND')
  ],
  'rally-mic-pod-extension-cable': [
    image('Main', 'logitech-rally-mic-pod-extension-cable-main.webp', 'Logitech Rally Mic Pod Extension Cable 이미지', 'Logitech', 'Rally Mic Pod Extension Cable', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/mic-pod-extension-cable/gallery-1.png', '1569×1098', '1362×851', 'FOUND')
  ],
  'strong-usb-cable': [
    image('Main', 'logitech-strong-usb-cable-main.webp', 'Logitech Strong USB-A to USB-C 케이블 이미지', 'Logitech', 'Strong USB Cable', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/strong-usb/gallery/strong-usb-cable-gallery-1.png', '1600×1374', '1371×1187', 'VERIFIED')
  ],
  'rally-plus': [
    image('Main', 'logitech-rally-plus-main.webp', 'Logitech Rally Plus 전체 구성(카메라·스피커 2·마이크 팟 2) 이미지', 'Logitech', 'Rally Plus', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/rally/buy/2026/gallery/rally-plus-front-angle-gallery-1.png', '3856×2160', '1400×331', 'FOUND')
  ],
  'rally-mic-pod': [
    image('Perspective', 'logitech-rally-mic-pod-perspective.webp', 'Logitech Rally Mic Pod 원근 이미지', 'Logitech', 'Rally Mic Pod', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/rally-mic-pod/gallery/mic-pod-gallery-graphite-1.png', '1600×1200', '1400×822', 'FOUND'),
    image('Other', 'logitech-rally-mic-pod-top.webp', 'Logitech Rally Mic Pod 상단 음소거 버튼 이미지', 'Logitech', 'Rally Mic Pod', 'https://resource.logitech.com/content/dam/logitech/en/products/video-conferencing/rally-mic-pod/gallery/mic-pod-gallery-graphite-2.png', '1600×1200', '1106×1183', 'FOUND')
  ],
  'pt-vmz71': [
    image('Main', 'pt-vmz71-main.webp', 'Panasonic PT-VMZ71 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-VMZ71 Series', 'https://docs.connect.panasonic.com/projector/products/vmz71/img/img_mainimg001.png', '708×376', '708×372', 'FOUND')
  ],
  'pt-vmz61': [
    image('Main', 'pt-vmz61-main.webp', 'Panasonic PT-VMZ71/VMZ61 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-VMZ71 Series', 'https://docs.connect.panasonic.com/projector/products/vmz71/img/img_mainimg001.png', '708×376', '708×372', 'FOUND')
  ],
  'pt-vmz51': [
    image('Main', 'pt-vmz51-main.webp', 'Panasonic PT-VMZ71/VMZ61 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-VMZ71 Series', 'https://docs.connect.panasonic.com/projector/products/vmz71/img/img_mainimg001.png', '708×376', '708×372', 'FOUND')
  ],
  'pt-mz14k': [
    image('Main', 'pt-mz14kl-main.webp', 'Panasonic PT-MZ20K 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-MZ20K Series', 'https://docs.connect.panasonic.com/projector/products/mz20k/img/img_mainimg001.jpg', '488×259', '488×259', 'FOUND')
  ],
  'pt-mz11k': [
    image('Main', 'pt-mz11kl-main.webp', 'Panasonic PT-MZ20K 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-MZ20K Series', 'https://docs.connect.panasonic.com/projector/products/mz20k/img/img_mainimg001.jpg', '488×259', '488×259', 'FOUND')
  ],
  'pt-mz882': [
    image('Main', 'pt-mz882-main.webp', 'Panasonic PT-MZ882 시리즈 대표 이미지(흑백 투톤)', 'Panasonic', 'PT-MZ882 Series', 'https://docs.connect.panasonic.com/projector/products/mz882/img/img_mainimg001.jpg', '488×259', '488×259', 'FOUND')
  ],
  'pulse-4k': [
    image('Front', 'pulse4k-front.webp', "Analog Way Pulse 4K 전면 조작부 이미지(전면에 모델명 'Pulse 4K' 표기)", 'Analog Way', 'Pulse 4K', 'https://dwn01.analogway.com/Site+Internet/Series/Midra+4k/Products/Pulse+4k/High+Resolution+Pictures/pulse-4k-fav.jpg', '6952×1960', '1800×390', 'VERIFIED')
  ],
  'eikos-4k': [
    image('Front', 'eikos4k-front.webp', "Analog Way Eikos 4K 전면 조작부 이미지(전면에 모델명 'Eikos 4K' 표기)", 'Analog Way', 'Eikos 4K', 'https://dwn01.analogway.com/Site+Internet/Series/Midra+4k/Products/Eikos+4k/High+Resolution+Pictures/eikos-4k-fav.jpg', '6844×1848', '1800×395', 'VERIFIED')
  ],
  'aquilon-rs2': [
    image('Front', 'aquilonrs2-front.webp', "Analog Way Aquilon RS2 전면 이미지(전면에 모델명 'Aquilon RS2' 표기)", 'Analog Way', 'Aquilon RS2', 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS2/High+Resolution+Pictures/aquilon-4u-rs2-fav-det-web.jpg', '3175×1772', '1800×686', 'VERIFIED')
  ],
  'zenith-100': [
    image('Front', 'zenith100-front.webp', "Analog Way Zenith 100 전면 이미지(전면에 모델명 'Zenith 100'/'ZEN100' 표기)", 'Analog Way', 'Zenith 100', 'https://dwn01.analogway.com/Site+Internet/Series/Alta+4k/Products/Zenith+100/High+Resolution+Pictures/zenith100-fav-web.png', '2362×699', '1800×510', 'VERIFIED')
  ],
  'zenith-200': [
    image('Front', 'zenith200-front.webp', "Analog Way Zenith 200 전면 이미지(전면에 모델명 'Zenith 200'/'ZEN200' 표기)", 'Analog Way', 'Zenith 200', 'https://dwn01.analogway.com/Site+Internet/Series/Alta+4k/Products/Zenith+200/High+Resolution+Pictures/zenith200-fav-web.png', '2362×764', '1800×533', 'VERIFIED')
  ],
  rc400t: [
    image('Front', 'rc400t-front.webp', "Analog Way RC400T 전면 이미지(전면에 모델명 'RC400T' 표기)", 'Analog Way', 'RC400T', 'https://cdn.prod.website-files.com/6540cb540116ce87ec8b62fe/65ef10bc1d235af01c99b642_RC400T.avif', '500×220', '471×215', 'VERIFIED'),
  ],
  'nx-1200': [
    image('Main', 'nx1200-main.webp', "AMX NX-1200 컨트롤러 이미지(전면·측면에 모델명 'NX-1200' 표기)", 'AMX', 'NX-1200', 'https://adn.harmanpro.com/productattachment/3636/product_attachment/vert_medium_2x-2077089418107c053c25f6d7f573c47a.webp', '900×298', '900×298', 'VERIFIED')
  ],
  'nx-2200': [
    image('Main', 'nx2200-main.webp', "AMX NX-2200 컨트롤러 이미지(전면·측면에 모델명 'NX-2200' 표기)", 'AMX', 'NX-2200', 'https://adn.harmanpro.com/productattachment/4404/product_attachment/vert_medium_2x-28f5fe41b1751e80410a41f001a184a4.webp', '900×177', '900×177', 'VERIFIED')
  ],
  'nx-3200': [
    image('Main', 'nx3200-main.webp', "AMX NX-3200 컨트롤러 이미지(전면·측면에 모델명 'NX-3200' 표기)", 'AMX', 'NX-3200', 'https://adn.harmanpro.com/productattachment/4413/product_attachment/vert_medium_2x-86148d69acc35fb5a6de8440292e50c8.webp', '894×178', '894×178', 'VERIFIED')
  ],
  'varia-100': [
    image('Main', 'varia100-main.webp', 'AMX VARIA-100 터치 패널 이미지(전면에 화면 표시, 측면 LED 라인 확인 가능)', 'AMX', 'VARIA-100', 'https://adn.harmanpro.com/productattachment/11307/product_attachment/vert_medium_2x-5ffd7c598db880c51902abd7ce7ed8ca.webp', '1500×1124', '1500×1124', 'FOUND')
  ],
  'varia-80': [
    image('Main', 'varia80-main.webp', 'AMX VARIA-80 터치 패널 이미지(전면에 화면 표시, 측면 LED 라인 확인 가능)', 'AMX', 'VARIA-80', 'https://adn.harmanpro.com/productattachment/11343/product_attachment/vert_medium_2x-750e4f76640b57bf2614b868d022c13b.webp', '1500×1124', '1500×1124', 'FOUND')
  ],
  'varia-sl80': [
    image('Main', 'variasl80-main.webp', 'AMX VARIA-SL80 벽면 매립형 터치 패널 이미지(전면에 화면 표시, 측면 LED 라인 확인 가능)', 'AMX', 'VARIA-SL80', 'https://adn.harmanpro.com/productattachment/11287/product_attachment/vert_medium_2x-100a351b0438a37795b807f7728193a9.webp', '1500×1125', '1500×1125', 'FOUND')
  ],
  'varia-sl50': [
    image('Main', 'variasl50-main.webp', 'AMX VARIA-SL50 벽면 매립형 터치 패널 이미지(세로형, 전면에 화면 표시, 측면 LED 라인 확인 가능)', 'AMX', 'VARIA-SL50', 'https://adn.harmanpro.com/productattachment/11295/product_attachment/vert_medium_2x-14f34124943df254442c6a9a7eec0275.webp', '1136×1600', '1136×1600', 'FOUND')
  ],
  xsm4216f: [
    image('Main', 'xsm4216f-main.webp', 'NETGEAR XSM4216F(M4250-16XF) 관리형 스위치 전면 및 측면 사시도, 16개의 SFP+ 포트와 NETGEAR 로고가 보인다', 'NETGEAR', 'XSM4216F', 'https://assets.netgear.com/transform/pdp-desktop/d5af8012-43f9-4ec0-81c8-cec3cdc37abb/B6_M4250_16XF_XSM4216F_32', '779x536', '779x536', 'FOUND')
  ],
  gsm4212p: [
    image('Main', 'gsm4212p-main.webp', "NETGEAR GSM4210PX(M4250-8G2XF-PoE+ 30W) 스위치 전면부, 8개의 PoE+ RJ45 포트와 2개의 SFP+ 포트, 콘솔 포트가 보이며 전면 라벨에 'M4250-8G2XF-PoE+ 30W' 모델명이 표시되어 있다", 'NETGEAR', 'GSM4210PX', 'https://assets.netgear.com/transform/pdp-desktop/f167aa72-e4f7-45a2-af74-53c1dc5269f9/GSM4210PX_flange_F_Tipoff_NS', '802x552', '802x552', 'VERIFIED')
  ],
  gsm4230p: [
    image('Main', 'gsm4230p-main.webp', 'NETGEAR GSM4230P(M4250-26G4F-PoE+) 스위치 후면 근접 사시도, 24개의 PoE+ RJ45 포트, SFP 슬롯, 전원 커넥터가 보인다', 'NETGEAR', 'GSM4230P', 'https://assets.netgear.com/transform/pdp-desktop/7e74430a-799c-4bc1-af5d-7dfb29651616/B5_gsm4230p_32', '779x536', '779x536', 'FOUND')
  ],
  gsm4230px: [
    image('Main', 'gsm4230px-main.webp', 'NETGEAR GSM4230PX(M4250-26G4XF-PoE+) 스위치 전면 및 측면 사시도, 24개의 PoE+ RJ45 포트와 SFP+ 슬롯, 냉각 통풍구가 보인다', 'NETGEAR', 'GSM4230PX', 'https://assets.netgear.com/transform/pdp-desktop/f74ddb22-5019-4edf-8c04-607c72366d0c/B6_gsm4230px_32', '779x536', '779x536', 'FOUND')
  ],
  gsm4248p: [
    image('Main', 'gsm4248p-main.webp', 'NETGEAR GSM4248P(M4250-40G8F-PoE+) 스위치 정면 사진, 다수의 PoE+ RJ45 포트와 콘솔/USB 포트가 보인다', 'NETGEAR', 'GSM4248P', 'https://assets.netgear.com/transform/pdp-desktop/a23ad1f4-bb12-434c-8bb8-7e8dee6bb848/B6_gsm4248p_32', '779x536', '779x536', 'FOUND')
  ],
  gs116pp: [
    image('Main', 'gs116pp-main.webp', "NETGEAR GS116PP 비관리형 PoE+ 스위치 정면 사시도, 16개의 RJ45 포트 아래 노란색 PoE 표시 라벨과 전면 라벨의 'GS116PP' 모델명이 선명하게 보인다", 'NETGEAR', 'GS116PP', 'https://assets.netgear.com/transform/pdp-desktop/f9a95193-2074-4399-879c-6032ced7051d/GS116pp_productcarousel_hero_image', '779x536', '779x536', 'VERIFIED')
  ],
  gs108pp: [
    image('Main', 'gs108pp-main.webp', "NETGEAR GS108PP 비관리형 PoE+ 스위치 정면 사시도, 8개의 RJ45 포트 아래 노란색 PoE 표시 라벨과 측면 라벨의 'GS108PP' 모델명이 선명하게 보인다", 'NETGEAR', 'GS108PP', 'https://assets.netgear.com/transform/pdp-desktop/70ec4bb6-147e-4cf6-bf97-f0e5e1b11572/B3_gs108pp_32', '779x536', '779x536', 'VERIFIED')
  ],
  'v-02hd': [
    image('Main', 'v-02hd-main.webp', 'Roland V-02HD 멀티포맷 비디오 믹서 컨트롤 패널', 'Roland', 'V-02HD', 'https://static.roland.com/assets/images/products/gallery/v-02hd_top_front_gal.jpg', '1500x815', '1500x815', 'VERIFIED')
  ],
  'v-1hd-plus': [
    image('Main', 'v-1hd-plus-main.webp', 'Roland V-1HD+ HD 비디오 스위처 컨트롤 패널', 'Roland', 'V-1HD+', 'https://static.roland.com/assets/images/products/gallery/v-1hd_plus_front30_B_main_gal.jpg', '1680x500', '1680x500', 'VERIFIED')
  ],
  'vr-4hd': [
    image('Main', 'vr-4hd-main.webp', 'Roland VR-4HD AV 믹서 컨트롤 패널 정면', 'Roland', 'VR-4HD', 'https://static.roland.com/assets/images/products/gallery/vr4hd_top_main_gal.jpg', '1665x1050', '1665x1050', 'VERIFIED')
  ],
  'vr-6hd': [
    image('Main', 'vr-6hd-main.webp', 'Roland VR-6HD 다이렉트 스트리밍 AV 믹서 컨트롤 패널', 'Roland', 'VR-6HD', 'https://static.roland.com/assets/images/products/gallery/vr-6hd_front30_gal.jpg', '1680x765', '1680x765', 'VERIFIED')
  ],
  'v-8hd': [
    image('Main', 'v-8hd-main.webp', 'Roland V-8HD HD 비디오 스위처 컨트롤 패널', 'Roland', 'V-8HD', 'https://static.roland.com/assets/images/products/gallery/v-8hd_top_front_2_gal.jpg', '1680x656', '1680x656', 'VERIFIED')
  ],
  'v-60hd': [
    image('Main', 'v-60hd-main.webp', 'Roland V-60HD HD 비디오 스위처 컨트롤 패널', 'Roland', 'V-60HD', 'https://static.roland.com/assets/images/products/gallery/v-60hd_main_gal.jpg', '1500x609', '1500x609', 'VERIFIED')
  ],
  'v-80hd': [
    image('Main', 'v-80hd-main.webp', 'Roland V-80HD 다이렉트 스트리밍 비디오 스위처 컨트롤 패널', 'Roland', 'V-80HD', 'https://static.roland.com/assets/images/products/gallery/v-80hd_front30.jpg', '1680x700', '1680x700', 'VERIFIED')
  ],
  'v-160hd': [
    image('Main', 'v-160hd-main.webp', 'Roland V-160HD 스트리밍 비디오 스위처 컨트롤 패널', 'Roland', 'V-160HD', 'https://static.roland.com/assets/images/products/gallery/v-160hd_front30_B_gal.jpg', '1680x643', '1680x643', 'VERIFIED')
  ],
  smartvision40: [
    image('Main', 'smartvision40-main.webp', 'Yealink SmartVision 40 올인원 비디오바 전면, 듀얼 카메라와 120도 시야각 표시', 'Yealink', 'SmartVision40', 'https://www.yealink.com/website-service/attachment/product/image/20240627/20240627053009982101b.png', '1920x784', '1920x784', 'VERIFIED')
  ],
  vcm35: [
    image('Main', 'vcm35-main.webp', 'Yealink VCM35 원형 마이크로폰 어레이, 케이블 연결 모습', 'Yealink', 'VCM35', 'https://www.yealink.com/website-service/attachment/product/image/20230904/202309040633222863a10699a427e9d528ed0e244e682.png', '602x415', '602x415', 'VERIFIED')
  ],
  uvc86: [
    image('Main', 'uvc86-main.webp', 'Yealink UVC86 카메라 설치 예시 모음(회의실 배치, 선반, 천장, TV 상단 거치)', 'Yealink', 'UVC86', 'https://www.yealink.com/website-service/attachment/product/image/20240627/20240627054727337521e.png', '1400x1175', '1400x1175', 'VERIFIED')
  ],
  cm20: [
    image('Main', 'cm20-main.webp', 'Yealink CM20 천장형 마이크로폰, 화이트 메쉬 커버와 블랙 하우징 분리 모습', 'Yealink', 'CM20', 'https://www.yealink.com/website-service/attachment/product/image/20241030/2024103007303973857a6.png', '1920x1353', '1920x1353', 'VERIFIED')
  ],
  cs10: [
    image('Main', 'cs10-main.webp', 'Yealink CS10 원형 천장형 스피커, 화이트 메쉬 커버 정면 모습', 'Yealink', 'CS10', 'https://www.yealink.com/website-service/attachment/product/image/20240130/2024013007073877150dd232f4c2ca19c4defb8f2eea6.png', '602x415', '602x415', 'VERIFIED')
  ],
  avhub: [
    image('Main', 'avhub-main.webp', 'Yealink AVHub 본체 전면, USB 포트 및 Yealink 로고', 'Yealink', 'AVHub', 'https://www.yealink.com/website-service/attachment/product/image/20241106/20241106085123775e608.png', '1920x1200', '1920x1200', 'VERIFIED')
  ],
  'uvc85-byod': [
    image('Main', 'uvc85-byod-main.webp', 'Yealink UVC85-BYOD 키트 구성품(UVC85 카메라, CP50, CPE40) 전체 모습', 'Yealink', 'UVC85-BYOD', 'https://www.yealink.com/website-service/attachment/product/other/20250320/2025032002203411f155.webp', '1057x596', '1057x596', 'VERIFIED')
  ],
  cpe40: [
    image('Main', 'cpe40-main.webp', 'Yealink CPE40 원형 확장 마이크로폰/스피커폰, 음소거·볼륨 버튼 상단 모습', 'Yealink', 'CPE40', 'https://www.yealink.com/website-service/attachment/product/image/20241029/20241029033402640e470.png', '744x533', '744x533', 'VERIFIED')
  ],
  'ec-4bv': [
    image('Main', 'ec-4bv-main.webp', 'BSS Audio EC-4BV 이더넷 벽면 컨트롤러(화이트, US Decora형)', 'BSS Audio', 'EC-4BV', 'https://adn.harmanpro.com/product_attachments/product_attachments/1966_1729004360/EC-4BV-WHT_US_x_large_2x.webp', '3686x3072', '3686x3072', 'VERIFIED')
  ],
  'blu-101': [
    image('Main', 'blu-101-main.webp', 'BSS Audio BLU-101 컨퍼런싱 프로세서 전면부', 'BSS Audio', 'BLU-101', 'https://adn.harmanpro.com/product_attachments/product_attachments/1330_1728944425/BLU-101_Front_x_large_2x.webp', '4096x410', '4096x410', 'VERIFIED')
  ],
  'blu-100': [
    image('Main', 'blu-100-main.webp', 'BSS Audio BLU-100 신호처리기 전면부', 'BSS Audio', 'BLU-100', 'https://adn.harmanpro.com/product_attachments/product_attachments/1328_1728944439/BLU-100_Front_x_large_2x.webp', '4096x438', '4096x438', 'VERIFIED')
  ],
  'blu-160': [
    image('Main', 'blu-160-main.webp', 'BSS Audio BLU-160 신호처리기 전면부(카드 슬롯 4개)', 'BSS Audio', 'BLU-160', 'https://adn.harmanpro.com/product_attachments/product_attachments/1344_1728944378/BLU-160_Front_x_large_2x.webp', '4096x438', '4096x438', 'VERIFIED')
  ],
  'blu-50': [
    image('Main', 'blu-50-main.webp', 'BSS Audio BLU-50 하프랙 신호처리기 전면부', 'BSS Audio', 'BLU-50', 'https://adn.harmanpro.com/product_attachments/product_attachments/1580_1728152802/BLU-50_Front_x_large_2x.webp', '4096x438', '4096x438', 'VERIFIED')
  ],
  'blu-aec-in': [
    image('Main', 'blu-aec-in-main.webp', 'BSS Audio AEC 입력 카드(AEC Card) 실물 사진', 'BSS Audio', 'AEC Card', 'https://adn.harmanpro.com/productattachment/1466/product_attachment/x_large_2x-c7d50aa6f6a82a84d90db9a75d3a0d2c.webp', '1845x3072', '1845x3072', 'VERIFIED')
  ],
  'blucard-in': [
    image('Main', 'blucard-in-main.webp', 'BSS Audio Analog Input Card 실물 사진', 'BSS Audio', 'Analog Input Card', 'https://adn.harmanpro.com/productattachment/1469/product_attachment/x_large_2x-1ab54fb5d4eef9229e8a80d3136f269a.webp', '1845x3072', '1845x3072', 'VERIFIED')
  ],
  'blucard-out': [
    image('Main', 'blucard-out-main.webp', 'BSS Audio Analog Output Card 실물 사진', 'BSS Audio', 'Analog Output Card', 'https://adn.harmanpro.com/productattachment/1470/product_attachment/x_large_2x-f48e1f712c6729c357af2f5a8b7924a5.webp', '1845x3072', '1845x3072', 'VERIFIED')
  ],
  'blu-dan': [
    image('Main', 'blu-dan-main.webp', 'BSS Audio BLU-DA(구 BLU-DAN) Dante/AES67-BLU link 브리지 전면부', 'BSS Audio', 'BLU-DA', 'https://adn.harmanpro.com/product_attachments/product_attachments/5192_1728940298/BSS_BLU-DA_x_large_2x.webp', '4096x819', '4096x819', 'VERIFIED')
  ],
  'd-cerno-cu': [
    image('Main', 'd-cerno-cu-main.webp', 'D-Cerno CU 중앙 제어 장치', 'Televic', 'D-Cerno CU', 'https://documents.televic.digital/conference/index.php/s/RHjqJcY7dz4sGWT', '1902x1123', '1902x1123', 'VERIFIED')
  ],
  'd-cerno-ae': [
    image('Main', 'd-cerno-ae-main.webp', 'D-Cerno AE 랙형 중앙 엔진', 'Televic', 'D-Cerno AE', 'https://documents.televic.digital/conference/index.php/s/9xABEyWNK9emno7', '2038x786', '2038x786', 'VERIFIED')
  ],
  'd-cerno-d-sl': [
    image('Main', 'd-cerno-d-sl-main.webp', 'D-Cerno D SL 델리게이트 디스커션 유닛(탈착식 마이크 장착)', 'Televic', 'D-Cerno D SL', 'https://documents.televic.digital/conference/index.php/s/nWriiJSnfAs4Yjt', '1902x1123', '1902x1123', 'VERIFIED')
  ],
  'd-mic-50-sl': [
    image('Main', 'd-mic-50-sl-main.webp', 'D-Mic 50 SL 구스넥 마이크(50cm)', 'Televic', 'D-Mic 50 SL', 'https://documents.televic.digital/conference/index.php/s/kqq9baF5qpq7rNF', '2000x496', '2000x496', 'VERIFIED')
  ],
  'plixus-ae-r-dante': [
    image('Main', 'plixus-ae-r-dante-main.webp', 'Plixus AE-R Dante 랙형 오디오 엔진', 'Televic', 'Plixus AE-R Dante', 'https://documents.televic.digital/conference/index.php/s/HZP74JS8zLxzaPC', '2119x1123', '2119x1123', 'VERIFIED')
  ],
  'plixus-ae-r-ps': [
    image('Main', 'plixus-ae-r-ps-main.webp', 'Plixus AE-R PS 외장 전원 공급 장치', 'Televic', 'Plixus AE-R PS', 'https://documents.televic.digital/conference/index.php/s/f2XKZpPkcbYfnKX', '1867x990', '1867x990', 'VERIFIED')
  ],
  'confidea-flex': [
    image('Main', 'confidea-flex-main.webp', 'Confidea FLEX 터치스크린 탁상형 회의 유닛', 'Televic', 'Confidea FLEX', 'https://documents.televic.digital/conference/index.php/s/2kDk4ndpZ5ZaaPf', '2902x1659', '2902x1659', 'VERIFIED')
  ],
  'plixus-next': [
    image('Main', 'plixus-next-main.webp', 'Plixus NEXT 네트워크 익스텐더', 'Televic', 'Plixus NEXT', 'https://documents.televic.digital/conference/index.php/s/W9kbS3grpBJJncP', '1868x990', '1868x990', 'VERIFIED')
  ],
  'd-mic-40-sl': [
    image('Main', 'd-mic-40-sl-main.webp', 'D-Mic 40 SL 구스넥 마이크(40cm)', 'Televic', 'D-Mic 40 SL', 'https://documents.televic.digital/conference/index.php/s/WG4bzxmaNPkRg9a', '2000x652', '2000x652', 'VERIFIED')
  ],
  'ultrix-ns-fr2': [
    image('Main', 'ultrix-ns-fr2-main.webp', 'ULTRIX-NS-FR2 2RU 프레임 (Ultrix 제품 페이지 공식 이미지)', 'Ross Video', 'ULTRIX-NS-FR2', 'https://www.rossvideo.com/wp-content/uploads/2026/07/ULTRIX_FAMILY_FR2.png', '768x440', '768x440', 'VERIFIED')
  ],
  'ultrix-hdx-io': [
    image('Main', 'ultrix-hdx-io-main.webp', 'ULTRIX-HDX-IO SDI I/O 카드 (Ultrix I/O Cards 제품 페이지 공식 이미지)', 'Ross Video', 'ULTRIX-HDX-IO', 'https://www.rossvideo.com/wp-content/uploads/2026/01/HDX-io.png', '2048x521', '2048x521', 'VERIFIED')
  ],
  ultripower: [
    image('Main', 'ultripower-main.webp', 'Ross Video Ultripower 1RU 랙마운트 전원 공급 유닛 전면(중앙에 \'Ultripower\', 좌우 슬롯에 \'Ultripower-PS\' 모듈 2개 장착)', 'Ross Video', 'ULTRIPOWER', 'https://documentation.rossvideo.com/files/Brochures/Infrastructure/Ultripower%20Cutsheet.pdf', '1229x200', '1229x200', 'VERIFIED'),
    image('Rear', 'ultripower-rear.webp', 'Ross Video Ultripower 후면 패널(이더넷 포트, OUT 1-4 전원 커넥터, IEC 전원 인렛 A/B 확인 가능)', 'Ross Video', 'ULTRIPOWER', 'https://documentation.rossvideo.com/files/Brochures/Infrastructure/Ultripower%20Cutsheet.pdf', '1225x200', '1225x200', 'FOUND')
  ],
  'ultripower-ps': [
    image('Main', 'ultripower-ps-main.webp', 'Ross Video Ultripower-PS 개별 전원 모듈(섀시에 장착된 상태, 모듈 전면에 \'Ultripower-PS\' 라벨과 냉각팬 확인 가능)', 'Ross Video', 'ULTRIPOWER-PS', 'https://documentation.rossvideo.com/files/Brochures/Infrastructure/Ultripower%20Cutsheet.pdf', '1229x200', '1229x200', 'VERIFIED')
  ],
  'ultritouch-2-hr': [
    image('Front', 'ultritouch-2-hr-main.webp', 'Ultritouch-2-HR 전면 (Ultritouch 제품 페이지 공식 이미지)', 'Ross Video', 'ULTRITOUCH-2-HR', 'https://www.rossvideo.com/wp-content/uploads/2018/08/Ultritouch-Front2.jpg', '1600x800', '1600x800', 'VERIFIED'),
    image('Rear', 'ultritouch-2-hr-rear.webp', 'Ultritouch 후면 패널 - 전원/네트워크 커넥터 (참고용, 2RU/4RU 공용 이미지일 가능성 있음)', 'Ross Video', 'ULTRITOUCH-2-HR', 'https://www.rossvideo.com/wp-content/uploads/2018/08/Ultritouch-Back.jpg', '1600x800', '1600x800', 'FOUND')
  ],
  'novastar-h2': [
    image('Front', 'h2-front.webp', 'NovaStar H2 전면부', 'NovaStar', 'H2', 'https://www.novastar.tech/product/detail.html?catid=3&id=39', '2400x532', '2400x532', 'VERIFIED'),
    image('Rear', 'h2-rear.webp', 'NovaStar H2 후면부(카드 슬롯)', 'NovaStar', 'H2', 'https://www.novastar.tech/product/detail.html?catid=3&id=39', '2400x534', '2400x534', 'VERIFIED')
  ],
  'novastar-h5': [
    image('Front', 'h5-front.webp', 'NovaStar H5 전면부(터치스크린 LCD)', 'NovaStar', 'H5', 'https://www.novastar.tech/product/detail.html?catid=3&id=39', '2400x1176', '2400x1176', 'VERIFIED'),
    image('Rear', 'h5-rear.webp', 'NovaStar H5 후면부(카드 슬롯)', 'NovaStar', 'H5', 'https://www.novastar.tech/product/detail.html?catid=3&id=39', '2400x1175', '2400x1175', 'VERIFIED')
  ],
  'h-preview-card-2xrj45-1xhdmi13': [
    image('Main', 'h-preview-card-2xrj45-1xhdmi13-main.webp', 'H_2xRJ45+1xHDMI1.3 프리뷰 카드 전면 커넥터', 'NovaStar', 'H_2xRJ45+1xHDMI1.3 Preview Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1126x117', '1126x117', 'VERIFIED')
  ],
  'h-input-card-4xhdmi': [
    image('Main', 'h-input-card-4xhdmi-main.webp', 'H_4xHDMI 입력 카드 전면 커넥터(HDMI 1.3 x2, HDMI 1.4 x2)', 'NovaStar', 'H_4xHDMI Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x155', '1342x155', 'VERIFIED')
  ],
  'h-input-card-hdmi20-dp12-4k': [
    image('Main', 'h-input-card-hdmi20-dp12-4k-main.webp', 'H_1xHDMI2.0+1xDP1.2 입력 카드 전면 커넥터', 'NovaStar', 'H_1xHDMI2.0+1xDP1.2 Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x155', '1342x155', 'VERIFIED')
  ],
  'h-input-card-hdmi20-4k': [
    image('Main', 'h-input-card-hdmi20-4k-main.webp', 'H_1xHDMI2.0 입력 카드 전면 커넥터', 'NovaStar', 'H_1xHDMI2.0 Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x137', '1342x137', 'VERIFIED')
  ],
  'h-input-card-dp12-4k': [
    image('Main', 'h-input-card-dp12-4k-main.webp', 'H_1xDP1.2 입력 카드 전면 커넥터', 'NovaStar', 'H_1xDP1.2 Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x155', '1342x155', 'VERIFIED')
  ],
  'h-input-card-2xhdmi20-2xdp12': [
    image('Main', 'h-input-card-2xhdmi20-2xdp12-main.webp', 'H_2xHDMI2.0+2xDP1.2 입력 카드 전면 커넥터', 'NovaStar', 'H_2xHDMI2.0+2xDP1.2 Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x155', '1342x155', 'VERIFIED')
  ],
  'h-input-card-12g-sdi': [
    image('Main', 'h-input-card-12g-sdi-main.webp', 'H_1x12G SDI 입력 카드 전면 커넥터(IN / LOOP)', 'NovaStar', 'H_1x12G SDI Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x139', '1342x139', 'VERIFIED')
  ],
  'h-input-card-4x3g-sdi': [
    image('Main', 'h-input-card-4x3g-sdi-main.webp', 'H_4x3G SDI 입력 카드 전면 커넥터', 'NovaStar', 'H_4x3G SDI Input Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x139', '1342x139', 'VERIFIED')
  ],
  'h-output-card-4xhdmi-dl': [
    image('Main', 'h-output-card-4xhdmi-dl-main.webp', 'H_4xHDMI 출력 카드 전면 커넥터(HDMI 1.4 x4)', 'NovaStar', 'H_4xHDMI Output Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1126x115', '1126x115', 'VERIFIED')
  ],
  'h-output-card-hdmi20-4k': [
    image('Main', 'h-output-card-hdmi20-4k-main.webp', 'H_1xHDMI2.0 출력 카드 전면 커넥터(주 출력 + 복제 출력)', 'NovaStar', 'H_1xHDMI2.0 Output Card', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '1342x137', '1342x137', 'VERIFIED')
  ],
  'h-800w-psu': [
    image('Main', 'h-800w-psu-main.webp', 'H_800W 전원 공급 모듈 실물 사진', 'NovaStar', 'H_800W Power', 'https://en-website001.oss-us-east-1.aliyuncs.com/Specification/H2%20Video%20Wall%20Splicer%20Specifications-V1.17.0.pdf', '550x466', '550x466', 'VERIFIED')
  ],
  'eb-pq2220b': [
    image('Main', 'eb-pq2220b-main.webp', '엡손 EB-PQ2220B 4K 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PQ2220B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=a33d9a01df167a802f294561e4272660fc9f3496&vid=a33d9a01df167a802f294561e4272660fc9f3496&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-l790su': [
    image('Main', 'eb-l790su-main.webp', '엡손 EB-L790SU 레이저 단초점 프로젝터 정면 이미지', 'Epson', 'EB-L790SU', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=13edff527ccb65177f277e80b54796ba53dc8693&vid=13edff527ccb65177f277e80b54796ba53dc8693&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l690u': [
    image('Main', 'eb-l690u-main.webp', '엡손 EB-L690U 레이저 프로젝터 정면 이미지', 'Epson', 'EB-L690U', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=13edff527ccb65177f277e80b54796ba53dc8693&vid=13edff527ccb65177f277e80b54796ba53dc8693&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l895e': [
    image('Main', 'eb-l895e-main.webp', '엡손 EB-L895E 레이저 프로젝터 정면 이미지', 'Epson', 'EB-L895E', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=2d8022984a69610ae51ed946f7f0a9c561ba5e09&vid=2d8022984a69610ae51ed946f7f0a9c561ba5e09&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l795se': [
    image('Main', 'eb-l795se-main.webp', '엡손 EB-L795SE 레이저 단초점 프로젝터 정면 이미지', 'Epson', 'EB-L795SE', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=e276bbfd71ebd5f00577b0bc31da2c897fe06da5&vid=e276bbfd71ebd5f00577b0bc31da2c897fe06da5&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l695se': [
    image('Main', 'eb-l695se-main.webp', '엡손 EB-L695SE 레이저 초단초점 프로젝터 정면 이미지', 'Epson', 'EB-L695SE', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=ab01b655f796f97edf8d9c4312f82aba8ff8a8fb&vid=ab01b655f796f97edf8d9c4312f82aba8ff8a8fb&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l895u': [
    image('Main', 'eb-l895u-main.webp', '엡손 EB-L895U 레이저 프로젝터 정면 이미지', 'Epson', 'EB-L895U', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=2d8022984a69610ae51ed946f7f0a9c561ba5e09&vid=2d8022984a69610ae51ed946f7f0a9c561ba5e09&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-l790u': [
    image('Main', 'eb-l790u-main.webp', '엡손 EB-L790U 레이저 프로젝터 정면 이미지', 'Epson', 'EB-L790U', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=13edff527ccb65177f277e80b54796ba53dc8693&vid=13edff527ccb65177f277e80b54796ba53dc8693&prid=original&clid=SAPDAM&prclid=productpictures', '960x640', '960x640', 'FOUND')
  ],
  'eb-pq2216b': [
    image('Main', 'eb-pq2216b-main.webp', '엡손 EB-PQ2216B 4K 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PQ2216B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=a33d9a01df167a802f294561e4272660fc9f3496&vid=a33d9a01df167a802f294561e4272660fc9f3496&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-pq2213b': [
    image('Main', 'eb-pq2213b-main.webp', '엡손 EB-PQ2213B 4K 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PQ2213B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=a33d9a01df167a802f294561e4272660fc9f3496&vid=a33d9a01df167a802f294561e4272660fc9f3496&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-pu2216b': [
    image('Main', 'eb-pu2216b-main.webp', '엡손 EB-PU2216B 고광량 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PU2216B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=5c300259e29d23528007ddfcefc33645ff4fbe45&vid=5c300259e29d23528007ddfcefc33645ff4fbe45&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-pu2213b': [
    image('Main', 'eb-pu2213b-main.webp', '엡손 EB-PU2213B 고광량 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PU2213B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=5c300259e29d23528007ddfcefc33645ff4fbe45&vid=5c300259e29d23528007ddfcefc33645ff4fbe45&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-pu2010w-b': [
    image('Main', 'eb-pu2010w-b-main.webp', '엡손 EB-PU2010B 고광량 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PU2010B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=022c18ef0c0846e91456d68312067cdbba072569&vid=022c18ef0c0846e91456d68312067cdbba072569&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-pu1008b': [
    image('Main', 'eb-pu1008b-main.webp', '엡손 EB-PU1008B 고광량 레이저 프로젝터 정면 이미지', 'Epson', 'EB-PU1008B', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=f1f69abc72c312d7d27ca9b83cbfc1a603ec8159&vid=f1f69abc72c312d7d27ca9b83cbfc1a603ec8159&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  'eb-l260f': [
    image('Main', 'eb-l260f-main.webp', '엡손 EB-L260F 레이저 비즈니스 프로젝터 정면 이미지', 'Epson', 'EB-L260F', 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=170c32f51f2061c5ccee14b400fe17a5107c0c17&vid=170c32f51f2061c5ccee14b400fe17a5107c0c17&prid=original&clid=SAPDAM&prclid=productpictures', '690x460', '690x460', 'FOUND')
  ],
  hg43u800fnfxkr: [
    image('Main', 'hg43u800fnfxkr-main.webp', '호텔 TV HU8000F 시리즈 정면', 'Samsung', 'HG43U800FNFXKR', 'https://images.samsung.com/kdp/goods/2025/10/21/abaf8ac7-e9d1-4d61-99b2-3d1f89b28067.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  hg50u800fnfxkr: [
    image('Main', 'hg50u800fnfxkr-main.webp', '호텔 TV HU8000F 시리즈 정면', 'Samsung', 'HG50U800FNFXKR', 'https://images.samsung.com/kdp/goods/2025/10/21/cfdadb87-1342-48f3-9107-71e55db7b799.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  hg65u800fnfxkr: [
    image('Main', 'hg65u800fnfxkr-main.webp', '호텔 TV HU8000F 시리즈 정면', 'Samsung', 'HG65U800FNFXKR', 'https://images.samsung.com/kdp/goods/2025/10/21/b9dd4f62-d73d-4524-ac49-5b58c65c44f0.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh32qmcebgcxkr: [
    image('Main', 'lh32qmcebgcxkr-main.webp', '단독형 UHD M 시리즈 80.1cm 정면', 'Samsung', 'LH32QMCEBGCXKR', 'https://images.samsung.com/kdp/goods/2023/11/27/b5d508b0-450b-484b-92ee-ad6d24cec05d.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh43qmcebgcxkr: [
    image('Main', 'lh43qmcebgcxkr-main.webp', '단독형 UHD M 시리즈 정면', 'Samsung', 'LH43QMCEBGCXKR', 'https://images.samsung.com/kdp/goods/2023/08/29/7912ee7f-7c9f-4202-9adb-62491be478c7.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh85qmcebgcxkr: [
    image('Main', 'lh85qmcebgcxkr-main.webp', '단독형 UHD M 시리즈 정면', 'Samsung', 'LH85QMCEBGCXKR', 'https://images.samsung.com/kdp/goods/2023/08/29/9124bf3b-fa36-43fc-b25b-460d045ba5e7.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh98qecedgcxkr: [
    image('Main', 'lh98qecedgcxkr-main.webp', '단독형 UHD E 시리즈 98인치 정면', 'Samsung', 'LH98QECEDGCXKR', 'https://images.samsung.com/kdp/goods/2024/08/26/619b8046-e8f2-4617-a3b7-65559d31ea30.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh98qmcebgcxkr: [
    image('Main', 'lh98qmcebgcxkr-main.webp', '단독형 UHD M 시리즈 첫번째 이미지', 'Samsung', 'LH98QMCEBGCXKR', 'https://images.samsung.com/kdp/goods/2024/10/14/eb43a1c6-2c2d-4277-99c3-af1da01b2272.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh43qhcebgcxkr: [
    image('Main', 'lh43qhcebgcxkr-main.webp', '단독형 UHD H 시리즈 정면', 'Samsung', 'LH43QHCEBGCXKR', 'https://images.samsung.com/kdp/goods/2023/09/04/85db0f25-511c-449a-94cc-935bb8e4f18d.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh75qhcebgcxkr: [
    image('Main', 'lh75qhcebgcxkr-main.webp', '단독형 UHD H 시리즈 정면', 'Samsung', 'LH75QHCEBGCXKR', 'https://images.samsung.com/kdp/goods/2023/09/04/44853db9-5581-45fe-b0c1-99142514e49d.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh115qhfebgxkr: [
    image('Main', 'lh115qhfebgxkr-main.webp', '단독형 UHD H 시리즈 290.7cm 세로형 정면', 'Samsung', 'LH115QHFEBGXKR', 'https://images.samsung.com/kdp/goods/2025/08/28/3a33df49-4b10-4ad7-8ede-93e5d4bf3f05.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh55vmcrbgbxkr: [
    image('Main', 'lh55vmcrbgbxkr-main.webp', '비디오월 Razor 베젤 0.88mm 시리즈 첫번째 이미지', 'Samsung', 'LH55VMCRBGBXKR', 'https://images.samsung.com/kdp/goods/2024/10/15/6661afd9-e11d-4006-b99f-25d82ab9fba2.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh55vhcrbgbxkr: [
    image('Main', 'lh55vhcrbgbxkr-main.webp', '비디오월 Razor 베젤 0.88mm 시리즈 첫번째 이미지', 'Samsung', 'LH55VHCRBGBXKR', 'https://images.samsung.com/kdp/goods/2024/10/15/6528e22c-b75f-41f3-b452-08bacd0bc570.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  kq75lsf03wfxkr: [
    image('Main', 'kq75lsf03wfxkr-main.webp', '2025 The Frame Pro 189cm 정면', 'Samsung', 'KQ75LSF03WFXKR', 'https://images.samsung.com/kdp/goods/2025/03/05/a852d262-818e-4fca-bee4-f4d77eb2c7af.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh55wmfwbgcxkr: [
    image('Main', 'lh55wmfwbgcxkr-main.webp', 'Flip Pro 전자칠판 55인치 정면', 'Samsung', 'LH55WMFWBGCXKR', 'https://images.samsung.com/kdp/goods/2026/03/17/59151f93-3b7c-4eec-afc7-16f4cb9e2547.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  lh75wmfwlgcxkr: [
    image('Main', 'lh75wmfwlgcxkr-main.webp', 'Flip Pro 전자칠판 75인치 정면', 'Samsung', 'LH75WMFWLGCXKR', 'https://images.samsung.com/kdp/goods/2026/03/17/ec3ecbb6-32ff-4c50-af3c-a200d8917a90.png?$Q90_1920_1280_F_PNG$', '1920x1280', '1920x1280', 'VERIFIED')
  ],
  'control-23-1': [
    image('Main', 'control-23-1-main.webp', 'JBL Control 23-1 실내외 겸용 스피커 정면 각도컷', 'JBL', 'Control 23-1', 'https://adn.harmanpro.com/productattachment/7359/product_attachment/x_large_2x-bb9eecb2cee425988260ed8fbf868dbc.webp', '1500x986', '1500x986', 'VERIFIED')
  ],
  'control-25-1': [
    image('Main', 'control-25-1-main.webp', 'JBL Control 25-1 실내외 겸용 스피커 정면 각도컷', 'JBL', 'Control 25-1', 'https://adn.harmanpro.com/productattachment/7362/product_attachment/x_large_2x-b1bdb34cf58fa0730a34c8f41b7dacb2.webp', '1500x986', '1500x986', 'VERIFIED')
  ],
  'control-28-1': [
    image('Main', 'control-28-1-main.webp', 'JBL Control 28-1 실내외 겸용 스피커 정면 각도컷', 'JBL', 'Control 28-1', 'https://adn.harmanpro.com/productattachment/7370/product_attachment/x_large_2x-a18e6b1172950f3ff0186c68d31ba836.webp', '1500x986', '1500x986', 'VERIFIED')
  ],
  'ac18-95': [
    image('Main', 'ac18-95-main.webp', 'JBL AC18/95 8인치 2-way 스피커', 'JBL', 'AC18/95', 'https://adn.harmanpro.com/productattachment/9529/product_attachment/x_large_2x-3b7b974f27f7f842357828dac7f13d64.webp', '1500x986', '1500x986', 'VERIFIED')
  ],
  'ac18-26': [
    image('Main', 'ac18-26-main.webp', 'JBL AC18/26 8인치 2-way 스피커', 'JBL', 'AC18/26', 'https://adn.harmanpro.com/productattachment/7472/product_attachment/x_large_2x-205a1ef14cc0712cfec4de4daefd511d.webp', '1500x986', '1500x986', 'VERIFIED')
  ],
  'control-412ct': [
    image('Main', 'control-412ct-main.webp', 'JBL Control 412C/T 천장매입형 스피커', 'JBL', 'Control 412C/T', 'https://adn.harmanpro.com/productattachment/13468/product_attachment/x_large_2x-eb54e55ceb8e8543644466108eb1d651.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-414ct': [
    image('Main', 'control-414ct-main.webp', 'JBL Control 414C/T 천장매입형 스피커', 'JBL', 'Control 414C/T', 'https://adn.harmanpro.com/productattachment/13476/product_attachment/x_large_2x-4ef25d1dd6f33efb57eceed876f42403.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-416ct': [
    image('Main', 'control-416ct-main.webp', 'JBL Control 416C/T 천장매입형 스피커', 'JBL', 'Control 416C/T', 'https://adn.harmanpro.com/productattachment/13515/product_attachment/x_large_2x-01950787c3c7601434d8d3aeb2fddec3.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-418ct': [
    image('Main', 'control-418ct-main.webp', 'JBL Control 418C/T 천장매입형 스피커', 'JBL', 'Control 418C/T', 'https://adn.harmanpro.com/productattachment/13483/product_attachment/x_large_2x-8f3d95bd428a0d479700ee038dd4d60b.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-447ct': [
    image('Main', 'control-447ct-main.webp', 'JBL Control 447C/T 천장매입형 스피커', 'JBL', 'Control 447C/T', 'https://adn.harmanpro.com/productattachment/13555/product_attachment/x_large_2x-19f26a5cf1122a0608d8f17f1283304e.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-419cst': [
    image('Main', 'control-419cst-main.webp', 'JBL Control 419CS/T 천장매입형 서브우퍼', 'JBL', 'Control 419CS/T', 'https://adn.harmanpro.com/productattachment/12906/product_attachment/x_large_2x-8cf339e050a6c8ee4275c8d3a9aa2982.webp', '2141x1605', '2141x1605', 'VERIFIED')
  ],
  'control-440cst': [
    image('Main', 'control-440cst-main.webp', 'JBL Control 440CS/T 천장매입형 서브우퍼', 'JBL', 'Control 440CS/T', 'https://adn.harmanpro.com/productattachment/13578/product_attachment/x_large_2x-c38ea84849e7cce026f6513fadb9f69f.webp', '1605x1605', '1605x1605', 'VERIFIED')
  ],
  'control-424ct': [
    image('Main', 'control-424ct-main.webp', 'JBL Control 424C/T 천장매입형 스피커', 'JBL', 'Control 424C/T', 'https://adn.harmanpro.com/productattachment/13053/product_attachment/x_large_2x-f224719ed4ed63273c83322fa623c2d8.webp', '1450x1605', '1450x1605', 'VERIFIED')
  ],
  'control-424lp': [
    image('Main', 'control-424lp-main.webp', 'JBL Control 424LP 저심도 천장매입형 스피커', 'JBL', 'Control 424LP', 'https://adn.harmanpro.com/productattachment/12920/product_attachment/x_large_2x-e359522ec10c157e439ead17a7acfd42.webp', '1450x1605', '1450x1605', 'VERIFIED')
  ],
  'control-426ct': [
    image('Main', 'control-426ct-main.webp', 'JBL Control 426C/T 천장매입형 스피커', 'JBL', 'Control 426C/T', 'https://adn.harmanpro.com/productattachment/12941/product_attachment/x_large_2x-8239b57ad60d042c03bfd413d7bbc86c.webp', '1424x1605', '1424x1605', 'VERIFIED')
  ],
  'control-426lp': [
    image('Main', 'control-426lp-main.webp', 'JBL Control 426LP 저심도 천장매입형 스피커', 'JBL', 'Control 426LP', 'https://adn.harmanpro.com/productattachment/12927/product_attachment/x_large_2x-340066799085d22ff8cd6a76e28cfaa9.webp', '1742x1605', '1742x1605', 'VERIFIED')
  ],
  'quattrocanali-2404-dspd': [
    image('Front', 'quattrocanali-2404-dspd-front.webp', 'Powersoft Quattrocanali 2404 DSP+D 전면부', 'Powersoft', 'Quattrocanali 2404 DSP+D', 'https://www.powersoft.com/api/media/file/Quattrocanali2404DSP_gallery-cardL_front-2.png', '1024x500', '1007x131')
  ],
  'quattrocanali-4804-dspd': [
    image('Front', 'quattrocanali-4804-dspd-front.webp', 'Powersoft Quattrocanali 4804 DSP+D 전면부', 'Powersoft', 'Quattrocanali 4804 DSP+D', 'https://www.powersoft.com/api/media/file/Quattrocanali4804DSP_gallery-cardL_front-6.png', '1024x500', '1007x132')
  ],
  'duecanali-1604-dsp': [
    image('Front', 'duecanali-1604-dsp-front.webp', 'Powersoft Duecanali 1604 DSP 전면부', 'Powersoft', 'Duecanali 1604 DSP', 'https://www.powersoft.com/api/media/file/Duecanali1604DSP_gallery-cardL_front-5.png', '1024x500', '1006x131')
  ],
  'mezzo-602-ad': [
    image('Front', 'mezzo-602-ad-front.webp', 'Powersoft Mezzo 602 AD 전면부', 'Powersoft', 'Mezzo 602 AD', 'https://www.powersoft.com/api/media/file/Mezzo602AD_gallery-cardL_front-2.png', '1024x500', '511x130'),
    image('Rear', 'mezzo-602-ad-rear.webp', 'Powersoft Mezzo AD 시리즈 후면 커넥터부(대표 이미지)', 'Powersoft', 'Mezzo 602 AD', 'https://www.powersoft.com/api/media/file/Mezzo324AD_gallery-cardL_rear-1.png', '1024x500', '528x133')
  ],
  'mezzo-322-a': [
    image('Front', 'mezzo-322-a-front.webp', 'Powersoft Mezzo 322 A 전면부', 'Powersoft', 'Mezzo 322 A', 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', '1024x500', '511x129'),
    image('Rear', 'mezzo-322-a-rear.webp', 'Powersoft Mezzo A 시리즈 후면 커넥터부(대표 이미지)', 'Powersoft', 'Mezzo 322 A', 'https://www.powersoft.com/api/media/file/Mezzo604A_gallery-cardL_rear-1.png', '1024x500', '530x137')
  ],
  'mezzo-602-a': [
    image('Front', 'mezzo-602-a-front.webp', 'Powersoft Mezzo 602 A 전면부', 'Powersoft', 'Mezzo 602 A', 'https://www.powersoft.com/api/media/file/Mezzo602A_gallery-cardL_front-2.png', '1024x500', '511x130'),
    image('Rear', 'mezzo-602-a-rear.webp', 'Powersoft Mezzo A 시리즈 후면 커넥터부(대표 이미지)', 'Powersoft', 'Mezzo 602 A', 'https://www.powersoft.com/api/media/file/Mezzo604A_gallery-cardL_rear-1.png', '1024x500', '530x137')
  ],
  'duecanali-1604-dspd': [
    image('Front', 'duecanali-1604-dspd-front.webp', 'Powersoft Duecanali 1604 DSP+D 전면부', 'Powersoft', 'Duecanali 1604 DSP+D', 'https://www.powersoft.com/api/media/file/Duecanali1604DSP_gallery-cardL_front-4.png', '1024x500', '1006x131')
  ],
  'quattrocanali-1204-dspd': [
    image('Front', 'quattrocanali-1204-dspd-front.webp', 'Powersoft Quattrocanali 1204 DSP+D 전면부', 'Powersoft', 'Quattrocanali 1204 DSP+D', 'https://www.powersoft.com/api/media/file/Quattrocanali1204DSP_gallery-cardL_front-5.png', '1024x500', '1006x131')
  ],
  'duecanali-804-dsp': [
    image('Front', 'duecanali-804-dsp-front.webp', 'Powersoft Duecanali 804 DSP 전면부', 'Powersoft', 'Duecanali 804 DSP', 'https://www.powersoft.com/api/media/file/Duecanali804DSP_gallery-cardL_front-4.png', '1024x500', '1006x131')
  ],
  'quattrocanali-1204-dsp': [
    image('Front', 'quattrocanali-1204-dsp-front.webp', 'Powersoft Quattrocanali 1204 DSP 전면부', 'Powersoft', 'Quattrocanali 1204 DSP', 'https://www.powersoft.com/api/media/file/Quattrocanali1204DSP_gallery-cardL_front-4.png', '1024x500', '1006x131')
  ],
  'quattrocanali-4804-dsp': [
    image('Front', 'quattrocanali-4804-dsp-front.webp', 'Powersoft Quattrocanali 4804 DSP 전면부', 'Powersoft', 'Quattrocanali 4804 DSP', 'https://www.powersoft.com/api/media/file/Quattrocanali4804DSP_gallery-cardL_front-6.png', '1024x500', '1007x132')
  ],
  'mezzo-324-ad': [
    image('Front', 'mezzo-324-ad-front.webp', 'Powersoft Mezzo 324 AD 전면부(사이트에서 322 A와 공용 이미지 사용)', 'Powersoft', 'Mezzo 324 AD', 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', '1024x500', '511x129'),
    image('Rear', 'mezzo-324-ad-rear.webp', 'Powersoft Mezzo 324 AD 후면 커넥터부', 'Powersoft', 'Mezzo 324 AD', 'https://www.powersoft.com/api/media/file/Mezzo324AD_gallery-cardL_rear-1.png', '1024x500', '528x133')
  ],
  'mezzo-604-ad': [
    image('Front', 'mezzo-604-ad-front.webp', 'Powersoft Mezzo 604 AD 전면부', 'Powersoft', 'Mezzo 604 AD', 'https://www.powersoft.com/api/media/file/Mezzo604A_gallery-cardL_front-2.png', '1024x500', '512x130'),
    image('Rear', 'mezzo-604-ad-rear.webp', 'Powersoft Mezzo AD 시리즈 후면 커넥터부(대표 이미지)', 'Powersoft', 'Mezzo 604 AD', 'https://www.powersoft.com/api/media/file/Mezzo324AD_gallery-cardL_rear-1.png', '1024x500', '528x133')
  ],
  'mezzo-324-a': [
    image('Front', 'mezzo-324-a-front.webp', 'Powersoft Mezzo 324 A 전면부(사이트에서 322 A와 공용 이미지 사용)', 'Powersoft', 'Mezzo 324 A', 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', '1024x500', '511x129'),
    image('Rear', 'mezzo-324-a-rear.webp', 'Powersoft Mezzo A 시리즈 후면 커넥터부(대표 이미지)', 'Powersoft', 'Mezzo 324 A', 'https://www.powersoft.com/api/media/file/Mezzo604A_gallery-cardL_rear-1.png', '1024x500', '530x137')
  ],
  'mezzo-604-a': [
    image('Front', 'mezzo-604-a-front.webp', 'Powersoft Mezzo 604 A 전면부', 'Powersoft', 'Mezzo 604 A', 'https://www.powersoft.com/api/media/file/Mezzo604AD_gallery-cardL_front-1.png', '1024x500', '511x130'),
    image('Rear', 'mezzo-604-a-rear.webp', 'Powersoft Mezzo 604 A 후면 커넥터부', 'Powersoft', 'Mezzo 604 A', 'https://www.powersoft.com/api/media/file/Mezzo604A_gallery-cardL_rear-1.png', '1024x500', '530x137')
  ],
  'duecanali-804-dspd': [
    image('Front', 'duecanali-804-dspd-front.webp', 'Powersoft Duecanali 804 DSP+D 전면부', 'Powersoft', 'Duecanali 804 DSP+D', 'https://www.powersoft.com/api/media/file/Duecanali804DSP_gallery-cardL_front-5.png', '1024x500', '1006x131')
  ],
  'quattrocanali-2404-dsp': [
    image('Front', 'quattrocanali-2404-dsp-front.webp', 'Powersoft Quattrocanali 2404 DSP 전면부', 'Powersoft', 'Quattrocanali 2404 DSP', 'https://www.powersoft.com/api/media/file/Quattrocanali2404DSP_gallery-cardL_front-3.png', '1024x500', '1007x131')
  ]
,
  'cdi-2-300bl': [
    image('Front', 'cdi-2-300bl-front.webp', 'Crown CDi 2|300BL 전면', 'HARMAN', 'Crown CDi 2|300BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6020_1728939592/Crown_CDi_DriveCore_2300BL_Front_x_large_2x.webp', '4096x1283', '2000x626'),
    image('Rear', 'cdi-2-300bl-rear.webp', 'Crown CDi 2|300BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|300BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6024_1728990132/Crown_CDi_DriveCore_2300BL_Rear_x_large_2x.webp', '4096x1377', '2000x672')
  ],
  'dci-2-300': [
    image('Front', 'dci-2-300-front.webp', 'Crown DCi 2|300 전면', 'HARMAN', 'Crown DCi 2|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/2095_1728943332/DCi_Analog_2-300_front_no_top_shadow_x_large_2x.webp', '4096x988', '2000x482'),
    image('Rear', 'dci-2-300-rear.webp', 'Crown DCi 2채널 후면 커넥터 패널(공용 이미지)', 'HARMAN', 'Crown DCi 2|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/2195_1729004892/Back_2_Channel_no_top_w_shadow_x_large_2x.webp', '4096x1209', '2000x590')
  ],
  'cdi-2-300': [
    image('Front', 'cdi-2-300-front.webp', 'Crown CDi 2|300 전면', 'HARMAN', 'Crown CDi 2|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/6012_1728939605/Crown_CDi_DriveCore_2300_Front_x_large_2x.webp', '4096x1287', '2000x628'),
    image('Rear', 'cdi-2-300-rear.webp', 'Crown CDi 2|300 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/6016_1728990219/Crown_CDi_DriveCore_2300_Rear_x_large_2x.webp', '4096x1365', '2000x667')
  ],
  'dci-2-300n': [
    image('Front', 'dci-2-300n-front.webp', 'Crown DCi 2|300N 전면', 'HARMAN', 'Crown DCi 2|300N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2097_1728943320/DCi_2-300N_front_no_top_shadow_x_large_2x.webp', '4096x989', '2000x483'),
    image('Rear', 'dci-2-300n-rear.webp', 'Crown DCi Network 2채널 후면 커넥터 패널', 'HARMAN', 'Crown DCi 2|300N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2196_1729004820/DCi_Network_2_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1119', '2000x546')
  ],
  'i-tech-4x3500hd': [
    image('Front', 'itech-4x3500hd-front.webp', 'Crown I-Tech 4x3500HD 전면', 'HARMAN', 'Crown I-Tech 4x3500HD', 'https://adn.harmanpro.com/product_attachments/product_attachments/2141_1728943168/ITHD4_3500_front_no_top_shadow_original_x_large_2x.webp', '4096x1023', '2000x500'),
    image('Rear', 'itech-4x3500hd-rear.webp', 'Crown I-Tech 4x3500HD 후면 Speakon 커넥터 패널', 'HARMAN', 'Crown I-Tech 4x3500HD', 'https://adn.harmanpro.com/product_attachments/product_attachments/2461_1729005023/ITHD4_Backpanel_Speakon_w_Reflection--straight_on_x_large_2x.webp', '4096x2731', '2000x1333')
  ],
  'cdi-2-600bl': [
    image('Front', 'cdi-2-600bl-front.webp', 'Crown CDi 2|600BL 전면', 'HARMAN', 'Crown CDi 2|600BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6036_1728939568/Crown_CDi_DriveCore_2600BL_Front_x_large_2x.webp', '4096x1304', '2000x637'),
    image('Rear', 'cdi-2-600bl-rear.webp', 'Crown CDi 2|600BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|600BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6040_1728989961/Crown_CDi_DriveCore_2600BL_Rear_x_large_2x.webp', '4096x1436', '2000x701')
  ],
  'dci-4-300da': [
    image('Front', 'dci-4-300da-front.webp', 'Crown DCi 4|300DA 전면', 'HARMAN', 'Crown DCi 4|300DA', 'https://adn.harmanpro.com/product_attachments/product_attachments/6729_1728935052/Crown_DCi_4300_DA_Front_x_large_2x.webp', '4096x892', '2000x436'),
    image('Rear', 'dci-4-300da-rear.webp', 'Crown DCi 4|300DA 후면 Dante/AES67 포트 패널', 'HARMAN', 'Crown DCi 4|300DA', 'https://adn.harmanpro.com/product_attachments/product_attachments/10508_1728962207/Crown_DCi_4300_DA_Back_x_large_2x.webp', '4096x2731', '2000x1333')
  ],
  'comtech-d-4125': [
    image('Front', 'ctd-4125-front.webp', 'Crown ComTech CTD-4125 전면', 'HARMAN', 'Crown CTD-4125', 'https://adn.harmanpro.com/product_attachments/product_attachments/13174_1748629693/Crown_ComTech_CTD-4125_ProductPhoto_Front_1605x1605_x_large_x_large_2x.webp', '4096x789', '2000x385')
  ],
  'comtech-d-8125': [
    image('Front', 'ctd-8125-front.webp', 'Crown ComTech CTD-8125 전면', 'HARMAN', 'Crown CTD-8125', 'https://adn.harmanpro.com/product_attachments/product_attachments/13172_1748629462/Crown_ComTech_CTD-8125_ProductPhoto_Front_1605x1605_x_large_x_large_2x.webp', '4096x533', '2000x260')
  ],
  'dci-2-600': [
    image('Front', 'dci-2-600-front.webp', 'Crown DCi 2|600 전면', 'HARMAN', 'Crown DCi 2|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/2105_1728943309/DCi_Analog_2-600_front_no_top_shadow_x_large_2x.webp', '4096x990', '2000x483'),
    image('Rear', 'dci-2-600-rear.webp', 'Crown DCi 2채널 후면 커넥터 패널(공용 이미지)', 'HARMAN', 'Crown DCi 2|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/2197_1729004904/Back_2_Channel_no_top_w_shadow_x_large_2x.webp', '4096x1209', '2000x590')
  ],
  'dci-4-300': [
    image('Front', 'dci-4-300-front.webp', 'Crown DCi 4|300 전면', 'HARMAN', 'Crown DCi 4|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/2114_1728943267/DCi_Analog_4-300_front_no_top_shadow_x_large_2x.webp', '4096x1019', '2000x498'),
    image('Rear', 'dci-4-300-rear.webp', 'Crown DCi 4채널 후면 커넥터 패널(공용 이미지)', 'HARMAN', 'Crown DCi 4|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/2199_1729004914/DCi_4_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1262', '2000x616')
  ],
  'dci-4-600': [
    image('Front', 'dci-4-600-front.webp', 'Crown DCi 4|600 전면', 'HARMAN', 'Crown DCi 4|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/2121_1728943254/DCi_Analog_4-600_front_no_top_shadow_x_large_2x.webp', '4096x984', '2000x480'),
    image('Rear', 'dci-4-600-rear.webp', 'Crown DCi 4채널 후면 커넥터 패널(공용 이미지)', 'HARMAN', 'Crown DCi 4|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/2209_1729004927/DCi_4_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1262', '2000x616')
  ],
  'cdi-2-600': [
    image('Front', 'cdi-2-600-front.webp', 'Crown CDi 2|600 전면', 'HARMAN', 'Crown CDi 2|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/6028_1728939582/Crown_CDi_DriveCore_2600_Front_x_large_2x.webp', '4096x1304', '2000x637'),
    image('Rear', 'cdi-2-600-rear.webp', 'Crown CDi 2|600 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/6032_1728990047/Crown_CDi_DriveCore_2600_Rear_x_large_2x.webp', '4096x1365', '2000x667')
  ],
  'cdi-2-1200': [
    image('Front', 'cdi-2-1200-front.webp', 'Crown CDi 2|1200 전면', 'HARMAN', 'Crown CDi 2|1200', 'https://adn.harmanpro.com/product_attachments/product_attachments/6076_1728939508/Crown_CDi_DriveCore_21200_Front_x_large_2x.webp', '4096x1318', '2000x644'),
    image('Rear', 'cdi-2-1200-rear.webp', 'Crown CDi 2|1200 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|1200', 'https://adn.harmanpro.com/product_attachments/product_attachments/6080_1728989527/Crown_CDi_DriveCore_21200_Rear_x_large_2x.webp', '4096x1415', '2000x691')
  ],
  'cdi-4-300': [
    image('Front', 'cdi-4-300-front.webp', 'Crown CDi 4|300 전면', 'HARMAN', 'Crown CDi 4|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/6044_1728939556/Crown_CDi_DriveCore_4300_Front_x_large_2x.webp', '4096x1312', '2000x641'),
    image('Rear', 'cdi-4-300-rear.webp', 'Crown CDi 4|300 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|300', 'https://adn.harmanpro.com/product_attachments/product_attachments/6048_1728989873/Crown_CDi_DriveCore_4300_Rear_x_large_2x.webp', '4096x1397', '2000x682')
  ],
  'cdi-4-600': [
    image('Front', 'cdi-4-600-front.webp', 'Crown CDi 4|600 전면', 'HARMAN', 'Crown CDi 4|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/6060_1728939532/Crown_CDi_DriveCore_4600_Front_x_large_2x.webp', '4096x1343', '2000x656'),
    image('Rear', 'cdi-4-600-rear.webp', 'Crown CDi 4|600 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|600', 'https://adn.harmanpro.com/product_attachments/product_attachments/6064_1728989700/Crown_CDi_DriveCore_4600_Rear_x_large_2x.webp', '4096x1420', '2000x693')
  ],
  'cdi-4-1200': [
    image('Front', 'cdi-4-1200-front.webp', 'Crown CDi 4|1200 전면', 'HARMAN', 'Crown CDi 4|1200', 'https://adn.harmanpro.com/product_attachments/product_attachments/6092_1728939484/Crown_CDi_DriveCore_41200_Front_x_large_2x.webp', '4096x1292', '2000x631'),
    image('Rear', 'cdi-4-1200-rear.webp', 'Crown CDi 4|1200 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|1200', 'https://adn.harmanpro.com/product_attachments/product_attachments/6096_1728989354/Crown_CDi_DriveCore_41200_Rear_x_large_2x.webp', '4096x1436', '2000x701')
  ],
  'dci-2-600n': [
    image('Front', 'dci-2-600n-front.webp', 'Crown DCi 2|600N 전면', 'HARMAN', 'Crown DCi 2|600N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2106_1728943297/DCi_2-600N_front_no_top_shadow_x_large_2x.webp', '4096x964', '2000x471'),
    image('Rear', 'dci-2-600n-rear.webp', 'Crown DCi Network 2채널 후면 커넥터 패널', 'HARMAN', 'Crown DCi 2|600N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2205_1729004830/DCi_Network_2_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1119', '2000x546')
  ],
  'dci-4-300n': [
    image('Front', 'dci-4-300n-front.webp', 'Crown DCi 4|300N 전면', 'HARMAN', 'Crown DCi 4|300N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2129_1728943216/DCi_4-300N_front_no_top_shadow_x_large_2x.webp', '4096x985', '2000x481'),
    image('Rear', 'dci-4-300n-rear.webp', 'Crown DCi Network 4채널 후면 커넥터 패널', 'HARMAN', 'Crown DCi 4|300N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2202_1729004843/DCi_Network_4_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1114', '2000x544')
  ],
  'dci-4-600n': [
    image('Front', 'dci-4-600n-front.webp', 'Crown DCi 4|600N 전면', 'HARMAN', 'Crown DCi 4|600N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2123_1728943243/DCi_4-600N_front_no_top_shadow_x_large_2x.webp', '4096x990', '2000x483'),
    image('Rear', 'dci-4-600n-rear.webp', 'Crown DCi Network 4채널 후면 커넥터 패널', 'HARMAN', 'Crown DCi 4|600N', 'https://adn.harmanpro.com/product_attachments/product_attachments/2210_1729004854/DCi_Network_4_CH_Backpanel_no_top_w_shadow_x_large_2x.webp', '4096x1114', '2000x544')
  ],
  'cdi-2-1200bl': [
    image('Front', 'cdi-2-1200bl-front.webp', 'Crown CDi 2|1200BL 전면', 'HARMAN', 'Crown CDi 2|1200BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6084_1728939495/Crown_CDi_DriveCore_21200BL_Front_x_large_2x.webp', '4096x1274', '2000x622'),
    image('Rear', 'cdi-2-1200bl-rear.webp', 'Crown CDi 2|1200BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 2|1200BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6088_1728989443/Crown_CDi_DriveCore_21200BL_Rear_x_large_2x.webp', '4096x1386', '2000x677')
  ],
  'cdi-4-300bl': [
    image('Front', 'cdi-4-300bl-front.webp', 'Crown CDi 4|300BL 전면', 'HARMAN', 'Crown CDi 4|300BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6052_1728939545/Crown_CDi_DriveCore_4300BL_Front_x_large_2x.webp', '4096x1231', '2000x601'),
    image('Rear', 'cdi-4-300bl-rear.webp', 'Crown CDi 4|300BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|300BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6056_1728989787/Crown_CDi_DriveCore_4300BL_Rear_x_large_2x.webp', '4096x1394', '2000x681')
  ],
  'cdi-4-600bl': [
    image('Front', 'cdi-4-600bl-front.webp', 'Crown CDi 4|600BL 전면', 'HARMAN', 'Crown CDi 4|600BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6068_1728939519/Crown_CDi_DriveCore_4600BL_Front_x_large_2x.webp', '4096x1332', '2000x650'),
    image('Rear', 'cdi-4-600bl-rear.webp', 'Crown CDi 4|600BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|600BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6072_1728989614/Crown_CDi_DriveCore_4600BL_Rear_x_large_2x.webp', '4096x1398', '2000x683')
  ],
  'cdi-4-1200bl': [
    image('Front', 'cdi-4-1200bl-front.webp', 'Crown CDi 4|1200BL 전면', 'HARMAN', 'Crown CDi 4|1200BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6100_1728939470/Crown_CDi_DriveCore_41200BL_Front_x_large_2x.webp', '4096x1319', '2000x644'),
    image('Rear', 'cdi-4-1200bl-rear.webp', 'Crown CDi 4|1200BL 후면 커넥터 패널', 'HARMAN', 'Crown CDi 4|1200BL', 'https://adn.harmanpro.com/product_attachments/product_attachments/6104_1728989269/Crown_CDi_DriveCore_41200BL_Rear_x_large_2x.webp', '4096x1418', '2000x692')
  ],
  'dci-4-600da': [
    image('Front', 'dci-4-600da-front.webp', 'Crown DCi 4|600DA 전면', 'HARMAN', 'Crown DCi 4|600DA', 'https://adn.harmanpro.com/product_attachments/product_attachments/6730_1728935045/Crown_DCi_4600_DA_Front_x_large_2x.webp', '4096x892', '2000x436'),
    image('Rear', 'dci-4-600da-rear.webp', 'Crown DCi 4|600DA 후면 Dante/AES67 포트 패널', 'HARMAN', 'Crown DCi 4|600DA', 'https://adn.harmanpro.com/product_attachments/product_attachments/10509_1728962194/Crown_DCi_4600_DA_Back_x_large_2x.webp', '4096x2731', '2000x1333')
  ],
  'comtech-d-2125': [
    image('Front', 'ctd-2125-front.webp', 'Crown ComTech CTD-2125 전면', 'HARMAN', 'Crown CTD-2125', 'https://adn.harmanpro.com/product_attachments/product_attachments/13173_1748629581/Crown_ComTech_CTD-2125_ProductPhoto_Front_1605x1605_x_large_x_large_2x.webp', '4096x832', '2000x406')
  ]
,
  ulxd4q: [
    image('Front', 'ulxd4q-front.webp', 'Shure ULXD4Q 쿼드 채널 디지털 무선 수신기 정면', 'Shure', 'ULXD4Q Quad-Channel Digital Wireless Receiver', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/8ed/a9e/17-/large/e5ed31006c35010746bf58406c28c521.jpeg', '1500x1500', '1500x1500')
  ],
  ulxd4d: [
    image('Front', 'ulxd4d-front.webp', 'Shure ULXD4D 듀얼 채널 디지털 무선 수신기 정면', 'Shure', 'ULXD4D Dual-Channel Digital Wireless Receiver', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/e56/bfb/5a-/large/f57b35ec5c33ecffc76308949745308c.jpeg', '1500x1500', '1500x1500')
  ],
  ulxd4: [
    image('Front', 'ulxd4-front.webp', 'Shure ULXD4 단일 채널 디지털 무선 수신기 정면', 'Shure', 'ULXD4 Digital Wireless Receiver', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/a0d/43b/33-/large/c13a96be17d516bdbc82c29ad244bb8d.jpeg', '1500x1500', '1500x1500')
  ],
  'ulxd2-beta58': [
    image('Front', 'ulxd2-beta58-front.webp', 'Shure ULXD2/B58 핸드헬드 송신기(BETA 58A 캡슐) 정면', 'Shure', 'ULXD2/B58 Digital Handheld Transmitter with BETA 58A Capsule', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/5f0/bf7/b6-/large/21f64fc1083c70ea7c7f935e9346e799.jpeg', '1500x1500', '1500x1500')
  ],
  'ulxd2-beta87': [
    image('Front', 'ulxd2-beta87-front.webp', 'Shure ULXD2/B87A 핸드헬드 송신기(BETA 87A 캡슐) 정면', 'Shure', 'ULXD2/B87A Digital Handheld Transmitter with BETA 87A Capsule', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/789/0e3/cb-/large/8ffa3b5e2885876add7f5dcbfbfe7917.jpeg', '1500x1500', '1500x1500')
  ],
  ulxd1: [
    image('Front', 'ulxd1-front.webp', 'Shure ULXD1 바디팩 송신기 정면', 'Shure', 'ULXD1 Bodypack Transmitter', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/a0a/c6b/28-/large/73167ef4f4c40e32e7b2acec5bd46931.jpeg', '1500x1500', '1500x1500')
  ],
  ulxd8: [
    image('Front', 'ulxd8-front.webp', 'Shure ULXD8 구즈넥 베이스 송신기 정면(구즈넥 마이크 미포함)', 'Shure', 'ULXD8 Wireless Gooseneck Base Transmitter', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/2cb/d03/e8-/large/e7ec7bd49e113c832e2594fa8d8ff9bc.jpeg', '1500x1500', '1500x1500')
  ],
  'ulxd2-ksm9': [
    image('Front', 'ulxd2-ksm9-front.webp', 'Shure ULXD2/KSM9 핸드헬드 송신기(KSM9 캡슐) 정면', 'Shure', 'ULXD2/KSM9 Digital Handheld Transmitter with KSM9 Capsule', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/b48/96d/cd-/large/fe4e1404fa789de278c62e853c455d11.jpeg', '1500x1500', '1500x1500')
  ],
  qlxd4: [
    image('Front', 'qlxd4-front.webp', 'Shure QLXD4 디지털 무선 수신기 정면', 'Shure', 'QLXD4 Digital Wireless Receiver', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/068/c56/55-/large/fe74a71f0230c0e16aff9fb54e9387d6.jpeg', '1500x1500', '1500x1500')
  ],
  qlxd1: [
    image('Front', 'qlxd1-front.webp', 'Shure QLXD1 바디팩 송신기 정면', 'Shure', 'QLXD1 Bodypack Transmitter', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/1d1/efc/61-/large/c81c9a619ef8966f5506a229ca954e5b.jpeg', '1500x1500', '1500x1500')
  ],
  'qlxd2-beta87a': [
    image('Front', 'qlxd2-beta87a-front.webp', 'Shure QLXD2/B87A 핸드헬드 송신기(BETA 87A 캡슐) 정면', 'Shure', 'QLXD2/B87A Handheld Transmitter with BETA 87A Capsule', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/be7/f9b/fd-/large/731c0285f0a34a2d7a1e0f659dea54a8.jpeg', '1500x1500', '1500x1500')
  ],
  'qlxd2-beta58': [
    image('Front', 'qlxd2-beta58-front.webp', 'Shure QLXD2/B58A 핸드헬드 송신기(BETA 58A 캡슐) 정면', 'Shure', 'QLXD2/B58A Handheld Transmitter with BETA 58A Capsule', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/c5f/bac/92-/large/eb22fb750c52c34d58c82492cce87518.jpeg', '1500x1500', '1500x1500')
  ],
  ua874xa: [
    image('Front', 'ua874xa-front.webp', 'Shure UA874XA 능동형 지향성 안테나 (902-960MHz 라벨 표기 확인됨)', 'Shure', 'UA874 Active Directional Antenna (variant UA874XA, 902-960 MHz)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/248/aee/26-/original/203aa9b5f7aeb51664dfed7d966905cd.webp', '3000x3000', '1500x1500')
  ],
  'a900w-r-gm': [
    image('Front', 'a900w-r-gm-front.webp', 'A900W-R-GM 키트 구성품 (흰색 백커버, Gripple 커넥터, 스틸 케이블, 케이블 타이)', 'Shure', 'A900-GM Gripple Suspension Mount Kit for Ceiling Array Microphones (variant A900W-R-GM: Round, White Cover)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/902/02b/95-/original/e52db7762240a04554eea3dea3fd4ad3.webp', '3000x3000', '1500x1500')
  ],
  mx395: [
    image('Front', 'mx395-front.webp', 'MX395 카트리지 3종(녹색/적색 LED 링 포함 블랙, 화이트) 제품 이미지', 'Shure', 'MX395 Microflex Low Profile Boundary Microphone', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/799/333/29-/original/05489c7b942819560ab7c2f6763d2b31.webp', '2397x2397', '1500x1500')
  ],
  'ua844-swb': [
    image('Front', 'ua844swb-front.webp', 'UA844+SWB 랙마운트 전면 패널 (전원 LED, 470-952MHz 표기)', 'Shure', 'UA844+SWB Antenna Distribution System (5-way active antenna splitter and power distribution)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/6f8/07b/2a-/original/5dc9d3e64aaa92a9c959f1ef9bbed0a3.webp', '3000x3000', '1500x1500'),
    image('Rear', 'ua844swb-rear.webp', 'UA844+SWB 후면 패널 (Antenna A/B, RF Output A/B, Cascade, Power In/Out 커넥터)', 'Shure', 'UA844+SWB Antenna Distribution System (5-way active antenna splitter and power distribution)', 'https://products.shureweb.eu/shure_product_db/product_images/files/64a/850/63-/original/de2d6cc3ee3e23eccb299dffdc5a22c9.webp', '3000x3000', '1500x1500')
  ],
  'mx418d-c': [
    image('Front', 'mx418dc-front.webp', 'MX400 시리즈 구스넥 마이크 패밀리 (좌측 데스크탑 베이스 부착형이 MX418D/C 해당)', 'Shure', 'MX418D/C — MX400D Series Desktop Gooseneck Microphone, 18", Cardioid, with Desktop Base', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/95c/0be/80-/original/7a0d43b8f52361576df757e5dc85dc75.png', '3000x3000', '1500x1500')
  ],
  'mxcwapt-w': [
    image('Front', 'mxcwaptw-front.webp', 'MXCWAPT 액세스 포인트 트랜시버 상단면 (디스플레이 및 조작 버튼)', 'Shure', 'MXCWAPT Access Point Transceiver (regional variant MXCWAPT-W: Worldwide)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/84f/73b/9c-/original/e81ee1c5db5e07d5cb8d9244c4ab8910.webp', '3000x3000', '1500x1500'),
    image('Other', 'mxcwaptw-detail.webp', 'MXCWAPT 측면/저면 각도 (LCD 디스플레이, PoE/네트워크 상태 LED, 하단 케이블 정리부)', 'Shure', 'MXCWAPT Access Point Transceiver (regional variant MXCWAPT-W: Worldwide)', 'https://products.shureweb.eu/shure_product_db/product_images/files/967/6e0/7e-/original/39209942fef990c36ce98adf69ee2e9e.webp', '3000x3000', '1500x1500')
  ],
  'mxc420-c': [
    image('Front', 'mxc420c-front.webp', 'MXC 시리즈 구스넥 마이크 3종(길이별) — 10핀 모듈러 커넥터 하단부', 'Shure', 'MXC420/C — MXC Gooseneck Microphone, 20", Single-flex, Cardioid', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/b12/004/76-/original/0cc6731625430e0cc0cca0c921b8163e.webp', '2562x2562', '1500x1500')
  ],
  'mxa925w-r': [
    image('Front', 'mxa925wr-front.webp', 'MXA925 색상/폼팩터 4종 패밀리샷 (화이트 사각, 블랙 사각, 화이트 원형, 블랙 원형) — MXA925W-R은 우측에서 세 번째(화이트 원형)', 'Shure', 'MXA925 Ceiling Array Microphone (variant MXA925W-R: White, Round)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/420/286/fd-/original/a679930bcdb71c96a20196bd0b19d15d.webp', '3000x3000', '1500x1500')
  ],
  ua864a: [
    image('Front', 'ua864a-front.webp', 'UA864 벽면형 광대역 안테나 (화이트 하우징, 전면 게인 스위치/LED)', 'Shure', 'UA864 Wall-Mounted Wideband Antenna (variant UA864A, 650-952 MHz)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/265/152/2a-/original/360efcae2b1c88e5f044c28fd536eedc.webp', '3000x3000', '1500x1500'),
    image('Rear', 'ua864a-rear.webp', 'UA864 후면 마운팅 플레이트 (케이블 배선 채널, BNC 커넥터, 게인 스위치 라벨)', 'Shure', 'UA864 Wall-Mounted Wideband Antenna (variant UA864A, 650-952 MHz)', 'https://products.shureweb.eu/shure_product_db/product_images/files/a39/ea7/e1-/original/bbe7a66c6bc370a61bc0e5047fe0a083.webp', '3000x3000', '1500x1500')
  ],
  'mx392-c': [
    image('Front', 'mx392c-front.webp', 'MX392 바운더리 마이크로폰 (원형 로우프로파일 하우징, 상단 케이블 출구)', 'Shure', 'MX392/C Microflex Boundary Microphone (Cardioid, Top Cable Exit)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/831/97f/c9-/original/77bca0e1da0c0c30e908e78d266c8c8a.webp', '3000x3000', '1500x1500')
  ],
  ua845uwb: [
    image('Front', 'ua845uwb-front.webp', 'UA845UWB 전면 패널 (5개 대역 선택 LED, SET 버튼, 전원 스위치)', 'Shure', 'UA845UWB Antenna Distribution System (Active VHF/UHF Wideband Antenna/Power Distribution, 5-way)', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/549/2ef/c1-/original/5f45082dd425412462578da6f3dc45e3.webp', '3300x3300', '1500x1500'),
    image('Rear', 'ua845uwb-rear.webp', 'UA845UWB 후면 패널 (AC 전원 인렛/아울렛, Antenna A/B, RF Output A/B, Cascade 커넥터)', 'Shure', 'UA845UWB Antenna Distribution System (Active VHF/UHF Wideband Antenna/Power Distribution, 5-way)', 'https://products.shureweb.eu/shure_product_db/product_images/files/a35/035/23-/original/9222484608393bff08cfc97cf9fb98b2.webp', '3300x3300', '1500x1500')
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
  'rally-bar': 'rally-bar-front.webp',
  'mezzo-322-ad': 'mezzo-322-ad-front.webp',
  'v-02hd-mk-ii': 'v-02hd-mk-ii-perspective.webp',
  'uvc-01': 'uvc-01-perspective.webp',
  'eb-l530u': 'eb-l530u-main.webp',
  'avio-usb-c': 'avio-usb-c-main.webp',
  mxcw640: 'mxcw640-main.webp',
  gsm4248px: 'gsm4248px-rear.webp',
  'aquilon-rs1': 'aquilon-rs1-front.webp',
  'sx-1216-rti': 'sx-1216-rti-front.webp',
  'led-780h': 'led-780h-front.webp',
  'hdmi20-optj-tx90': 'hdmi20-optj-tx90-front.webp',
  'hdmi20-optj-rx90': 'hdmi20-optj-rx90-front.webp',
  'avio-bt': 'avio-bt-main.webp',
  'avio-2ch-in': 'avio-2ch-in-main.webp',
  'avio-2ch-out': 'avio-2ch-out-main.webp',
  'hyperdeck-studio-hd-pro': 'hyperdeck-studio-hd-pro-main.webp',
  'hyperdeck-studio-hd-plus': 'hyperdeck-studio-hd-plus-main.webp',
  'hyperdeck-studio-hd-mini': 'hyperdeck-studio-hd-mini-main.webp',
  'x100pro-7u': 'x100pro-7u-front.webp',
  'x100pro-4u': 'x100pro-4u-front.webp',
  'x100pro-2u': 'x100pro-2u-front.webp',
  'tio1608-d2': 'tio1608-d2-front.webp',
  dm3: 'dm3-front.webp',
  'rio1608-d3': 'rio1608-d3-front.webp',
  'rio3224-d3': 'rio3224-d3-front.webp',
  tr535n: 'tr535n-front.webp',
  tr535: 'tr535-front.webp',
  tr335: 'tr335-front.webp',
  tr315: 'tr315-perspective.webp',
  cl01: 'cl01-front.webp',
  vs5: 'lumantek-vs5-main.webp',
  vs10: 'lumantek-vs10-main.webp',
  'ez-md-plus': 'lumantek-ez-md-main.webp',
  'ez-shv-plus': 'lumantek-ez-shv-main.webp',
  'ez-hsv-plus': 'lumantek-ez-hsv-main.webp',
  'rally-mic-pod-hub': 'logitech-rally-mic-pod-hub-perspective.webp',
  'rally-mic-pod-extension-cable': 'logitech-rally-mic-pod-extension-cable-main.webp',
  'strong-usb-cable': 'logitech-strong-usb-cable-main.webp',
  'rally-plus': 'logitech-rally-plus-main.webp',
  'rally-mic-pod': 'logitech-rally-mic-pod-perspective.webp',
  'pt-vmz71': 'pt-vmz71-main.webp',
  'pt-vmz61': 'pt-vmz61-main.webp',
  'pt-vmz51': 'pt-vmz51-main.webp',
  'pt-mz14k': 'pt-mz14kl-main.webp',
  'pt-mz11k': 'pt-mz11kl-main.webp',
  'pt-mz882': 'pt-mz882-main.webp',
  'pulse-4k': 'pulse4k-front.webp',
  'eikos-4k': 'eikos4k-front.webp',
  'aquilon-rs2': 'aquilonrs2-front.webp',
  'zenith-100': 'zenith100-front.webp',
  'zenith-200': 'zenith200-front.webp',
  rc400t: 'rc400t-front.webp',
  'nx-1200': 'nx1200-main.webp',
  'nx-2200': 'nx2200-main.webp',
  'nx-3200': 'nx3200-main.webp',
  'varia-100': 'varia100-main.webp',
  'varia-80': 'varia80-main.webp',
  'varia-sl80': 'variasl80-main.webp',
  'varia-sl50': 'variasl50-main.webp',
  xsm4216f: 'xsm4216f-main.webp',
  gsm4212p: 'gsm4212p-main.webp',
  gsm4230p: 'gsm4230p-main.webp',
  gsm4230px: 'gsm4230px-main.webp',
  gsm4248p: 'gsm4248p-main.webp',
  gs116pp: 'gs116pp-main.webp',
  gs108pp: 'gs108pp-main.webp',
  'v-02hd': 'v-02hd-main.webp',
  'v-1hd-plus': 'v-1hd-plus-main.webp',
  'vr-4hd': 'vr-4hd-main.webp',
  'vr-6hd': 'vr-6hd-main.webp',
  'v-8hd': 'v-8hd-main.webp',
  'v-60hd': 'v-60hd-main.webp',
  'v-80hd': 'v-80hd-main.webp',
  'v-160hd': 'v-160hd-main.webp',
  smartvision40: 'smartvision40-main.webp',
  vcm35: 'vcm35-main.webp',
  uvc86: 'uvc86-main.webp',
  cm20: 'cm20-main.webp',
  cs10: 'cs10-main.webp',
  avhub: 'avhub-main.webp',
  'uvc85-byod': 'uvc85-byod-main.webp',
  cpe40: 'cpe40-main.webp',
  'ec-4bv': 'ec-4bv-main.webp',
  'blu-101': 'blu-101-main.webp',
  'blu-100': 'blu-100-main.webp',
  'blu-160': 'blu-160-main.webp',
  'blu-50': 'blu-50-main.webp',
  'blu-aec-in': 'blu-aec-in-main.webp',
  'blucard-in': 'blucard-in-main.webp',
  'blucard-out': 'blucard-out-main.webp',
  'blu-dan': 'blu-dan-main.webp',
  'd-cerno-cu': 'd-cerno-cu-main.webp',
  'd-cerno-ae': 'd-cerno-ae-main.webp',
  'd-cerno-d-sl': 'd-cerno-d-sl-main.webp',
  'd-mic-50-sl': 'd-mic-50-sl-main.webp',
  'plixus-ae-r-dante': 'plixus-ae-r-dante-main.webp',
  'plixus-ae-r-ps': 'plixus-ae-r-ps-main.webp',
  'confidea-flex': 'confidea-flex-main.webp',
  'plixus-next': 'plixus-next-main.webp',
  'd-mic-40-sl': 'd-mic-40-sl-main.webp',
  'ultrix-ns-fr2': 'ultrix-ns-fr2-main.webp',
  'ultrix-hdx-io': 'ultrix-hdx-io-main.webp',
  ultripower: 'ultripower-main.webp',
  'ultripower-ps': 'ultripower-ps-main.webp',
  'ultritouch-2-hr': 'ultritouch-2-hr-main.webp',
  'novastar-h2': 'h2-front.webp',
  'novastar-h5': 'h5-front.webp',
  'h-preview-card-2xrj45-1xhdmi13': 'h-preview-card-2xrj45-1xhdmi13-main.webp',
  'h-input-card-4xhdmi': 'h-input-card-4xhdmi-main.webp',
  'h-input-card-hdmi20-dp12-4k': 'h-input-card-hdmi20-dp12-4k-main.webp',
  'h-input-card-hdmi20-4k': 'h-input-card-hdmi20-4k-main.webp',
  'h-input-card-dp12-4k': 'h-input-card-dp12-4k-main.webp',
  'h-input-card-2xhdmi20-2xdp12': 'h-input-card-2xhdmi20-2xdp12-main.webp',
  'h-input-card-12g-sdi': 'h-input-card-12g-sdi-main.webp',
  'h-input-card-4x3g-sdi': 'h-input-card-4x3g-sdi-main.webp',
  'h-output-card-4xhdmi-dl': 'h-output-card-4xhdmi-dl-main.webp',
  'h-output-card-hdmi20-4k': 'h-output-card-hdmi20-4k-main.webp',
  'h-800w-psu': 'h-800w-psu-main.webp',
  'eb-pq2220b': 'eb-pq2220b-main.webp',
  'eb-l790su': 'eb-l790su-main.webp',
  'eb-l690u': 'eb-l690u-main.webp',
  'eb-l895e': 'eb-l895e-main.webp',
  'eb-l795se': 'eb-l795se-main.webp',
  'eb-l695se': 'eb-l695se-main.webp',
  'eb-l895u': 'eb-l895u-main.webp',
  'eb-l790u': 'eb-l790u-main.webp',
  'eb-pq2216b': 'eb-pq2216b-main.webp',
  'eb-pq2213b': 'eb-pq2213b-main.webp',
  'eb-pu2216b': 'eb-pu2216b-main.webp',
  'eb-pu2213b': 'eb-pu2213b-main.webp',
  'eb-pu2010w-b': 'eb-pu2010w-b-main.webp',
  'eb-pu1008b': 'eb-pu1008b-main.webp',
  'eb-l260f': 'eb-l260f-main.webp',
  hg43u800fnfxkr: 'hg43u800fnfxkr-main.webp',
  hg50u800fnfxkr: 'hg50u800fnfxkr-main.webp',
  hg65u800fnfxkr: 'hg65u800fnfxkr-main.webp',
  lh32qmcebgcxkr: 'lh32qmcebgcxkr-main.webp',
  lh43qmcebgcxkr: 'lh43qmcebgcxkr-main.webp',
  lh85qmcebgcxkr: 'lh85qmcebgcxkr-main.webp',
  lh98qecedgcxkr: 'lh98qecedgcxkr-main.webp',
  lh98qmcebgcxkr: 'lh98qmcebgcxkr-main.webp',
  lh43qhcebgcxkr: 'lh43qhcebgcxkr-main.webp',
  lh75qhcebgcxkr: 'lh75qhcebgcxkr-main.webp',
  lh115qhfebgxkr: 'lh115qhfebgxkr-main.webp',
  lh55vmcrbgbxkr: 'lh55vmcrbgbxkr-main.webp',
  lh55vhcrbgbxkr: 'lh55vhcrbgbxkr-main.webp',
  kq75lsf03wfxkr: 'kq75lsf03wfxkr-main.webp',
  lh55wmfwbgcxkr: 'lh55wmfwbgcxkr-main.webp',
  lh75wmfwlgcxkr: 'lh75wmfwlgcxkr-main.webp',
  'control-23-1': 'control-23-1-main.webp',
  'control-25-1': 'control-25-1-main.webp',
  'control-28-1': 'control-28-1-main.webp',
  'ac18-95': 'ac18-95-main.webp',
  'ac18-26': 'ac18-26-main.webp',
  'control-412ct': 'control-412ct-main.webp',
  'control-414ct': 'control-414ct-main.webp',
  'control-416ct': 'control-416ct-main.webp',
  'control-418ct': 'control-418ct-main.webp',
  'control-447ct': 'control-447ct-main.webp',
  'control-419cst': 'control-419cst-main.webp',
  'control-440cst': 'control-440cst-main.webp',
  'control-424ct': 'control-424ct-main.webp',
  'control-424lp': 'control-424lp-main.webp',
  'control-426ct': 'control-426ct-main.webp',
  'control-426lp': 'control-426lp-main.webp',
  'quattrocanali-2404-dspd': 'quattrocanali-2404-dspd-front.webp',
  'quattrocanali-4804-dspd': 'quattrocanali-4804-dspd-front.webp',
  'duecanali-1604-dsp': 'duecanali-1604-dsp-front.webp',
  'mezzo-602-ad': 'mezzo-602-ad-front.webp',
  'mezzo-322-a': 'mezzo-322-a-front.webp',
  'mezzo-602-a': 'mezzo-602-a-front.webp',
  'duecanali-1604-dspd': 'duecanali-1604-dspd-front.webp',
  'quattrocanali-1204-dspd': 'quattrocanali-1204-dspd-front.webp',
  'duecanali-804-dsp': 'duecanali-804-dsp-front.webp',
  'quattrocanali-1204-dsp': 'quattrocanali-1204-dsp-front.webp',
  'quattrocanali-4804-dsp': 'quattrocanali-4804-dsp-front.webp',
  'mezzo-324-ad': 'mezzo-324-ad-front.webp',
  'mezzo-604-ad': 'mezzo-604-ad-front.webp',
  'mezzo-324-a': 'mezzo-324-a-front.webp',
  'mezzo-604-a': 'mezzo-604-a-front.webp',
  'duecanali-804-dspd': 'duecanali-804-dspd-front.webp',
  'quattrocanali-2404-dsp': 'quattrocanali-2404-dsp-front.webp'
,
  'cdi-2-300bl': 'cdi-2-300bl-front.webp',
  'dci-2-300': 'dci-2-300-front.webp',
  'cdi-2-300': 'cdi-2-300-front.webp',
  'dci-2-300n': 'dci-2-300n-front.webp',
  'i-tech-4x3500hd': 'itech-4x3500hd-front.webp',
  'cdi-2-600bl': 'cdi-2-600bl-front.webp',
  'dci-4-300da': 'dci-4-300da-front.webp',
  'comtech-d-4125': 'ctd-4125-front.webp',
  'comtech-d-8125': 'ctd-8125-front.webp',
  'dci-2-600': 'dci-2-600-front.webp',
  'dci-4-300': 'dci-4-300-front.webp',
  'dci-4-600': 'dci-4-600-front.webp',
  'cdi-2-600': 'cdi-2-600-front.webp',
  'cdi-2-1200': 'cdi-2-1200-front.webp',
  'cdi-4-300': 'cdi-4-300-front.webp',
  'cdi-4-600': 'cdi-4-600-front.webp',
  'cdi-4-1200': 'cdi-4-1200-front.webp',
  'dci-2-600n': 'dci-2-600n-front.webp',
  'dci-4-300n': 'dci-4-300n-front.webp',
  'dci-4-600n': 'dci-4-600n-front.webp',
  'cdi-2-1200bl': 'cdi-2-1200bl-front.webp',
  'cdi-4-300bl': 'cdi-4-300bl-front.webp',
  'cdi-4-600bl': 'cdi-4-600bl-front.webp',
  'cdi-4-1200bl': 'cdi-4-1200bl-front.webp',
  'dci-4-600da': 'dci-4-600da-front.webp',
  'comtech-d-2125': 'ctd-2125-front.webp'
,
  ulxd4q: 'ulxd4q-front.webp',
  ulxd4d: 'ulxd4d-front.webp',
  ulxd4: 'ulxd4-front.webp',
  'ulxd2-beta58': 'ulxd2-beta58-front.webp',
  'ulxd2-beta87': 'ulxd2-beta87-front.webp',
  ulxd1: 'ulxd1-front.webp',
  ulxd8: 'ulxd8-front.webp',
  'ulxd2-ksm9': 'ulxd2-ksm9-front.webp',
  qlxd4: 'qlxd4-front.webp',
  qlxd1: 'qlxd1-front.webp',
  'qlxd2-beta87a': 'qlxd2-beta87a-front.webp',
  'qlxd2-beta58': 'qlxd2-beta58-front.webp',
  ua874xa: 'ua874xa-front.webp',
  'a900w-r-gm': 'a900w-r-gm-front.webp',
  mx395: 'mx395-front.webp',
  'ua844-swb': 'ua844swb-front.webp',
  'mx418d-c': 'mx418dc-front.webp',
  'mxcwapt-w': 'mxcwaptw-front.webp',
  'mxc420-c': 'mxc420c-front.webp',
  'mxa925w-r': 'mxa925wr-front.webp',
  ua864a: 'ua864a-front.webp',
  'mx392-c': 'mx392c-front.webp',
  ua845uwb: 'ua845uwb-front.webp'
};
