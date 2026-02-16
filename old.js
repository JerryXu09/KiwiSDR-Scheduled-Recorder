// ==UserScript==
// @name         KiwiSDR-Auto-Record
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Allows users to conveniently schedule start and stop times for recording sessions.
// @author       JerryXu09
// @license      MIT
// @match        http://*.proxy.kiwisdr.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to get the recording button via class selector `.id-rec1`
    const getButton = () => document.querySelector('.id-rec1');
    
    // Function to get the save WF button via class selector `id-btn-grp-56`
    const getSaveWFButton = () => document.querySelector('.id-btn-grp-56');

    // Function to click a button
    const clickButton = (button) => {
        if (button) {
            button.click();
            console.log('Button clicked, operation executed');
        } else {
            console.log('Button not found');
        }
    };

    // Create the button to initiate the scheduled recording
    const startButton = document.createElement('button');
    startButton.innerText = 'Set Scheduled Recording';
    startButton.style.position = 'fixed';
    startButton.style.top = '10px';
    startButton.style.right = '10px';
    startButton.style.zIndex = 1000;
    document.body.appendChild(startButton);

    // Create container for input fields
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

    // Format the current time as "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
               pad(date.getMonth() + 1) + '-' +
               pad(date.getDate()) + ' ' +
               pad(date.getHours()) + ':' +
               pad(date.getMinutes()) + ':' +
               pad(date.getSeconds());
    };

    // Set default start and stop times
    const now = new Date();
    const startDefault = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
    const stopDefault = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes later

    // Create input fields, checkboxes, and labels to set start, stop times, and WF save option, with default times
    inputContainer.innerHTML = `
        <label>Start Time (format: YYYY-MM-DD HH:MM:SS): <input id="startTime" type="text" value="${formatDateTime(startDefault)}"></label><br><br>
        <label>Stop Time (format: YYYY-MM-DD HH:MM:SS): <input id="endTime" type="text" value="${formatDateTime(stopDefault)}"></label><br><br>
        <label><input id="saveWFCheckbox" type="checkbox" checked> Save WF after recording</label><br><br>
        <button id="confirmButton">Confirm</button>
        <button id="cancelButton">Cancel</button>
    `;

    const confirmButton = inputContainer.querySelector('#confirmButton');
    const cancelButton = inputContainer.querySelector('#cancelButton');

    // Show input container
    startButton.addEventListener('click', () => {
        inputContainer.style.display = 'block';
    });

    // Confirm button event
    confirmButton.addEventListener('click', () => {
        const startTimeInput = document.getElementById('startTime').value;
        const endTimeInput = document.getElementById('endTime').value;
        const saveWF = document.getElementById('saveWFCheckbox').checked;

        // Convert user input times to Date objects
        const startTime = new Date(startTimeInput.replace(/-/g, '/'));
        const endTime = new Date(endTimeInput.replace(/-/g, '/'));

        const now = new Date();

        // Validate input times
        if (isNaN(startTime) || isNaN(endTime)) {
            alert("Please enter valid start and stop times!");
            return;
        }
        if (startTime <= now) {
            alert("Start time must be in the future!");
            return;
        }
        if (endTime <= startTime) {
            alert("Stop time must be after start time!");
            return;
        }

        // Calculate delay times in milliseconds
        const startDelay = startTime - now;
        const stopDelay = endTime - now;

        const button = getButton();
        startButton.disabled = true;
        startButton.innerText = 'Scheduled operation in progress...';

        // Start recording at scheduled time
        setTimeout(() => {
            clickButton(button);
            console.log(`Recording started: ${startTimeInput}`);

            // Stop recording at scheduled stop time
            setTimeout(() => {
                clickButton(button);
                console.log(`Recording stopped: ${endTimeInput}`);

                // Check if user chose to save WF option
                if (saveWF) {
                    const saveWFButton = getSaveWFButton();
                    if (saveWFButton) {
                        setTimeout(() => {
                            clickButton(saveWFButton);
                            console.log("WF image saved as JPG");
                        }, 1000); // Delay 1 sec to ensure recording operation is complete
                    } else {
                        console.log("Save WF button not found");
                    }
                }

                // Reset button state
                startButton.disabled = false;
                startButton.innerText = 'Set Scheduled Recording';
            }, stopDelay - startDelay);

        }, startDelay);

        // Hide input container
        inputContainer.style.display = 'none';
    });

    // Cancel button event, close input container
    cancelButton.addEventListener('click', () => {
        inputContainer.style.display = 'none';
    });
})();