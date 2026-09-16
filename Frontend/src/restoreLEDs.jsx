// src/utils/restoreLEDs.js

const API_BASE_URL = 'http://localhost:8000';

export async function restoreLEDs() {
  try {
    const response = await fetch(`${API_BASE_URL}/gpio/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('Failed to restore LEDs:', response.status, txt);
    }
  } catch (err) {
    console.error('Network error while restoring LEDs:', err);
  }
}