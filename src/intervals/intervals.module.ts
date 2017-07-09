import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ScheduleIntervals } from './intervals.component';
import { IntouchDirective } from './directives/intouch.directive';
import { TimemaskDirective } from './directives/timemask.directive';

@NgModule({
  declarations: [
    ScheduleIntervals,
    IntouchDirective,
    TimemaskDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  exports: [
    ScheduleIntervals
  ],
  providers: [],
  bootstrap: [ScheduleIntervals]
})
export class PercoIntervalsModule { }
