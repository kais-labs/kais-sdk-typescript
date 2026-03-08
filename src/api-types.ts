// api-types.ts — Type definitions matching the kAIs Go API resources.

// --- Kubernetes metadata ---

export interface ObjectMeta {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  resourceVersion?: string;
  uid?: string;
}

// --- Cell types ---

export type LLMProvider = "anthropic" | "openai" | "ollama" | "openrouter";

export type CellPhase = "Pending" | "Running" | "Completed" | "Failed" | "Paused";

export interface ReasoningSpec {
  effort?: string;
  budgetTokens?: number;
}

export interface WorkingMemorySpec {
  maxMessages: number;
  summarizeAfter: number;
}

export interface MindSpec {
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  reasoning?: ReasoningSpec;
  workingMemory?: WorkingMemorySpec;
}

export interface ToolSpec {
  name: string;
  config?: Record<string, string>;
}

export interface ResourceBudget {
  maxTokensPerTurn?: number;
  maxCostPerHour?: number;
  maxTotalCost?: number;
}

export interface ComputeResources {
  cpuLimit?: string;
  memoryLimit?: string;
}

export interface RemoteTarget {
  host: string;
  port?: number;
  user: string;
  keySecret: string;
  workDir?: string;
}

export interface RepositoryRef {
  name: string;
  mountPath?: string;
}

export interface KnowledgeGraphRef {
  name: string;
  purpose?: string;
  shared?: boolean;
}

export interface VectorStoreRef {
  name: string;
  purpose?: string;
}

export interface WebhookConfig {
  provider: string;
  secret?: string;
  events?: string[];
}

export interface CellSpec {
  mind: MindSpec;
  tools?: ToolSpec[];
  budget?: ResourceBudget;
  resources?: ComputeResources;
  parentRef?: string;
  formationRef?: string;
  initCommands?: string[];
  remoteRef?: string;
  remote?: RemoteTarget;
  repositories?: RepositoryRef[];
  knowledgeGraphRefs?: KnowledgeGraphRef[];
  vectorStoreRefs?: VectorStoreRef[];
  ruleRefs?: string[];
  connectorRefs?: string[];
  webhooks?: WebhookConfig[];
}

export interface CellStatus {
  phase?: CellPhase;
  podName?: string;
  totalCost?: number;
  totalTokens?: number;
  lastActive?: string;
  message?: string;
  conditions?: Condition[];
}

export interface Cell {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: CellSpec;
  status?: CellStatus;
}

// --- Formation types ---

export type TopologyType = "full_mesh" | "hierarchy" | "star" | "ring" | "stigmergy" | "custom";

export type FormationPhase = "Pending" | "Running" | "Paused" | "Completed" | "Failed";

export interface TopologyRoute {
  from: string;
  to: string[];
  protocol?: string;
}

export interface TopologyBroadcast {
  enabled: boolean;
  from?: string[];
}

export interface TopologyBlackboard {
  decayMinutes: number;
}

export interface TopologySpec {
  type: TopologyType;
  root?: string;
  hub?: string;
  routes?: TopologyRoute[];
  broadcast?: TopologyBroadcast;
  blackboard?: TopologyBlackboard;
}

export interface CellTemplate {
  name: string;
  replicas?: number;
  spec: CellSpec;
}

export interface FormationBudget {
  maxTotalCost?: number;
  maxCostPerHour?: number;
  allocation?: Record<string, string>;
}

export interface FormationSpec {
  cells: CellTemplate[];
  topology: TopologySpec;
  budget?: FormationBudget;
  knowledgeGraphRefs?: KnowledgeGraphRef[];
  ruleRefs?: string[];
  connectorRefs?: string[];
}

export interface FormationCellStatus {
  name: string;
  phase: CellPhase;
  cost: number;
}

export interface FormationStatus {
  phase?: FormationPhase;
  readyCells?: number;
  totalCells?: number;
  totalCost?: number;
  cells?: FormationCellStatus[];
  message?: string;
  conditions?: Condition[];
}

export interface Formation {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: FormationSpec;
  status?: FormationStatus;
}

// --- Rule types ---

export interface Rule {
  name: string;
  content: string;
  priority: number;
  enabled: boolean;
}

// --- File types ---

export interface FileInfo {
  name: string;
  size: number;
  mimeType: string;
  uploadedBy?: string;
  uploadedAt?: string;
  url: string;
}

// --- Chat types ---

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  thinking?: string;
  timestamp: string;
}

// --- Completion types ---

export interface CompletionResponse {
  content: string;
  from: string;
}

export interface CompletionChunk {
  type: string;
  content: string;
  from: string;
}

// --- Request types ---

export interface CreateCellRequest {
  name: string;
  spec: CellSpec;
}

export interface UpdateCellRequest {
  spec: CellSpec;
}

export interface CreateFormationRequest {
  name: string;
  spec: FormationSpec;
}

export interface UpdateFormationRequest {
  spec: FormationSpec;
}

export interface CreateRuleRequest {
  name: string;
  content: string;
  priority?: number;
  enabled?: boolean;
}

export interface UpdateRuleRequest {
  content?: string;
  priority?: number;
  enabled?: boolean;
}

// --- Kubernetes condition ---

export interface Condition {
  type: string;
  status: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
  observedGeneration?: number;
}

// --- API error response ---

export interface APIErrorResponse {
  error: string;
}
