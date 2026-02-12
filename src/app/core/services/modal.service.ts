import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type: 'alert' | 'confirm';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  modalState = signal<ModalConfig | null>(null);
  private resultSubject$ = new Subject<boolean>();

  alert(config: { title: string; message: string; confirmText?: string }): void {
    this.modalState.set({ ...config, type: 'alert' });
    this.resultSubject$ = new Subject<boolean>();
  }

  confirm(config: { title:string; message: string; confirmText?: string; cancelText?: string }): Promise<boolean> {
    this.modalState.set({ ...config, type: 'confirm' });
    this.resultSubject$ = new Subject<boolean>();
    return new Promise((resolve) => {
      this.resultSubject$.subscribe(result => {
        resolve(result);
      });
    });
  }

  close(result: boolean): void {
    this.modalState.set(null);
    this.resultSubject$.next(result);
    this.resultSubject$.complete();
  }
}
