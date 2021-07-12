import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import {
	AbstractPageableDataComponent,
	PagingOptions,
	PagingResults,
	SortableTableHeader,
	SortChange,
	SortDirection
} from '../../../common/paging.module';
import { ColumnConfig } from '../../../common/paging/quick-column-toggle/quick-column-toggle.component';
import { SystemAlertService } from '../../../common/system-alert.module';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import cloneDeep from 'lodash/cloneDeep';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Role } from '../../auth/role.model';
import { User } from '../../auth/user.model';
import { ConfigService } from '../../config.service';
import { ExportConfigService } from '../../export-config.service';
import { AdminUsersService } from './admin-users.service';

@UntilDestroy()
@Component({
	templateUrl: './admin-list-users.component.html'
})
export class AdminListUsersComponent extends AbstractPageableDataComponent<User> implements OnInit {
	// Columns to show/hide in user table
	columns: ColumnConfig = {
		name: { show: true, display: 'Name' },
		username: { show: true, display: 'Username' },
		_id: { show: false, display: 'ID' },
		// teams: { show: true, display: 'Teams' },
		organization: { show: false, display: 'Organization' },
		email: { show: false, display: 'Email' },
		phone: { show: false, display: 'Phone' },
		acceptedEua: { show: false, display: 'EUA' },
		lastLogin: { show: true, display: 'Last Login' },
		created: { show: false, display: 'Created' },
		updated: { show: false, display: 'Updated' },
		// bypassAccessCheck: { show: false, display: 'Bypass AC' },
		externalRoles: { show: false, display: 'External Roles' },
		externalGroups: { show: false, display: 'External Groups' },
		roles: { show: true, display: 'Roles' }
	};

	defaultColumns: ColumnConfig = JSON.parse(JSON.stringify(this.columns));

	headers: SortableTableHeader[] = [
		{
			name: 'Name',
			sortable: true,
			sortField: 'name',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Name'
		},
		{
			name: 'Username',
			sortable: true,
			sortField: 'username',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Username'
		},
		{ name: 'ID', sortable: false, sortField: '_id' },
		// { name: 'Teams', sortable: false },
		{ name: 'Organization', sortable: false, sortField: 'organization' },
		{ name: 'Email', sortable: false, sortField: 'email' },
		{ name: 'Phone', sortable: false, sortField: 'phone' },
		{ name: 'EUA', sortable: false, sortField: 'acceptedEua' },
		{
			name: 'Last Login',
			sortable: true,
			sortField: 'lastLogin',
			sortDir: SortDirection.desc,
			tooltip: 'Sort by Last Login',
			default: true
		},
		{
			name: 'Created',
			sortable: true,
			sortField: 'created',
			sortDir: SortDirection.desc,
			tooltip: 'Sort by Create Date'
		},
		{ name: 'Updated', sortable: false, sortField: 'updated' },
		// { name: 'Bypass AC', sortable: false, sortField: 'bypassAccessCheck' },
		{ name: 'External Roles', sortable: false, sortField: 'externalRoles' },
		{ name: 'External Groups', sortable: false, sortField: 'externalGroups' },
		{ name: 'Roles', sortable: false, sortField: 'roles' }
	];

	headersToShow: SortableTableHeader[] = [];

	possibleRoles: Role[] = Role.ROLES;

	enableUserBypassAC: false;

	private requiredExternalRoles: string[];

	constructor(
		private route: ActivatedRoute,
		private configService: ConfigService,
		private adminUsersService: AdminUsersService,
		private exportConfigService: ExportConfigService,
		private alertService: SystemAlertService
	) {
		super();
	}

	ngOnInit() {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
			// Clear any alerts
			this.alertService.clearAllAlerts();

			// Clear cache if requested
			const clearCachedFilter = params?.[`clearCachedFilter`] ?? '';
			if (clearCachedFilter === 'true' || null == this.adminUsersService.cache.listUsers) {
				this.adminUsersService.cache.listUsers = {};
			}
		});

		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe((config: any) => {
				this.enableUserBypassAC = config.enableUserBypassAC;
				if (this.enableUserBypassAC) {
					this.columns.bypassAccessCheck = { show: false, display: 'Bypass AC' };
					this.defaultColumns = JSON.parse(JSON.stringify(this.columns));
					this.headers.push({
						name: 'Bypass AC',
						sortable: false,
						sortField: 'bypassAccessCheck'
					});
				}

				this.requiredExternalRoles = Array.isArray(config.requiredRoles)
					? config.requiredRoles
					: [];

				this.headersToShow = this.headers.filter(
					(header: SortableTableHeader) =>
						header.sortField &&
						this.columns.hasOwnProperty(header.sortField) &&
						this.columns[header.sortField].show
				);

				this.initializeFromCache();
			});

		this.sortEvent$.next(this.headers.find((header: any) => header.default) as SortChange);
		super.ngOnInit();
	}

	confirmDeleteUser(user: User) {
		const id = user.userModel._id;
		this.adminUsersService.removeUser(id).subscribe({
			next: data => {
				this.load$.next(true);
			},
			error: error => {
				this.alertService.addClientErrorAlert(error);
			}
		});
	}

	exportUserData() {
		console.error('Export of single user field is not yet supported.');
	}

	exportCurrentView() {
		const viewColumns = Object.keys(this.columns)
			.filter((key: string) => this.columns[key].show)
			.map((key: string) => ({ key, title: this.columns[key].display }));

		const rolesIndex = viewColumns.findIndex((pair: any) => pair.key === 'roles');

		if (rolesIndex !== -1) {
			const roleColumns = Role.ROLES.map(role => {
				return { key: `roles.${role.role}`, title: `${role.label} Role` };
			});
			viewColumns.splice(rolesIndex, 1, ...roleColumns);
		}

		this.exportConfigService
			.postExportConfig('user', {
				q: this.getQuery(),
				s: this.search,
				cols: viewColumns,
				sort: this.pagingOptions.sortField,
				dir: this.pagingOptions.sortDir
			})
			.subscribe((response: any) => {
				window.open(`/api/admin/users/csv/${response._id}`);
			});
	}

	columnsUpdated(updatedColumns: ColumnConfig) {
		this.columns = cloneDeep(updatedColumns);
		this.headersToShow = this.headers.filter(
			(header: SortableTableHeader) =>
				header.sortField && this.columns?.[header.sortField].show
		);
	}

	/**
	 * Initialize query, search, and paging options, possibly from cached user settings
	 */
	private initializeFromCache() {
		const cachedFilter = this.adminUsersService.cache.listUsers;

		this.filterEvent$.next(cachedFilter.filters || this.getDefaultQuickFilters());
		this.searchEvent$.next(cachedFilter.search);

		if (cachedFilter.paging) {
			this.pageEvent$.next(cachedFilter.paging);
			this.sortEvent$.next(cachedFilter.paging);
		}
	}

	private getDefaultQuickFilters() {
		const roles: any = {};

		if (this.enableUserBypassAC) {
			roles.bypassAC = { show: false, display: 'Bypass AC' };
		}

		Role.ROLES.forEach(role => {
			if (role.role !== 'user') {
				roles[`${role.role}Role`] = { show: false, display: role.label };
			}
		});

		roles.pending = { show: false, display: 'Pending' };

		return roles;
	}

	loadData(
		pagingOptions: PagingOptions,
		search: string,
		query: any
	): Observable<PagingResults<User>> {
		this.adminUsersService.cache.listUsers = {
			filters: this.filters,
			search,
			paging: pagingOptions
		};

		return this.adminUsersService.search(query, search, pagingOptions, {});
	}

	getQuery(): any {
		let query: any;
		const elements: any[] = [];

		if (this.filters.bypassAC?.show) {
			elements.push({ bypassAccessCheck: true });
		}

		Role.ROLES.forEach(role => {
			const filter = this.filters[`${role.role}Role`];
			if (filter?.show) {
				const element: Record<string, boolean> = {};
				element[`roles.${role.role}`] = true;
				elements.push(element);
			}
		});

		if (this.filters.pending.show) {
			const filter: any = {
				$or: [{ 'roles.user': { $ne: true } }]
			};
			if (this.requiredExternalRoles.length > 0) {
				filter.$or.push({
					$and: [
						{ bypassAccessCheck: { $ne: true } },
						{ externalRoles: { $not: { $all: this.requiredExternalRoles } } }
					]
				});
			}
			elements.push(filter);
		}

		if (elements.length > 0) {
			query = { $or: elements };
		}
		return query;
	}
}
