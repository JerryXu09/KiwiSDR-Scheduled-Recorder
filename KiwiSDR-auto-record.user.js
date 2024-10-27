// ==UserScript==
// @name         KiwiSDR定时录音
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  让用户方便地定时开启和关闭录制。
// @author       JerryXu09
// @match        http://*.proxy.kiwisdr.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 获取录音按钮，通过类名选择器 `.id-rec1`
    const getButton = () => document.querySelector('.id-rec1');

    // 点击按钮的函数
    const clickButton = (button) => {
        if (button) {
            button.click();
            console.log('按钮已点击，操作已执行');
        } else {
            console.log('按钮未找到');
        }
    };

    // 创建用于启动点击操作的按钮
    const startButton = document.createElement('button');
    startButton.innerText = '设置定时录制';
    startButton.style.position = 'fixed';
    startButton.style.top = '10px';
    startButton.style.right = '10px';
    startButton.style.zIndex = 1000;
    document.body.appendChild(startButton);

    // 创建输入框容器
    const inputContainer = document.createElement('div');
    inputContainer.style.position = 'fixed';
    inputContainer.style.top = '50px';
    inputContainer.style.right = '10px';
    inputContainer.style.background = '#f0f0f0';
    inputContainer.style.border = '1px solid #ccc';
    inputContainer.style.padding = '10px';
    inputContainer.style.display = 'none';
    inputContainer.style.zIndex = 1000;
    document.body.appendChild(inputContainer);

    // 创建输入框和标签（用来输入具体的开始和停止时间）
    inputContainer.innerHTML = `
        <label>开始时间 (格式: YYYY-MM-DD HH:MM:SS)：<input id="startTime" type="text" placeholder="2024-10-27 14:30:00"></label><br><br>
        <label>停止时间 (格式: YYYY-MM-DD HH:MM:SS)：<input id="endTime" type="text" placeholder="2024-10-27 14:35:00"></label><br><br>
        <button id="confirmButton">确认</button>
        <button id="cancelButton">取消</button>
    `;

    const confirmButton = inputContainer.querySelector('#confirmButton');
    const cancelButton = inputContainer.querySelector('#cancelButton');

    // 显示输入框
    startButton.addEventListener('click', () => {
        inputContainer.style.display = 'block';
    });

    // 确认按钮点击事件
    confirmButton.addEventListener('click', () => {
        const startTimeInput = document.getElementById('startTime').value;
        const endTimeInput = document.getElementById('endTime').value;

        // 将用户输入的时间转换为 Date 对象
        const startTime = new Date(startTimeInput.replace(/-/g, '/')); // 兼容某些浏览器
        const endTime = new Date(endTimeInput.replace(/-/g, '/'));

        const now = new Date();

        // 校验输入时间是否合法
        if (isNaN(startTime) || isNaN(endTime)) {
            alert("请输入有效的开始和停止时间！");
            return;
        }
        if (startTime <= now) {
            alert("开始时间必须在当前时间之后！");
            return;
        }
        if (endTime <= startTime) {
            alert("停止时间必须在开始时间之后！");
            return;
        }

        // 计算与当前时间的差值，转换为毫秒
        const startDelay = startTime - now;
        const stopDelay = endTime - now;

        const button = getButton();
        startButton.disabled = true;
        startButton.innerText = '定时操作进行中...';

        // 定时开始录音
        setTimeout(() => {
            clickButton(button);
            console.log(`录音已开始：${startTimeInput}`);

            // 定时停止录音
            setTimeout(() => {
                clickButton(button);
                console.log(`录音已停止：${endTimeInput}`);

                // 恢复按钮状态
                startButton.disabled = false;
                startButton.innerText = '设置定时录制';
            }, stopDelay - startDelay);

        }, startDelay);

        // 隐藏输入框
        inputContainer.style.display = 'none';
    });

    // 取消按钮点击事件，关闭输入框
    cancelButton.addEventListener('click', () => {
        inputContainer.style.display = 'none';
    });
})();
