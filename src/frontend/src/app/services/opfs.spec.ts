import { TestBed } from '@angular/core/testing';

import { OpfsService } from './opfs';

describe('OpfsService', () => {
  let service: OpfsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpfsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
