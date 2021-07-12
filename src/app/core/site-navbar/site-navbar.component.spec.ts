import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { PopoverDirective, PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { of } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorizationDirective } from '../auth/authorization.directive';
import { AuthorizationService } from '../auth/authorization.service';
import { SessionService } from '../auth/session.service';
import { Config } from '../config.model';
import { ConfigService } from '../config.service';
import { MessageService } from '../messages/message.service';
import { SiteNavbarComponent } from './site-navbar.component';

describe('Site Navbar Component Spec', () => {
	let authorizationServiceSpy: any;
	let configServiceSpy: any;
	let messageServiceSpy: any;
	let sessionServiceSpy: any;

	const defaultMockConfig: Config = {
		auth: 'local',
		app: { title: 'Test' },
		apiDocs: {
			enabled: true,
			path: '/api-docs'
		},
		banner: { html: 'Testing', style: '' },
		copyright: {
			html: 'Testing',
			style: ''
		},
		contactEmail: 'test@test.com',
		teams: { implicitMembers: { strategy: 'local' } },
		version: 'test'
	};

	let mockConfig: Config;

	beforeEach(async () => {
		// reset for each test
		mockConfig = {
			...defaultMockConfig
		};

		authorizationServiceSpy = jasmine.createSpyObj('AuthorizationService', [
			'isAuthenticated',
			'hasRole',
			'hasSomeRoles',
			'hasEveryRole'
		]);
		authorizationServiceSpy.isAuthenticated.and.returnValue(of(true));
		authorizationServiceSpy.hasRole.and.returnValue(of(true));
		authorizationServiceSpy.hasSomeRoles.and.returnValue(of(true));
		authorizationServiceSpy.hasEveryRole.and.returnValue(of(true));

		configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
		configServiceSpy.getConfig.and.callFake(() => {
			return of(mockConfig);
		});

		messageServiceSpy = jasmine.createSpyObj('MessageService', ['remove']);
		messageServiceSpy.remove.and.returnValue(of({}));
		messageServiceSpy.numMessagesIndicator = of(0);

		sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession']);
		sessionServiceSpy.getSession.and.returnValue(of({}));

		TestBed.configureTestingModule({
			declarations: [SiteNavbarComponent, AuthorizationDirective, PopoverDirective],
			imports: [
				BsDatepickerModule.forRoot(),
				ModalModule.forRoot(),
				TooltipModule.forRoot(),
				PopoverModule.forRoot(),
				FormsModule,
				RouterTestingModule
			],
			providers: [
				AuthGuard,
				BsModalService,
				{ provide: AuthorizationService, useValue: authorizationServiceSpy },
				{ provide: ConfigService, useValue: configServiceSpy },
				{ provide: MessageService, useValue: messageServiceSpy },
				{ provide: SessionService, useValue: sessionServiceSpy }
			]
		});
	});

	describe('api docs display', () => {
		it('should not display the api docs when missing', async () => {
			mockConfig.apiDocs = null;

			const fixture = TestBed.createComponent(SiteNavbarComponent);
			const component = fixture.componentInstance;

			expect(component.helpNavOpen).toEqual(false);

			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.helpNavOpen).toEqual(false);

			const bottomMenuItems = fixture.debugElement.queryAll(
				By.css('li.nav-popover-bottom > a')
			);
			const helpMenuItem = bottomMenuItems[bottomMenuItems.length - 1];
			helpMenuItem.triggerEventHandler('click', null);

			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.helpNavOpen).toEqual(true);
			expect(component.showApiDocsLink).toEqual(false);
			expect(component.apiDocsLink).toEqual('');

			/*
			 * TODO Unclear how to test that the popover contents do NOT
			 * include the contents of API Docs link
			 */
		});

		it('should not display the api docs when disabled', async () => {
			mockConfig.apiDocs = {
				enabled: false,
				path: '/some-path'
			};

			const fixture = TestBed.createComponent(SiteNavbarComponent);
			const component = fixture.componentInstance;

			expect(component.helpNavOpen).toEqual(false);

			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.helpNavOpen).toEqual(false);
			expect(component.showApiDocsLink).toEqual(false);
			expect(component.apiDocsLink).toEqual('/some-path');

			const bottomMenuItems = fixture.debugElement.queryAll(
				By.css('li.nav-popover-bottom > a')
			);
			const helpMenuItem = bottomMenuItems[bottomMenuItems.length - 1];
			helpMenuItem.triggerEventHandler('click', null);

			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.helpNavOpen).toEqual(true);
			expect(component.showApiDocsLink).toEqual(false);
			expect(component.apiDocsLink).toEqual('/some-path');

			/*
			 * TODO Unclear how to test that the popover contents do NOT
			 * include the contents of API Docs link
			 */
		});

		it('should display the api docs when enabled', async () => {
			mockConfig.apiDocs = {
				enabled: true,
				path: '/some-path'
			};

			const fixture = TestBed.createComponent(SiteNavbarComponent);
			const component = fixture.componentInstance;

			fixture.detectChanges();
			await fixture.whenStable();

			const bottomMenuItems = fixture.debugElement.queryAll(By.directive(PopoverDirective));
			const helpMenuItem = bottomMenuItems[bottomMenuItems.length - 1];
			helpMenuItem.triggerEventHandler('click', null);

			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.helpNavOpen).toEqual(true);
			expect(component.showApiDocsLink).toEqual(true);
			expect(component.apiDocsLink).toEqual('/some-path');

			/*
			 * TODO Unclear how to test that the popover contents DO
			 * include the contents of API Docs link
			 */
		});
	});
});
