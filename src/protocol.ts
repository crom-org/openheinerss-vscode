export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

export interface PermissionRequestParams {
  sessionId: string;
  requestId: string;
  tool: string;
  command?: string;
  severity: "low" | "medium" | "high";
  reason?: string;
}

export interface TextEventParams {
  sessionId: string;
  delta: string;
}

export interface ThinkingEventParams {
  sessionId: string;
  delta: string;
}
