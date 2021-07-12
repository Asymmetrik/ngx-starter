import { Router } from '@angular/router';

import { PageTitleService } from './page-title.service';

describe('PageTitleService', () => {
	describe('generatePathTitle', () => {
		it('should return data.title when present', () => {
			const service = new PageTitleService(null, null, null, null);
			const title = service.generatePathTitle({ title: 'Test Title' });

			expect(title).toEqual('Test Title');
		});

		it('should return title derived from url', () => {
			const router = { url: '/test' };
			const service = new PageTitleService(null, router as Router, null, null);

			let title = service.generatePathTitle({});
			expect(title).toEqual('Test');

			router.url = '/test/id';
			title = service.generatePathTitle({});
			expect(title).toEqual('Test > Id');

			router.url = '/really/long/url/path/to/parse';
			title = service.generatePathTitle({});
			expect(title).toEqual('Really > Long > Url > Path > To > Parse');
		});

		it('should  null when error occurs', () => {
			const service = new PageTitleService(null, null, null, null);
			const title = service.generatePathTitle({});

			expect(title).toBeUndefined();
		});
	});
});
