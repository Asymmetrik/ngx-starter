import { Injectable } from '@angular/core';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Role } from './role.model';
import { Session } from './session.model';
import { SessionService } from './session.service';

@UntilDestroy()
@Injectable()
export class AuthorizationService {
	private session: Session | null;

	constructor(private sessionService: SessionService) {
		this.sessionService
			.getSession()
			.pipe(untilDestroyed(this))
			.subscribe(session => {
				this.session = session;
			});
	}

	public isEuaCurrent() {
		const euaPublished: number = this.session?.user?.eua?.published ?? 0;
		const euaAccepted: number = this.session?.user?.userModel?.acceptedEua ?? 0;

		return euaAccepted >= euaPublished;
	}

	public isAuthenticated(): boolean {
		return this.session?.name != null;
	}

	public hasExternalRole(role: string): boolean {
		const externalRoles = this.session?.user?.userModel?.externalRoles ?? [];

		return externalRoles.indexOf(role) !== -1;
	}

	public hasRole(role: string | Role): boolean {
		role = this.roleToString(role);

		const roles = this.session?.user?.userModel?.roles ?? {};
		return null != roles[role] && roles[role];
	}

	public hasAnyRole(): boolean {
		return Role.ROLES.some((r: Role) => this.hasRole(r.role));
	}

	public hasSomeRoles(roles: Array<string | Role>): boolean {
		return roles.some((role: string | Role) => this.hasRole(role));
	}

	public hasEveryRole(roles: Array<string | Role>): boolean {
		return roles.every((role: string | Role) => this.hasRole(role));
	}

	public isUser(): boolean {
		return this.hasRole(Role.USER.role);
	}

	public isAdmin(): boolean {
		return this.hasRole(Role.ADMIN.role);
	}

	private roleToString(role: string | Role) {
		if (typeof role !== 'string') {
			return role.role;
		}
		return role;
	}
}
