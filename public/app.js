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

async function loadWorkspaces() {
  try {
    const res = await fetch('/api/workspaces');
    const workspaces = await res.json();
    const select = document.getElementById('workspace-select');
    const currentRes = await fetch('/api/workspaces/current');
    const current = await currentRes.json();

    select.innerHTML = '';
    workspaces.forEach(ws => {
      const opt = document.createElement('option');
      opt.value = ws.id;
      opt.innerText = `${ws.name} (${ws.root_path})`;
      if (current && ws.id === current.id) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('Failed to load workspaces', error);
  }
}

async function addWorkspace() {
  const path = document.getElementById('new-workspace-path').value;
  if (!path) return alert('Path is required');
  
  try {
    const res = await fetch('/api/workspaces/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    if (!res.ok) throw new Error(await res.text());
    await loadWorkspaces();
    document.getElementById('new-workspace-path').value = '';
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function selectWorkspace() {
  const id = document.getElementById('workspace-select').value;
  if (!id) return;
  
  try {
    await fetch('/api/workspaces/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  } catch (error) {
    alert('Error selecting workspace: ' + error.message);
  }
}

document.getElementById('btn-add-workspace').onclick = addWorkspace;
document.getElementById('workspace-select').onchange = selectWorkspace;
document.getElementById('btn-refresh-workspaces').onclick = loadWorkspaces;

document.getElementById('btn-analyze').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  const workspace_id = document.getElementById('workspace-select').value;
  callAPI('/api/analyze', { task, provider, workspace_id });
};

document.getElementById('btn-handoff').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  const workspace_id = document.getElementById('workspace-select').value;
  callAPI('/api/handoff', { task, provider, workspace_id });
};

document.getElementById('btn-review').onclick = () => {
  const task = document.getElementById('task').value;
  const provider = document.getElementById('provider').value;
  const workspace_id = document.getElementById('workspace-select').value;
  callAPI('/api/review-diff', { task, provider, workspace_id });
};

document.getElementById('btn-copy').onclick = () => {
  const content = document.getElementById('output-text').innerText;
  navigator.clipboard.writeText(content).then(() => alert('Copied to clipboard!'));
};

loadWorkspaces();
checkHealth();
setInterval(checkHealth, 5000);
