import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import capitalize from 'lodash/capitalize';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';

@UntilDestroy()
@Injectable()
export class PageTitleService {
	appTitle: string | null = null;

	constructor(
		private configService: ConfigService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private titleService: Title
	) {}

	init() {
		this.configService
			.getConfig()
			.pipe(
				tap(config => {
					this.appTitle = get(config, 'app.title', null);
				}),
				switchMap(() => this.router.events),
				filter(event => event instanceof NavigationEnd),
				map(() => {
					let route = this.activatedRoute;
					// Get to the leaf route
					while (null != route.firstChild) {
						route = route.firstChild;
					}
					return route;
				}),
				switchMap(route => route.data),
				map(data => {
					const pathTitle = this.generatePathTitle(data);
					if (isEmpty(this.appTitle) || isEmpty(pathTitle)) {
						return `${this.appTitle}${pathTitle}`;
					}
					return `${this.appTitle} - ${pathTitle}`;
				}),
				untilDestroyed(this)
			)
			.subscribe((title: string) => {
				this.titleService.setTitle(title);
			});
	}

	generatePathTitle(data: any) {
		// If there wasn't a path title, try to generate one
		if (null == data.title) {
			try {
				return this.router.url
					.split(';')[0]
					.split('/')
					.slice(1)
					.map(frag => capitalize(frag))
					.join(' > ');
			} catch {
				// no-op
			}
		}
		return data.title;
	}
}
