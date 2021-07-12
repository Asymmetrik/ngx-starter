import { HttpErrorResponse } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SystemAlertService } from '../../../common/system-alert.module';

import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Role } from '../../auth/role.model';
import { User } from '../../auth/user.model';
import { ConfigService } from '../../config.service';

export abstract class ManageUserComponent implements OnInit {
	config: any;
	error?: string;
	proxyPki: boolean;
	metadataLocked: boolean;
	okDisabled: boolean;

	// Variables that will be set by implementing classes
	title: string;
	subtitle: string;
	okButtonText: string;
	navigateOnSuccess: string;
	user: User;

	possibleRoles = Role.ROLES;

	protected constructor(
		protected router: Router,
		protected configService: ConfigService,
		protected alertService: SystemAlertService
	) {}

	ngOnInit() {
		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe((config: any) => {
				this.config = config;
				this.proxyPki = config.auth.startsWith('proxy-pki');

				this.metadataLocked = this.proxyPki;

				this.initialize();
			});
	}

	abstract initialize(): any;

	abstract submitUser(user: User): Observable<any>;

	abstract handleBypassAccessCheck(): any;

	submit() {
		if (this.validatePassword()) {
			this.submitUser(this.user)
				.pipe(untilDestroyed(this))
				.subscribe(
					() => this.router.navigate([this.navigateOnSuccess]),
					(response: HttpErrorResponse) => {
						this.alertService.addClientErrorAlert(response);
					}
				);
		}
	}

	bypassAccessCheck() {
		this.metadataLocked = !(this.user?.userModel?.bypassAccessCheck ?? false);
		this.handleBypassAccessCheck();
	}

	private validatePassword(): boolean {
		if (this.user.userModel.password === this.user.userModel.verifyPassword) {
			return true;
		}
		this.error = 'Passwords must match';
		return false;
	}
}
