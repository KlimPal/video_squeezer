import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: 'img[fallbackSrc]'
})
export class ImgFallbackDirectiveDirective {

    @Input() fallbackSrc: string

    constructor(private eRef: ElementRef) {}

    isFirstError = true;
    @HostListener('error')
    loadFallbackOnError() {
        if (!this.isFirstError) {
            return
        }
        this.isFirstError = false
        this.eRef.nativeElement.src = this.fallbackSrc;
    }

}
