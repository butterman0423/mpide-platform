import { DOCUMENT, Inject, Injectable } from '@angular/core'
import { fromEvent } from 'rxjs'
import { environment } from '../../../environments/environment.development'

type TokenClient = google.accounts.oauth2.TokenClient
type TokenResponse = google.accounts.oauth2.TokenResponse

interface GApiWindow extends Window {
    google: typeof google
}

@Injectable({
    providedIn: 'root'
})
export class GDriveService {
    private tokenClient: TokenClient | undefined
    private accessToken: string | undefined
    private serviceLoaded: boolean = false

    constructor(@Inject(DOCUMENT) document: Document) {
        fromEvent(document.defaultView as Window, 'load').subscribe((e) => {
            const { google } = e.currentTarget as GApiWindow
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: environment.googleApiClientId,
                scope: [
                    "https://www.googleapis.com/auth/drive"
                ].join(" "),
                callback: this._handleTokenResponse
            })

            this.serviceLoaded = true
        })
    }

    private _handleTokenResponse(tokRes: TokenResponse) {
        if (tokRes.error) {
            console.error('Google Auth failed: ', tokRes.error_description)
            return
        }
        this.accessToken = tokRes.access_token
    }

    public isServiceLoaded(): boolean {
        return this.serviceLoaded
    }

    public requestAuth(): void {
        if (!this.tokenClient) return
        this.tokenClient.requestAccessToken()
    }
}