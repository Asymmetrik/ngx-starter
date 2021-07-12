import { Pipe, PipeTransform } from '@angular/core';

import { UtcDateUtils } from './utc-date-utils.service';

@Pipe({
	name: 'utcDate'
})
export class UtcDatePipe implements PipeTransform {
	transform(value: string | number | null | undefined, format?: string): string {
		return UtcDateUtils.format(value, format);
	}
}
