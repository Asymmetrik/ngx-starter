import { ActivatedRouteSnapshot, PRIMARY_OUTLET, UrlSegment } from '@angular/router';

export interface Breadcrumb {
	label: string;
	url: string;
}

export class BreadcrumbService {
	static getBreadcrumbs(
		route: ActivatedRouteSnapshot,
		url: string = '',
		breadcrumbs: Breadcrumb[] = []
	): Breadcrumb[] {
		const ROUTE_DATA_BREADCRUMB = 'breadcrumb';

		// Find the primary route
		const child = route.children.find(c => c.outlet === PRIMARY_OUTLET);

		// Return if there is no primary route
		if (!child) {
			return breadcrumbs;
		}

		// If custom data property "breadcrumb" is specified on the route, add breadcrumb
		if (child.data.hasOwnProperty(ROUTE_DATA_BREADCRUMB)) {
			// Get the route's URL segment
			const routeURL: string = child.url.map((segment: UrlSegment) => segment.path).join('/');

			// Append route URL to URL
			url += `/${routeURL}`;

			// Add breadcrumb
			breadcrumbs.push({ label: child.data[ROUTE_DATA_BREADCRUMB], url });
		}

		return this.getBreadcrumbs(child, url, breadcrumbs);
	}

	static getBreadcrumbLabel(route: ActivatedRouteSnapshot): string {
		const breadcrumbs: Breadcrumb[] = this.getBreadcrumbs(route);

		return breadcrumbs[0]?.label ?? '';
	}
}
