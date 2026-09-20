import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentRef.setInput('id', id); // setInput to fix failed ngOnChanges() call in ngOnInit() when using TestBed.createComponent()
	fixture.detectChanges(); // ngOnChanges -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded state
	return fixture;
}

describe('CrDetailComponent', () => {
	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('disables Approve for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(true);
	});

	it('updates status and timeline when Approve is clicked', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const page: HTMLElement = fixture.nativeElement;
		const approveBtn = page.querySelector<HTMLButtonElement>('.cr-actions__approve')!;

		expect(approveBtn.disabled).toBe(false);

		approveBtn.click();
		await flush();
		fixture.detectChanges();

		expect(page.querySelector('.cr-status')!.textContent!.trim()).toBe('APPROVED');

		const entries = Array.from(page.querySelectorAll('.cr-timeline__entry'));
		const approvals = entries.filter(
			(entry) => entry.querySelector('.cr-timeline__action')!.textContent!.trim() === 'APPROVE',
		);

		expect(approvals).toHaveLength(1);
		expect(approvals[0].querySelector('.cr-timeline__by')!.textContent!.trim()).toBe(users.approver.id);
		expect(approveBtn.disabled).toBe(true);
		expect(page.querySelector('.cr-actions__reject')).toBeNull();
		expect(page.querySelector('.cr-actions__error')).toBeNull();
	});

	it('updates status and timeline when Reject is clicked', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const page: HTMLElement = fixture.nativeElement;
		const reasonInput = page.querySelector<HTMLTextAreaElement>('.cr-actions__reason')!;
		const rejectBtn = page.querySelector<HTMLButtonElement>('.cr-actions__reject-btn')!;

		reasonInput.value = 'The quantity is too high.';
		reasonInput.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectBtn.disabled).toBe(false);

		rejectBtn.click();
		await flush();
		fixture.detectChanges();

		expect(page.querySelector('.cr-status')!.textContent!.trim()).toBe('REJECTED');

		const entries = Array.from(page.querySelectorAll('.cr-timeline__entry'));
		const rejections = entries.filter(
			(entry) => entry.querySelector('.cr-timeline__action')!.textContent!.trim() === 'REJECT',
		);

		expect(rejections).toHaveLength(1);
		expect(rejections[0].querySelector('.cr-timeline__by')!.textContent!.trim()).toBe(users.approver.id);
		expect(rejections[0].querySelector('.cr-timeline__note')!.textContent!.trim()).toBe('The quantity is too high.');
		expect(page.querySelector<HTMLButtonElement>('.cr-actions__approve')!.disabled).toBe(true);
		expect(page.querySelector('.cr-actions__reject')).toBeNull();
		expect(page.querySelector('.cr-actions__error')).toBeNull();
	});

		it('disables Reject for empty or spaces-only reasons and enables it for a valid reason', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const page: HTMLElement = fixture.nativeElement;
		const reasonInput = page.querySelector<HTMLTextAreaElement>('.cr-actions__reason')!;
		const rejectBtn = page.querySelector<HTMLButtonElement>('.cr-actions__reject-btn')!;

		// initially empty disables reject
		expect(rejectBtn.disabled).toBe(true);

        // invalid spaces input disables reject
		reasonInput.value = '   ';
		reasonInput.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectBtn.disabled).toBe(true);

        // valid input enables reject
		reasonInput.value = 'The quantity is too high.';
		reasonInput.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectBtn.disabled).toBe(false);

		// clearing reason disables reject again
		reasonInput.value = '';
		reasonInput.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectBtn.disabled).toBe(true);
	});
});
