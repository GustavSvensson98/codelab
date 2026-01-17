const CodeLab = (function () {
  'use strict';

  let messageHandler = null;
  let currentIframe = null;
  let executionTimeout = null;

  /* =======================
     STYLES
  ======================= */
  const styles = `
  .code-lab {
    width: 100%;
    max-width: 720px;
    margin: 20px auto;
    font-family: system-ui, monospace;
  }

  .code-lab .editor-header {
    background: #1e1e1e;
    color: white;
    padding: 8px 12px;
    border-radius: 6px 6px 0 0;
  }

  .code-lab .task {
    background: #f5f5f5;
    padding: 12px;
    border-left: 4px solid #4caf50;
    margin-bottom: 8px;
    border-radius: 4px;
  }

  .code-lab textarea {
    height: 180px;
    background: #1e1e1e;
    color: #dcdcdc;
    border: none;
    padding: 12px;
    font-size: 14px;
    width: 100%;
    font-family: 'Courier New', monospace;
    resize: vertical;
    box-sizing: border-box;
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .run-btn {
    background: #4caf50;
    color: white;
    border: none;
    padding: 10px 14px;
    border-radius: 4px;
    cursor: pointer;
  }

  .hint-btn {
    background: #ff9800;
    border: none;
    padding: 10px 14px;
    border-radius: 4px;
    cursor: pointer;
  }

  .hints {
    margin-top: 12px;
    padding: 12px;
    background: #fff3cd;
    border-radius: 4px;
    position: relative;
  }

  .close-hint {
    position: absolute;
    right: 8px;
    top: 6px;
    cursor: pointer;
    font-weight: bold;
  }

  .output {
    margin-top: 16px;
    background: #111;
    border-radius: 6px;
  }

  .output-header {
    background: #222;
    color: #aaa;
    padding: 6px 12px;
  }

  .output-content {
    padding: 12px;
    color: #0f0;
    min-height: 40px;
  }

  .tests {
    margin-top: 16px;
    background: #1a1a1a;
    border-radius: 6px;
  }

  .tests-header {
    padding: 8px 12px;
    background: #333;
    color: white;
  }

  .tests-body {
    padding: 10px;
  }

  .pass { color: #4caf50; }
  .fail { color: #f44336; }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .overlay-content {
    background: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
  }

  .hidden { display: none; }
  `;

  function injectStyles() {
    if (document.getElementById('code-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'code-lab-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function cleanup() {
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
    if (executionTimeout) {
      clearTimeout(executionTimeout);
      executionTimeout = null;
    }
    if (currentIframe) {
      URL.revokeObjectURL(currentIframe.src);
      currentIframe.remove();
      currentIframe = null;
    }
  }

  /* =======================
     RUN USER CODE
  ======================= */
  function runCode(container, config) {
    const editor = container.querySelector('textarea');
    const output = container.querySelector('.output-content');
    const testsBody = container.querySelector('.tests-body');
    const overlay = container.querySelector('.overlay');

    output.textContent = '';
    testsBody.innerHTML = '';
    overlay.classList.add('hidden');

    cleanup();

    const userCode = editor.value;

    // Syntax validation
    try {
      new Function(userCode);
    } catch (e) {
      output.textContent = e.name + ': ' + e.message;
      testsBody.innerHTML =
        '<div class="fail">❌ Syntaxfel – koden kunde inte köras</div>';
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<body>
<script>
(function () {
  const logs = [];
  let hasError = false;

  console.log = (...args) => {
    logs.push(args.map(a => String(a)).join(' '));
  };

  function send() {
    parent.postMessage({
      type: 'code-lab-result',
      logs,
      hasError
    }, '*');
  }

  try {
    const fn = new Function(${JSON.stringify(userCode)});
    fn();
  } catch (e) {
    hasError = true;
    logs.push(e.name + ': ' + e.message);
  }

  send();
})();
<\/script>
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    currentIframe = document.createElement('iframe');
    currentIframe.sandbox = 'allow-scripts';
    currentIframe.style.display = 'none';
    document.body.appendChild(currentIframe);

messageHandler = function (e) {
  if (!e.data || e.data.type !== 'code-lab-result') return;

  cleanup();

  const { logs, hasError } = e.data;
  output.textContent = logs.join('\n') || '(ingen output)';

  let allPassed = true;

  // Hämta användarkoden från editorn
  const code = container.querySelector('textarea').value;

  config.tests.forEach(test => {
    // Skicka logs, hasError och code till validatorn
    const pass = !hasError && test.validator(logs, hasError, code);

    const div = document.createElement('div');
    div.className = pass ? 'pass' : 'fail';
    div.textContent = (pass ? '✅ ' : '❌ ') + test.name;

    if (!pass) allPassed = false;
    testsBody.appendChild(div);
  });

  if (allPassed && !hasError) {
    overlay.classList.remove('hidden');
  }
};


    window.addEventListener('message', messageHandler);
    currentIframe.src = url;
  }

  /* =======================
     HTML TEMPLATE
  ======================= */
  function template(config) {
    return `
<div class="code-lab">
  <div class="task">
    <h3>${config.task.title}</h3>
    <p>${config.task.description}</p>
  </div>

  <div class="editor-header">JavaScript Editor</div>
  <textarea>${config.initialCode || ''}</textarea>

  <div class="actions">
    <button class="run-btn">▶ Exekvera</button>
    ${config.hint ? `<button class="hint-btn">💡 Visa hint</button>` : ''}
  </div>

  ${config.hint ? `
  <div class="hints hidden">
    <span class="close-hint">✕</span>
    ${config.hint}
  </div>` : ''}

  <div class="output">
    <div class="output-header">Output</div>
    <pre class="output-content"></pre>
  </div>

  <div class="tests">
    <div class="tests-header">🧪 Testresultat</div>
    <div class="tests-body"></div>
  </div>

  <div class="overlay hidden">
    <div class="overlay-content">
      <h2>🎉 Bra jobbat!</h2>
      <button class="close-overlay">Fortsätt</button>
    </div>
  </div>
</div>
`;
  }

  /* =======================
     INIT
  ======================= */
  function init(config) {
    if (!config.containerId || !config.tests) {
      console.error('CodeLab: ogiltig config');
      return;
    }

    const container = document.getElementById(config.containerId);
    if (!container) return;

    injectStyles();
    container.innerHTML = template(config);

    const lab = container.querySelector('.code-lab');

    lab.querySelector('.run-btn').onclick = () =>
      runCode(lab, config);

    if (config.hint) {
      const hints = lab.querySelector('.hints');
      lab.querySelector('.hint-btn').onclick = () =>
        hints.classList.toggle('hidden');
      lab.querySelector('.close-hint').onclick = () =>
        hints.classList.add('hidden');
    }

    lab.querySelector('.close-overlay').onclick = () =>
      lab.querySelector('.overlay').classList.add('hidden');
  }

  return { init, cleanup };
})();

window.CodeLab = CodeLab;
