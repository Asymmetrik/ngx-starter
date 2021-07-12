import { HttpBackend, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AsyncSubject, Observable } from 'rxjs';
import { Config } from './config.model';

@Injectable()
export class ConfigService {
	configSubject = new AsyncSubject<Config | null>();

	constructor(private http: HttpBackend) {
		this.reloadConfig();
	}

	/**
	 * Get the shared config observable
	 */
	public getConfig(): Observable<Config | null> {
		return this.configSubject;
	}

	/**
	 * Refresh the latest config and fire it to the subject. This should not need
	 * to be invoked frequently because the config rarely changes.
	 *
	 * We are using HttpBackend to avoid the interceptors since this call is invoked
	 * as part of the app initialization process.
	 */
	public reloadConfig() {
		const request = new HttpRequest<Config>('GET', 'api/config', {});

		this.http.handle(request).subscribe(
			(httpEvent: HttpEvent<Config>) => {
				if (httpEvent instanceof HttpResponse) {
					let newConfig = null;
					const response: HttpResponse<Config> = httpEvent;

					if (response.status >= 200 && response.status < 300) {
						newConfig = response.body;
					}

					this.configSubject.next(newConfig);
					this.configSubject.complete();
				}
			},
			() => {
				this.configSubject.next(null);
				this.configSubject.complete();
			}
		);
	}
}
