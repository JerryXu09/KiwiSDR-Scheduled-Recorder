// ==UserScript==
// @name         KiwiSDR Timed Recording
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Allows users to conveniently schedule start and stop times for recording.
// @author       JerryXu
// @match        http://*.proxy.kiwisdr.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Get the recording button using the class selector `.id-rec1`
    const getButton = () => document.querySelector('.id-rec1');

    // Function to click the button
    const clickButton = (button) => {
        if (button) {
            button.click();
            console.log('Button clicked, action executed');
        } else {
            console.log('Button not found');
        }
    };

    // Create a button to initiate the timed recording process
    const startButton = document.createElement('button');
    startButton.innerText = 'Set Timed Recording';
    startButton.style.position = 'fixed';
    startButton.style.top = '10px';
    startButton.style.right = '10px';
    startButton.style.zIndex = 1000;
    document.body.appendChild(startButton);

    // Create a container for input fields
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

    // Create input fields and labels (for specifying start and stop times)
    inputContainer.innerHTML = `
        <label>Start Time (format: YYYY-MM-DD HH:MM:SS): <input id="startTime" type="text" placeholder="2024-10-27 14:30:00"></label><br><br>
        <label>End Time (format: YYYY-MM-DD HH:MM:SS): <input id="endTime" type="text" placeholder="2024-10-27 14:35:00"></label><br><br>
        <button id="confirmButton">Confirm</button>
        <button id="cancelButton">Cancel</button>
    `;

    const confirmButton = inputContainer.querySelector('#confirmButton');
    const cancelButton = inputContainer.querySelector('#cancelButton');

    // Show the input container
    startButton.addEventListener('click', () => {
        inputContainer.style.display = 'block';
    });

    // Confirm button click event
    confirmButton.addEventListener('click', () => {
        const startTimeInput = document.getElementById('startTime').value;
        const endTimeInput = document.getElementById('endTime').value;

        // Convert user input times to Date objects
        const startTime = new Date(startTimeInput.replace(/-/g, '/')); // For compatibility with some browsers
        const endTime = new Date(endTimeInput.replace(/-/g, '/'));

        const now = new Date();

        // Validate input times
        if (isNaN(startTime) || isNaN(endTime)) {
            alert("Please enter a valid start and end time!");
            return;
        }
        if (startTime <= now) {
            alert("Start time must be in the future!");
            return;
        }
        if (endTime <= startTime) {
            alert("End time must be after the start time!");
            return;
        }

        // Calculate time differences in milliseconds
        const startDelay = startTime - now;
        const stopDelay = endTime - now;

        const button = getButton();
        startButton.disabled = true;
        startButton.innerText = 'Timed operation in progress...';

        // Schedule start recording
        setTimeout(() => {
            clickButton(button);
            console.log(`Recording started: ${startTimeInput}`);

            // Schedule stop recording
            setTimeout(() => {
                clickButton(button);
                console.log(`Recording stopped: ${endTimeInput}`);

                // Restore button state
                startButton.disabled = false;
                startButton.innerText = 'Set Timed Recording';
            }, stopDelay - startDelay);

        }, startDelay);

        // Hide input container
        inputContainer.style.display = 'none';
    });

    // Cancel button click event to close the input container
    cancelButton.addEventListener('click', () => {
        inputContainer.style.display = 'none';
    });
})();
