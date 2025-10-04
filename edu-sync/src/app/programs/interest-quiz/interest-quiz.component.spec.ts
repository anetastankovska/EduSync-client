import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterestQuizComponent } from './interest-quiz.component';

describe('InterestQuizComponent', () => {
  let component: InterestQuizComponent;
  let fixture: ComponentFixture<InterestQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterestQuizComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterestQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
