"use strict";var y=Object.create;var g=Object.defineProperty;var k=Object.getOwnPropertyDescriptor;var M=Object.getOwnPropertyNames;var I=Object.getPrototypeOf,O=Object.prototype.hasOwnProperty;var P=(o,e)=>{for(var s in e)g(o,s,{get:e[s],enumerable:!0})},f=(o,e,s,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of M(e))!O.call(o,t)&&t!==s&&g(o,t,{get:()=>e[t],enumerable:!(n=k(e,t))||n.enumerable});return o};var u=(o,e,s)=>(s=o!=null?y(I(o)):{},f(e||!o||!o.__esModule?g(s,"default",{value:o,enumerable:!0}):s,o)),C=o=>f(g({},"__esModule",{value:!0}),o);var q={};P(q,{activate:()=>E,deactivate:()=>R});module.exports=C(q);var i=u(require("vscode"));var w=u(require("child_process")),b=u(require("readline")),l=u(require("vscode")),v=class{constructor(e,s){this.binaryPath=e;this.cwd=s}process=null;reqIdCounter=1;pendingRequests=new Map;onNotificationEmitter=new l.EventEmitter;onNotification=this.onNotificationEmitter.event;async start(){if(this.process)return;try{this.process=w.spawn(this.binaryPath,["serve","--stdio"],{cwd:this.cwd,env:{...process.env}})}catch(s){throw new Error(`Falha ao iniciar Openheinerss (${this.binaryPath}): ${s.message}`)}this.process.on("error",s=>{l.window.showErrorMessage(`Erro no processo Openheinerss: ${s.message}`),this.stop()}),this.process.on("exit",s=>{this.process=null}),b.createInterface({input:this.process.stdout}).on("line",s=>{if(s.trim())try{let n=JSON.parse(s);if("id"in n&&n.id!==null){let t=this.pendingRequests.get(n.id);t&&(this.pendingRequests.delete(n.id),n.error?t.reject(new Error(n.error.message||"Erro RPC")):t.resolve(n.result))}else"method"in n&&this.handleNotification(n)}catch(n){console.error("Falha ao analisar mensagem do Openheinerss:",s,n)}})}async handleNotification(e){if(e.method==="agent.permission_request"){let s=e.params,n=s.command||s.tool,r=await l.window.showWarningMessage(`\u{1F6E1}\uFE0F [Openheinerss] O agente deseja executar: ${n}
Motivo: ${s.reason||"Opera\xE7\xE3o necess\xE1ria"}`,{modal:s.severity==="high"},"Permitir","Negar")==="Permitir";await this.sendRequest("session.permission_respond",{sessionId:s.sessionId,requestId:s.requestId,allow:r})}this.onNotificationEmitter.fire(e)}async sendRequest(e,s={}){(!this.process||!this.process.stdin.writable)&&await this.start();let n=this.reqIdCounter++,t={jsonrpc:"2.0",id:n,method:e,params:s};return new Promise((r,d)=>{this.pendingRequests.set(n,{resolve:r,reject:d}),this.process.stdin.write(JSON.stringify(t)+`
`)})}stop(){this.process&&(this.process.kill("SIGTERM"),this.process=null)}};var m=class{constructor(e,s){this._extensionUri=e;this.onSendMessage=s}static viewType="openheinerss.chatView";_view;resolveWebviewView(e,s,n){this._view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri]},e.webview.html=this._getHtmlForWebview(),e.webview.onDidReceiveMessage(t=>{switch(t.type){case"prompt":this.onSendMessage(t.text,t.harness,t.model);break}})}postMessage(e){this._view&&this._view.webview.postMessage(e)}_getHtmlForWebview(){return`<!DOCTYPE html>
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
    <span>\u{1F3BC}</span> Openheinerss Maestro
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
    <div class="message agent">Ol\xE1! Escolha um motor e envie sua tarefa para orquestrar o c\xF3digo.</div>
  </div>

  <div class="footer">
    <textarea id="promptInput" placeholder="O que deseja que o agente fa\xE7a?"></textarea>
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
        appendMessage("\u{1F914} " + msg.delta, "thinking");
      } else if (msg.type === "text") {
        if (!currentAgentMsg) {
          currentAgentMsg = appendMessage("", "agent");
        }
        currentAgentMsg.textContent += msg.delta;
        messagesList.scrollTop = messagesList.scrollHeight;
      } else if (msg.type === "tool") {
        appendMessage("\u{1F6E0}\uFE0F " + msg.name + ": " + JSON.stringify(msg.args), "tool");
      } else if (msg.type === "complete") {
        currentAgentMsg = null;
      } else if (msg.type === "error") {
        appendMessage("\u274C Erro: " + msg.message, "agent");
      }
    });
  </script>
</body>
</html>`}};var c=null,p=null,a;function E(o){let e=i.workspace.getConfiguration("openheinerss"),s=e.get("binaryPath")||"openheinerss",n=i.workspace.workspaceFolders?.[0]?.uri.fsPath||process.cwd();c=new v(s,n),a=i.window.createStatusBarItem(i.StatusBarAlignment.Right,100),a.command="openheinerss.focusChat",a.text="$(symbol-event) Openheinerss",a.tooltip="Clique para abrir o Openheinerss Maestro",a.show(),o.subscriptions.push(a);let t=new m(o.extensionUri,async(r,d,x)=>{try{a.text="$(sync~spin) Openheinerss: Pensando...",p||(p=(await c.sendRequest("session.create",{harness:d||e.get("defaultHarness")||"claude-code",model:x||e.get("defaultModel")||void 0,cwd:n,options:{permissionMode:e.get("permissionMode")||"prompt"}})).sessionId),await c.sendRequest("session.prompt",{sessionId:p,text:r})}catch(h){i.window.showErrorMessage(`Erro no Openheinerss: ${h.message}`),a.text="$(alert) Openheinerss: Erro",t.postMessage({type:"error",message:h.message})}});o.subscriptions.push(i.window.registerWebviewViewProvider(m.viewType,t)),c.onNotification(r=>{switch(r.method){case"agent.thinking":t.postMessage({type:"thinking",delta:r.params.delta}),a.text="$(sync~spin) Openheinerss: Deliberando...";break;case"agent.text":t.postMessage({type:"text",delta:r.params.delta}),a.text="$(sync~spin) Openheinerss: Gerando c\xF3digo...";break;case"agent.tool_call":t.postMessage({type:"tool",name:r.params.toolName,args:r.params.arguments}),a.text=`$(tools) Openheinerss: ${r.params.toolName}`;break;case"agent.complete":t.postMessage({type:"complete"}),a.text="$(check) Openheinerss: Pronto";break;case"agent.error":t.postMessage({type:"error",message:r.params.message}),a.text="$(alert) Openheinerss: Falha";break}}),o.subscriptions.push(i.commands.registerCommand("openheinerss.doctor",async()=>{try{let d=(await c.sendRequest("doctor.check",{})).summary||"Ambiente validado com sucesso!";i.window.showInformationMessage(`Openheinerss Doctor: ${d}`)}catch(r){i.window.showErrorMessage(`Falha no Doctor: ${r.message}`)}})),o.subscriptions.push(i.commands.registerCommand("openheinerss.stop",async()=>{p&&c&&(await c.sendRequest("session.abort",{sessionId:p}),p=null,a.text="$(symbol-event) Openheinerss: Parado",i.window.showInformationMessage("Sess\xE3o do agente encerrada com sucesso."))})),o.subscriptions.push(i.commands.registerCommand("openheinerss.selectHarness",async()=>{let r=[{label:"claude-code",description:"Claude Code oficial (Anthropic Claude 3.5/3.7)"},{label:"opencode",description:"OpenCode Interpreter (Ollama, DeepSeek, Groq)"},{label:"aider",description:"Aider Pair Programming (Git auto-commit & Ollama)"},{label:"codex",description:"OpenAI Codex / Assistants API (o3-mini, GPT-4o)"},{label:"agy",description:"Google Antigravity Suite (Gemini Pro/Flash)"},{label:"mock",description:"Mock Engine (Testes determin\xEDsticos sem tokens)"}],d=await i.window.showQuickPick(r,{placeHolder:"Selecione o motor de agente (Harness) para o projeto"});d&&(await e.update("defaultHarness",d.label,i.ConfigurationTarget.Workspace),p=null,i.window.showInformationMessage(`Motor padr\xE3o alterado para: ${d.label}`))})),o.subscriptions.push(i.commands.registerCommand("openheinerss.focusChat",()=>{i.commands.executeCommand("openheinerss.chatView.focus")}))}function R(){c&&(c.stop(),c=null)}0&&(module.exports={activate,deactivate});
