import { DOCUMENT, inject, Injectable } from '@angular/core'
import { fromEvent } from 'rxjs'
import { environment } from '../../../environments/environment.development'

type TokenClient = google.accounts.oauth2.TokenClient
type TokenResponse = google.accounts.oauth2.TokenResponse

interface GApiWindow extends Window {
    google: typeof google
    gapi: typeof gapi
}

@Injectable({
    providedIn: 'root'
})
export class GDriveService {
    private tokenClient: TokenClient | undefined
    private accessToken: string | undefined
    private serviceLoaded = false
    private document: Document = inject(DOCUMENT)
    private appId = environment.googleApiClientId.split('-')[0];

    private pendingAuthForCallback?: () => void;

    constructor() {
        fromEvent(this.document.defaultView as Window, 'load').subscribe((e) => {
            const { google, gapi } = e.currentTarget as unknown as GApiWindow;
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: environment.googleApiClientId,
                scope: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"].join(" "),
                callback: (resp: TokenResponse) => {
                    this._handleTokenResponse(resp);

                    if (this.accessToken && this.pendingAuthForCallback){
                        this.pendingAuthForCallback();
                        this.pendingAuthForCallback = undefined;
                    }
                }
            });

            gapi.load('client:picker', async() => {
                await gapi.client.init({
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                this.serviceLoaded = true
            })
        })
    }

    private _handleTokenResponse(tokRes: TokenResponse) {
        if (tokRes.error) {
            console.error('Google Auth failed: ', tokRes.error_description)
            return
        }
        this.accessToken = tokRes.access_token
        console.log("auth worked")
    }

    public isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    public isServiceLoaded(): boolean {
        return this.serviceLoaded
    }
    
    public requestAuth(callback?: () => void): void {
        if (!this.tokenClient) return;

        if (callback) {
            this.pendingAuthForCallback = callback;
        }
        this.tokenClient.requestAccessToken();
    }

    public openFolderPicker(onFolderSelected: (folderId: string, folderName: string) => void): void {
        if (!this.accessToken) {
            this.requestAuth(() => this.openFolderPicker(onFolderSelected));
            return;
        }

        const {google} = this.document.defaultView as unknown as GApiWindow;
        
        const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder');

        const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(this.accessToken)
            .setAppId(this.appId)
            .setCallback((data: google.picker.ResponseObject) => {
                if (data.action === google.picker.Action.PICKED && data.docs && data.docs.length > 0) {
                    const document = data.docs[0];
                    onFolderSelected(document.id || '', document.name || 'Unknown Folder');
                }
            })
            .build();

        picker.setVisible(true);
    }

    public async fetchProjectFiles(folderId: string): Promise<{name: string, content: string}[]> {
        if (!this.accessToken) throw new Error("Not authenticated");
        const { gapi } = this.document.defaultView as unknown as GApiWindow;

        const query = `'${folderId}' in parents and (name contains '.c' or name contains '.cpp' or name contains '.h') and trashed = false`;
        
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const rawFiles = response.result.files || [];
        const validExtensions = ['.c', '.cpp', '.h'];
        const files = rawFiles.filter(file => 
            file.name && validExtensions.some(ext => file.name!.toLowerCase().endsWith(ext))
        );
        const loadedFiles: {name: string, content: string}[] = [];

        for (const file of files) {
            const fileData = await gapi.client.drive.files.get({
                fileId: file.id || '',
                alt: 'media'
            });
            loadedFiles.push({
                name: file.name || 'Unknown_File',
                content: fileData.body
            });
        }

        return loadedFiles;
    }

    public async getFilesInFolder(folderId: string): Promise<{id: string, name: string}[]> {
        if (!this.accessToken) throw new Error("Not authenticated");
        const { gapi } = this.document.defaultView as unknown as GApiWindow;

        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const rawFiles = response.result.files || [];
        return rawFiles.map(f => ({
            id: f.id || '',
            name: f.name || 'Unknown_File'
        }));
    }

    public async exportProjectFiles(folderId: string, filesToExport: {name: string, content: string}[]): Promise<void> {
        if (!this.accessToken) throw new Error("Not authenticated");
        const { gapi } = this.document.defaultView as unknown as GApiWindow;

        const existingDriveFiles = await this.getFilesInFolder(folderId);

        for (const file of filesToExport) {
            const existingFile = existingDriveFiles.find(f => f.name === file.name);

            if (existingFile) {
                await gapi.client.request({
                    path: `/upload/drive/v3/files/${existingFile.id}`,
                    method: 'PATCH',
                    params: { uploadType: 'media' },
                    body: file.content
                });
            } else {

                const metadataResponse = await gapi.client.drive.files.create({
                    resource: {
                        name: file.name,
                        parents: [folderId]
                    },
                    fields: 'id'
                });

                await gapi.client.request({
                    path: `/upload/drive/v3/files/${metadataResponse.result.id}`,
                    method: 'PATCH',
                    params: { uploadType: 'media' },
                    body: file.content
                });
            }
        }
    }
}