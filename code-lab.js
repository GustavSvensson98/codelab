const CodeLab = (function() {
    'use strict';

    // Globala variabler för hantering
    let messageHandler = null;
    let currentIframe = null;
    let executionTimeout = null;
    let currentConfig = null;

    // CSS som injekteras
    const styles = `
    .code-lab {
      width: 100%;
      max-width: 720px;
      margin: 20px auto;
      font-family: system-ui, monospace;
    }
    
    .code-lab .editor-header {
      width: 100%;
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
      width: 100%;
      border-radius: 4px;
    }

    .code-lab .code-editor {
        width: 100%;
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
    
    .code-lab .actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    .code-lab .run-btn {
      background: #4caf50;
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .code-lab .run-btn:hover {
      background: #45a049;
    }
    
    .code-lab .hint-btn {
      background: #ff9800;
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .code-lab .hint-btn:hover {
      background: #f57c00;
    }
    
    .code-lab .hints {
      position: relative;
      margin-top: 12px;
      padding: 12px;
      background: #fff3cd;
      border-radius: 4px;
      border-left: 4px solid #ff9800;
    }
    
    .code-lab .close-hint {
      position: absolute;
      top: 6px;
      right: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 18px;
    }
    
    .code-lab .error-display {
      margin-top: 16px;
      background: #ffebee;
      border-radius: 6px;
      border-left: 4px solid #f44336;
      overflow: hidden;
    }
    
    .code-lab .error-header {
      background: #f44336;
      color: white;
      padding: 8px 12px;
      font-weight: 600;
    }
    
    .code-lab .error-message {
      margin: 0;
      padding: 12px;
      color: #c62828;
      background: #ffebee;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .code-lab .output {
      margin-top: 16px;
      background: #111;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .code-lab .output-header {
      background: #222;
      color: #aaa;
      padding: 6px 12px;
      font-weight: 500;
    }
    
    .code-lab .output-content {
      margin: 0;
      padding: 12px;
      color: #0f0;
      min-height: 40px;
      font-family: 'Courier New', monospace;
    }
    
    .code-lab .tests {
      margin-top: 16px;
      background: #1a1a1a;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .code-lab .tests-header {
      padding: 8px 12px;
      background: #333;
      color: white;
      font-weight: 500;
    }
    
    .code-lab .tests-body {
      padding: 10px;
      min-height: 40px;
    }
    
    .code-lab .test {
      margin-bottom: 6px;
      padding: 4px;
    }
    
    .code-lab .pass {
      color: #4caf50;
      font-weight: 500;
    }
    
    .code-lab .fail {
      color: #f44336;
      font-weight: 500;
    }
    
    .code-lab .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .code-lab .overlay-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .code-lab .overlay-content button {
      margin-top: 20px;
      padding: 10px 24px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .code-lab .hidden {
      display: none;
    }
  `;

    // Injektera CSS
    function injectStyles() {
        if (document.getElementById('code-lab-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'code-lab-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // Rensa körning
    function cleanupExecution() {
        if (messageHandler) {
            window.removeEventListener("message", messageHandler);
            messageHandler = null;
        }
        if (executionTimeout) {
            clearTimeout(executionTimeout);
            executionTimeout = null;
        }
        if (currentIframe && currentIframe.parentNode) {
            URL.revokeObjectURL(currentIframe.src);
            currentIframe.parentNode.removeChild(currentIframe);
            currentIframe = null;
        }
    }

    // Visa/dölj hints
    function toggleHints(container) {
        const hints = container.querySelector('.hints');
        hints.classList.toggle('hidden');
    }

    // Stäng overlay
    function closeOverlay(container) {
        const overlay = container.querySelector('.overlay');
        overlay.classList.add('hidden');
    }

    // Kör kod
    function runCode(container, config) {
        const editor = container.querySelector('.code-editor');
        const outputEl = container.querySelector('.output-content');
        const testsBody = container.querySelector('.tests-body');
        const errorDisplay = container.querySelector('.error-display');
        const errorMessage = container.querySelector('.error-message');

        outputEl.textContent = "";
        testsBody.innerHTML = "";
        errorDisplay.classList.add("hidden");
        errorMessage.textContent = "";

        cleanupExecution();

        const userCode = editor.value.trim();

        // Syntax-validering
        let syntaxError = null;
        try {
            new Function(userCode);
        } catch (e) {
            syntaxError = e;
        }

        if (syntaxError) {
            errorDisplay.classList.remove("hidden");
            errorMessage.textContent = `${syntaxError.name}: ${syntaxError.message}\n\nDin kod innehåller ett syntax-fel.`;
            testsBody.innerHTML = '<div class="test">⚠️ <span class="fail">Kan inte köra på grund av syntax-fel</span></div>';
            outputEl.textContent = "(kod kunde inte köras)";
            return;
        }

        // Skapa säkert HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline';">
</head>
<body>
<script>
(function() {
  'use strict';
  try {
    Object.defineProperty(window, 'parent', {
      get: function() { throw new Error('Access denied'); }
    });
    Object.defineProperty(window, 'top', {
      get: function() { throw new Error('Access denied'); }
    });
  } catch(e) {}
  
  const logs = [];
  let hasError = false;
  let errorInfo = null;
  let executed = false;
  
  const sandboxConsole = {
    log: function(...args) {
      logs.push(args.map(arg => {
        try { return String(arg); } catch(e) { return '[Object]'; }
      }).join(' '));
    },
    error: function(...args) {
      logs.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
    },
    warn: function(...args) {
      logs.push('WARN: ' + args.map(arg => String(arg)).join(' '));
    }
  };
  
  window.console = sandboxConsole;
  
  window.onerror = function(message, source, lineno, colno, error) {
    hasError = true;
    errorInfo = { message: String(message), line: lineno, column: colno };
    sendResults();
    return true;
  };
  
  function sendResults() {
    if (executed) return;
    executed = true;
    try {
      window.parent.postMessage({
        type: 'code-execution-result',
        logs: logs,
        hasError: hasError,
        errorInfo: errorInfo
      }, '*');
    } catch(e) {}
  }
  
  setTimeout(function() {
    if (!executed) sendResults();
  }, 100);
  
  try {
    (function() { ${userCode} })();
    sendResults();
  } catch (e) {
    hasError = true;
    errorInfo = { message: e.message || String(e), name: e.name || 'Error' };
    sendResults();
  }
})();
<\/script>
</body>
</html>
`;

        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);

        currentIframe = document.createElement('iframe');
        currentIframe.setAttribute('sandbox', 'allow-scripts');
        currentIframe.style.display = 'none';
        document.body.appendChild(currentIframe);

        executionTimeout = setTimeout(cleanupExecution, 5000);

        messageHandler = function(event) {
            if (!event.data || event.data.type !== 'code-execution-result') return;

            const { logs, hasError, errorInfo } = event.data;
            cleanupExecution();

            if (hasError && errorInfo) {
                errorDisplay.classList.remove("hidden");
                let errorText = errorInfo.name ? `${errorInfo.name}: ${errorInfo.message}` : errorInfo.message;
                if (errorInfo.line) {
                    errorText += `\n\nRad: ${errorInfo.line}`;
                    if (errorInfo.column) errorText += `, Kolumn: ${errorInfo.column}`;
                }
                errorMessage.textContent = errorText;
            }

            outputEl.textContent = logs.length > 0 ? logs.join("\n") : "(ingen output)";

            let allPassed = true;
            config.tests.forEach(function(test) {
                const div = document.createElement("div");
                div.className = "test";

                const pass = hasError ? false : test.validator(logs, hasError);

                if (hasError) {
                    div.innerHTML = `⚠️ <span class="fail">${test.name} - Kan inte köra på grund av fel</span>`;
                    allPassed = false;
                } else {
                    div.innerHTML = pass
                        ? `✅ <span class="pass">${test.name}</span>`
                        : `❌ <span class="fail">${test.name}</span>`;
                    if (!pass) allPassed = false;
                }

                testsBody.appendChild(div);
            });

            if (allPassed && !hasError) {
                container.querySelector('.overlay').classList.remove('hidden');
            }
        };

        window.addEventListener("message", messageHandler);
        currentIframe.src = blobUrl;
    }

    // Skapa HTML-struktur
    function createLabHTML(config) {
        return `
      <div class="code-lab">
        <div class="task">
          <h3>📘 ${config.task.title}</h3>
          <p>${config.task.description}</p>
        </div>
        
        <div class="editor-header">JavaScript Editor</div>
        <textarea class="code-editor">${config.initialCode || ''}</textarea>
        
        <div class="actions">
          <button class="run-btn">▶ Exekvera</button>
          ${config.hint ? '<button class="hint-btn">💡 Visa hint</button>' : ''}
        </div>
        
        ${config.hint ? `
        <div class="hints hidden">
          <span class="close-hint">✕</span>
          <strong>Hint:</strong><br>
          ${config.hint}
        </div>
        ` : ''}
        
        <div class="error-display hidden">
          <div class="error-header">⚠️ Fel upptäckt</div>
          <pre class="error-message"></pre>
        </div>
        
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
            <p>Du klarade alla tester.</p>
            <button class="close-overlay">Fortsätt</button>
          </div>
        </div>
      </div>
    `;
    }

    // Initialisera CodeLab
    function init(config) {
        // Validera config
        if (!config.containerId) {
            console.error('CodeLab: containerId krävs');
            return;
        }
        if (!config.tests || config.tests.length === 0) {
            console.error('CodeLab: tests array krävs');
            return;
        }

        const container = document.getElementById(config.containerId);
        if (!container) {
            console.error('CodeLab: Container med ID "' + config.containerId + '" hittades inte');
            return;
        }

        // Injektera styles
        injectStyles();

        // Sätt default värden
        config.task = config.task || { title: 'Uppgift', description: 'Lös uppgiften nedan' };
        config.initialCode = config.initialCode || '// Skriv din kod här\n';

        // Skapa HTML
        container.innerHTML = createLabHTML(config);

        const labContainer = container.querySelector('.code-lab');

        // Event listeners
        labContainer.querySelector('.run-btn').addEventListener('click', function() {
            runCode(labContainer, config);
        });

        if (config.hint) {
            labContainer.querySelector('.hint-btn').addEventListener('click', function() {
                toggleHints(labContainer);
            });
            labContainer.querySelector('.close-hint').addEventListener('click', function() {
                toggleHints(labContainer);
            });
        }

        labContainer.querySelector('.close-overlay').addEventListener('click', function() {
            closeOverlay(labContainer);
        });

        // Cleanup vid page unload
        window.addEventListener('beforeunload', cleanupExecution);

        currentConfig = config;
    }

    // Public API
    return {
        init: init,
        cleanup: cleanupExecution
    };
})();

// Exponera globalt för Wix
if (typeof window !== 'undefined') {
    window.CodeLab = CodeLab;
}
