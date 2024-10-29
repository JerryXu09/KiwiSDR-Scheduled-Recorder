// ==UserScript==
// @name         KiwiSDR定时录音
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  让用户方便地定时开启和关闭录制。
// @author       JerryXu09
// @license      MIT
// @match        http://*.proxy.kiwisdr.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 获取录音按钮，通过类名选择器 `.id-rec1`
    const getButton = () => document.querySelector('.id-rec1');
    
    // 获取保存WF按钮，通过类名选择器 `id-btn-grp-56`
    const getSaveWFButton = () => document.querySelector('.id-btn-grp-56');

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

    // 获取当前时间，并格式化为 "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
               pad(date.getMonth() + 1) + '-' +
               pad(date.getDate()) + ' ' +
               pad(date.getHours()) + ':' +
               pad(date.getMinutes()) + ':' +
               pad(date.getSeconds());
    };

    // 设置默认的开始和停止时间
    const now = new Date();
    const startDefault = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后
    const stopDefault = new Date(now.getTime() + 10 * 60 * 1000); // 10分钟后

    // 创建输入框、复选框和标签（用于设置开始、停止时间和WF保存选项），并使用默认时间
    inputContainer.innerHTML = `
        <label>开始时间 (格式: YYYY-MM-DD HH:MM:SS)：<input id="startTime" type="text" value="${formatDateTime(startDefault)}"></label><br><br>
        <label>停止时间 (格式: YYYY-MM-DD HH:MM:SS)：<input id="endTime" type="text" value="${formatDateTime(stopDefault)}"></label><br><br>
        <label><input id="saveWFCheckbox" type="checkbox" checked> 录音完成后保存WF</label><br><br>
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
        const saveWF = document.getElementById('saveWFCheckbox').checked; // 获取复选框状态

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

                // 检查用户是否选择了保存WF选项
                if (saveWF) {
                    const saveWFButton = getSaveWFButton();
                    if (saveWFButton) {
                        setTimeout(() => {
                            clickButton(saveWFButton);
                            console.log("WF图像已保存为JPG");
                        }, 1000); // 延迟1秒点击保存WF按钮，确保录音操作已完成
                    } else {
                        console.log("保存WF按钮未找到");
                    }
                }

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
