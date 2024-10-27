# KiwiSDR-Auto-Record

[English version](#english)

此用户脚本专为与KiwiSDR一起使用而设计，允许用户设置录制的开始和停止时间，从而使录制过程自动化。该脚本在带有Tampermonkey或类似扩展的浏览器环境中运行，并通过自动单击录制按钮与KiwiSDR的界面进行交互。

## 特点：
- 根据预定时间在KiwiSDR上自动启动和停止录制。
- 默认通配KiwiSDR代理URL(*.proxy.kiwisdr.com)，如有需要可以自己在脚本中添加其它站点。 
- 简化了设置精确录音时间的过程。

如果需要适配更多KiwiSDR站点，请自行在脚本开头中添加一行：
```
// @match        https://irk.swl.su/*
```
其中`https://irk.swl.su/*`可以修改成任何你需要的KiwiSDR站点，注意`http(s)`和通配符`*`。不需要添加端口号。

- - -
# English
This user script is designed to work with KiwiSDR, allowing users to set start and stop times for recording, thereby automating the recording process. The script runs in a browser environment with Tampermonkey or a similar extension and interacts with KiwiSDR's interface by automatically clicking the record button.

## Features:
- Automatically start and stop recording on KiwiSDR at scheduled times.
- By default, the script matches KiwiSDR proxy URLs (`*.proxy.kiwisdr.com`). If necessary, you can add other URLs to the script yourself.
- Simplifies the process of setting precise recording times.

If you need to adapt this for more KiwiSDR sites, you can add a line at the beginning of the script:
```
// @match        https://irk.swl.su/*
```
Where `https://irk.swl.su/*` can be changed to any KiwiSDR site you need. Pay attention to the http(s) protocol, wildcard `*`, and note that there is no need to add a port number.
