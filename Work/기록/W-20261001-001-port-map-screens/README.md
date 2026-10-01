# 후면 지도 캡처

실측 뷰포트1280×850 / 390×850, Chromium(Edge), reduced motion. `local.json`은 제품10화면+기존대표6화면 결과. `comparison-*`는 실제 RTCOM QMS Port Map과 ULXD4D를 나란히 놓은 그림이다. 카드 캡처만 고정 헤더를 제외했으며 전체 화면에는 헤더가 있다.

| 제품 | 1280px Port Map | 390px Port Map | 390px 오른쪽 끝 |
|---|---|---|---|
| ulxd4d | [보기](local-ulxd4d-1280-port-map.png) | [보기](local-ulxd4d-390-port-map.png) | [보기](local-ulxd4d-390-port-map-right.png) |
| novastar-h5 | [보기](local-novastar-h5-1280-port-map.png) | [보기](local-novastar-h5-390-port-map.png) | [보기](local-novastar-h5-390-port-map-right.png) |
| dci-4-600da | [보기](local-dci-4-600da-1280-port-map.png) | [보기](local-dci-4-600da-390-port-map.png) | [보기](local-dci-4-600da-390-port-map-right.png) |
| eb-pq2220b | [보기](local-eb-pq2220b-1280-port-map.png) | [보기](local-eb-pq2220b-390-port-map.png) | [보기](local-eb-pq2220b-390-port-map-right.png) |

[PC RTCOM 비교](comparison-ulxd4d-rtcom-1280.png) · [모바일 RTCOM 비교](comparison-ulxd4d-rtcom-390.png)

`before-*`/`after-*`는 BRC-AM7·DM7·UA874XA 보존 대조다. `local-제품-폭.png`는 시범 전체 화면이며 Aquilon은 사진 fallback 유지다.

## 실제 공개 캡처

PR149 병합본 Pages 성공 후 실제 공개 주소에서 다시 검증했다. `public.json`은10개 시범 화면·6개 대표 화면의 실측이다.

| 제품 | 1280px | 390px |
|---|---|---|
| ULXD4D | [공개 PC](public-ulxd4d-1280-port-map.png) | [공개 모바일](public-ulxd4d-390-port-map.png) |
| H5 | [공개 PC](public-novastar-h5-1280-port-map.png) | [공개 모바일](public-novastar-h5-390-port-map.png) |
| Crown DCi 4\|600DA | [공개 PC](public-dci-4-600da-1280-port-map.png) | [공개 모바일](public-dci-4-600da-390-port-map.png) |
| Epson 부분 지도 | [공개 PC](public-eb-pq2220b-1280-port-map.png) | [공개 모바일](public-eb-pq2220b-390-port-map.png) |

모바일은 `public-제품-390-port-map-right.png`에 사진 오른쪽 끝도 남겼다. Aquilon은 `public-aquilon-rs1-폭.png`에서 기존 사진 fallback을 확인한다.
