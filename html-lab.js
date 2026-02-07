const HtmlLab = (function () {
  'use strict';

  let vmInstance = null;

  /* =======================
     STYLES
  ======================= */
  const styles = `
    .html-lab {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 0;
    }
    
    .html-lab .exercise-card {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .html-lab .exercise-card h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .html-lab .exercise-card p {
      margin: 0 0 12px 0;
      color: #334155;
      line-height: 1.6;
    }
    
    .html-lab .exercise-card ul {
      margin: 0;
      padding-left: 20px;
      color: #334155;
    }
    
    .html-lab .exercise-card li {
      margin-bottom: 6px;
    }
    
    .html-lab .exercise-card strong {
      color: #1e40af;
      font-family: monospace;
      background: #dbeafe;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
    }
    
    .html-lab .editor-container {
      position: relative;
      height: 500px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      background: #1e1e1e;
    }
    
    .html-lab .loading {
      position: absolute;
      inset: 0;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    
    .html-lab .spinner {
      width: 36px;
      height: 36px;
      border: 4px solid #eee;
      border-top: 4px solid #4f46e5;
      border-radius: 50%;
      animation: html-lab-spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes html-lab-spin {
      to { transform: rotate(360deg); }
    }
    
    .html-lab .stackblitz {
      width: 100%;
      height: 100%;
    }
    
    .html-lab .verify-bar {
      background: #f9fafb;
      border-top: 1px solid #ddd;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .html-lab .verify-btn {
      background: #4f46e5;
      color: white;
      font-size: 16px;
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
    
    .html-lab .verify-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .html-lab .verify-btn:hover:not(:disabled) {
      background: #4338ca;
    }
    
    .html-lab .test-output {
      margin-top: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #ffffff;
      min-height: 200px;
      overflow: hidden;
    }
    
    .html-lab .test-header {
      background: #374151;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .html-lab .test-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #f3f4f6;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .html-lab .test-summary {
      font-size: 13px;
      color: #d1d5db;
      font-weight: 500;
    }
    
    .html-lab .test-summary.all-passed {
      color: #86efac;
    }
    
    .html-lab .test-summary.has-failures {
      color: #fca5a5;
    }
    
    .html-lab .test-body {
      padding: 16px;
    }
    
    .html-lab .test-placeholder {
      text-align: center;
      padding: 40px 20px;
      color: #9ca3af;
      font-size: 14px;
    }
    
    .html-lab .test-item {
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }
    
    .html-lab .test-item.pass {
      background: #f0fdf4;
      border-color: #86efac;
    }
    
    .html-lab .test-item.fail {
      background: #fef2f2;
      border-color: #fecaca;
    }
    
    .html-lab .test-item-header {
      display: flex;
      align-items: center;
    }
    
    .html-lab .test-icon {
      margin-right: 12px;
      font-size: 18px;
      font-weight: bold;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .html-lab .test-item.pass .test-icon {
      color: #16a34a;
      background: #dcfce7;
    }
    
    .html-lab .test-item.fail .test-icon {
      color: #dc2626;
      background: #fee2e2;
    }
    
    .html-lab .test-name {
      flex: 1;
      font-weight: 500;
      color: #111827;
      font-family: monospace;
      font-size: 13px;
    }
    
    .html-lab .hint-btn {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      margin-left: 8px;
    }
    
    .html-lab .hint-btn:hover {
      background: #d97706;
    }
    
    .html-lab .hint-content {
      display: none;
      margin-top: 12px;
      padding: 12px;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      font-size: 13px;
      color: #78350f;
      line-height: 1.5;
    }
    
    .html-lab .hint-content.show {
      display: block;
    }
    
    .html-lab .hint-content code {
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #92400e;
      white-space: nowrap;
    }
    
    .html-lab .hint-content .code-block {
      background: #fef3c7;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #92400e;
      margin-top: 8px;
      overflow-x: auto;
      white-space: pre;
    }
    
    .html-lab .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      animation: html-lab-fadeIn 0.3s ease;
    }
    
    .html-lab .modal-overlay.show {
      display: flex;
    }
    
    @keyframes html-lab-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .html-lab .modal-content {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: html-lab-slideUp 0.3s ease;
      position: relative;
    }
    
    @keyframes html-lab-slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .html-lab .modal-icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: html-lab-bounce 0.6s ease;
    }
    
    @keyframes html-lab-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    .html-lab .modal-title {
      font-size: 28px;
      font-weight: bold;
      color: #059669;
      margin: 0 0 12px 0;
    }
    
    .html-lab .modal-message {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 30px 0;
      line-height: 1.6;
    }
    
    .html-lab .modal-close-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: transform 0.2s ease;
    }
    
    .html-lab .modal-close-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    .html-lab .hidden {
      display: none;
    }
  `;

  function injectStyles() {
    if (document.getElementById('html-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'html-lab-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  /* =======================
     HTML TEMPLATE
  ======================= */
  function template(config) {
    const requirements = config.requirements.map(req => 
      `<li>${req}</li>`
    ).join('');

    return `
<div class="html-lab">
  <div class="exercise-card">
    <h2>📝 ${config.title}</h2>
    <p>${config.description}</p>
    <ul>${requirements}</ul>
  </div>

  <div class="editor-container">
    <div class="loading">
      <div class="spinner"></div>
      <div>Laddar kodmiljö…</div>
    </div>
    <div class="stackblitz"></div>
  </div>

  <div class="verify-bar">
    <strong>När du är klar:</strong>
    <button class="verify-btn" disabled>✔ Verifiera lösning</button>
  </div>

  <div class="test-output">
    <div class="test-header">
      <h3>🧪 Testresultat</h3>
      <span class="test-summary">Väntar på verifiering...</span>
    </div>
    <div class="test-body">
      <div class="test-placeholder">
        Klicka på "Verifiera lösning" för att testa din kod
      </div>
    </div>
  </div>

  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-icon">🎉</div>
      <h2 class="modal-title">Grattis!</h2>
      <p class="modal-message">Du har klarat alla tester!<br>Fantastiskt jobbat med din HTML-kod.</p>
      <button class="modal-close-btn">Fortsätt</button>
    </div>
  </div>
</div>
`;
  }

  /* =======================
     RUN TESTS
  ======================= */
  async function runTests(container, config) {
    const testBody = container.querySelector('.test-body');
    const testSummary = container.querySelector('.test-summary');
    const successModal = container.querySelector('.modal-overlay');

    testBody.innerHTML = '<div class="test-placeholder">Kör tester...</div>';
    testSummary.textContent = "Testar...";
    testSummary.className = "test-summary";

    try {
      const files = await vmInstance.getFsSnapshot();
      const htmlContent = files['index.html'];

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const results = config.tests.map(test => ({
        id: test.id,
        name: test.name,
        passed: test.validator(doc),
        hint: test.hint
      }));

      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => !r.passed).length;
      const total = results.length;

      // Update summary
      if (failed === 0) {
        testSummary.textContent = `${passed}/${total} tester godkända ✓`;
        testSummary.className = "test-summary all-passed";
      } else {
        testSummary.textContent = `${passed}/${total} tester godkända`;
        testSummary.className = "test-summary has-failures";
      }

      // Render test results
      testBody.innerHTML = results.map(r => {
        const hintBtn = !r.passed && r.hint ?
          `<button class="hint-btn" onclick="HtmlLab.toggleHint('${r.id}')">💡 Visa hint</button>` : '';
        const hintDiv = !r.passed && r.hint ?
          `<div class="hint-content" id="hint-${r.id}">${r.hint}</div>` : '';

        return `<div class="test-item ${r.passed ? 'pass' : 'fail'}">
          <div class="test-item-header">
            <span class="test-icon">${r.passed ? '✓' : '✗'}</span>
            <div class="test-name">${r.name}</div>
            ${hintBtn}
          </div>
          ${hintDiv}
        </div>`;
      }).join("");

      // Show success modal if all tests passed
      if (failed === 0) {
        setTimeout(() => {
          successModal.classList.add('show');
        }, 500);
      }

    } catch (error) {
      console.error("Verification error:", error);
      testBody.innerHTML = '<div class="test-placeholder" style="color: #dc2626;">Ett fel uppstod vid verifiering. Försök igen.</div>';
      testSummary.textContent = "Fel vid testning";
      testSummary.className = "test-summary has-failures";
    }
  }

  /* =======================
     INIT
  ======================= */
  async function init(config) {
    if (!config.containerId || !config.tests) {
      console.error('HtmlLab: ogiltig config');
      return;
    }

    const container = document.getElementById(config.containerId);
    if (!container) {
      console.error('HtmlLab: container not found');
      return;
    }

    // Load StackBlitz SDK dynamically
    if (!window.sdk) {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import sdk from "https://unpkg.com/@stackblitz/sdk@1/bundles/sdk.m.js";
        window.sdk = sdk;
      `;
      document.head.appendChild(script);
      
      // Wait for SDK to load
      await new Promise(resolve => {
        const checkSdk = setInterval(() => {
          if (window.sdk) {
            clearInterval(checkSdk);
            resolve();
          }
        }, 100);
      });
    }

    injectStyles();
    container.innerHTML = template(config);

    const lab = container.querySelector('.html-lab');
    const loading = lab.querySelector('.loading');
    const verifyBtn = lab.querySelector('.verify-btn');
    const stackblitzDiv = lab.querySelector('.stackblitz');
    const modalCloseBtn = lab.querySelector('.modal-close-btn');
    const successModal = lab.querySelector('.modal-overlay');

    // Initialize StackBlitz
    window.sdk.embedProject(stackblitzDiv, {
      template: "html",
      title: config.title,
      description: config.description,
      openFile: "index.html",
      hideNavigation: true,
      hideDevTools: true,
      files: {
        "index.html": config.initialCode || `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
</head>
<body>

<!-- Skriv din HTML här -->

</body>
</html>`
      }
    }).then((vm) => {
      vmInstance = vm;
      loading.style.display = "none";
      verifyBtn.disabled = false;
    });

    // Event handlers
    verifyBtn.onclick = () => runTests(lab, config);
    
    modalCloseBtn.onclick = () => {
      successModal.classList.remove('show');
    };

    successModal.addEventListener('click', function(e) {
      if (e.target === successModal) {
        successModal.classList.remove('show');
      }
    });
  }

  function toggleHint(testId) {
    const hintElement = document.getElementById(`hint-${testId}`);
    if (hintElement) {
      hintElement.classList.toggle('show');
    }
  }

  return { init, toggleHint };
})();

window.HtmlLab = HtmlLab;
