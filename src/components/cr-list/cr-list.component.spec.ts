import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrListComponent } from './cr-list.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser): Promise<ComponentFixture<CrListComponent>> {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrListComponent);
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded/empty state
	return fixture;
}

describe('CrListComponent', () => {
	it('renders a row per change request in the user org', async () => {
		const fixture = await render(users.approver);
		expect(fixture.nativeElement.querySelectorAll('.cr-list__row').length).toBe(3); // org-alpha: CR-1, CR-2, CR-3
	});

	it('shows the empty state when the org has no change requests', async () => {
		const fixture = await render({ id: 'x', orgCode: 'org-empty', policies: ['cr_r_o'] });
		expect(fixture.nativeElement.querySelector('.cr-list__empty')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
	});

	it('filters rows by status and restores them when ALL is selected', async () => {
		const fixture = await render(users.approver);
		const page: HTMLElement = fixture.nativeElement;
		const filter = page.querySelector<HTMLSelectElement>('.cr-list__filter')!;

		expect(page.querySelectorAll('.cr-list__row')).toHaveLength(3);

		filter.value = 'PENDING_APPROVAL';
		filter.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		const rows = page.querySelectorAll('.cr-list__row');
		expect(rows).toHaveLength(1);
		expect(rows[0].querySelector('td')!.textContent!.trim()).toBe('CR-1');
		expect(rows[0].querySelector('.cr-status')!.textContent!.trim()).toBe('PENDING_APPROVAL');

		filter.value = 'CANCELLED';
		filter.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(page.querySelectorAll('.cr-list__row')).toHaveLength(0);
		expect(page.querySelector('.cr-list__table')).toBeNull();
		expect(page.querySelector('.cr-list__empty')!.textContent)
			.toContain('No change requests match this status.');

		filter.value = 'ALL';
		filter.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(page.querySelectorAll('.cr-list__row')).toHaveLength(3);
		expect(page.querySelector('.cr-list__table')).not.toBeNull();
		expect(page.querySelector('.cr-list__empty')).toBeNull();
	});
});
