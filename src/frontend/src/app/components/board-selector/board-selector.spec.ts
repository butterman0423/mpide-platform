import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSelectorComponent } from './board-selector';

describe('BoardSelectorComponent', () => {
  let component: BoardSelectorComponent;
  let fixture: ComponentFixture<BoardSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardSelectorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});