/**
 * API Fetch Wrapper Utility
 */
const API = {
  async get(url) {
    const res = await fetch(url);
    return res.json();
  },
  async post(url, data) {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    return res.json();
  },
  async put(url, data) {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  }
};
