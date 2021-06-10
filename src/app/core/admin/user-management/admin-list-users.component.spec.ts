import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { of, throwError } from 'rxjs';
import { PagingModule, PagingResults } from 'src/app/common/paging.module';
import { PipesModule } from 'src/app/common/pipes.module';
import { SearchInputModule } from 'src/app/common/search-input.module';
import { SystemAlertModule } from 'src/app/common/system-alert.module';
import { Role } from '../../auth/role.model';
import { User } from '../../auth/user.model';
import { ConfigService } from '../../config.service';
import { ExportConfigService } from '../../export-config.service';
import { AdminListUsersComponent } from './admin-list-users.component';
import { AdminUsersService } from './admin-users.service';
import { SystemAlertService } from '../../../common/system-alert.module';

describe('Admin List Users Component Spec', () => {
	let adminUsersServiceSpy: any;
	let alertServiceSpy: any;
	let configServiceSpy: any;
	let exportConfigServiceSpy: any;
	let exportResponseId: string;

	const mockUsers: PagingResults<User> = {
		elements: [],
		totalPages: 1,
		totalSize: 0,
		pageNumber: 0,
		pageSize: 20
	};

	let fixture: ComponentFixture<AdminListUsersComponent>;
	let component: AdminListUsersComponent;
	let rootHTMLElement: HTMLElement;

	const toggleColumnCheckbox = async (checkboxLabel: string) => {
		const allColumnCheckboxes = rootHTMLElement.querySelectorAll(
			'.quick-select-header > .form-check > .form-check-label'
		);
		// default to the first element, then actually find the checkbox
		let columnButton = allColumnCheckboxes.item(0);
		allColumnCheckboxes.forEach(e => {
			if (e.textContent === checkboxLabel) {
				columnButton = e;
			}
		});
		columnButton.parentElement.querySelector('input').click();
		fixture.detectChanges();
		await fixture.whenStable();
	};

	const clickExportButton = async () => {
		const exportButtonElement = rootHTMLElement.querySelector('span.fa-download').parentElement;
		expect(exportButtonElement.textContent.trim()).toEqual('Export');
		exportButtonElement.click();
		fixture.detectChanges();
		await fixture.whenStable();
	};

	beforeEach(async () => {
		exportResponseId = `${Math.random()}`;

		// reset for each test
		adminUsersServiceSpy = jasmine.createSpyObj('AdminUsersService', ['search', 'removeUser']);
		adminUsersServiceSpy.cache = {
			listUsers: {}
		};
		adminUsersServiceSpy.search.and.returnValue(of(mockUsers));

		configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
		configServiceSpy.getConfig.and.returnValue(of({}));

		exportConfigServiceSpy = jasmine.createSpyObj('ExportConfigService', ['postExportConfig']);
		exportConfigServiceSpy.postExportConfig.and.returnValue(
			of({
				_id: exportResponseId
			})
		);

		alertServiceSpy = jasmine.createSpyObj('SystemAlertService', [
			'addClientErrorAlert',
			'clearAllAlerts'
		]);

		TestBed.configureTestingModule({
			declarations: [AdminListUsersComponent],
			imports: [
				FormsModule,
				RouterTestingModule,
				PagingModule,
				PipesModule,
				SearchInputModule,
				SystemAlertModule,
				TooltipModule.forRoot()
			],
			providers: [
				{ provide: AdminUsersService, useValue: adminUsersServiceSpy },
				{ provide: ConfigService, useValue: configServiceSpy },
				{ provide: ExportConfigService, useValue: exportConfigServiceSpy },
				{ provide: SystemAlertService, useValue: alertServiceSpy }
			]
		});

		fixture = TestBed.createComponent(AdminListUsersComponent);
		component = fixture.componentInstance;
		rootHTMLElement = fixture.debugElement.nativeElement;
	});

	it('should initialize the users listing', async () => {
		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(0);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);
		fixture.detectChanges();
		await fixture.whenStable();
		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(1);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);
	});

	it('should enable the email column and export the current view', async () => {
		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(0);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(1);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);

		// Toggle the email filter on
		await toggleColumnCheckbox('Email');

		expect(component.columns.name.show).toEqual(true);
		expect(component.columns.email.show).toEqual(true);

		// Click the export button
		await clickExportButton();

		const expectedBaseColumns = ['name', 'username', 'email', 'lastLogin'].map(key => {
			return { key, title: component.columns[key].display };
		});

		const roleColumns = Role.ROLES.map(role => {
			return { key: `roles.${role.role}`, title: `${role.label} Role` };
		});

		const expectedColumns = [...expectedBaseColumns, ...roleColumns];

		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(1);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledWith('user', {
			q: undefined,
			s: undefined,
			cols: expectedColumns,
			sort: 'lastLogin',
			dir: 'DESC'
		});
	});

	it('should disable the roles column and export the current view', async () => {
		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(0);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(adminUsersServiceSpy.search).toHaveBeenCalledTimes(1);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(0);

		// Toggle the Roles filter off
		await toggleColumnCheckbox('Roles');

		expect(component.columns.name.show).toEqual(true);
		expect(component.columns.email.show).toEqual(false);
		expect(component.columns.roles.show).toEqual(false);

		// Click the export button
		await clickExportButton();

		const expectedBaseColumns = ['name', 'username', 'lastLogin'].map(key => {
			return { key, title: component.columns[key].display };
		});

		const expectedColumns = [...expectedBaseColumns];

		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledTimes(1);
		expect(exportConfigServiceSpy.postExportConfig).toHaveBeenCalledWith('user', {
			q: undefined,
			s: undefined,
			cols: expectedColumns,
			sort: 'lastLogin',
			dir: 'DESC'
		});
	});

	it('should call the api to delete a user', done => {
		component.load$.subscribe({
			next: () => {
				done();
			}
		});
		expect(adminUsersServiceSpy.removeUser).toHaveBeenCalledTimes(0);
		adminUsersServiceSpy.removeUser.and.returnValue(of());
		const fakeUser = { userModel: { _id: 1 } };
		component.confirmDeleteUser(fakeUser as any);
		expect(adminUsersServiceSpy.removeUser).toHaveBeenCalledTimes(1);
		expect(adminUsersServiceSpy.removeUser).toHaveBeenCalledWith(1);
		fixture.detectChanges();
	});

	it('should defer errors to the alert service for deletions', () => {
		adminUsersServiceSpy.removeUser.and.returnValue(throwError('error'));
		const fakeUser = { userModel: { _id: 1 } };
		component.confirmDeleteUser(fakeUser as any);
		fixture.detectChanges();
		expect(alertServiceSpy.addClientErrorAlert).toHaveBeenCalledTimes(1);
		expect(alertServiceSpy.addClientErrorAlert).toHaveBeenCalledWith('error');
	});
});
