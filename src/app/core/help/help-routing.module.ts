import { Injectable, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterModule } from '@angular/router';

import { HelpTopicWrapperComponent } from './help-topic-wrapper.component';
import { HelpTopics } from './help-topic.component';
import { HelpComponent } from './help.component';

@Injectable()
export class HelpBreadcrumbResolver implements Resolve<string | null> {
	resolve(route: ActivatedRouteSnapshot) {
		return HelpTopics.getTopicTitle(route.params.topic);
	}
}

@NgModule({
	imports: [
		RouterModule.forChild([
			{
				path: 'help',
				component: HelpComponent,
				children: [
					/**
					 * Default Route
					 */
					{
						path: '',
						redirectTo: 'getting-started',
						pathMatch: 'full'
					},
					{
						path: ':topic',
						component: HelpTopicWrapperComponent,
						resolve: {
							breadcrumb: HelpBreadcrumbResolver
						}
					}
				]
			}
		])
	],
	exports: [],
	providers: [HelpBreadcrumbResolver]
})
export class HelpRoutingModule {}
