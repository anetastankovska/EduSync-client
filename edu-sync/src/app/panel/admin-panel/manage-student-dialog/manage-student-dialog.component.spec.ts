import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStudentDialogComponent } from './manage-student-dialog.component';

describe('ManageStudentDialogComponent', () => {
  let component: ManageStudentDialogComponent;
  let fixture: ComponentFixture<ManageStudentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageStudentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageStudentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
