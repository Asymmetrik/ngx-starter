import difference from 'lodash/difference';
import { User } from '../auth/user.model';
import { TeamRole } from './team-role.model';
import { Team } from './team.model';

export class TeamMember extends User {
	public explicit = false;

	public active = false;

	public role = 'member';

	public roleDisplay: string;

	constructor() {
		super();
	}

	hasTeams(): boolean {
		return this.userModel.teams.length > 0;
	}

	public getRoleInTeam(team: Pick<Team, '_id'>): string | null {
		if (null != this.userModel && null != team) {
			const teams = this?.userModel?.teams ?? [];
			// Find the role of this user in the team
			const ndx = teams.findIndex((t: any) => t._id === team._id);

			if (-1 !== ndx) {
				return teams[ndx].role;
			}
		}

		return null;
	}

	public setFromTeamMemberModel(team: Team | null, userModel: any): TeamMember {
		// Set the user model
		super.setFromUserModel(userModel);

		if (null != this.userModel) {
			// Initialize the teams array if needed
			if (null == userModel.teams) {
				this.userModel.teams = [];
			}

			// Determine if user is implicit/explicit and active/inactive
			this.explicit = (userModel.teams?.length ?? 0) > 0;

			if (userModel.bypassAccessCheck) {
				this.active = true;
			} else if (null != team) {
				this.role = this.getRoleInTeam(team) ?? TeamRole.VIEW_ONLY.role;
				this.roleDisplay = TeamRole.getDisplay(this.role);

				this.explicit = userModel.teams.map((t: any) => t._id).includes(team._id);

				this.active =
					0 === difference(team.requiresExternalTeams, userModel.externalGroups).length &&
					0 === difference(team.requiresExternalRoles, userModel.externalRoles).length;
			}
		}

		return this;
	}
}
