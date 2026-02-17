// ==UserScript==
// @name         KiwiSDR Scheduled Recorder
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  KiwiSDR scheduled recorder with frequency/mode presets. 定时录音，支持预设频率和解调模式。
// @author       JerryXu09
// @license      MIT
// @match        http://*.proxy.kiwisdr.com/*
// @match        http://*.proxy2.kiwisdr.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==================== Language ====================
    const LANG = {
        zh: {
            title: '定时录音',
            startTime: '开始时间',
            endTime: '结束时间',
            targetFreq: '目标频率 (kHz)',
            targetFreqHint: '留空 = 不改变',
            targetMode: '解调模式',
            noChange: '— 不改变 —',
            saveWF: '录制结束后保存频谱图',
            confirm: '确认计划',
            cancelSchedule: '取消计划',
            close: '收起',
            currentInfo: '当前',
            statusIdle: '就绪',
            statusScheduled: '已计划',
            statusWaitStart: '等待开始',
            statusRecording: '录音中',
            statusDone: '录音完成',
            statusCancelled: '已取消',
            statusInterrupted: '录音被中断，计划已取消',
            statusAlreadyRec: '检测到已在录音，将在指定时间停止',
            wfSaved: '频谱图已保存',
            errInvalidTime: '请输入有效的时间！',
            errStartPast: '开始时间必须在当前时间之后！',
            errEndBeforeStart: '结束时间必须在开始时间之后！',
            errInvalidFreq: '频率无效，范围 0 ~ 30000 kHz',
            countdown: '倒计时',
            tuningTo: '正在调谐至',
        },
        en: {
            title: 'Scheduled Rec',
            startTime: 'Start Time',
            endTime: 'End Time',
            targetFreq: 'Target Freq (kHz)',
            targetFreqHint: 'Empty = no change',
            targetMode: 'Demod Mode',
            noChange: '— No change —',
            saveWF: 'Save waterfall after recording',
            confirm: 'Confirm',
            cancelSchedule: 'Cancel Schedule',
            close: 'Collapse',
            currentInfo: 'Current',
            statusIdle: 'Ready',
            statusScheduled: 'Scheduled',
            statusWaitStart: 'Waiting to start',
            statusRecording: 'Recording...',
            statusDone: 'Recording complete',
            statusCancelled: 'Cancelled',
            statusInterrupted: 'Recording interrupted, schedule cancelled',
            statusAlreadyRec: 'Already recording, will stop at scheduled time',
            wfSaved: 'Waterfall saved',
            errInvalidTime: 'Please enter valid times!',
            errStartPast: 'Start time must be in the future!',
            errEndBeforeStart: 'End time must be after start time!',
            errInvalidFreq: 'Invalid frequency, range 0–30000 kHz',
            countdown: 'Countdown',
            tuningTo: 'Tuning to',
        }
    };
    const L = navigator.language.startsWith('zh') ? 'zh' : 'en';
    const t = LANG[L];

    // ==================== Mode Definitions ====================
    const MODE_GROUPS = [
        { label: 'AM',    modes: [['am','AM'], ['amn','AM Narrow'], ['amw','AM Wide']] },
        { label: 'SAM',   modes: [['sam','SAM'], ['sal','SAM-L'], ['sau','SAM-U'], ['sas','SAM Stereo'], ['qam','QAM']] },
        { label: 'SSB',   modes: [['lsb','LSB'], ['lsn','LSB Narrow'], ['usb','USB'], ['usn','USB Narrow']] },
        { label: 'CW',    modes: [['cw','CW'], ['cwn','CW Narrow']] },
        { label: 'FM',    modes: [['nbfm','NBFM'], ['nnfm','NBFM Narrow']] },
        { label: 'Other', modes: [['drm','DRM'], ['iq','IQ']] },
    ];

    // ==================== KiwiSDR API Wrapper ====================
    const kiwi = {
        setFreqMode(freqKHz, mode) {
            if (typeof freqmode_set_dsp_kHz === 'function') {
                freqmode_set_dsp_kHz(freqKHz, mode);
            }
        },
        setMode(mode) {
            if (typeof ext_set_mode === 'function') {
                ext_set_mode(mode);
            }
        },
        startRec() {
            if (typeof toggle_or_set_rec === 'function') {
                toggle_or_set_rec(true);
            }
        },
        stopRec() {
            if (typeof toggle_or_set_rec === 'function') {
                toggle_or_set_rec(false);
            }
        },
        isRecording() {
            return (typeof recording !== 'undefined') ? recording : false;
        },
        saveWF() {
            if (typeof export_waterfall === 'function') {
                export_waterfall();
            }
        },
        getFreqKHz() {
            return (typeof freq_car_Hz !== 'undefined') ? freq_car_Hz / 1000 : 0;
        },
        getMode() {
            return (typeof cur_mode !== 'undefined') ? cur_mode : 'am';
        },
        isReady() {
            return typeof freqmode_set_dsp_kHz === 'function' &&
                   typeof toggle_or_set_rec === 'function';
        }
    };

    // ==================== State ====================
    let state = {
        startTimer: null,
        stopTimer: null,
        countdownTimer: null,
        monitorTimer: null,
        isScheduled: false,
        wasRecording: false,
        scheduledStart: null,
        scheduledEnd: null,
    };

    // ==================== Utilities ====================
    const pad = n => n < 10 ? '0' + n : String(n);

    function toLocalISOString(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
               'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function formatCountdown(ms) {
        if (ms <= 0) return '0:00';
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
        return m + ':' + pad(s);
    }

    function formatTime(date) {
        return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    // ==================== CSS Styles ====================
    const STYLES = `
        #ksr-panel {
            position: fixed; top: 10px; right: 10px; width: 300px;
            background: #f5f5f5; border: 1px solid #bbb; border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10000;
            font-family: sans-serif; font-size: 13px; color: #333;
            user-select: none;
        }
        #ksr-header {
            background: #e0e0e0; padding: 7px 12px; cursor: move;
            font-weight: 600; border-bottom: 1px solid #bbb;
            border-radius: 4px 4px 0 0; display: flex;
            justify-content: space-between; align-items: center;
        }
        #ksr-header span { pointer-events: none; }
        #ksr-toggle {
            background: none; border: none; cursor: pointer;
            font-size: 16px; color: #666; padding: 0 4px; line-height: 1;
        }
        #ksr-toggle:hover { color: #333; }
        #ksr-body { padding: 10px 12px; display: none; }
        #ksr-body.ksr-open { display: block; }
        .ksr-row { margin-bottom: 8px; }
        .ksr-row:last-child { margin-bottom: 0; }
        .ksr-label {
            display: block; margin-bottom: 3px;
            font-size: 11px; color: #666; font-weight: 500;
        }
        .ksr-input, .ksr-select {
            width: 100%; padding: 5px 8px; border: 1px solid #ccc;
            border-radius: 3px; font-size: 12px; box-sizing: border-box;
            background: #fff; color: #333;
        }
        .ksr-select { padding: 4px 6px; }
        .ksr-input:focus, .ksr-select:focus {
            outline: none; border-color: #888;
        }
        .ksr-checkbox-row {
            display: flex; align-items: center; gap: 6px;
            font-size: 12px; cursor: pointer;
        }
        .ksr-checkbox-row input { margin: 0; cursor: pointer; }
        .ksr-btn-row { display: flex; gap: 8px; margin-top: 10px; }
        .ksr-btn {
            flex: 1; padding: 6px 0; border: 1px solid #999;
            border-radius: 3px; background: #fff; cursor: pointer;
            font-size: 12px; text-align: center; color: #333;
        }
        .ksr-btn:hover { background: #eee; }
        .ksr-btn-confirm {
            background: #5a8f5a; color: #fff; border-color: #4a7a4a;
        }
        .ksr-btn-confirm:hover { background: #4a7a4a; }
        .ksr-btn-cancel {
            background: #c0392b; color: #fff; border-color: #a5301f;
        }
        .ksr-btn-cancel:hover { background: #a5301f; }
        #ksr-status {
            margin-top: 8px; padding: 6px 8px; background: #e8e8e8;
            border-radius: 3px; font-size: 11px; color: #555;
            text-align: center; min-height: 16px; line-height: 1.4;
        }
        #ksr-status.ksr-status-active { background: #d4edda; color: #155724; }
        #ksr-status.ksr-status-recording { background: #f8d7da; color: #721c24; }
        #ksr-status.ksr-status-error { background: #fff3cd; color: #856404; }
        #ksr-info {
            font-size: 11px; color: #888; padding: 2px 0 6px;
            border-bottom: 1px solid #ddd; margin-bottom: 8px;
        }
    `;

    // ==================== Build UI ====================
    function buildUI() {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'ksr-panel';

        // Default times
        const now = new Date();
        const startDefault = new Date(now.getTime() + 2 * 60 * 1000);
        const stopDefault = new Date(now.getTime() + 7 * 60 * 1000);

        // Build mode options
        let modeOptionsHTML = `<option value="">${t.noChange}</option>`;
        for (const group of MODE_GROUPS) {
            modeOptionsHTML += `<optgroup label="${group.label}">`;
            for (const [val, label] of group.modes) {
                modeOptionsHTML += `<option value="${val}">${label}</option>`;
            }
            modeOptionsHTML += '</optgroup>';
        }

        panel.innerHTML = `
            <div id="ksr-header">
                <span>📻 ${t.title}</span>
                <button id="ksr-toggle" title="${t.close}">▼</button>
            </div>
            <div id="ksr-body">
                <div id="ksr-info">${t.currentInfo}: —</div>

                <div class="ksr-row">
                    <label class="ksr-label">${t.startTime}</label>
                    <input type="datetime-local" step="1" id="ksr-start" class="ksr-input" value="${toLocalISOString(startDefault)}">
                </div>
                <div class="ksr-row">
                    <label class="ksr-label">${t.endTime}</label>
                    <input type="datetime-local" step="1" id="ksr-end" class="ksr-input" value="${toLocalISOString(stopDefault)}">
                </div>
                <div class="ksr-row">
                    <label class="ksr-label">${t.targetFreq} <small style="color:#aaa">${t.targetFreqHint}</small></label>
                    <input type="number" id="ksr-freq" class="ksr-input" placeholder="" min="0" max="30000" step="any">
                </div>
                <div class="ksr-row">
                    <label class="ksr-label">${t.targetMode}</label>
                    <select id="ksr-mode" class="ksr-select">${modeOptionsHTML}</select>
                </div>
                <div class="ksr-row">
                    <label class="ksr-checkbox-row">
                        <input type="checkbox" id="ksr-savewf">
                        ${t.saveWF}
                    </label>
                </div>

                <div class="ksr-btn-row" id="ksr-btn-row-main">
                    <button class="ksr-btn ksr-btn-confirm" id="ksr-confirm">${t.confirm}</button>
                </div>
                <div class="ksr-btn-row" id="ksr-btn-row-cancel" style="display:none;">
                    <button class="ksr-btn ksr-btn-cancel" id="ksr-cancel">${t.cancelSchedule}</button>
                </div>

                <div id="ksr-status">${t.statusIdle}</div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    // ==================== Drag Logic ====================
    function enableDrag(panel) {
        const header = panel.querySelector('#ksr-header');
        let dragging = false, startX, startY, origX, origY;

        header.addEventListener('mousedown', e => {
            if (e.target.id === 'ksr-toggle') return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.left = (origX + dx) + 'px';
            panel.style.top = (origY + dy) + 'px';
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => { dragging = false; });
    }

    // ==================== Toggle Panel ====================
    function setupToggle(panel) {
        const toggle = panel.querySelector('#ksr-toggle');
        const body = panel.querySelector('#ksr-body');

        toggle.addEventListener('click', () => {
            const open = body.classList.toggle('ksr-open');
            toggle.textContent = open ? '▲' : '▼';
        });
    }

    // ==================== Status Display ====================
    function setStatus(text, type) {
        const el = document.getElementById('ksr-status');
        if (!el) return;
        el.textContent = text;
        el.className = 'ksr-status-' + (type || '');
        el.id = 'ksr-status';
    }

    function updateInfo() {
        const el = document.getElementById('ksr-info');
        if (!el) return;
        const freq = kiwi.getFreqKHz();
        const mode = kiwi.getMode().toUpperCase();
        el.textContent = `${t.currentInfo}: ${freq.toFixed(freq % 1 === 0 ? 0 : 3)} kHz ${mode}`;

        const freqInput = document.getElementById('ksr-freq');
        if (freqInput && !freqInput.value) {
            freqInput.placeholder = freq.toFixed(freq % 1 === 0 ? 0 : 3);
        }
    }

    // ==================== Scheduling ====================
    function clearSchedule() {
        if (state.startTimer) { clearTimeout(state.startTimer); state.startTimer = null; }
        if (state.stopTimer) { clearTimeout(state.stopTimer); state.stopTimer = null; }
        if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
        if (state.monitorTimer) { clearInterval(state.monitorTimer); state.monitorTimer = null; }
        state.isScheduled = false;
        state.wasRecording = false;
        state.scheduledStart = null;
        state.scheduledEnd = null;

        document.getElementById('ksr-btn-row-main').style.display = 'flex';
        document.getElementById('ksr-btn-row-cancel').style.display = 'none';
        setFormEnabled(true);
    }

    function setFormEnabled(enabled) {
        const ids = ['ksr-start', 'ksr-end', 'ksr-freq', 'ksr-mode', 'ksr-savewf', 'ksr-confirm'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = !enabled;
        });
    }

    function startCountdown() {
        state.countdownTimer = setInterval(() => {
            if (!state.isScheduled) return;
            const now = Date.now();

            if (state.scheduledStart && now < state.scheduledStart.getTime()) {
                // Waiting to start
                const remain = state.scheduledStart.getTime() - now;
                setStatus(`${t.statusWaitStart}  ⏱ ${t.countdown}: ${formatCountdown(remain)}`, 'active');
            } else if (state.scheduledEnd && now < state.scheduledEnd.getTime()) {
                // Recording in progress
                const remain = state.scheduledEnd.getTime() - now;
                setStatus(`${t.statusRecording}  ⏱ ${formatCountdown(remain)}`, 'recording');
            }
        }, 500);
    }

    function startMonitor() {
        state.monitorTimer = setInterval(() => {
            if (!state.isScheduled) return;
            const isRec = kiwi.isRecording();

            // Detect unexpected interruption
            if (state.wasRecording && !isRec) {
                console.log('[KSR] Recording interrupted unexpectedly');
                clearSchedule();
                setStatus(t.statusInterrupted, 'error');
                return;
            }
            state.wasRecording = isRec;
        }, 1000);
    }

    function scheduleRecording(startTime, endTime, freqKHz, mode, saveWF) {
        const now = new Date();
        const alreadyRecording = kiwi.isRecording();

        clearSchedule();
        state.isScheduled = true;
        state.scheduledStart = startTime;
        state.scheduledEnd = endTime;

        document.getElementById('ksr-btn-row-main').style.display = 'none';
        document.getElementById('ksr-btn-row-cancel').style.display = 'flex';
        setFormEnabled(false);

        const doStop = () => {
            console.log('[KSR] Stopping recording');
            kiwi.stopRec();
            state.wasRecording = false;

            if (saveWF) {
                setTimeout(() => {
                    kiwi.saveWF();
                    console.log('[KSR] Waterfall saved');
                    setStatus(t.statusDone + ' · ' + t.wfSaved, '');
                }, 1500);
            } else {
                setStatus(t.statusDone, '');
            }

            setTimeout(() => clearSchedule(), 3000);
        };

        if (alreadyRecording) {
            // Already recording: only schedule stop
            setStatus(t.statusAlreadyRec, 'recording');
            state.wasRecording = true;

            const stopDelay = endTime.getTime() - now.getTime();
            state.stopTimer = setTimeout(doStop, stopDelay);
        } else {
            // Schedule start and stop
            const startDelay = startTime.getTime() - now.getTime();
            const stopDelay = endTime.getTime() - now.getTime();

            state.startTimer = setTimeout(() => {
                console.log('[KSR] Starting recording');

                // Tune to target frequency/mode before recording
                const shouldTune = (freqKHz != null) || (mode != null);
                if (freqKHz != null && mode != null) {
                    console.log(`[KSR] Tuning to ${freqKHz} kHz ${mode}`);
                    setStatus(`${t.tuningTo} ${freqKHz} kHz ${mode.toUpperCase()}...`, 'active');
                    kiwi.setFreqMode(freqKHz, mode);
                } else if (freqKHz != null) {
                    console.log(`[KSR] Tuning to ${freqKHz} kHz`);
                    kiwi.setFreqMode(freqKHz, kiwi.getMode());
                } else if (mode != null) {
                    console.log(`[KSR] Switching mode to ${mode}`);
                    kiwi.setMode(mode);
                }

                // Small delay for tuning to settle, then start recording
                const recDelay = shouldTune ? 500 : 0;
                setTimeout(() => {
                    kiwi.startRec();
                    state.wasRecording = true;
                    setStatus(t.statusRecording, 'recording');
                }, recDelay);
            }, startDelay);

            state.stopTimer = setTimeout(doStop, stopDelay);
        }

        startCountdown();
        startMonitor();
        console.log(`[KSR] Scheduled: ${formatTime(startTime)} → ${formatTime(endTime)}`);
    }

    // ==================== Event Handlers ====================
    function setupEvents() {
        // Confirm
        document.getElementById('ksr-confirm').addEventListener('click', () => {
            const startStr = document.getElementById('ksr-start').value;
            const endStr = document.getElementById('ksr-end').value;
            const freqStr = document.getElementById('ksr-freq').value.trim();
            const modeVal = document.getElementById('ksr-mode').value;
            const saveWF = document.getElementById('ksr-savewf').checked;

            const startTime = new Date(startStr);
            const endTime = new Date(endStr);
            const now = new Date();

            // Validate
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                alert(t.errInvalidTime);
                return;
            }
            if (startTime <= now) {
                alert(t.errStartPast);
                return;
            }
            if (endTime <= startTime) {
                alert(t.errEndBeforeStart);
                return;
            }

            let freqKHz = null;
            if (freqStr !== '') {
                freqKHz = parseFloat(freqStr);
                if (isNaN(freqKHz) || freqKHz < 0 || freqKHz > 30000) {
                    alert(t.errInvalidFreq);
                    return;
                }
            }

            const mode = modeVal || null;

            scheduleRecording(startTime, endTime, freqKHz, mode, saveWF);
        });

        // Cancel
        document.getElementById('ksr-cancel').addEventListener('click', () => {
            clearSchedule();
            setStatus(t.statusCancelled, '');
        });
    }

    // ==================== Init ====================
    function init() {
        const panel = buildUI();
        enableDrag(panel);
        setupToggle(panel);
        setupEvents();

        // Periodically update current freq/mode info
        setInterval(updateInfo, 1000);
        updateInfo();

        console.log('[KSR] KiwiSDR Scheduled Recorder v2.0 loaded');
    }

    // Wait for KiwiSDR to be ready
    const readyCheck = setInterval(() => {
        if (kiwi.isReady()) {
            clearInterval(readyCheck);
            init();
        }
    }, 500);

    // Failsafe: init anyway after 15s even if API not detected
    setTimeout(() => {
        if (!document.getElementById('ksr-panel')) {
            clearInterval(readyCheck);
            init();
            console.warn('[KSR] Initialized without full API detection');
        }
    }, 15000);

})();
