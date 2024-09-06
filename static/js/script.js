// Elements
const recordButton = document.getElementById('recordButton');
const translateButton = document.getElementById('translateButton');
const soundWave = document.getElementById('soundWave');
const imageModal = document.getElementById('imageModal');
const languageSelect = document.getElementById('language');
const languageSelection = document.getElementById('languageSelection');
const navbar = document.getElementById('navbar');
const container = document.querySelector('.container');
const closeBtn = document.querySelector('.close-btn');
const transcriptDisplay = document.getElementById('transcriptDisplay');
const modalText = document.getElementById('modalText'); // Element for displaying transcribed text
const modalImages = document.getElementById('modalImage'); // Element for displaying images

// Ensure modal is hidden initially
window.addEventListener('load', () => {
    container.classList.add('show');
    imageModal.style.display = 'none'; // Hide modal on page load
});

let isRecording = false;
let mediaRecorder;
let audioStream;
let audioBlob;

// Function to toggle recording
function toggleRecording() {
    if (!isRecording) {
        startRecording().then(() => {
            soundWave.style.display = 'block'; // Show sound wave animation
            recordButton.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Recording';
            recordButton.classList.add('stop-btn');
            translateButton.style.display = 'none'; // Hide translate button during recording
            translateButton.disabled = true;
            isRecording = true;
        }).catch(err => {
            console.error('Error starting recording:', err);
            alert('Could not start recording.');
        });
    } else {
        stopRecording();
        soundWave.style.display = 'none'; // Hide sound wave animation
        recordButton.innerHTML = '<i class="fa-solid fa-microphone"></i> Record Audio';
        recordButton.classList.remove('stop-btn');
        translateButton.style.display = 'block'; // Show translate button after recording
        translateButton.disabled = false;
        isRecording = false;
    }
}

// Function to start recording
function startRecording() {
    return navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioStream = stream;
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioBlob = event.data;
                }
            };

            mediaRecorder.start();
            console.log("Recording started");

            // Return a promise that resolves when recording starts
            return new Promise((resolve) => {
                mediaRecorder.onstart = () => resolve();
            });
        })
        .catch(err => {
            console.error('Error accessing audio input:', err);
            throw err; // Propagate the error
        });
}

// Function to stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        audioStream.getTracks().forEach(track => track.stop()); // Stop all tracks
        console.log("Recording stopped");
    }
}

function translateAudio() {
    if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        console.log('Sending audio to server...');
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Server response:', data);

            // Ensure the response has images
            if (data.images && data.images.length > 0) {
                // Set the transcription text
                modalText.innerHTML = `Transcription: ${data.transcription || 'No transcription available'}`;

                // Clear previous images
                modalImages.innerHTML = '';

                // Display images
                data.images.forEach(imageSrc => {
                    const img = document.createElement('img');
                    img.src = imageSrc;
                    img.alt = 'Sign language image';
                    img.style.width = '100px'; // Adjust size as needed
                    img.style.height = '100px'; // Adjust size as needed
                    modalImages.appendChild(img);
                });

                imageModal.style.display = 'flex'; // Show the modal with the images and transcription
            } else {
                alert('No images found for the transcription.');
            }
        })
        .catch(error => {
            console.error('Error uploading audio:', error);
            alert('Could not process audio.');
        });
    } else {
        alert('No audio recorded.');
    }
}


// Toggle navigation
function toggleNav() {
    navbar.classList.toggle('show');
}

// Event listener for the record button
recordButton.addEventListener('click', toggleRecording);

// Event listener for the translate button
translateButton.addEventListener('click', translateAudio);

// Event listener for the close button
closeBtn.addEventListener('click', () => {
    imageModal.style.display = 'none';
    modalText.innerHTML = ''; // Clear transcript display when modal is closed
    modalImages.innerHTML = ''; // Clear images when modal is closed
});

// Event listener to close modal if clicked outside of modal content
window.addEventListener('click', (event) => {
    if (event.target === imageModal) {
        imageModal.style.display = 'none';
        modalText.innerHTML = ''; // Clear transcript display when modal is closed
        modalImages.innerHTML = ''; // Clear images when modal is closed
    }
});
