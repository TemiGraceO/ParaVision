const { execSync } = require('child_process');

// Change these pins if your board numbering differs
const LED_BLOOD = 7;
const LED_STOOL = 11;

function setLED(pin, state) {
  try {
    execSync(`gpio write ${pin} ${state ? 1 : 0}`);
    console.log(`LED on pin ${pin} set to ${state ? 'ON' : 'OFF'}`);
  } catch (err) {
    console.error(`Error setting LED on pin ${pin}:`, err.message);
  }
}

// Test sequence
console.log('Turning both LEDs OFF for 5 seconds...');
setLED(LED_BLOOD, 0);
setLED(LED_STOOL, 0);

setTimeout(() => {
  console.log('Restoring both LEDs ON...');
  setLED(LED_BLOOD, 1);
  setLED(LED_STOOL, 1);
}, 5000);
