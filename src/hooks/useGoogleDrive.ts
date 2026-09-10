import { useState, useEffect, useCallback, useRef } from 'react';
import { exportUserData, type BackupData } from '../lib/backupService';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const FOLDER_NAME = 'FinTrack Backups';

interface GoogleDriveState {
  isLoaded: boolean;
  isSignedIn: boolean;
  accessToken: string | null;
  user_email: string | null;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          init: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { api_key: string; discoveryDocs: string[] }) => Promise<void>;
        drive: {
          files: {
            list: (params: {
              q: string;
              fields: string;
              spaces?: string;
            }) => Promise<{ result: { files?: Array<{ id: string; name: string }> } }>;
            create: (params: {
              resource: Record<string, unknown>;
              media: {
                mimeType: string;
                body: string;
              };
              fields: string;
            }) => Promise<{ result: { id: string; name: string } }>;
          };
        };
      };
    };
  }
}

export function useGoogleDrive() {
  const [state, setState] = useState<GoogleDriveState>({
    isLoaded: false,
    isSignedIn: false,
    accessToken: null,
    user_email: null,
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() =>
    localStorage.getItem('fintrack_last_gdrive_backup')
  );
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      setState((s) => ({ ...s, isLoaded: true }));
      return;
    }

    const loadScripts = async () => {
      // Load Google Identity Services
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      document.head.appendChild(gisScript);

      // Load Google API Client
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      document.head.appendChild(gapiScript);

      await Promise.all([
        new Promise<void>((resolve) => {
          gisScript.onload = () => resolve();
        }),
        new Promise<void>((resolve) => {
          gapiScript.onload = () => resolve();
        }),
      ]);

      // Initialize gapi client
      await new Promise<void>((resolve) => {
        window.gapi!.load('client', async () => {
          await window.gapi!.client.init({
            api_key: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          resolve();
        });
      });

      // Initialize GIS token client
      tokenClientRef.current = window.google!.accounts.oauth2.init({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            setState((s) => ({
              ...s,
              isSignedIn: true,
              accessToken: response.access_token ?? null,
            }));
          }
        },
      });

      setState((s) => ({ ...s, isLoaded: true }));
    };

    loadScripts();
  }, []);

  const signIn = useCallback(() => {
    tokenClientRef.current?.requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    if (state.accessToken) {
      window.google!.accounts.oauth2.revoke(state.accessToken, () => {
        setState((s) => ({
          ...s,
          isSignedIn: false,
          accessToken: null,
          user_email: null,
        }));
      });
    }
  }, [state.accessToken]);

  const findOrCreateFolder = async (accessToken: string): Promise<string> => {
    // Search for existing folder
    const listResult = await window.gapi!.client.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = listResult.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }

    // Create folder
    const createResult = await window.gapi!.client.drive.files.create({
      resource: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    } as any);

    return createResult.result.id;
  };

  const backupToDrive = useCallback(
    async (data?: BackupData): Promise<boolean> => {
      if (!state.accessToken) return false;

      setIsBackingUp(true);
      try {
        const backupData = data || exportUserData();
        const json = JSON.stringify(backupData, null, 2);
        const fileName = `fintrack_backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;

        const folderId = await findOrCreateFolder(state.accessToken);

        await window.gapi!.client.drive.files.create({
          resource: {
            name: fileName,
            parents: [folderId],
          },
          media: {
            mimeType: 'application/json',
            body: json,
          },
          fields: 'id, name',
        });

        const timestamp = new Date().toISOString();
        setLastBackup(timestamp);
        localStorage.setItem('fintrack_last_gdrive_backup', timestamp);
        return true;
      } catch (error) {
        console.error('Google Drive backup failed:', error);
        return false;
      } finally {
        setIsBackingUp(false);
      }
    },
    [state.accessToken]
  );

  return {
    ...state,
    isBackingUp,
    lastBackup,
    signIn,
    signOut,
    backupToDrive,
    isConfigured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY),
  };
}
