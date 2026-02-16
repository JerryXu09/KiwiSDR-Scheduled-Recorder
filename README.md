# KiwiSDR Scheduled Recorder

[English](#english) | 中文

KiwiSDR 网页端定时录音油猴脚本，支持预设频率与解调模式。

## 功能

- **定时录音** — 设定起止时间，自动开始/停止录音，精确到秒
- **频率预设** — 录制开始时自动跳转至目标频率，无需手动守候
- **解调模式** — 支持全部 18 种模式（AM / AMN / AMW / SAM / SAL / SAU / SAS / QAM / DRM / LSB / LSN / USB / USN / CW / CWN / NBFM / NNFM / IQ）
- **保存频谱图** — 录制结束后可选自动导出瀑布图
- **录音中断检测** — 若录音意外中断，自动取消计划并提示
- **中英双语** — 根据浏览器语言自动切换
- **可拖拽面板** — 轻量简洁的浮动 UI，不遮挡操作

## 技术细节

脚本完全通过 KiwiSDR 内部 JS API 工作，不模拟任何按钮点击：

| 操作 | API |
|------|-----|
| 调频+切模式 | `freqmode_set_dsp_kHz(freq, mode)` |
| 开始录音 | `toggle_or_set_rec(true)` |
| 停止录音 | `toggle_or_set_rec(false)` |
| 读取录音状态 | `recording` 全局变量 |
| 保存频谱图 | `export_waterfall()` |

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 新建脚本，将 `script.user.js` 的内容粘贴进去，保存

默认匹配 `http://*.proxy.kiwisdr.com/*`。如需适配其它站点，在脚本头部添加：

```
// @match        http://your-kiwisdr-site.com/*
```

## 老版本

参见`old.user.js`，供参考。

## 使用

1. 打开任意 KiwiSDR 页面，右上角出现 **📻 定时录音** 面板
2. 点击展开，设置开始/结束时间
3. 可选填目标频率（kHz）和解调模式 — 留空则不改变当前设置
4. 可勾选"录制结束后保存频谱图"
5. 点击 **确认计划**，面板显示倒计时

到达开始时间时，脚本自动跳频 → 切模式 → 开始录音。到达结束时间时自动停止。

---

# English

Tampermonkey userscript for scheduled recording on KiwiSDR, with frequency and demodulation mode presets.

## Features

- **Scheduled recording** — set start/stop times, accurate to the second
- **Frequency preset** — auto-tune to target frequency when recording starts
- **Demodulation modes** — all 18 modes supported (AM / AMN / AMW / SAM / SAL / SAU / SAS / QAM / DRM / LSB / LSN / USB / USN / CW / CWN / NBFM / NNFM / IQ)
- **Waterfall export** — optionally save waterfall image after recording
- **Interruption detection** — alerts if recording stops unexpectedly
- **Bilingual** — auto-switches between Chinese and English
- **Draggable panel** — lightweight floating UI

## How It Works

The script uses KiwiSDR's internal JS APIs directly — no button clicking:

| Action | API |
|--------|-----|
| Tune + set mode | `freqmode_set_dsp_kHz(freq, mode)` |
| Start recording | `toggle_or_set_rec(true)` |
| Stop recording | `toggle_or_set_rec(false)` |
| Check rec state | `recording` global variable |
| Save waterfall | `export_waterfall()` |

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Create a new script, paste the contents of `script.user.js`, and save

Default match: `http://*.proxy.kiwisdr.com/*`. To add other sites:

```
// @match        http://your-kiwisdr-site.com/*
```

## About the Old Version

See `old.js`, for reference.

## Usage

1. Open any KiwiSDR page — the **📻 Scheduled Rec** panel appears at the top-right
2. Click to expand, set start/end times
3. Optionally enter target frequency (kHz) and demodulation mode — leave empty to keep current settings
4. Optionally check "Save waterfall after recording"
5. Click **Confirm**; the panel shows a live countdown

At start time the script auto-tunes → switches mode → starts recording. At end time it stops automatically.

## License

[MIT](LICENSE)
