import { TestBed } from '@angular/core/testing';

import { FileSelection } from './file-selection';

describe('FileSelection', () => {
  let service: FileSelection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileSelection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
