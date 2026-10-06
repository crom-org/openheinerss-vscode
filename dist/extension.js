"use strict";var C=Object.create;var y=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var S=Object.getPrototypeOf,B=Object.prototype.hasOwnProperty;var A=(t,e)=>{for(var s in e)y(t,s,{get:e[s],enumerable:!0})},O=(t,e,s,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of q(e))!B.call(t,r)&&r!==s&&y(t,r,{get:()=>e[r],enumerable:!(i=R(e,r))||i.enumerable});return t};var v=(t,e,s)=>(s=t!=null?C(S(t)):{},O(e||!t||!t.__esModule?y(s,"default",{value:t,enumerable:!0}):s,t)),$=t=>O(y({},"__esModule",{value:!0}),t);var H={};A(H,{activate:()=>N,deactivate:()=>T});module.exports=$(H);var n=v(require("vscode"));var E=v(require("child_process")),f=v(require("fs")),d=v(require("path")),P=v(require("readline")),b=v(require("vscode")),x=class{constructor(e,s){this.binaryPath=e;this.cwd=s}process=null;reqIdCounter=1;pendingRequests=new Map;onNotificationEmitter=new b.EventEmitter;onNotification=this.onNotificationEmitter.event;resolveBinary(){let e=process.env.HOME||"",s=[this.binaryPath,d.join(e,".local","bin","openheinerss"),d.join(e,"go","bin","openheinerss"),d.join(this.cwd,"openheinerss"),"/usr/local/bin/openheinerss","/usr/bin/openheinerss"];for(let i of s)if(i&&f.existsSync(i))try{return f.accessSync(i,f.constants.X_OK),i}catch{}return this.binaryPath}async start(){if(this.process&&this.process.stdin&&this.process.stdin.writable)return;let e=this.resolveBinary();return new Promise((s,i)=>{let r=!1,a={...process.env},o=process.env.HOME||"",g=[d.join(o,".local","bin"),d.join(o,"go","bin"),d.join(o,".bun","bin"),d.join(o,".cargo","bin"),d.join(o,".opencode","bin"),"/usr/local/bin","/usr/bin"].filter(Boolean),k=a.PATH||"";a.PATH=g.join(d.delimiter)+d.delimiter+k;try{this.process=E.spawn(e,["serve","--stdio"],{cwd:this.cwd,env:a})}catch(l){return i(new Error(`Falha ao executar Openheinerss (${e}): ${l.message}`))}this.process.on("error",l=>{this.stop(),r?b.window.showErrorMessage(`Erro no processo Openheinerss: ${l.message}`):i(new Error(`Falha ao iniciar Openheinerss (${e}): ${l.message}`))}),this.process.on("exit",l=>{this.process=null,r||i(new Error(`Processo Openheinerss encerrou com c\xF3digo ${l}`))});let u=setTimeout(()=>{this.process&&this.process.stdin&&this.process.stdin.writable?(r=!0,s()):r||i(new Error("Openheinerss n\xE3o respondeu no tempo limite"))},100);P.createInterface({input:this.process.stdout}).on("line",l=>{if(l.trim())try{let p=JSON.parse(l);if("id"in p&&p.id!==null){let M=this.pendingRequests.get(p.id);M&&(this.pendingRequests.delete(p.id),p.error?M.reject(new Error(p.error.message||"Erro RPC")):M.resolve(p.result))}else"method"in p&&this.handleNotification(p)}catch(p){console.error("Falha ao analisar mensagem do Openheinerss:",l,p)}})})}async handleNotification(e){if(e.method==="agent.permission_request"){let s=e.params,i=s.command||s.tool,a=await b.window.showWarningMessage(`\u{1F6E1}\uFE0F [Openheinerss] O agente deseja executar: ${i}
Motivo: ${s.reason||"Opera\xE7\xE3o necess\xE1ria"}`,{modal:s.severity==="high"},"Permitir","Negar")==="Permitir";await this.sendRequest("session.permission_respond",{sessionId:s.sessionId,requestId:s.requestId,allow:a})}this.onNotificationEmitter.fire(e)}async sendRequest(e,s={}){if((!this.process||!this.process.stdin||!this.process.stdin.writable)&&await this.start(),!this.process||!this.process.stdin||!this.process.stdin.writable)throw new Error("Servidor Openheinerss n\xE3o est\xE1 acess\xEDvel ou processo n\xE3o inicializou.");let i=this.reqIdCounter++,r={jsonrpc:"2.0",id:i,method:e,params:s};return new Promise((a,o)=>{this.pendingRequests.set(i,{resolve:a,reject:o}),this.process.stdin.write(JSON.stringify(r)+`
`)})}stop(){this.process&&(this.process.kill("SIGTERM"),this.process=null)}};var w=class{constructor(e,s){this._extensionUri=e;this.onSendMessage=s}static viewType="openheinerss.chatView";_view;resolveWebviewView(e,s,i){this._view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri]},e.webview.html=this._getHtmlForWebview(),e.webview.onDidReceiveMessage(r=>{switch(r.type){case"prompt":this.onSendMessage(r.text,r.harness,r.model);break}})}postMessage(e){this._view&&this._view.webview.postMessage(e)}_getHtmlForWebview(){return`<!DOCTYPE html>
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
</html>`}};var m=null,h=null,c;function N(t){let e=n.workspace.getConfiguration("openheinerss"),s=e.get("binaryPath")||"openheinerss",i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||process.cwd();m=new x(s,i),c=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),c.command="openheinerss.focusChat",c.text="$(symbol-event) Openheinerss",c.tooltip="Clique para abrir o Openheinerss Maestro",c.show(),t.subscriptions.push(c);let r=null,a=new w(t.extensionUri,async(o,g,k)=>{try{c.text="$(sync~spin) Openheinerss: Pensando...";let u=g||e.get("defaultHarness")||"claude-code";(!h||r!==u)&&(h=(await m.sendRequest("session.create",{harness:u,model:k||e.get("defaultModel")||void 0,cwd:i,options:{permissionMode:e.get("permissionMode")||"prompt"}})).sessionId,r=u),await m.sendRequest("session.prompt",{sessionId:h,text:o})}catch(u){n.window.showErrorMessage(`Erro no Openheinerss: ${u.message}`),c.text="$(alert) Openheinerss: Erro",a.postMessage({type:"error",message:u.message})}});t.subscriptions.push(n.window.registerWebviewViewProvider(w.viewType,a)),m.onNotification(o=>{switch(o.method){case"agent.thinking":a.postMessage({type:"thinking",delta:o.params.delta}),c.text="$(sync~spin) Openheinerss: Deliberando...";break;case"agent.text":a.postMessage({type:"text",delta:o.params.delta}),c.text="$(sync~spin) Openheinerss: Gerando c\xF3digo...";break;case"agent.tool_call":a.postMessage({type:"tool",name:o.params.toolName,args:o.params.arguments}),c.text=`$(tools) Openheinerss: ${o.params.toolName}`;break;case"agent.complete":a.postMessage({type:"complete"}),c.text="$(check) Openheinerss: Pronto";break;case"agent.error":a.postMessage({type:"error",message:o.params.message}),c.text="$(alert) Openheinerss: Falha";break}}),t.subscriptions.push(n.commands.registerCommand("openheinerss.doctor",async()=>{try{let g=(await m.sendRequest("doctor.check",{})).summary||"Ambiente validado com sucesso!";n.window.showInformationMessage(`Openheinerss Doctor: ${g}`)}catch(o){n.window.showErrorMessage(`Falha no Doctor: ${o.message}`)}})),t.subscriptions.push(n.commands.registerCommand("openheinerss.stop",async()=>{h&&m&&(await m.sendRequest("session.abort",{sessionId:h}),h=null,c.text="$(symbol-event) Openheinerss: Parado",n.window.showInformationMessage("Sess\xE3o do agente encerrada com sucesso."))})),t.subscriptions.push(n.commands.registerCommand("openheinerss.selectHarness",async()=>{let o=[{label:"claude-code",description:"Claude Code oficial (Anthropic Claude 3.5/3.7)"},{label:"opencode",description:"OpenCode Interpreter (Ollama, DeepSeek, Groq)"},{label:"aider",description:"Aider Pair Programming (Git auto-commit & Ollama)"},{label:"codex",description:"OpenAI Codex / Assistants API (o3-mini, GPT-4o)"},{label:"agy",description:"Google Antigravity Suite (Gemini Pro/Flash)"},{label:"mock",description:"Mock Engine (Testes determin\xEDsticos sem tokens)"}],g=await n.window.showQuickPick(o,{placeHolder:"Selecione o motor de agente (Harness) para o projeto"});g&&(await e.update("defaultHarness",g.label,n.ConfigurationTarget.Workspace),h=null,n.window.showInformationMessage(`Motor padr\xE3o alterado para: ${g.label}`))})),t.subscriptions.push(n.commands.registerCommand("openheinerss.focusChat",()=>{n.commands.executeCommand("openheinerss.chatView.focus")}))}function T(){m&&(m.stop(),m=null)}0&&(module.exports={activate,deactivate});
