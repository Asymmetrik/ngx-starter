export class TeamRole {
	public static VIEW_ONLY: TeamRole = new TeamRole(
		'View Only',
		'This user can view resources within this team.',
		'member'
	);
	public static EDITOR: TeamRole = new TeamRole(
		'Editor',
		'This user has member privileges and can also create and manage resources within this team',
		'editor'
	);
	public static ADMIN: TeamRole = new TeamRole(
		'Admin',
		'This user has editor privileges and can also manage team membership',
		'admin'
	);

	constructor(public label: string, public description: string, public role: string) {}

	public static get ROLES(): TeamRole[] {
		return [this.VIEW_ONLY, this.EDITOR, this.ADMIN];
	}

	static getDisplay(role: string): string {
		return TeamRole.ROLES.find((tr: TeamRole) => tr.role === role)?.label ?? 'Unknown';
	}
}
