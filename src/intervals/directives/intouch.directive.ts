import {
  HostListener,
  Directive,
  ViewContainerRef,
  Output,
  Inject,
  EventEmitter
} from '@angular/core';
import { DOCUMENT } from "@angular/platform-browser";

@Directive({
  selector: '.intouch'
})
export class IntouchDirective {
  public ondrag : boolean = false;
  constructor(
    public el: ViewContainerRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public eventProvider = this.moveHandler.bind(this);

  @Output() update = new EventEmitter();

  @HostListener('mousedown', ['$event']) onMouseDown(e) {
    e.stopPropagation();
    this.ondrag = true;
    this.document.body.style.userSelect = 'none';
    this.document.addEventListener('mousemove', this.eventProvider, false);
  }

  @HostListener('window:mouseup', ['$event']) onMouseUp(e) {
    if(this.ondrag) {
      this.ondrag = false;
      this.document.body.style.userSelect = '';
      this.document.removeEventListener('mousemove', this.eventProvider, false);
    }
  }

  private moveHandler(e){
      if(this.ondrag && !e.button && e.buttons){
        this.update.emit({
          ondrag : true,
          event : e,
          element : this.el.element.nativeElement
        });
      }
      return false;
  }

}
