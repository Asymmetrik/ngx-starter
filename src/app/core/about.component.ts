import { Component, OnInit } from '@angular/core';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Config } from './config.model';
import { ConfigService } from './config.service';

@UntilDestroy()
@Component({
	template: `
		<div class="container">
			<div class="row">
				<div class="col-md-8 offset-2 jumbotron" style="margin-top: 4rem;">
					<h1>{{ appTitle }}</h1>
					<p>v{{ version }}</p>
				</div>
			</div>
		</div>
	`,
	styles: ['']
})
export class AboutComponent implements OnInit {
	appTitle?: string;
	version?: string;

	constructor(private configService: ConfigService) {}

	ngOnInit() {
		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe(config => {
				this.appTitle = config?.app?.title ?? '';
				this.version = config?.version ?? '';
			});
	}
}
