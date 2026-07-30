export interface FormIssue {
  source: "schema" | "semantic" | "registry" | "storage" | "renderer";
  code: string;
  path: string;
  messageKey: string;
  message: string;
  elementId?: string;
  details?: Record<string, unknown>;
}
