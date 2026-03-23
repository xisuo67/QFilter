import type { IconSvgElement } from "@hugeicons/react";

/**
 * 支付宝品牌标识（Hugeicons 无官方图标）。
 * 使用「支」字形简化线条，与 HugeiconsIcon 元组格式一致。
 */
export const AlipayBrandIcon = [
  ["path", { d: "M5 6h14", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", key: "0" }],
  ["path", { d: "M12 6v12", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", key: "1" }],
  ["path", { d: "M5 11h14", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", key: "2" }],
  ["path", { d: "M12 14l-3 4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", key: "3" }],
  ["path", { d: "M12 14l3 4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", key: "4" }],
] as const satisfies IconSvgElement;
