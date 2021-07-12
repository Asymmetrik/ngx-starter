import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ModalAction, ModalService } from '../../../common/modal.module';
import { SystemAlertService } from '../../../common/system-alert.module';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { catchError, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../auth/authentication.service';
import { AuthorizationService } from '../../auth/authorization.service';
import { Config } from '../../config.model';
import { ConfigService } from '../../config.service';
import { TeamAuthorizationService } from '../team-authorization.service';
import { Team } from '../team.model';
import { TeamsService } from '../teams.service';

@UntilDestroy()
@Component({
	selector: 'app-view-team',
	templateUrl: './view-team.component.html'
})
export class ViewTeamComponent implements OnInit {
	team: Team;
	_team: any;

	nestedTeamsEnabled = false;
	implicitMembersStrategy?: string;

	canManageTeam = false;

	isEditing = false;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private modalService: ModalService,
		private configService: ConfigService,
		private teamsService: TeamsService,
		private alertService: SystemAlertService,
		private authenticationService: AuthenticationService,
		private authorizationService: AuthorizationService,
		private teamAuthorizationService: TeamAuthorizationService
	) {}

	ngOnInit() {
		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe(config => {
				this.implicitMembersStrategy = config?.teams?.implicitMembers?.strategy;
				this.nestedTeamsEnabled = config?.teams?.nestedTeams ?? false;
			});

		this.route.data
			.pipe(
				map(data => data.team),
				untilDestroyed(this)
			)
			.subscribe(team => {
				this.updateTeam(team);
			});
	}

	edit() {
		this._team = new Team().setFromModel(this.team);
		this.isEditing = true;
	}

	cancelEdit() {
		this.isEditing = false;
	}

	saveEdit() {
		this.teamsService
			.update(this._team)
			.pipe(
				tap(() => this.authenticationService.reloadCurrentUser()),
				untilDestroyed(this)
			)
			.subscribe(team => {
				this.isEditing = false;
				if (team) {
					this.team = team;
					this.alertService.addAlert('Updated team metadata', 'success', 5000);
				}
			});
	}

	updateTeam(team: any) {
		if (null != team) {
			this.team = team;
			this.canManageTeam =
				this.authorizationService.isAdmin() || this.teamAuthorizationService.isAdmin(team);
		} else {
			this.router.navigate(['resource/invalid', { type: 'team' }]);
		}
	}

	remove() {
		this.modalService
			.confirm(
				'Delete team?',
				`Are you sure you want to delete the team: <strong>"${this.team.name}"</strong>?<br/>This action cannot be undone.`,
				'Delete'
			)
			.pipe(
				first(),
				filter(action => action === ModalAction.OK),
				switchMap(() => this.teamsService.delete(this.team)),
				tap(() => this.authenticationService.reloadCurrentUser()),
				catchError((error: HttpErrorResponse) => {
					this.alertService.addClientErrorAlert(error);
					return of(null);
				}),
				untilDestroyed(this)
			)
			.subscribe(() => this.router.navigate(['/teams', { clearCachedFilter: true }]));
	}
}
