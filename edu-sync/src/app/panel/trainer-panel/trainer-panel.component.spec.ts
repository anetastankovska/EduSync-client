import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainerPanelComponent } from './trainer-panel.component';

describe('TrainerPanelComponent', () => {
  let component: TrainerPanelComponent;
  let fixture: ComponentFixture<TrainerPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainerPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
