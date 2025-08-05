# KiwiSDR Scheduled Recorder

> Last update: Aug 5, 2025

[English version](#english)

此油猴脚本为 KiwiSDR 网页而设计，使得用户可以定时开关录音功能。

## 特点：
- 根据预定时间在 KiwiSDR 上自动启动和停止录制，精确到秒(具体精确度取决于设备时间和 Kiwi 的缓存造成的延迟)。
- 可以在录制结束后自动保存WF，但**仅限结束前的300s**。
- 默认通配 KiwiSDR 代理URL(*.proxy.kiwisdr.com)，如有需要可以自己在脚本中添加其它站点。 
- 稍微简化了设置精确录音时间的过程。

如果需要适配更多KiwiSDR站点，请自行在脚本开头中添加一行：
```
// @match        https://irk.swl.su/*
```
其中`https://irk.swl.su/*`可以修改成任何你需要的KiwiSDR站点，注意`http(s)`和通配符`*`。不需要添加端口号。

- - -
# English

This Tampermonkey script is designed for KiwiSDR sites, allowing users to schedule the recording function.

## Features:
- Automatically starts and stops recording on KiwiSDR at scheduled times, accurate to the second (precision depends on device time and delays caused by Kiwi's buffering).
- Can automatically save the WF after recording ends, but **only for the last 300s**.
- By default, it matches KiwiSDR proxy URLs (*.proxy.kiwisdr.com); you can add other sites in the script if needed.
- Simplifies the process of setting precise recording times.

If you need to adapt to more KiwiSDR sites, add a line at the beginning of the script:
```
// @match        https://irk.swl.su/*
```
Where `https://irk.swl.su/*` can be changed to any KiwiSDR site you need. No need to include the port number.
