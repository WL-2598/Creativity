# 银河展厅 · CREATIVITY WAREHOUSE

> 一座由种子驱动的创意仓库。这里不陈列成品，只发生创造——
> 每一件展品都是一台发生器：一颗种子，一个宇宙。

本仓库是**创新仓库**：所有展品均为原创、即时生成、永不重复的创造物。
同一颗种子在每件展品中都遵循"确定性复现"的法则——分享种子，即分享一个完整的世界。

## 🏛 展品

| 展品 | 类型 | 说明 |
| ---- | ---- | ---- |
| [**星澜 STELLAR ECHO**](starlark/) | 声音 × 视觉 | 生成式环境音乐 × 实时视觉宇宙。全合成音乐引擎（13 音阶、和声进行、动机发展、欧几里得节奏、每 8 小节呼吸式演化）× 四种与频谱共振的视觉模式，支持 WAV 录音 |
| [**墨韵 INK RESONANCE**](inkflow/) | 墨色 × 诗心 | 宣纸宇宙。种子生成水墨画卷与同源绝句（起承转合、平水韵式押韵、画诗同源），可落笔、题诗、换五色墨、落印 |
| [**织梦 STORYWEAVER**](storyteller/) | 叙事 × 星图 | 一颗种子织出一则星夜短篇。八大主题词库、同篇不重样约束、打字机式逐字显现，星图随故事主题流转 |

入口：仓库根目录的 **银河展厅**（`index.html`），每件展品配实时预览。

## 🚀 运行

零依赖、零构建。任意静态服务器即可（推荐内置服务器）：

```bash
node tools/serve.mjs            # 默认 8080，服务整个仓库
```

打开后先见**银河展厅**，从展厅进入任一展品。

## 🧪 测试

仓库共 **38 项自动化测试**，覆盖全部展品的核心逻辑与引擎调度：

```bash
node --test test/composition.test.mjs     # 星澜：作曲核心（音阶/和声/动机/节奏）
node --test test/visual.test.mjs         # 星澜：视觉渲染冒烟
node --test test/audio-engine.test.mjs   # 星澜：fake AudioContext 驱动真实调度
node --test test/ink-poetry.test.mjs     # 墨韵：诗心格律与画诗同源
node --test test/ink-render.test.mjs     # 墨韵：笔法合法性与渲染冒烟
node --test test/story.test.mjs          # 织梦：叙事结构与星图冒烟
```

## 🏗 仓库结构

```
index.html              银河展厅（仓库总入口，展品实时预览）
css/gallery.css         展厅样式
js/gallery.js           展厅驱动
shared/rng.js           仓库共用：可播种随机工具（种子宇宙的基石）
starlark/               展品一：星澜（生成式音乐 × 视觉宇宙）
  index.html  css/  js/
inkflow/                展品二：墨韵（水墨画卷 × 格律诗词）
  index.html  css/  js/
storyteller/            展品三：织梦（生成式叙事 × 星图）
  index.html  css/  js/
tools/serve.mjs         零依赖静态服务器
test/                   全部自动化测试
```

## 🌱 设计哲学

- **种子即宇宙**：所有展品共享同一套可播种随机（`shared/rng.js`），一颗种子决定一个世界的全部，且完全可复现。
- **声画同源 / 画诗同源 / 景事同源**：每个展品内部，不同感官通道由同一条生成脉络统御，而非拼接。
- **发生器而非播放器**：仓库里没有"作品"，只有"发生作品的能力"——每一次进入，都是一次即时的创造。

---

*以代码造物，以像素成星。仓库持续生长。*
