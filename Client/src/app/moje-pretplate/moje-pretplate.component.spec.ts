import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MojePretplateComponent } from './moje-pretplate.component';

describe('MojePretplateComponent', () => {
  let component: MojePretplateComponent;
  let fixture: ComponentFixture<MojePretplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MojePretplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MojePretplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
