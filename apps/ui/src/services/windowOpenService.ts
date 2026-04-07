import { type FileOpenResult, getPlatform, type PlatformBridge } from '../platform';
import { eventBus } from '../platform/eventBus';
import { getProjectStore } from '../stores/projectStore';
import { requestRender } from '../stores/renderRequestStore';
import { DEFAULT_TAB_NAME, createWorkspaceTab } from '../stores/workspaceFactories';
import { getWorkspaceState, workspaceStore } from '../stores/workspaceStore';
import type { WorkspaceStoreState } from '../stores/workspaceTypes';
import { addRecentFile, addRecentFolder } from '../utils/recentFiles';
import { findEmptyFolders, loadWorkspaceFolder } from '../utils/workspaceFolder';

type FileOpenPlatform = Pick<
  PlatformBridge,
  'capabilities' | 'readDirectoryFiles' | 'readSubdirectories' | 'createDirectory' | 'writeTextFile'
>;

export interface OpenWorkspaceFolderOptions {
  createIfEmpty?: boolean;
  requestRender?: boolean;
  trackRecent?: boolean;
  platform?: FileOpenPlatform;
  /** Pre-read file contents — bypasses FS calls when provided (used by secondary windows). */
  preReadFiles?: Record<string, string>;
}

export interface OpenWorkspaceFolderResult {
  workspaceRoot: string;
  renderTargetPath: string;
  emptyFolders: string[];
  createdDefaultFile: boolean;
  fileCount: number;
  activeTabId: string;
}

export interface OpenFileInWindowOptions {
  requestRender?: boolean;
  trackRecent?: boolean;
  platform?: FileOpenPlatform;
}

export interface OpenFileInWindowResult {
  projectRoot: string | null;
  projectPath: string;
  activeTabId: string;
  fileCount: number;
  reusedExistingTab: boolean;
}

function emitStartupDetail(phase: string, detail?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('openscad:startup-phase', {
      detail: {
        phase,
        detail: detail ?? null,
      },
    })
  );
}

function revokeBlobUrl(url: string | null | undefined) {
  if (!url || !url.startsWith('blob:')) {
    return;
  }

  URL.revokeObjectURL(url);
}

function clearExistingWorkspaceUi() {
  for (const tab of getWorkspaceState().tabs) {
    revokeBlobUrl(tab.render.previewSrc);
  }
}

function hydrateWindowWorkspace(args: {
  projectRoot: string | null;
  files: Record<string, string>;
  renderTargetPath: string;
  activeProjectPath?: string;
  activeFilePath?: string | null;
}) {
  const activeProjectPath = args.activeProjectPath ?? args.renderTargetPath;
  const activeTab = createWorkspaceTab({
    filePath: args.activeFilePath ?? null,
    name: activeProjectPath,
    projectPath: activeProjectPath,
  });
  const workspaceState: WorkspaceStoreState = {
    tabs: [activeTab],
    activeTabId: activeTab.id,
    showWelcome: false,
  };

  clearExistingWorkspaceUi();
  getProjectStore().getState().openProject(args.projectRoot, args.files, args.renderTargetPath);
  workspaceStore.getState().hydrateWorkspace(workspaceState);

  const activeContent = args.files[activeProjectPath];
  if (activeContent) {
    eventBus.emit('code-updated', { code: activeContent, source: 'file-open' });
  }

  return activeTab.id;
}

async function loadProjectFromFile(
  platform: FileOpenPlatform,
  result: Pick<FileOpenResult, 'path' | 'name' | 'content'>
) {
  if (!result.path) {
    return {
      projectRoot: null,
      files: { [result.name || DEFAULT_TAB_NAME]: result.content },
      renderTargetPath: result.name || DEFAULT_TAB_NAME,
      activeProjectPath: result.name || DEFAULT_TAB_NAME,
      emptyFolders: [] as string[],
    };
  }

  const separatorIndex = result.path.lastIndexOf('/');
  const projectRoot = separatorIndex > 0 ? result.path.substring(0, separatorIndex) : null;
  const relativeName = result.path.substring(separatorIndex + 1);
  const files: Record<string, string> = { [relativeName]: result.content };

  if (projectRoot && platform.capabilities.hasFileSystem) {
    try {
      const siblings = await platform.readDirectoryFiles(projectRoot, ['scad'], true);
      for (const [relPath, siblingContent] of Object.entries(siblings)) {
        if (relPath !== relativeName) {
          files[relPath] = siblingContent;
        }
      }
    } catch (error) {
      console.warn('[windowOpenService] Failed to load sibling files:', error);
    }
  }

  let emptyFolders: string[] = [];
  if (projectRoot && platform.capabilities.hasFileSystem) {
    try {
      const allDirs = await platform.readSubdirectories(projectRoot);
      emptyFolders = findEmptyFolders(allDirs, Object.keys(files));
    } catch {
      emptyFolders = [];
    }
  }

  return {
    projectRoot,
    files,
    renderTargetPath: relativeName,
    activeProjectPath: relativeName,
    emptyFolders,
  };
}

export async function openWorkspaceFolderInWindow(
  dirPath: string,
  options: OpenWorkspaceFolderOptions = {}
): Promise<OpenWorkspaceFolderResult> {
  const platform = options.platform ?? getPlatform();
  emitStartupDetail('workspace_open_begin', dirPath);

  let workspace;
  if (options.preReadFiles && Object.keys(options.preReadFiles).length > 0) {
    // Use pre-read files from the Rust side (avoids FS plugin IPC in secondary windows).
    const files = options.preReadFiles;
    const filePaths = Object.keys(files);
    const renderTargetPath =
      filePaths.find((p) => p === DEFAULT_TAB_NAME) ??
      [...filePaths].sort((a, b) => a.localeCompare(b))[0];
    workspace = {
      files,
      renderTargetPath,
      emptyFolders: [] as string[],
      createdDefaultFile: false,
    };
  } else {
    workspace = await loadWorkspaceFolder(platform, dirPath, {
      createIfEmpty: options.createIfEmpty,
    });
  }
  emitStartupDetail(
    'workspace_open_loaded',
    `${Object.keys(workspace.files).length} file(s), target ${workspace.renderTargetPath}`
  );

  const activeTabId = hydrateWindowWorkspace({
    projectRoot: dirPath,
    files: workspace.files,
    renderTargetPath: workspace.renderTargetPath,
    activeProjectPath: workspace.renderTargetPath,
    activeFilePath: `${dirPath}/${workspace.renderTargetPath}`,
  });
  emitStartupDetail('workspace_open_hydrated', workspace.renderTargetPath);

  const projectStore = getProjectStore().getState();
  for (const dir of workspace.emptyFolders) {
    projectStore.addFolder(dir);
  }
  emitStartupDetail('workspace_open_folders_added', `${workspace.emptyFolders.length} empty folder(s)`);

  if (options.trackRecent ?? true) {
    addRecentFolder(dirPath);
    emitStartupDetail('workspace_open_recent_added', dirPath);
  }
  if (options.requestRender ?? true) {
    requestRender('file_open', { immediate: true });
    emitStartupDetail('workspace_open_render_requested', workspace.renderTargetPath);
  }

  return {
    workspaceRoot: dirPath,
    renderTargetPath: workspace.renderTargetPath,
    emptyFolders: workspace.emptyFolders,
    createdDefaultFile: workspace.createdDefaultFile,
    fileCount: Object.keys(workspace.files).length,
    activeTabId,
  };
}

export async function openFileInWindow(
  result: Pick<FileOpenResult, 'path' | 'name' | 'content'>,
  options: OpenFileInWindowOptions = {}
): Promise<OpenFileInWindowResult> {
  if (result.path) {
    const existingTab = getWorkspaceState().tabs.find((tab) => tab.filePath === result.path);
    if (existingTab) {
      workspaceStore.getState().setActiveTab(existingTab.id);
      workspaceStore.getState().hideWelcomeScreen();
      return {
        projectRoot: getProjectStore().getState().projectRoot,
        projectPath: existingTab.projectPath,
        activeTabId: existingTab.id,
        fileCount: Object.keys(getProjectStore().getState().files).length,
        reusedExistingTab: true,
      };
    }
  }

  const platform = options.platform ?? getPlatform();
  const project = await loadProjectFromFile(platform, result);
  const activeFilePath =
    project.projectRoot && result.path
      ? result.path
      : project.projectRoot
        ? `${project.projectRoot}/${project.activeProjectPath}`
        : null;
  const activeTabId = hydrateWindowWorkspace({
    projectRoot: project.projectRoot,
    files: project.files,
    renderTargetPath: project.renderTargetPath,
    activeProjectPath: project.activeProjectPath,
    activeFilePath,
  });

  const projectStore = getProjectStore().getState();
  for (const dir of project.emptyFolders) {
    projectStore.addFolder(dir);
  }

  if ((options.trackRecent ?? true) && result.path) {
    addRecentFile(result.path);
  }
  if (options.requestRender ?? true) {
    requestRender('file_open', { immediate: true });
  }

  return {
    projectRoot: project.projectRoot,
    projectPath: project.activeProjectPath,
    activeTabId,
    fileCount: Object.keys(project.files).length,
    reusedExistingTab: false,
  };
}
