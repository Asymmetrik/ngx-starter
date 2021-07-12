import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { combineLatest, of, Observable } from 'rxjs';
import { catchError, first, map, switchMap } from 'rxjs/operators';
import { ConfigService } from '../config.service';
import { AuthorizationService } from './authorization.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private router: Router,
		private configService: ConfigService,
		private sessionService: SessionService,
		private authorizationService: AuthorizationService
	) {}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		// Default to requiring authentication if guard is present
		const requiresAuthentication = route.data?.requiresAuthentication ?? true;

		// -----------------------------------------------------------
		// Does the user need to be authenticated?
		// -----------------------------------------------------------

		// If the route doesn't require authentication, let them through
		if (!requiresAuthentication) {
			return of(true);
		}

		// -----------------------------------------------------------
		// Yes, the user needs to be authenticated
		// -----------------------------------------------------------
		const config$ = this.configService.getConfig().pipe(first());
		const session$ = this.sessionService.getSession().pipe(first());

		return combineLatest([config$, session$]).pipe(
			switchMap(([config, session]) => {
				// The user isn't authenticated, try reloading
				if (session === null && !config?.auth.startsWith('proxy-pki')) {
					return this.sessionService.reloadSession();
				}
				return of(session);
			}),
			switchMap(() => {
				return this.authorizationService.isAuthenticated()
					? this.sessionService.getCurrentEua()
					: of(null);
			}),
			map(() => {
				return this.checkAccess(route, state);
			})
		);
	}

	checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		// The user still isn't authenticated
		if (!this.authorizationService.isAuthenticated()) {
			// Send them to signin with a redirect to the previous URL
			this.sessionService.setPreviousUrl(state.url);
			this.router.navigate(['/signin']);
			return false;
		}

		if (!this.authorizationService.isAdmin()) {
			// -----------------------------------------------------------
			// Does the user need to accept the user agreement??
			// -----------------------------------------------------------
			// Check to see if the user needs to agree to the end user agreement
			// Default to requiring authentication if guard is present
			const requiresEua = route.data?.requiresEua ?? true;

			if (requiresEua && !this.authorizationService.isEuaCurrent()) {
				this.sessionService.setPreviousUrl(state.url);
				this.router.navigate(['/eua']);
				return false;
			}

			// -----------------------------------------------------------
			// Check the role requirements for the route
			// -----------------------------------------------------------

			// compile a list of roles that are missing
			const requiredRoles = route.data?.roles ?? ['user'];
			const requireAllRoles = route.data?.requireAllRoles ?? true;
			const missingRoles: any[] = [];
			const userRoles: any[] = [];
			requiredRoles.forEach((role: any) => {
				if (!this.authorizationService.hasRole(role)) {
					missingRoles.push(role);
				} else {
					userRoles.push(role);
				}
			});

			// If there are roles missing then we need to do something
			if (
				((missingRoles.length > 0 && requireAllRoles) ||
					(userRoles.length === 0 && requiredRoles.length > 0)) &&
				state.url !== '/unauthorized'
			) {
				// The user doesn't have the needed roles to view the page
				this.sessionService.setPreviousUrl(state.url);
				this.router.navigate(['/unauthorized']);
				return false;
			}

			// redirect a user to the homepage if they are authorized
			// if (missingRoles.length === 0 && state.url === '/unauthorized') {
			// 	this.router.navigate(['']);
			// }
		}

		return true;
	}
}
