/**
 * utils.js — 视觉工具函数
 */

/** 流场角度：多层正弦叠加的廉价平滑噪声，适合粒子对流 */
export function flowAngle(x, y, t, scale = 0.0022, speed = 0.4) {
  const s = scale;
  return Math.sin(x * s + t * speed) * 1.4
       + Math.cos(y * s * 1.3 - t * speed * 0.7) * 1.1
       + Math.sin((x + y) * s * 0.5 + t * speed * 0.5) * 0.8;
}
