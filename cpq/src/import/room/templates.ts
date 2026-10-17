/**
 * 회의실 타입 템플릿 (B-20261016-07 2단계).
 *
 * `data/approved/room-templates.json`은 사용자가 준 회의실 견적 샘플 39종에서
 * **품목(품명·규격)·수량·비고만** 뽑은 공개 데이터다(2026-10-16 사용자 승인:
 * "품목·수량은 공개해도 됨" — 가격·구매처 제외). 생성은 이 PC에서
 * `tools/build-room-templates.ts`가 하고, 샘플 원본·금액·구매처는 저장소에
 * 넣지 않는다.
 *
 * 스키마는 전부 `strict()`다 — 모르는 키를 조용히 통과시키면 가격 같은
 * 칸이 섞여 들어와도 눈치채지 못한다. 단가는 여기 없다. 단가는 견적을
 * 만들 때 공개 단가(`prices.json`)와 가격표(B-20261016-06)에서 붙는다.
 */
import { z } from 'zod';

/** 수량 — 양수 십진수 문자열. `0`이나 음수는 품목 행이 아니다. */
const quantityText = z
  .string()
  .regex(/^\d+(\.\d+)?$/)
  .refine((v) => Number(v) > 0, '수량은 0보다 커야 한다');

export const roomTemplateItemSchema = z
  .object({
    /** 단가표(승인 카탈로그)와 1건으로 맞은 품목만 있다. 없으면 품명·규격으로만 적는다. */
    sku: z.string().min(1).optional(),
    name: z.string().min(1),
    specification: z.string(),
    /** 샘플의 설명 칸. 가이드 D열(설명)로 들어간다. */
    description: z.string().min(1).optional(),
    unit: z.string().min(1),
    quantity: quantityText,
    /** 샘플의 비고 칸. */
    remark: z.string().min(1).optional(),
    /** 규격이 단가표 여러 품목과 맞아 고르지 못했다 — 사람이 확인한다. */
    ambiguous: z.literal(true).optional(),
  })
  .strict();

export const roomTemplateSystemSchema = z
  .object({
    name: z.string().min(1),
    items: z.array(roomTemplateItemSchema).min(1),
  })
  .strict();

export const roomTemplateSchema = z
  .object({
    /** `1-1`…`8-3`, `VIP1-1`…`VIP3-3`. */
    id: z.string().regex(/^(VIP)?\d+-\d+$/),
    /** 집계표(타입별 분류)의 타입 이름. */
    typeName: z.string().min(1),
    /** 견적 시트 머리글의 이름 그대로. 집계표와 다르면 다른 채로 둔다 — 지어 맞추지 않는다. */
    sheetTitle: z.string().min(1).optional(),
    /** 원본 시트 이름(`7-1, 8-1`처럼 두 타입이 한 시트를 쓸 수 있다). */
    sourceSheet: z.string().min(1),
    systems: z.array(roomTemplateSystemSchema).min(1),
  })
  .strict();

export const roomTemplatesFileSchema = z
  .object({
    version: z.literal(1),
    /** 출처 설명(금액 없음). */
    source: z.string().min(1),
    note: z.string().optional(),
    templates: z.array(roomTemplateSchema).min(1),
  })
  .strict();

export type RoomTemplateItem = z.infer<typeof roomTemplateItemSchema>;
export type RoomTemplateSystem = z.infer<typeof roomTemplateSystemSchema>;
export type RoomTemplate = z.infer<typeof roomTemplateSchema>;
export type RoomTemplatesFile = z.infer<typeof roomTemplatesFileSchema>;
