// NATS client (existing)
export { KaisClient } from "./client";
export type { KaisClientOptions } from "./client";
export { Message } from "./types";
export type { CellInfo, MessageFields } from "./types";

// HTTP REST API client
export { KaisHTTP } from "./http";
export type { KaisHTTPOptions } from "./http";

// Resource clients
export {
  CellsClient,
  FormationsClient,
  RulesClient,
  FilesClient,
  CompletionsClient,
  KaisAPIError,
} from "./resources";

// API types
export type {
  ObjectMeta,
  LLMProvider,
  CellPhase,
  ReasoningSpec,
  WorkingMemorySpec,
  MindSpec,
  ToolSpec,
  ResourceBudget,
  ComputeResources,
  RemoteTarget,
  RepositoryRef,
  KnowledgeGraphRef,
  VectorStoreRef,
  WebhookConfig,
  CellSpec,
  CellStatus,
  Cell,
  TopologyType,
  FormationPhase,
  TopologyRoute,
  TopologyBroadcast,
  TopologyBlackboard,
  TopologySpec,
  CellTemplate,
  FormationBudget,
  FormationSpec,
  FormationCellStatus,
  FormationStatus,
  Formation,
  Rule,
  FileInfo,
  ChatMessage,
  CompletionResponse,
  CompletionChunk,
  CreateCellRequest,
  UpdateCellRequest,
  CreateFormationRequest,
  UpdateFormationRequest,
  CreateRuleRequest,
  UpdateRuleRequest,
  Condition,
  APIErrorResponse,
} from "./api-types";
