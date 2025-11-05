/**
 * PERDIA ENTITY EXPORTS
 * Maps Base44 entity names to Perdia SDK entities
 */

import { base44 } from './base44Client';

// ============================================================================
// ACTIVE PERDIA EDUCATION ENTITIES (Used by the app)
// ============================================================================

export const Keyword = base44.entities.Keyword;
export const ContentQueue = base44.entities.ContentQueue;
export const PerformanceMetric = base44.entities.PerformanceMetric;
export const WordPressConnection = base44.entities.WordPressConnection;
export const AutomationSettings = base44.entities.AutomationSettings;
export const PageOptimization = base44.entities.PageOptimization;
export const BlogPost = base44.entities.BlogPost;
export const SocialPost = base44.entities.SocialPost;
export const KnowledgeBaseDocument = base44.entities.KnowledgeBaseDocument;
export const AgentFeedback = base44.entities.AgentFeedback;
export const FileDocument = base44.entities.FileDocument;
export const ChatChannel = base44.entities.ChatChannel;
export const ChatMessage = base44.entities.ChatMessage;

// Agent system entities
export const AgentDefinition = base44.entities.AgentDefinition;
export const AgentConversation = base44.entities.AgentConversation;
export const AgentMessage = base44.entities.AgentMessage;

// ============================================================================
// LEGACY/UNUSED ENTITIES (Not used by Perdia but kept for compatibility)
// ============================================================================

export const Client = base44.entities.Client || {};
export const Project = base44.entities.Project || {};
export const Task = base44.entities.Task || {};
export const TimeEntry = base44.entities.TimeEntry || {};
export const EOSCompany = base44.entities.EOSCompany || {};
export const EOSRock = base44.entities.EOSRock || {};
export const EOSIssue = base44.entities.EOSIssue || {};
export const EOSScorecard = base44.entities.EOSScorecard || {};
export const EOSAccountabilitySeat = base44.entities.EOSAccountabilitySeat || {};
export const EOSPersonAssessment = base44.entities.EOSPersonAssessment || {};
export const EOSProcess = base44.entities.EOSProcess || {};
export const EOSProcessImprovement = base44.entities.EOSProcessImprovement || {};
export const EOSScorecardMetric = base44.entities.EOSScorecardMetric || {};
export const EOSScorecardEntry = base44.entities.EOSScorecardEntry || {};
export const EOSQuarterlySession = base44.entities.EOSQuarterlySession || {};
export const EOSToDo = base44.entities.EOSToDo || {};
export const MeetingNote = base44.entities.MeetingNote || {};
export const Report = base44.entities.Report || {};

// ============================================================================
// AUTH SDK
// ============================================================================

export const User = base44.auth;
