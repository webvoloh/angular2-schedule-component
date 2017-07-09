import { IntouchDirective } from './intouch.directive';
import { ViewContainerRef } from '@angular/core';
describe('IntouchDirective', () => {
  it('should create an instance', () => {
    let el : ViewContainerRef;
    const directive = new IntouchDirective(el);
    expect(directive).toBeTruthy();
  });
});
