export class SystemAlert {
	constructor(
		public id: number,
		public type: string,
		public msg: string,
		public subtext?: string
	) {}
}
