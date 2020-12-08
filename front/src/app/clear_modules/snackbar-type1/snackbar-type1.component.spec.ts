import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SnackbarType1Component } from './snackbar-type1.component';

describe('SnackbarType1Component', () => {
  let component: SnackbarType1Component;
  let fixture: ComponentFixture<SnackbarType1Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SnackbarType1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackbarType1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
