import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapTest } from './map-test';

describe('MapTest', () => {
  let component: MapTest;
  let fixture: ComponentFixture<MapTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
