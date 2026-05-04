import { Observation, Team, TeamMember } from '../types/index.js';
import { MemoryDatabase } from '../database/index.js';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
}

export class CloudSync {
  private db: MemoryDatabase;
  private endpoint?: string;
  private apiKey?: string;
  private enabled: boolean;

  constructor(db: MemoryDatabase, config: { enabled: boolean; endpoint?: string; apiKey?: string }) {
    this.db = db;
    this.enabled = config.enabled;
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
  }

  async sync(): Promise<SyncResult> {
    if (!this.enabled || !this.endpoint) {
      return { uploaded: 0, downloaded: 0, conflicts: 0 };
    }

    const result: SyncResult = { uploaded: 0, downloaded: 0, conflicts: 0 };

    try {
      const localChanges = await this.getLocalChanges();
      if (localChanges.length > 0) {
        await this.uploadChanges(localChanges);
        result.uploaded = localChanges.length;
      }

      const remoteChanges = await this.getRemoteChanges();
      if (remoteChanges.length > 0) {
        const merged = await this.mergeChanges(remoteChanges);
        result.downloaded = merged.downloaded;
        result.conflicts = merged.conflicts;
      }

      return result;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      throw error;
    }
  }

  private async getLocalChanges(): Promise<Observation[]> {
    return this.db.searchObservations('', { limit: 1000 });
  }

  private async uploadChanges(observations: Observation[]): Promise<void> {
    if (!this.endpoint) return;

    const response = await fetch(`${this.endpoint}/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        observations,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  private async getRemoteChanges(): Promise<Observation[]> {
    if (!this.endpoint) return [];

    const response = await fetch(`${this.endpoint}/sync/changes`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch remote changes: ${response.statusText}`);
    }

    const data = await response.json();
    return data.observations || [];
  }

  private async mergeChanges(remoteChanges: Observation[]): Promise<{ downloaded: number; conflicts: number }> {
    let downloaded = 0;
    let conflicts = 0;

    for (const remote of remoteChanges) {
      const local = this.db.getObservation(remote.id);

      if (!local) {
        this.db.storeObservation({
          type: remote.type,
          title: remote.title,
          content: remote.content,
          summary: remote.summary,
          tags: remote.tags,
          metadata: { ...remote.metadata, source: 'cloud-sync' },
          filesRead: remote.filesRead,
          filesModified: remote.filesModified
        });
        downloaded++;
      } else if (local.updatedAt < remote.updatedAt) {
        conflicts++;
      }
    }

    return { downloaded, conflicts };
  }

  async backup(): Promise<string> {
    const observations = this.db.searchObservations('', { limit: 10000 });
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      observations
    };

    const response = await fetch(`${this.endpoint}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(backup)
    });

    if (!response.ok) {
      throw new Error(`Backup failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.backupId;
  }

  async restore(backupId: string): Promise<number> {
    const response = await fetch(`${this.endpoint}/backup/${backupId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Restore failed: ${response.statusText}`);
    }

    const data = await response.json();
    let restored = 0;

    for (const obs of data.observations) {
      this.db.storeObservation({
        type: obs.type,
        title: obs.title,
        content: obs.content,
        tags: obs.tags,
        metadata: { ...obs.metadata, restored: true },
        filesRead: obs.filesRead,
        filesModified: obs.filesModified
      });
      restored++;
    }

    return restored;
  }
}

export class TeamSharing {
  private db: MemoryDatabase;
  private endpoint?: string;

  constructor(db: MemoryDatabase, endpoint?: string) {
    this.db = db;
    this.endpoint = endpoint;
  }

  async createTeam(name: string, ownerId: string): Promise<Team> {
    const team: Team = {
      id: crypto.randomUUID(),
      name,
      ownerId,
      members: [{ userId: ownerId, role: 'owner', joinedAt: new Date() }],
      createdAt: new Date()
    };

    return team;
  }

  async inviteMember(teamId: string, userId: string, role: TeamMember['role']): Promise<void> {
    if (!this.endpoint) return;

    await fetch(`${this.endpoint}/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
  }

  async shareObservation(observationId: number, teamId: string, permission: 'read' | 'write'): Promise<void> {
    if (!this.endpoint) return;

    await fetch(`${this.endpoint}/observations/${observationId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, permission })
    });
  }

  async getTeamObservations(teamId: string): Promise<Observation[]> {
    if (!this.endpoint) return [];

    const response = await fetch(`${this.endpoint}/teams/${teamId}/observations`);
    const data = await response.json();
    return data.observations || [];
  }
}
