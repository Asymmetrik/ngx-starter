import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { NgSelectComponent } from '@ng-select/ng-select';

import { PagingOptions, PagingResults } from '../../../common/paging.module';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { concat, of, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { User } from '../../auth/user.model';
import { TeamRole } from '../team-role.model';
import { AddedMember, TeamsService } from '../teams.service';

@UntilDestroy()
@Component({
	selector: 'app-add-members-modal',
	templateUrl: './add-members-modal.component.html',
	styles: [
		`
			:host {
				display: contents;
			}
		`
	]
})
export class AddMembersModalComponent implements OnInit {
	@Input() teamId: string;

	@Output() readonly usersAdded: EventEmitter<number> = new EventEmitter();

	addedMembers: AddedMember[] = [];

	submitting = false;

	queryUserSearchTerm = '';

	teamRoleOptions: any[] = TeamRole.ROLES;

	usersLoading = false;
	usersInput$ = new Subject<string>();
	users$: Observable<User[]>;

	private defaultRole = 'member';

	private pagingOptions: PagingOptions = new PagingOptions();

	constructor(private teamsService: TeamsService, public modalRef: BsModalRef) {}

	ngOnInit() {
		this.users$ = concat(
			of([]), // default items
			this.usersInput$.pipe(
				debounceTime(200),
				distinctUntilChanged(),
				tap(() => (this.usersLoading = true)),
				switchMap(term => this.teamsService.searchUsers({}, term, this.pagingOptions, {})),
				map(result =>
					result.elements.filter(
						(user: any) =>
							!this.addedMembers.map(m => m._id).includes(user?.userModel._id)
					)
				),
				tap(() => {
					this.usersLoading = false;
				})
			)
		);
	}

	submit() {
		this.submitting = true;

		// Add users who are already in the system
		this.teamsService
			.addMembers(this.addedMembers, { _id: this.teamId })
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.submitting = false;
				this.modalRef.hide();
				this.usersAdded.emit(this.addedMembers.length);
			});
	}

	remove(ndx: number) {
		if (ndx >= 0 && ndx < this.addedMembers.length) {
			this.addedMembers.splice(ndx, 1);
		}
	}

	updateRoleSelection(addedMember: AddedMember, role: string) {
		addedMember.role = role;
		addedMember.roleDisplay = TeamRole.getDisplay(role);
	}

	typeaheadOnSelect(user: User, comp: NgSelectComponent) {
		const selectedUsername = user?.userModel?.username;
		const selectedUserId = user?.userModel?._id;
		if (null != selectedUsername) {
			this.addedMembers.push({
				username: selectedUsername,
				_id: selectedUserId,
				role: this.defaultRole,
				roleDisplay: TeamRole.getDisplay(this.defaultRole)
			} as AddedMember);

			comp.clearModel();
		}
		this.queryUserSearchTerm = '';
	}
}
