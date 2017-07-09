import {
    Component,
    ViewChild,
    ViewContainerRef,
    EventEmitter,
    HostListener,
    Output,
    Input
} from '@angular/core';

@Component({
    selector: 'intervals',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class ScheduleIntervals {
    // Max interval range
    @Input() intervalRange: number = 86400;
    // Min left-offset
    @Input() minBegin = 0;
    // Max value
    @Input() maxEnd = 86400;
    // Min length (ranking units)
    @Input() minLength = 900;
    // Intervals object
    @Input() blocks: any = [];
    // Intervals types
    @Input() intervalTypes: any = [
        "Interval spacing",
        "Start of work shift",
        "End of work shift",
        "Full working shift"
    ];
    /* Events */
    // Click
    @Output() onIntervalClick = new EventEmitter();
    // Drag
    @Output() onIntervalDrag = new EventEmitter();
    // Save interval
    @Output() onIntervalSave = new EventEmitter();
    // Del interval
    @Output() onIntervalDelete = new EventEmitter();
    /***********************/
    // Current interval
    public currentInterval: any = null;
    // Siblings intervals
    public siblings: any;
    // All intervals
    public allIntervals: any = [];
    // onDrag flag
    public ondrag: boolean = false;
    // onCreate flag
    public oncreate: boolean = false;
    // The previous value of the shift in X
    public currentX: number = -1;
    // Timeline length
    public timelineWidth: any;
    // Error message
    public error: string;
    // Widget container
    @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;

    // Window resize
    @HostListener('window:resize', ['$event']) onWindowResize() {
        this.fixIntervals();
    }

    // onDrag trigger
    @HostListener('window:mouseup', ['$event']) onWindowClick(e) {
        if (this.ondrag) {
            setTimeout(() => {
                this.ondrag = false;
                this.currentX = -1;
            }, 500);
            return;
        }
        if (
            this.allIntervals.includes(e.target) ||
            native(e.target).hasClass('timeline') ||
            native(e.target).hasClass('intouch') ||
            native(e.target).hasClass('settype') ||
            e.target.tagName === 'OPTION' ||
            (native(e.target).hasClass('interval-time') && native(e.target.offsetParent).hasClass('active'))
        ) return;
        this.fixIntervals();
    }

    // Hotkeys
    @HostListener('window:keydown', ['$event']) globalHotKeys(e) {
        switch (e.key) {
            case 'Escape':
                this.cancelEdit();
                break;
            case 'Delete':
                this.deleteInterval(this.currentInterval);
                break;
        }
    }

    constructor(private containerRef: ViewContainerRef) {
    }

    private ngAfterViewInit() {
        this.timelineWidth = this.containerRef.element.nativeElement.querySelector('.timeline').clientWidth || null;
    }

    private intervalClick(e) {
        e.stopPropagation();
        if (native(e.target).hasClass('intouch') ||
            native(e.target).hasClass("settype") ||
            e.target.tagName === 'OPTION' ||
            (native(e.target).hasClass('interval-time') && native(e.target.offsetParent).hasClass('active'))
        ) {
            return;
        }
        this.fixIntervals();
        if (native(e.target).hasClass('interval-time')) {
            !native(e.target.offsetParent).hasClass("active") && native(e.target.offsetParent).addClass("active");
            this.setSiblings(e.target.offsetParent);
            this.currentInterval = e.target.offsetParent;
            return;
        }
        this.currentInterval = e.target;
        this.setSiblings(e.target);
        // Active toggle
        !native(e.target).hasClass("active") && native(e.target).addClass("active");
        this.onIntervalClick.emit({
            type: "click",
            nativeElement: this.currentInterval,
            blockIndex: native(this.currentInterval.parentNode.parentNode).index(),
            intervalIndex: native(this.currentInterval).index()
        })
    }

    private timelineMouseDown(e) {
        if (!native(e.target).hasClass('timeline')) {
            return;
        }
        if (this.currentInterval) {
            this.fixIntervals();
            return;
        }
        this.oncreate = true;
    }

    private timelineMouseMove(e) {
        if (!native(e.target).hasClass('timeline')) {
            return;
        }
        if (this.oncreate) {
            if (this.currentX === -1) {
                this.currentX = e.offsetX;
                return;
            }
            const vector = this.currentX < e.offsetX ? 'r' : 'l';
            if (Math.abs(this.currentX - e.offsetX) > 3) {
                this.createInterval(e, vector);
                this.oncreate = false;
                this.currentX = -1;
            }
        }
    }

    private timelineMouseUp() {
        this.oncreate = false;
        this.currentX = -1;
    }

    // Rendering intervals when the widget is loaded or reloaded
    private renderIntervals(data, timelineRef, intervalRef) {
        // In the process of dragging and for active intervals, we do not apply styles
        if (this.ondrag || native(intervalRef).hasClass('active')) return;
        // Saving references to all intervals as DOM elements
        !this.allIntervals.includes(intervalRef) && this.allIntervals.push(intervalRef);
        // Timeline width
        this.timelineWidth = timelineRef.clientWidth;
        /* Shift of the left tail in pixels (after several transformations is skipped
          In order to compensate for differences in widths during further work)
         I have not yet figured out how to do it more correctly */
        const begin = this.rangeToPixels(this.timeToRange(this.rangeToTime(data.begin)));
        // Right tail offset in pixels
        const end = this.rangeToPixels(this.timeToRange(this.rangeToTime(data.end)));
        // Interval length in pixels
        const width = end - begin;
        // Set styles
        native(intervalRef).style({
            left: `${begin}px`,
            width: `${width}px`
        });
    }

    // Create interval
    private createInterval(e, vector) {
        // Block index
        const blockIndex = native(e.target.parentNode).index();
        // Offset (ranges units)
        const offsetRange = this.pixelsToRange(e.offsetX);
        // Object pointer
        let ptr = this.blocks[blockIndex].intervals;
        // Calc index
        let createIndex = (() => {
            if (!ptr.length) {
                return 0;
            }
            for (let i = 0; i < ptr.length; i++) {
                if (i === 0 && ptr[i].begin > offsetRange) {
                    return 0;
                }
                if (i > 0 && ptr[i - 1].end < offsetRange && ptr[i].begin > offsetRange) {
                    return i;
                }
                if (i === ptr.length - 1 && ptr[i].end < offsetRange) {
                    return ptr.length
                }
            }
        })();
        let result = [...new Array(ptr.length + 1)], j = 0;
        const vflag = vector === 'r';
        for (let i = 0; i < result.length; i++) {
            if (i !== createIndex) {
                result[i] = ptr[j];
                j++;
                continue;
            }
            result[i] = {
                type: vflag ? 1 : 2,
                begin: vflag ? offsetRange - this.minLength : offsetRange,
                end: vflag ? offsetRange : offsetRange + this.minLength
            }
        }
        this.blocks[blockIndex].intervals = result;
        let newRef: HTMLElement;
        let int = setInterval(() => {
            if (e.target.children[createIndex] !== void 0) {
                newRef = e.target.children[createIndex];
                native(newRef).triggerMouseEvent('click');
                native(newRef.querySelector(vflag ? '.intouch.right' : '.intouch.left')).triggerMouseEvent('mousedown')
                clearInterval(int);
            }
        });
    }

    // Save & blur intervals
    private fixIntervals() {
        this.allIntervals.forEach((e) => {
            native(e).hasClass('active') && this.saveInterval(e);
        });
    }

    // Set intervavl type
    private setIntervalType(e) {
        let ptr = this.getObjectPointer(e.target.parentNode.parentNode);
        ptr.type = parseInt(e.target.value);
    }

    // onDrag handler
    private onDragInterval(e, intervalRef) {
        this.ondrag = e.ondrag;
        this.onDraggle(e.event, e.element, intervalRef);
    }

    private onDraggle(event, intouchRef, intervalRef) {
        let x = event.pageX;
        if (this.currentX === -1) {
            this.currentX = x;
        }
        let side = native(intouchRef).hasClass('left') ? 'left' : 'right',
            offset = x - this.currentX,
            currentWidth = parseInt(this.currentInterval.style.width),
            currentLeft = parseInt(this.currentInterval.style.left);
        this.onIntervalDrag.emit({
            type: 'drag',
            nativeElement: this.currentInterval,
            offset: offset,
            width: currentWidth,
            left: currentLeft,
            x: x
        });
        if (side === 'left') {
            // Collision with an adjacent interval
            if (this.siblings.l && this.siblings.l >= currentLeft + offset) {
                // Offset correcction
                let correct = this.siblings.l - currentLeft;
                // Set styles
                native(this.currentInterval).style({
                    // The left tail is set to the lowest possible value
                    left: `${this.siblings.l}px`,
                    // The true width, calculated taking into account overflow of the working area
                    width: `${currentWidth - correct}px`
                });
                // Set time
                intervalRef.querySelector('.interval-time.left').value = this.siblings.ln.querySelector('.interval-time.right').value;
                return;
            }
            // For the left tail working region extending beyond the boundaries
            if (
                this.pixelsToRange(currentLeft + offset) <= this.minBegin
            ) {
                native(this.currentInterval).style({
                    left: `${this.rangeToPixels(this.minBegin)}px`,
                    width: `${this.currentInterval.offsetLeft + currentWidth}px`
                });
                intervalRef.querySelector('.interval-time.left').value = this.rangeToTime(this.minBegin);
                return;
            }
            const width =
                this.pixelsToRange(currentWidth - offset) >= this.minLength ?
                    currentWidth - offset :
                    currentWidth;
            const left =
                this.pixelsToRange(currentWidth - offset) >= this.minLength ?
                    currentLeft + offset :
                    currentLeft;
            native(this.currentInterval).style({
                width: `${width}px`,
                left: `${left}px`
            });
            intervalRef.querySelector('.interval-time.left').value = this.rangeToTime(this.pixelsToRange(left));
        }

        if (side === 'right') {
            // Collision with an adjacent interval
            if (this.siblings.r && this.siblings.r <= currentLeft + offset + currentWidth) {
                let correct = this.siblings.r - currentLeft - currentWidth;
                native(this.currentInterval).style({
                    width: `${currentWidth + correct}px`
                });
                intervalRef.querySelector('.interval-time.right').value = this.siblings.rn.querySelector('.interval-time.left').value;
                return;
            }
            const width = this.pixelsToRange(currentWidth + offset) >= this.minLength &&
            this.pixelsToRange(currentLeft + offset + currentWidth) <= this.maxEnd ?
                currentWidth + offset :
                currentWidth;
            native(this.currentInterval).style({
                width: `${width}px`
            });
            intervalRef.querySelector('.interval-time.right').value = this.rangeToTime(this.pixelsToRange(currentLeft + width));
        }
        this.currentX = x;
    }

    // Cancel editing
    private cancelEdit(intervalRef?: HTMLElement) {
        intervalRef === void 0 && (intervalRef = this.currentInterval);
        if (intervalRef) {
            const selfindex = native(intervalRef).index();
            const parentIndex = native(intervalRef.offsetParent['offsetParent']).index();
            const intervalBegin = this.blocks[parentIndex].intervals[selfindex].begin;
            const intervalEnd = this.blocks[parentIndex].intervals[selfindex].end;
            intervalRef.querySelector('.interval-time.left')['value'] = this.rangeToTime(intervalBegin);
            intervalRef.querySelector('.interval-time.right')['value'] = this.rangeToTime(intervalEnd);
            native(intervalRef).hasClass('active') && native(intervalRef).removeClass('active');
            this.currentInterval = null;
        }
    }

    // Toggle time-inputs focus
    private togleInput(intervalRef: HTMLElement, inputRef: HTMLElement) {
        const trigger = native(inputRef).hasClass('left') ? "right" : "left";
        const input: any = intervalRef.querySelector(`.interval-time.${trigger}`);
        input.click();
    }

    // Save interval
    private saveInterval(intervalRef: HTMLElement) {
        const intervalIndex = native(intervalRef).index();
        let blockIndex = native(intervalRef.parentNode.parentNode).index(),
            begin = this.pixelsToRange(parseInt(intervalRef.style.left)),
            end = this.pixelsToRange(begin + parseInt(intervalRef.style.width)),
            lefttime = this.timeToRange(intervalRef.querySelector('.interval-time.left')['value']),
            righttime = this.timeToRange(intervalRef.querySelector('.interval-time.right')['value']);
        // TODO : Errors handling
        // Tails are inverted or the interval is shorter than the minimum value
        if (lefttime > righttime - this.minLength) {
            // TODO : There may be different actions, if not - merge
            this.setError("Tails are inverted");
            this.cancelEdit(intervalRef);
            return;
        }
        // Collision
        if (this.siblings && // Have siblings
            (this.siblings.lRange && // Left is have
            (lefttime < this.siblings.lRange && this.rangeToTime(lefttime) !== this.rangeToTime(this.siblings.lRange)) || // Time is not less and not equal to
            this.siblings.rRange && // Right is have
            (righttime > this.siblings.rRange && this.rangeToTime(righttime) !== this.rangeToTime(this.siblings.rRange)))) { // Time is no more and not equal
            // TODO : There may be different actions, if not - merge
            this.setError("The interval intersects neighboring");
            this.cancelEdit(intervalRef);
            return;
        }
        // Less than zero or more than 24 hours
        if ((lefttime < this.minBegin || lefttime > this.maxEnd) ||
            (righttime < this.minBegin || righttime > this.maxEnd)
        ) {
            // TODO : There may be different actions, if not - merge
            this.setError("Time is not in range");
            this.cancelEdit(intervalRef);
            return;
        }

        this.blocks[blockIndex].intervals[intervalIndex].begin = lefttime;
        this.blocks[blockIndex].intervals[intervalIndex].end = righttime;
        native(intervalRef).hasClass('active') && native(intervalRef).removeClass('active');
        this.onIntervalSave.emit({
            type: "save",
            nativeElement: this.currentInterval,
            data: this.blocks[blockIndex].intervals[intervalIndex]
        });
        this.currentInterval = null;
    }

    // Del interval
    private deleteInterval(intervalRef: HTMLElement) {
        const blockIndex: number = native(intervalRef.parentNode.parentNode).index();
        const intervalIndex: number = native(intervalRef).index();
        let temp = [...this.blocks[blockIndex].intervals];
        delete temp[intervalIndex];
        this.blocks[blockIndex].intervals = temp.filter((e) => {
            return e !== void 0;
        });
        this.allIntervals = this.allIntervals.filter((e) => {
            return e !== intervalRef;
        });
        this.currentInterval = null;
        this.onIntervalDelete.emit({
            type: "delete",
            blockIndex: blockIndex,
            intervalIndex: intervalIndex
        })
    }

    // Handling of time entry field events
    private handleFromInput(e) {
        switch (e.type) {
            case 'Enter':
                this.saveInterval(e.interval);
                break;
            case 'Escape':
                this.cancelEdit(e.interval);
                break;
            case 'Tab':
                this.togleInput(e.interval, e.input);
                break;
        }
    }

    // Set siblings intervals
    private setSiblings(intervalRef: HTMLElement) {
        let tmp = native(intervalRef).siblings();
        let l = tmp.fromLeft ?
            parseInt(tmp.fromLeft['style'].width) + parseInt(tmp.fromLeft['style'].left) :
            null;
        let r = tmp.fromRight ? parseInt(tmp.fromRight['style'].left) : null;
        let lt = tmp.fromLeft && tmp.fromLeft.querySelector('.interval-time.right')['value'];
        let rt = tmp.fromRight && tmp.fromRight.querySelector('.interval-time.left')['value'];
        this.siblings = {
            l: l,
            lRange: l && this.timeToRange(lt),
            r: r,
            rRange: r && this.timeToRange(rt),
            // nativeElements
            ln: tmp.fromLeft,
            rn: tmp.fromRight
        }
    }

    private setError(message: string) {
        this.error = message;
        console.error(message);
    }

    /* Transformations of quantities */
    private pixelsToRange(px) {
        return Math.round(px / (this.timelineWidth / this.intervalRange));
    }

    private rangeToPixels(rn) {
        return Math.round(rn * (this.timelineWidth / this.intervalRange));
    }

    private rangeToTime(range: number): string {
        let h = Math.floor(range / 60 / 60);
        let m = Math.floor((range / 60) % 60);
        return `${h.toString().length < 2 ? '0' + h : h}:${m.toString().length < 2 ? '0' + m : m}`;
    }

    private timeToRange(time) {
        return (time.split(":")).reduce((p, c) => {
            return parseInt(p) * 60 * 60 + parseInt(c) * 60;
        })
    }

    /****************************/

    private getObjectPointer(interval: HTMLElement) {
        const intervalIndex = native(interval).index();
        const blockIndex = native(interval.parentNode.parentNode).index();
        ;
        return this.blocks[blockIndex].intervals[intervalIndex];
    }

    public getAllIntervalsByBlockIndex(index: number) {
        return this.blocks[index].intervals;
    }
}

/* nativeElements class*/
class Element {
    private element: HTMLElement;

    constructor(node) {
        this.element = node;
    }

    public addClass(htmlclass: string): void {
        let temp = [...(this.element.className.split(" "))];
        !temp.includes(htmlclass) && temp.push(htmlclass);
        this.element.className = temp.join(" ");
    }

    public removeClass(htmlclass: string): void {
        let temp = [...(this.element.className.split(" "))];
        temp = temp.filter((e) => {
            return e !== htmlclass;
        });
        this.element.className = temp.join(" ");
    }

    public hasClass(htmlclass: string): boolean {
        let temp = [...(this.element.className.split(" "))];
        for (let i = 0; i < temp.length; i++) {
            if (temp[i] === htmlclass) return true;
        }
        return false;
    }

    public style(object): void {
        for (let key in object) {
            this.element.style[key] = object[key];
        }
    }

    public siblings() {
        return {
            fromLeft: this.element.previousElementSibling,
            fromRight: this.element.nextElementSibling
        }
    }

    public index(): number {
        let i = 0;
        let temp: any = this.element;
        while (temp.previousElementSibling !== null) {
            temp = temp.previousElementSibling;
            i++;
        }
        return i;
    }

    public triggerMouseEvent(eventType) {
        let clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent(eventType, true, true);
        this.element.dispatchEvent(clickEvent);
    }
}

/* Function-interface for Element */
function native(element) {
    return new Element(element);
}
