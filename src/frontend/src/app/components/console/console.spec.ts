import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Console } from './console';

describe('Console', () => {
  let component: Console;
  let fixture: ComponentFixture<Console>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Console]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Console);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
