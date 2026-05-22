import type { AurenMessage } from '../components/AurenMessageList';
import type { AurenImageAttachment } from './aurenAttachments';
import { supabase } from './supabase';

export type AurenConversation = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
};

export type AurenProject = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
};

type ConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
};

type MessageRow = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments: unknown;
};

function mapConversation(row: ConversationRow): AurenConversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title?.trim() || 'New chat',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  };
}

function mapProject(row: ProjectRow): AurenProject {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title.trim() || 'Untitled project',
    description: row.description?.trim() || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
  };
}

function normalizeImages(value: unknown): AurenImageAttachment[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const images = value.filter((item): item is AurenImageAttachment => {
    return Boolean(
      item &&
        typeof item === 'object' &&
        'id' in item &&
        'uri' in item &&
        'mimeType' in item &&
        'base64' in item,
    );
  });

  return images.length > 0 ? images : undefined;
}

function mapMessage(row: MessageRow): AurenMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    images: normalizeImages(row.attachments),
  };
}

export function createConversationTitle(content: string) {
  const cleaned = content.replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return 'New chat';
  }

  if (cleaned.length <= 46) {
    return cleaned;
  }

  return `${cleaned.slice(0, 43).trim()}...`;
}

export async function listAurenConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id,user_id,title,created_at,updated_at,last_message_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ConversationRow[]).map(mapConversation);
}

export async function createAurenConversation(userId: string, title: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title.trim() || 'New chat',
      last_message_at: new Date().toISOString(),
    })
    .select('id,user_id,title,created_at,updated_at,last_message_at')
    .single();

  if (error) {
    throw error;
  }

  return mapConversation(data as ConversationRow);
}

export async function listAurenProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id,user_id,title,description,created_at,updated_at,last_opened_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProjectRow[]).map(mapProject);
}

type CreateProjectInput = {
  userId: string;
  title: string;
  description?: string | null;
};

export async function createAurenProject({ userId, title, description }: CreateProjectInput) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || null,
      last_opened_at: new Date().toISOString(),
    })
    .select('id,user_id,title,description,created_at,updated_at,last_opened_at')
    .single();

  if (error) {
    throw error;
  }

  return mapProject(data as ProjectRow);
}

export async function loadAurenMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('id,role,content,attachments,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

type SaveMessageInput = {
  conversationId: string;
  userId: string;
  role: AurenMessage['role'];
  content: string;
  images?: AurenImageAttachment[];
};

export async function saveAurenMessage({ conversationId, userId, role, content, images }: SaveMessageInput) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      attachments: images ?? [],
    })
    .select('id,role,content,attachments,created_at')
    .single();

  if (error) {
    throw error;
  }

  return mapMessage(data as MessageRow);
}
