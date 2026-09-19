import { Component, Input, OnChanges } from '@angular/core'; // replaced OnInit with onChanges
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CrApiService } from '../../api/cr-api.service';
import { SessionService } from '../../session/session.service';
import { CrDetail, TimelineEntry } from '../../models/cr.models';
import { idle, loading, ViewState } from '../../common/view-state';
import { computeDiff, DiffRow } from '../diff.util';
import { formatMoney } from '../../common/money.util';

/**
 * Change Request DETAIL page: loads a CR and renders the diff/preview, the approval timeline, and
 * permission-aware Approve/Reject actions. `load`, the diff binding, and the template skeleton are
 * provided; the timeline ordering, permission gating, actions, and reject validation are yours.
 */
@Component({
	selector: 'app-cr-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './cr-detail.component.html',
})
export class CrDetailComponent implements OnChanges {
	@Input() id!: string;

	state: ViewState<CrDetail> = idle();
	submitting = false;
	actionError?: string;
	// TODO: add validation so the form is invalid until a reason is entered.
	rejectControl = new FormControl('', {
		nonNullable: true,
		validators: [(control: AbstractControl) => (control.value.trim() ? null : { required: true })],
	});

	constructor(private readonly api: CrApiService, private readonly session: SessionService) {}
    // ngOnInit(): void {
	// 	if (this.id) {
	// 		void this.load();
	// 	}
	// }

	// replaced ngOnInit with ngOnChanges to reload the component when the id changes
	ngOnChanges(): void {
	if (this.id) {
		this.rejectControl.reset();
		void this.load();
	}
}

	async load(): Promise<void> {
		this.state = loading();
		this.actionError = undefined;
		try {
			const detail = await this.api.getChangeRequest(this.session.user, this.id);
			this.state = { status: 'loaded', data: detail };
		} catch (err) {
			this.state = { status: 'error', data: null, error: (err as Error).message };
		}
	}

	get detail(): CrDetail | null {
		return this.state.data;
	}

	get diff(): DiffRow[] {
		return this.detail ? computeDiff(this.detail.baselineLineItems, this.detail.proposedLineItems) : [];
	}

	/** Approval timeline, oldest-first. */
	get timeline(): TimelineEntry[] {
		// TODO: return the audit entries ordered chronologically (oldest first).
		return this.detail?.audit.slice().sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()) ?? [];
	}

	// NOTE: this only looks at the CR status. The UI must also respect the user's permissions.
	// Second bug here: it doesn't check the user's policies.
	// 19/9 commit: permission-aware action visibility
	get canApprove(): boolean {
		return (
			this.detail?.status === 'PENDING_APPROVAL' &&
			['cr_a_u', 'cr_a_w', 'cr_a_o'].some((policy) => this.session.user.policies.includes(policy))
		);
	}

	get canReject(): boolean {
		return this.canApprove;
	}
	fmt(amount: number): string {
		return this.detail ? formatMoney(amount, this.detail.currency) : String(amount);
	}

	async approve(): Promise<void> {
		// TODO: perform the approve action through the API and reflect the outcome in the view.
		const request = this.detail;

		if (!request || !this.canApprove || this.submitting) {
			return;
		}

		this.submitting = true;
		this.actionError = undefined;

		try {
			const updated = await this.api.approve(this.session.user, request.id, new Date().toISOString());

			this.state = { status: 'loaded', data: updated };
		} catch (err) {
			this.actionError = err instanceof Error ? err.message : 'Approval response failed.';

			try {
				const refreshed = await this.api.getChangeRequest(this.session.user, request.id);

				this.state = { status: 'loaded', data: refreshed };
			} catch {
				this.state = {
					status: 'error',
					data: null,
					error: 'Could not confirm the request status. Please retry loading.',
				};
			}
		} finally {
			this.submitting = false;
		}
	}

	async reject(): Promise<void> {
		const request = this.detail;

		if (!request || !this.canReject || this.submitting) {
			return;
		}

		this.rejectControl.markAsTouched();

		if (this.rejectControl.invalid) {
			return;
		}

		const reason = this.rejectControl.value.trim();

		this.submitting = true;
		this.actionError = undefined;

		try {
			const updated = await this.api.reject(this.session.user, request.id, new Date().toISOString(), reason);

			this.state = { status: 'loaded', data: updated };
			this.rejectControl.reset();
		} catch (err) {
			this.actionError = err instanceof Error ? err.message : 'Rejection response failed.';

			try {
				const refreshed = await this.api.getChangeRequest(this.session.user, request.id);

				this.state = { status: 'loaded', data: refreshed };
			} catch {
				this.state = {
					status: 'error',
					data: null,
					error: 'Could not confirm the request status, please retry loading.',
				};
			}
		} finally {
			this.submitting = false;
		}
	}
}
