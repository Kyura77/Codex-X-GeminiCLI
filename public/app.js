const API = ''; // Relative to server

async function checkHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    document.getElementById('server-status').innerText = `Server Online | Providers: ${data.junior.providers.join(', ')}`;
  } catch {
    document.getElementById('server-status').innerText = 'Server Offline';
  }
}

async function callAPI(endpoint, body) {
  const btn = event.target;
  const originalText = btn.innerText;
  btn.innerText = 'Processing...';
  btn.disabled = true;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    showOutput(endpoint.split('/').pop(), data);
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

function showOutput(action, data) {
  const card = document.getElementById('output-card');
  const title = document.getElementById('output-title');
  const text = document.getElementById('output-text');
  
  card.style.display = 'block';
  
  if (action === 'handoff') {
    title.innerText = 'Senior Prompt (Ready for Copy)';
    text.innerText = data.senior_prompt;
  } else {
    title.innerText = action.charAt(0).toUpperCase() + action.slice(1);
    text.innerText = JSON.stringify(data, null, 2);
  }
}

document.getElementById('btn-analyze').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  callAPI('/api/analyze', { task, provider });
};

document.getElementById('btn-handoff').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  callAPI('/api/handoff', { task, provider });
};

document.getElementById('btn-review').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  callAPI('/api/review-diff', { task, provider });
};

document.getElementById('btn-copy').onclick = () => {
  const content = document.getElementById('output-text').innerText;
  navigator.clipboard.writeText(content).then(() => alert('Copied to clipboard!'));
};

checkHealth();
setInterval(checkHealth, 5000);
