import { Directive, HostListener, ElementRef, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '.interval-time'
})
export class TimemaskDirective {
  private reg = new RegExp(/\d+\.?\d*/);
  private input : any;
  private length : number = 5;
  private caret : number;
  @Output() settime = new EventEmitter();
  constructor(private element : ElementRef) {
      this.input = element.nativeElement;
  }

  @HostListener('click', ['$event']) onClick(e) {
    e.target.select();
    this.caret = 0;
  }

  @HostListener('keydown', ['$event']) onKeyDown(e) {
    e.preventDefault();
    const controlKeys = ['Enter', 'Escape', 'Tab'];
    if(controlKeys.includes(e.key)){
      this.input.blur();
      this.settime.emit({
        type : e.key,
        interval: this.input.offsetParent,
        input: this.input
      });
      return false;
    }
    if(!e.key.match(this.reg) || this.caret === 5){
      return false;
    }
    const char = e.key;
    const start = parseInt(e.target.selectionStart);
    const end = parseInt(e.target.selectionEnd);
    const single = Boolean(start === end);
    if(start === 5){
      return false;
    }
    this.input.value = (() => {
      let tmp = this.input.value.toString().split("");
      single && (this.caret = start);
      tmp[this.caret] = e.key;
      return tmp.join("");
      })();
    this.caret === 1 ?
      this.caret = this.caret + 2 :
      this.caret < 4 ? this.caret++ : false;
    !single && this.input.select() || single && this.input.setSelectionRange(this.caret, this.length);
    }
}
