import { execSync } from 'child_process';
import { Observation } from '../types/index.js';

export interface GitContext {
  commit?: string;
  branch?: string;
  remote?: string;
  author?: string;
  message?: string;
}

export class GitIntegration {
  private repoRoot: string | null = null;

  constructor() {
    try {
      this.repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch {
      this.repoRoot = null;
    }
  }

  isGitRepo(): boolean {
    return this.repoRoot !== null;
  }

  getContext(): GitContext {
    if (!this.isGitRepo()) {
      return {};
    }

    try {
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      const author = execSync('git log -1 --format="%an"', { encoding: 'utf-8' }).trim();
      const message = execSync('git log -1 --format="%s"', { encoding: 'utf-8' }).trim();

      let remote = '';
      try {
        remote = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
      } catch {
        remote = '';
      }

      return { commit, branch, remote, author, message };
    } catch {
      return {};
    }
  }

  enrichObservation(observation: Partial<Observation>): Observation {
    const gitContext = this.getContext();

    return {
      id: 0,
      type: observation.type || 'note',
      title: observation.title || '',
      content: observation.content || '',
      tags: observation.tags || [],
      metadata: observation.metadata || {},
      filesRead: observation.filesRead || [],
      filesModified: observation.filesModified || [],
      gitCommit: gitContext.commit,
      gitBranch: gitContext.branch,
      gitRemote: gitContext.remote,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  linkToCommit(observationId: number, commitSha: string): { commit: string; url: string } | null {
    if (!this.isGitRepo()) return null;

    try {
      const remote = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();

      let url = '';
      if (remote.includes('github.com')) {
        const match = remote.match(/github\.com[:/]([^/]+\/[^/]+)/);
        if (match) {
          const repo = match[1].replace('.git', '');
          url = `https://github.com/${repo}/commit/${commitSha}`;
        }
      } else if (remote.includes('gitlab.com')) {
        const match = remote.match(/gitlab\.com[:/]([^/]+\/[^/]+)/);
        if (match) {
          const repo = match[1].replace('.git', '');
          url = `https://gitlab.com/${repo}/-/commit/${commitSha}`;
        }
      }

      return { commit: commitSha, url };
    } catch {
      return null;
    }
  }

  getCommitObservations(commitSha: string): string[] {
    try {
      const message = execSync(`git log -1 --format="%B" ${commitSha}`, { encoding: 'utf-8' }).trim();

      const observationPattern = /#(\d+)/g;
      const matches = message.match(observationPattern) || [];

      return matches.map(m => m.replace('#', ''));
    } catch {
      return [];
    }
  }

  createCommitWithObservation(message: string, observationId: number): boolean {
    if (!this.isGitRepo()) return false;

    try {
      const fullMessage = `${message}\n\nObservation: #${observationId}`;
      execSync('git add -A', { encoding: 'utf-8' });
      execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
      return true;
    } catch {
      return false;
    }
  }

  getRecentBranches(limit: number = 10): { name: string; lastCommit: string }[] {
    if (!this.isGitRepo()) return [];

    try {
      const branches = execSync(
        `git for-each-ref --sort=-committerdate --format='%(refname:short)|%(objectname:short)' refs/heads/ --count=${limit}`,
        { encoding: 'utf-8' }
      ).trim();

      return branches.split('\n').filter(Boolean).map(line => {
        const [name, lastCommit] = line.split('|');
        return { name, lastCommit };
      });
    } catch {
      return [];
    }
  }
}
