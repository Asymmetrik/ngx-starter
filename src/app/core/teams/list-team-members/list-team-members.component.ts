import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { ModalAction, ModalService } from '../../../common/modal.module';
import {
	AbstractPageableDataComponent,
	PagingOptions,
	PagingResults,
	SortableTableHeader,
	SortChange,
	SortDirection
} from '../../../common/paging.module';
import { SystemAlertService } from '../../../common/system-alert.module';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { of, Observable } from 'rxjs';
import { catchError, filter, first, switchMap, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../auth/authentication.service';
import { AuthorizationService } from '../../auth/authorization.service';
import { SessionService } from '../../auth/session.service';
import { User } from '../../auth/user.model';
import { AddMembersModalComponent } from '../add-members-modal/add-members-modal.component';
import { TeamAuthorizationService } from '../team-authorization.service';
import { TeamMember } from '../team-member.model';
import { TeamRole } from '../team-role.model';
import { Team } from '../team.model';
import { TeamsService } from '../teams.service';

@UntilDestroy()
@Component({
	selector: 'list-team-members',
	templateUrl: './list-team-members.component.html'
})
export class ListTeamMembersComponent extends AbstractPageableDataComponent<TeamMember>
	implements OnChanges, OnDestroy, OnInit {
	@Input()
	team: Team;

	isUserAdmin: boolean;

	canManageTeam = false;

	teamRoleOptions: any[] = TeamRole.ROLES;

	user: User | null;

	headers: SortableTableHeader[] = [
		{
			name: 'Name',
			sortable: true,
			sortField: 'name',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Name',
			default: true
		},
		{
			name: 'Username',
			sortable: true,
			sortField: 'username',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Username'
		},
		{ name: 'Account Status', sortable: false },
		{ name: 'Explicit', sortable: false },
		{ name: 'Role', sortable: false },
		{ name: '', sortField: 'remove', sortable: false }
	];

	headersToShow: SortableTableHeader[] = [];

	private modalRef: BsModalRef | null = null;

	constructor(
		private bsModalService: BsModalService,
		private modalService: ModalService,
		private router: Router,
		private teamsService: TeamsService,
		private authenticationService: AuthenticationService,
		private authorizationService: AuthorizationService,
		private teamAuthorizationService: TeamAuthorizationService,
		private sessionService: SessionService,
		private alertService: SystemAlertService
	) {
		super();
	}

	ngOnInit() {
		this.alertService.clearAllAlerts();

		this.canManageTeam =
			this.authorizationService.isAdmin() || this.teamAuthorizationService.isAdmin(this.team);

		this.sessionService
			.getSession()
			.pipe(untilDestroyed(this))
			.subscribe(session => {
				this.user = session?.user ?? null;
				this.isUserAdmin = this.authorizationService.isAdmin();
			});

		this.sortEvent$.next(this.headers.find((header: any) => header.default) as SortChange);

		super.ngOnInit();

		this.headersToShow = this.headers
			.filter(header => this.canManageTeam || header.sortField !== 'remove')
			.filter(header => this.team.implicitMembers || header.name !== 'Explicit');
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.team) {
			this.load$.next(true);
		}
	}

	ngOnDestroy(): void {
		this.modalRef?.hide();
	}

	loadData(
		pagingOptions: PagingOptions,
		search: string,
		query: any
	): Observable<PagingResults<TeamMember>> {
		return this.teamsService.searchMembers(this.team, query, search, pagingOptions, {});
	}

	addMembers() {
		this.modalRef = this.bsModalService.show(AddMembersModalComponent, {
			ignoreBackdropClick: true,
			class: 'modal-dialog-scrollable modal-lg'
		});
		this.modalRef.content.teamId = this.team._id;
		this.modalRef.content.usersAdded
			.pipe(untilDestroyed(this))
			.subscribe((usersAdded: number) => {
				this.alertService.addAlert(`${usersAdded} user(s) added`, 'success', 5000);
				this.modalRef = null;
				this.reloadTeamMembers();
			});
	}

	removeMember(member: TeamMember) {
		this.modalService
			.confirm(
				'Remove member from team?',
				`Are you sure you want to remove member: "${member.userModel.name}" from this team?`,
				'Remove Member'
			)
			.pipe(
				first(),
				filter(action => action === ModalAction.OK),
				switchMap(() => this.teamsService.removeMember(this.team, member.userModel._id)),
				tap(() => this.authenticationService.reloadCurrentUser()),
				catchError((error: HttpErrorResponse) => {
					this.alertService.addClientErrorAlert(error);
					return of(null);
				}),
				untilDestroyed(this)
			)
			.subscribe(() => this.reloadTeamMembers());
	}

	updateRole(member: TeamMember, role: string) {
		// No update required
		if (member.role === role) {
			return;
		}

		// If user is removing their own admin, verify that they know what they're doing
		if (
			this?.user?.userModel._id === member.userModel._id &&
			member.role === 'admin' &&
			role !== 'admin'
		) {
			this.modalService
				.confirm(
					'Remove "Team Admin" role?',
					"Are you sure you want to remove <strong>yourself</strong> from the Team Admin role?<br/>Once you do this, you will no longer be able to manage the members of this team. <br/><strong>This also means you won't be able to give the role back to yourself.</strong>",
					'Remove Admin'
				)
				.pipe(
					first(),
					filter(action => action === ModalAction.OK),
					switchMap(() => this.doUpdateRole(member, role)),
					tap(() => this.authenticationService.reloadCurrentUser()),
					catchError((error: HttpErrorResponse) => {
						this.alertService.addClientErrorAlert(error);
						return of(null);
					}),
					untilDestroyed(this)
				)
				.subscribe(() => {
					// If we successfully removed the role from ourselves, redirect away
					this.router.navigate(['/teams', { clearCachedFilter: true }]);
				});
		} else if (!member.explicit) {
			// Member is implicitly in team, should explicitly add this member with the desired role
			this.addMember(member, role);
		} else {
			this.doUpdateRole(member, role)
				.pipe(
					catchError((error: HttpErrorResponse) => {
						this.alertService.addClientErrorAlert(error);
						return of(null);
					}),
					untilDestroyed(this)
				)
				.subscribe(() => this.reloadTeamMembers());
		}
	}

	private addMember(member: TeamMember, role?: string) {
		if (null == this.team._id || null == member) {
			this.alertService.addAlert('Failed to add member. Missing member or teamId.');
			return;
		}

		this.teamsService
			.addMember(this.team, member.userModel._id, role)
			.pipe(
				tap(() => this.authenticationService.reloadCurrentUser()),
				catchError((error: HttpErrorResponse) => {
					this.alertService.addClientErrorAlert(error);
					return of(null);
				}),
				untilDestroyed(this)
			)
			.subscribe(() => this.reloadTeamMembers());
	}

	private doUpdateRole(
		member: TeamMember,
		role: string,
		persist: boolean = true
	): Observable<any> {
		if (!persist) {
			member.role = role;
			member.roleDisplay = TeamRole.getDisplay(member.role);
			return of(member);
		}

		return this.teamsService.updateMemberRole(this.team, member.userModel._id, role);
	}

	private reloadTeamMembers() {
		this.pageEvent$.next({ pageNumber: 0, pageSize: this.pageSize });
	}
}
