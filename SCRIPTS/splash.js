// Get the loader bar element
const loaderBar = document.querySelector('.loader-bar');

// Set the initial width to 0
loaderBar.style.width = '0%';

// Function to update the loader bar width
function updateLoader(width) {
  loaderBar.style.width = `${width}%`;
}

// Example usage: Simulate a loading process
let progress = 0;
const intervalId = setInterval(() => {
  progress += 10;
  updateLoader(progress);
  if (progress >= 100) {
    clearInterval(intervalId);
    // Open another HTML page after the loading is complete
    setTimeout(() => {
      window.location.href = '/HTML/first.html';
    }, 400); // 3000 milliseconds = 3 seconds
  }
}, 300);