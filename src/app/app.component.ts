import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, Survey } from './core/models/survey.interface';
import { SupabaseService } from './core/services/supabase.service';
import { SurveyComponent } from './features/survey/survey.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ModalService } from './core/services/modal.service';
import { ModalComponent } from './shared/modal/modal.component';

const ADMIN_EMAIL = 'admin@siroe.cl';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, SurveyComponent, DashboardComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
    .fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  ],
  template: `
    @if (!currentUser()) {
      <div class="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 class="text-3xl font-bold text-center text-siroe-maroon mb-2">SIROE</h1>
          <p class="text-center text-gray-600 dark:text-gray-400 mb-8">Plataforma de Evaluación IA</p>

          <form (submit)="handleLogin($event)" class="space-y-4 fade-in">
            <div>
              <label for="loginIdentifier" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
              <input type="text" id="loginIdentifier" name="loginIdentifier" [(ngModel)]="loginIdentifier" required class="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon" placeholder="Ej: Juan Pérez">
            </div>
            <button type="submit" class="w-full mt-4 px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all disabled:bg-gray-400">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    } @else {
      <div class="flex h-screen bg-gray-100 dark:bg-gray-800 font-sans text-gray-800 dark:text-gray-200">
        <!-- Sidebar -->
        <aside class="w-64 bg-siroe-maroon text-white flex-col hidden sm:flex">
          <div class="flex items-center justify-center h-20 border-b border-white/20">
            <h1 class="text-2xl font-bold tracking-wider">SIROE</h1>
          </div>
          <nav class="flex-1 p-4">
            @if (currentUser()?.role === 'admin') {
              <a (click)="navigateTo('dashboard')" class="flex items-center px-4 py-3 my-2 rounded-lg cursor-pointer transition-colors" [class.bg-white/20]="view() === 'dashboard'" [class.hover:bg-white/10]="view() !== 'dashboard'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Panel de Control
              </a>
            }
            <a (click)="navigateTo('welcome')" class="flex items-center px-4 py-3 my-2 rounded-lg cursor-pointer transition-colors" [class.bg-white/20]="view() === 'welcome' || view() === 'survey'" [class.hover:bg-white/10]="!(view() === 'welcome' || view() === 'survey')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Evaluaciones
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <header class="h-20 flex items-center justify-between px-8 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 class="text-2xl font-semibold">{{ pageTitle() }}</h2>
            <div class="flex items-center gap-4">
              <div class="text-sm text-right">
                  <span>Bienvenido, <span class="font-bold">{{ currentUser()?.name }}</span></span>
              </div>
              <button (click)="logout()" class="px-4 py-2 bg-siroe-maroon/10 text-siroe-maroon dark:bg-white/10 dark:text-white text-sm font-semibold rounded-lg hover:bg-siroe-maroon/20 dark:hover:bg-white/20 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8 bg-gray-100 dark:bg-gray-800">
            <div class="fade-in">
              @switch (view()) {
                @case ('welcome') {
                  <div class="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-3xl font-bold text-siroe-maroon">Catálogo de Evaluaciones</h3>
                        @if (currentUser()?.role === 'admin') {
                            <div class="flex items-center gap-2">
                                <button (click)="requestNewSurveyCreation()" class="px-4 py-2 bg-siroe-maroon text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-opacity-90 transition-all">
                                    Crear Evaluación
                                </button>
                                <button (click)="refreshSurveys()" [disabled]="isRefreshing() || deletingSurveyId() !== null"
                                        class="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        aria-label="Actualizar catálogo">
                                    <svg [class.animate-spin]="isRefreshing()" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0121 12h-3a6 6 0 00-9.43-4.93L4 4zM20 20l-1.5-1.5A9 9 0 013 12h3a6 6 0 009.43 4.93L20 20z" />
                                    </svg>
                                </button>
                            </div>
                        }
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 mb-8">Selecciona una evaluación para comenzar.</p>

                    @if (allSurveysCompleted()) {
                      <div class="text-center p-6 bg-green-50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 class="font-bold text-lg text-green-800 dark:text-green-300">¡Felicidades!</h4>
                        <p class="text-gray-600 dark:text-gray-400 mt-2">
                          Has completado todas las evaluaciones disponibles. Gracias por tu participación.
                        </p>
                      </div>
                    } @else {
                      <div class="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        @for (survey of surveys(); track (survey.id ?? survey.title)) {
                          <div class="relative">
                            <button (click)="startSurvey(survey)" [disabled]="completedSurveys().has(survey.title) || deletingSurveyId() !== null" class="w-full h-full p-6 text-left border rounded-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-siroe-maroon flex flex-col">
                              <h4 class="font-bold text-lg text-siroe-maroon">{{ survey.title }}</h4>
                              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">{{ survey.description }}</p>
                            </button>
                             @if (currentUser()?.role === 'admin') {
                                <div class="absolute top-2 right-2 flex gap-2">
                                    <button (click)="editSurvey(survey)" [disabled]="deletingSurveyId() !== null" class="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50" aria-label="Editar encuesta">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </button>
                                    <button (click)="deactivateSurvey(survey)" [disabled]="deletingSurveyId() !== null" class="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50 w-7 h-7 flex items-center justify-center" aria-label="Desactivar encuesta">
                                        @if(deletingSurveyId() === survey.id) {
                                            <svg class="spinner h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        } @else {
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        }
                                    </button>
                                </div>
                            }
                             @if (completedSurveys().has(survey.title)) {
                              <div class="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <span class="text-xs font-semibold text-green-600 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center">
                                  <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                  Completado
                                </span>
                              </div>
                             }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                @case ('survey') {
                   @if(currentUser() && selectedSurvey()) {
                    <app-survey 
                      [survey]="selectedSurvey()!" 
                      [participantName]="currentUser()!.name"
                      (surveyCompleted)="onSurveyFinished()">
                    </app-survey>
                   }
                }
                @case ('dashboard') {
                  <app-dashboard 
                    [surveyToEdit]="editingSurvey()" 
                    [startInCreateMode]="startDashboardInCreateMode()"
                    (formClosed)="editingSurvey.set(null)">
                  </app-dashboard>
                }
              }
            </div>
          </div>
        </main>
      </div>
    }
    <app-modal></app-modal>
  `,
})
export class AppComponent {
  private supabaseService: SupabaseService = inject(SupabaseService);
  private modalService: ModalService = inject(ModalService);

  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  view = signal<'welcome' | 'survey' | 'dashboard'>('welcome');
  loginIdentifier = signal('');
  surveys = signal<Survey[]>([]);
  selectedSurvey = signal<Survey | null>(null);
  editingSurvey = signal<Survey | null>(null);
  completedSurveys = signal<Set<string>>(new Set());
  isRefreshing = signal(false);
  deletingSurveyId = signal<number | null>(null);
  startDashboardInCreateMode = signal(false);

  // --- COMPUTED SIGNALS ---
  pageTitle = computed(() => {
    switch (this.view()) {
      case 'dashboard': return 'Panel de Control';
      case 'welcome': return 'Evaluaciones Disponibles';
      case 'survey': return `Evaluación: ${this.selectedSurvey()?.title || ''}`;
      default: return 'Siroe AI Assessment';
    }
  });

  allSurveysCompleted = computed(() => {
    const availableSurveys = this.surveys().filter(s => s.type !== 'custom');
    if (availableSurveys.length === 0) return false;
    return availableSurveys.every(s => this.completedSurveys().has(s.title));
  });

  // --- METHODS ---
  async handleLogin(event: Event) {
    event.preventDefault();
    const identifier = this.loginIdentifier().trim();
    if (!identifier) {
      this.modalService.alert({
        title: 'Campo Requerido',
        message: 'Por favor, ingresa tu nombre.'
      });
      return;
    }

    if (identifier.toLowerCase() === ADMIN_EMAIL) {
      this.currentUser.set({ name: 'Admin', role: 'admin' });
      await this.refreshSurveys();
      this.view.set('welcome');
    } else {
      this.currentUser.set({ name: identifier, role: 'respondent' });
      const [completed, allSurveys] = await Promise.all([
        this.supabaseService.getUserCompletionStatus(identifier),
        this.supabaseService.getSurveys()
      ]);
      this.completedSurveys.set(completed);
      this.surveys.set(allSurveys);
      this.view.set('welcome');
    }
  }
  
  logout() {
    this.currentUser.set(null);
    this.loginIdentifier.set('');
    this.completedSurveys.set(new Set());
    this.selectedSurvey.set(null);
    this.editingSurvey.set(null);
    this.surveys.set([]);
    this.view.set('welcome');
  }

  async navigateTo(view: 'welcome' | 'dashboard') {
    if (this.view() === 'dashboard' && view !== 'dashboard') {
        this.startDashboardInCreateMode.set(false);
        this.editingSurvey.set(null);
    }
    if (view === 'welcome') {
      await this.refreshSurveys();
    }
    this.view.set(view);
    this.selectedSurvey.set(null);
  }

  async refreshSurveys() {
      this.isRefreshing.set(true);
      try {
        const allSurveys = await this.supabaseService.getSurveys();
        this.surveys.set(allSurveys);
      } catch (e) {
        console.error("Failed to refresh surveys", e);
        this.modalService.alert({
          title: 'Error de Red',
          message: 'No se pudo actualizar el catálogo de evaluaciones. Por favor, revisa tu conexión.'
        });
      } finally {
        setTimeout(() => this.isRefreshing.set(false), 300);
      }
  }

  startSurvey(survey: Survey) {
    this.selectedSurvey.set(survey);
    this.view.set('survey');
  }
  
  editSurvey(survey: Survey) {
    this.editingSurvey.set(survey);
    this.navigateTo('dashboard');
  }

  requestNewSurveyCreation() {
    this.editingSurvey.set(null);
    this.startDashboardInCreateMode.set(true);
    this.navigateTo('dashboard');
  }

  async deactivateSurvey(survey: Survey) {
    if (!survey.id) return;
    
    const confirmed = await this.modalService.confirm({
        title: 'Confirmar Desactivación',
        message: `¿Estás seguro de que quieres desactivar la encuesta "${survey.title}"? No se podrá responder, pero los resultados existentes se conservarán.`,
        confirmText: 'Sí, Desactivar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    this.deletingSurveyId.set(survey.id);
    try {
        const { error } = await this.supabaseService.deactivateSurvey(survey.id);
        if (error) {
            let errorMessage = `Error al desactivar la encuesta: ${error.message}`;
            if (error.code === 'RLS_VIOLATION' || error.message.includes('RLS') || error.message.includes('security policy')) {
                errorMessage = `Error de Permisos\n\nNo tienes los permisos necesarios para realizar esta acción. Por favor, asegúrate de que la política de seguridad (RLS) en tu tabla "surveys" de Supabase permite la operación de UPDATE para el rol "anon".`;
            } else if (error.message.includes('ninguna fila')) {
                errorMessage = `No se Pudo Modificar la Encuesta\n\nLa política de seguridad (RLS) de la base de datos para la operación UPDATE no encontró la encuesta que se intentaba modificar. Asegúrate de que la cláusula "USING" de tu política de RLS permite esta modificación.`;
            }
            this.modalService.alert({ title: 'Error', message: errorMessage });
        } else {
            this.modalService.alert({ title: 'Éxito', message: 'Encuesta desactivada con éxito.' });
            await this.refreshSurveys();
        }
    } catch (e: any) {
        this.modalService.alert({ title: 'Error Inesperado', message: `Ocurrió un error inesperado: ${e.message}`});
    } finally {
        this.deletingSurveyId.set(null);
    }
  }

  async onSurveyFinished() {
    const user = this.currentUser();
    if(user) {
      const completed = await this.supabaseService.getUserCompletionStatus(user.name);
      this.completedSurveys.set(completed);
    }
    this.view.set('welcome');
    this.selectedSurvey.set(null);
  }
}