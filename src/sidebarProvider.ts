import * as vscode from "vscode";

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "openheinerss.chatView";
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly onSendMessage: (text: string, harness: string, model: string) => void
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "prompt":
          this.onSendMessage(data.text, data.harness, data.model);
          break;
      }
    });
  }

  public postMessage(msg: any) {
    if (this._view) {
      this._view.webview.postMessage(msg);
    }
  }

  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Openheinerss Maestro</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      margin: 0;
      padding: 12px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
    }
    .header {
      font-weight: bold;
      font-size: 1.1em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .controls {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }
    select, input, textarea, button {
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #444);
      padding: 6px;
      border-radius: 4px;
      font-family: inherit;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 4px;
      margin-bottom: 12px;
    }
    .message {
      padding: 8px 10px;
      border-radius: 6px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .user {
      background: var(--vscode-editor-selectionBackground);
      align-self: flex-end;
      max-width: 85%;
    }
    .agent {
      background: var(--vscode-editor-inactiveSelectionBackground);
      align-self: flex-start;
      max-width: 95%;
    }
    .thinking {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      font-size: 0.9em;
      border-left: 2px solid var(--vscode-textLink-foreground);
      padding-left: 6px;
    }
    .tool {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-family: monospace;
      font-size: 0.85em;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    textarea {
      resize: vertical;
      min-height: 60px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span>🎼</span> Openheinerss Maestro
  </div>

  <div class="controls">
    <select id="harnessSelect">
      <option value="claude-code">Claude Code (Anthropic)</option>
      <option value="opencode">OpenCode (Ollama/DeepSeek)</option>
      <option value="aider">Aider (Pair Programming)</option>
      <option value="codex">Codex (OpenAI Assistants)</option>
      <option value="agy">Google AGY (Gemini)</option>
      <option value="mock">Mock Engine (Offline/0 tokens)</option>
    </select>
    <input type="text" id="modelInput" placeholder="Modelo (ex: ollama/qwen2.5-coder:32b, gpt-4o)" />
  </div>

  <div class="messages" id="messagesList">
    <div class="message agent">Olá! Escolha um motor e envie sua tarefa para orquestrar o código.</div>
  </div>

  <div class="footer">
    <textarea id="promptInput" placeholder="O que deseja que o agente faça?"></textarea>
    <button id="sendBtn">Enviar Tarefa</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesList = document.getElementById("messagesList");
    const promptInput = document.getElementById("promptInput");
    const harnessSelect = document.getElementById("harnessSelect");
    const modelInput = document.getElementById("modelInput");
    const sendBtn = document.getElementById("sendBtn");

    let currentAgentMsg = null;

    function appendMessage(text, className) {
      const div = document.createElement("div");
      div.className = "message " + className;
      div.textContent = text;
      messagesList.appendChild(div);
      messagesList.scrollTop = messagesList.scrollHeight;
      return div;
    }

    sendBtn.addEventListener("click", () => {
      const text = promptInput.value.trim();
      if (!text) return;
      appendMessage(text, "user");
      promptInput.value = "";
      currentAgentMsg = null;

      vscode.postMessage({
        type: "prompt",
        text: text,
        harness: harnessSelect.value,
        model: modelInput.value.trim()
      });
    });

    promptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "thinking") {
        appendMessage("🤔 " + msg.delta, "thinking");
      } else if (msg.type === "text") {
        if (!currentAgentMsg) {
          currentAgentMsg = appendMessage("", "agent");
        }
        currentAgentMsg.textContent += msg.delta;
        messagesList.scrollTop = messagesList.scrollHeight;
      } else if (msg.type === "tool") {
        appendMessage("🛠️ " + msg.name + ": " + JSON.stringify(msg.args), "tool");
      } else if (msg.type === "complete") {
        currentAgentMsg = null;
      } else if (msg.type === "error") {
        appendMessage("❌ Erro: " + msg.message, "agent");
      }
    });
  </script>
</body>
</html>`;
  }
}
