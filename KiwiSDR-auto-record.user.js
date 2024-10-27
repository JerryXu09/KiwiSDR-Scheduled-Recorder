// ==UserScript==
// @name         KiwiSDR定时录音
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  让用户方便的定时开启和关闭录制，而不用手动操作。
// @author       JerryXu
// @match        http://*.proxy.kiwisdr.com/*
// @grant        none
// ==/UserScript==
// 可以在上面添加通配之外的KiwiSDR站点。

(function() {
    'use strict';

    // 获取录音按钮，通过类名选择器 `.id-rec1`
    const getButton = () => document.querySelector('.id-rec1');

    // 点击按钮的函数
    const clickButton = (button) => {
        if (button) {
            button.click();
            console.log('按钮已点击，开始录制');
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

    // 创建输入框和标签
    inputContainer.innerHTML = `
        <label>多少毫秒后开始录制：<input id="firstClickDelay" type="number" value="5000"></label><br><br>
        <label>多少毫秒后停止录制：<input id="secondClickDelay" type="number" value="10000"></label><br><br>
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
        const firstClickDelay = parseInt(document.getElementById('firstClickDelay').value, 10);
        const secondClickDelay = parseInt(document.getElementById('secondClickDelay').value, 10);

        if (isNaN(firstClickDelay) || isNaN(secondClickDelay)) {
            alert("请输入有效的数字！");
            return;
        }

        // 开始点击流程
        const button = getButton();

        // 禁用开始按钮，防止重复启动
        startButton.disabled = true;
        startButton.innerText = '点击操作进行中';

        // 延迟第一次点击
        setTimeout(() => {
            clickButton(button);

            // 延迟第二次点击
            setTimeout(() => {
                clickButton(button);

                // 点击完成后恢复按钮状态
                startButton.disabled = false;
                startButton.innerText = '开始录制';
            }, secondClickDelay);

        }, firstClickDelay);

        // 隐藏输入框
        inputContainer.style.display = 'none';
    });

    // 取消按钮点击事件，关闭输入框
    cancelButton.addEventListener('click', () => {
        inputContainer.style.display = 'none';
    });
})();
