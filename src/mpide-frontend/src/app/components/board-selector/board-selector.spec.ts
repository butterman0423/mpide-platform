import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSelector } from './board-selector';

describe('BoardSelector', () => {
  let component: BoardSelector;
  let fixture: ComponentFixture<BoardSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
