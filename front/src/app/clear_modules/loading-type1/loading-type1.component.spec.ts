import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoadingType1Component } from './loading-type1.component';

describe('LoadingType1Component', () => {
  let component: LoadingType1Component;
  let fixture: ComponentFixture<LoadingType1Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadingType1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingType1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
