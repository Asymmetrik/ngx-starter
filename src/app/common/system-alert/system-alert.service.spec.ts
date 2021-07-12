import { HttpErrorResponse } from '@angular/common/http';

import { SystemAlertService } from './system-alert.service';

describe('SystemAlertService', () => {
	let service: SystemAlertService;

	const testAlertMsgs: string[] = Array(5)
		.fill(0)
		.map((v, i) => `test alert ${i}`);

	beforeEach(() => {
		service = new SystemAlertService();
		for (const msg of testAlertMsgs) {
			service.addAlert(msg);
		}
	});

	describe('clearAllAlerts', () => {
		it('clears all alerts', () => {
			service.clearAllAlerts();
			expect(service.getAlerts().length).toBe(0);
		});
	});

	describe('clear', () => {
		it('clears single alert by index', () => {
			const indexToClear = 3;
			service.clear(indexToClear);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(4);
			for (const alert of alerts) {
				expect(alert.msg).not.toBe(testAlertMsgs[indexToClear]);
			}
		});
	});

	describe('clearAlertById', () => {
		it('clears single alert by Id', () => {
			const idToClear = 3;
			const clearedAlertMsg = service.getAlerts().find(alert => alert.id === idToClear).msg;
			service.clearAlertById(idToClear);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(4);
			for (const alert of alerts) {
				expect(alert.msg).not.toBe(clearedAlertMsg);
			}
		});
	});

	describe('addAlert', () => {
		it('new alert is created added to list', () => {
			const newAlertMsg = 'added alert';
			service.addAlert(newAlertMsg);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(6);

			const newAlert = alerts[alerts.length - 1];
			expect(newAlert.msg).toBe(newAlertMsg);
			expect(newAlert.type).toBe('danger');
			expect(newAlert.subtext).toBeUndefined();
		});

		it('new alert is created with additional details', () => {
			const newAlertMsg = 'added alert';
			const newAlertType = 'warning';
			const newAlertSubtext = 'alert subtext';
			service.addAlert(newAlertMsg, newAlertType, null, newAlertSubtext);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(6);

			const newAlert = alerts[alerts.length - 1];
			expect(newAlert.msg).toBe(newAlertMsg);
			expect(newAlert.type).toBe(newAlertType);
			expect(newAlert.subtext).toBe(newAlertSubtext);
		});

		it('new alert cleared after specified ttl', () => {
			jasmine.clock().install();

			const ttl = 5000;
			const newAlertMsg = 'added alert';
			const spy = spyOn(service, 'clearAlertById').and.callThrough();
			service.addAlert(newAlertMsg, 'danger', ttl);
			expect(service.getAlerts().length).toBe(6);

			jasmine.clock().tick(ttl);

			expect(spy).toHaveBeenCalled();
			expect(service.getAlerts().length).toBe(5);

			jasmine.clock().uninstall();
		});
	});

	describe('addClientErrorAlert', () => {
		it('alert is created from client error', () => {
			const newAlertMsg = 'client error';
			service.addClientErrorAlert(
				new HttpErrorResponse({
					status: 400,
					error: {
						message: newAlertMsg
					}
				})
			);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(6);
			expect(alerts[alerts.length - 1].msg).toBe(newAlertMsg);
		});

		it('no alert is created for non-client error', () => {
			service.addClientErrorAlert(
				new HttpErrorResponse({
					status: 500,
					error: {
						message: 'not client error'
					}
				})
			);
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(5);
		});
	});

	describe('getAlerts', () => {
		it('gets all alerts', () => {
			const alerts = service.getAlerts();
			expect(alerts.length).toBe(5);
			for (let i = 0; i < testAlertMsgs.length; i++) {
				expect(alerts[i].msg).toBe(testAlertMsgs[i]);
			}
		});
	});
});
