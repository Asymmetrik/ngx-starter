import { Component } from '@angular/core';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';

import { Breadcrumb, BreadcrumbService } from '../../common/breadcrumb/breadcrumb.service';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { HelpTopics } from './help-topic.component';

export interface HelpTopic {
	id: string;
	title: string | null;
}

@UntilDestroy()
@Component({
	templateUrl: 'help.component.html',
	styleUrls: ['help.component.scss']
})
export class HelpComponent {
	helpTopics: HelpTopic[] = [];

	homeBreadcrumb: Breadcrumb = { label: 'Help', url: '/help' };

	title: string;

	constructor(private route: ActivatedRoute, private router: Router) {
		this.helpTopics = HelpTopics.getTopicList().map((topic: string) => ({
			id: topic,
			title: HelpTopics.getTopicTitle(topic, true)
		}));

		router.events
			.pipe(
				filter((event: Event) => event instanceof NavigationEnd),
				untilDestroyed(this)
			)
			.subscribe(() => (this.title = BreadcrumbService.getBreadcrumbLabel(route.snapshot)));
	}
}
