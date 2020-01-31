import { Component, OnInit } from '@angular/core';

import get from 'lodash/get';

import { ConfigService } from './config.service';
import { Config } from './config.model';

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
	appTitle: string = undefined;
	version: string = undefined;

	constructor(private configService: ConfigService) {}

	ngOnInit() {
		this.configService.getConfig().subscribe((config: Config) => {
			this.appTitle = get(config, 'app.title', '');
			this.version = config.version;
		});
	}
}
