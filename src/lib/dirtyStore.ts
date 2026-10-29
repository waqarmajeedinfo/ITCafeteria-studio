/**
 * Global Dirty State Management Store
 * Warns users before switching tabs if they have unsaved changes in modals or panels.
 */

export interface DirtyRecord {
  id: string;
  title: string;
  description?: string;
  onSave?: () => Promise<boolean | void> | boolean | void;
  onDiscard?: () => void;
}

type DirtyListener = (currentDirty: DirtyRecord | null) => void;

class DirtyStateManager {
  private activeDirty: DirtyRecord | null = null;
  private listeners: Set<DirtyListener> = new Set();

  public getDirty(): DirtyRecord | null {
    return this.activeDirty;
  }

  public isDirty(): boolean {
    return this.activeDirty !== null;
  }

  public setDirty(record: DirtyRecord): void {
    this.activeDirty = record;
    this.notify();
  }

  public clearDirty(id?: string): void {
    if (!id || (this.activeDirty && this.activeDirty.id === id)) {
      this.activeDirty = null;
      this.notify();
    }
  }

  public subscribe(listener: DirtyListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('itcafeteria_dirty_state_changed', {
          detail: this.activeDirty
        })
      );
    }
    this.listeners.forEach((fn) => {
      try {
        fn(this.activeDirty);
      } catch (err) {
        console.error('Dirty listener error:', err);
      }
    });
  }
}

export const dirtyManager = new DirtyStateManager();
