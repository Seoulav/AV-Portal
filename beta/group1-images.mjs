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
  'varia-sl50': 'variasl50-main.webp'
};
