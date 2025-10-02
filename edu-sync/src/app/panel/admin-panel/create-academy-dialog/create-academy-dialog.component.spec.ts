import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAcademyDialogComponent } from './create-academy-dialog.component';

describe('CreateAcademyDialogComponent', () => {
  let component: CreateAcademyDialogComponent;
  let fixture: ComponentFixture<CreateAcademyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAcademyDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAcademyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
