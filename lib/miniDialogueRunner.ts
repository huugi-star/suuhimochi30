import type { DialogueNode, DialogueRuntime, DialogueScript } from './miniDialogueTypes';

export type { DialogueRuntime } from './miniDialogueTypes';

export function createDialogueRuntime(script: DialogueScript, slots: Record<string, string> = {}): DialogueRuntime {
  return { scriptId: script.id, nodeId: script.startNodeId, slots: { ...slots } };
}

export function getDialogueNode(script: DialogueScript, runtime: DialogueRuntime): DialogueNode | null {
  return script.id === runtime.scriptId
    ? script.nodes.find((node) => node.id === runtime.nodeId) ?? null
    : null;
}

export function advanceDialogue(runtime: DialogueRuntime, nextNodeId: string): DialogueRuntime {
  return { ...runtime, nodeId: nextNodeId, slots: { ...runtime.slots } };
}

export function resolveDialogueText(text: string, slots: Record<string, string>): string {
  return text.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key: string) => slots[key] ?? match);
}

