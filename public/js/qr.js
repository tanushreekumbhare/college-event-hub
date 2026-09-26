/**
 * QR Code Scanner & Verification Script
 */
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('verify-scan-btn');
  const scanInput = document.getElementById('scan-registration-id');
  const resultDiv = document.getElementById('scan-result');

  if (scanBtn && scanInput) {
    scanBtn.addEventListener('click', async () => {
      const registrationId = scanInput.value.trim();
      if (!registrationId) {
        resultDiv.innerHTML = '<div style="color: red;">Please enter a Registration ID.</div>';
        return;
      }

      try {
        const res = await API.post('/api/attendance/scan', { registrationId });
        if (res.success) {
          resultDiv.innerHTML = `<div style="color: green; font-weight: bold;">✅ ${res.message}</div>`;
        } else {
          resultDiv.innerHTML = `<div style="color: red; font-weight: bold;">❌ ${res.message}</div>`;
        }
      } catch (err) {
        resultDiv.innerHTML = `<div style="color: red;">Error processing scan request.</div>`;
      }
    });
  }
});
