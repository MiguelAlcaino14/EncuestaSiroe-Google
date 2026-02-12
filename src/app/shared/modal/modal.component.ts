import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .modal-enter {
      animation: fadeIn 0.3s ease-out;
    }
    .modal-content-enter {
      animation: scaleIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
  template: `
    @if (modalService.modalState(); as state) {
      <div class="modal-enter fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="modal-content-enter bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b dark:border-gray-700">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ state.title }}</h3>
          </div>
          <div class="p-6">
            <p class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ state.message }}</p>
          </div>
          <div class="flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-2xl">
            @if (state.type === 'confirm') {
              <button (click)="cancel()" class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                {{ state.cancelText || 'Cancelar' }}
              </button>
            }
            <button (click)="confirm()" class="px-4 py-2 text-sm font-semibold text-white bg-siroe-maroon rounded-lg hover:bg-opacity-90 transition-colors">
              {{ state.confirmText || 'Aceptar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  modalService = inject(ModalService);

  confirm(): void {
    this.modalService.close(true);
  }

  cancel(): void {
    this.modalService.close(false);
  }
}
