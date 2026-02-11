import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, Profile } from './core/models/survey.interface';
import { SupabaseService } from './core/services/supabase.service';
import { SurveyComponent } from './features/survey/survey.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

const ADMIN_EMAIL = 'admin@siroe.cl';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, SurveyComponent, DashboardComponent],
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
              Nueva Evaluación
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
                  <div class="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
                    <h3 class="text-3xl font-bold text-center mb-2 text-siroe-maroon">Evaluación de Conocimientos en IA</h3>
                    <p class="text-center text-gray-600 dark:text-gray-400 mb-8">Selecciona tu perfil para comenzar.</p>

                    @if (completedSurveys().has('general') && completedSurveys().has('dev')) {
                      <div class="text-center p-6 bg-green-50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 class="font-bold text-lg text-green-800 dark:text-green-300">¡Felicidades!</h4>
                        <p class="text-gray-600 dark:text-gray-400 mt-2">
                          Has completado todas las evaluaciones disponibles. Gracias por tu participación.
                        </p>
                      </div>
                    } @else {
                      <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div class="relative">
                            <button (click)="startSurvey('general')" [disabled]="completedSurveys().has('general')" class="w-full p-6 text-left border rounded-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-siroe-maroon">
                              <h4 class="font-bold text-lg text-siroe-maroon">Perfil General</h4>
                              <p class="text-sm text-gray-500 dark:text-gray-400">Conceptos, ética y aplicación de la IA.</p>
                            </button>
                             @if (completedSurveys().has('general')) {
                              <div class="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <span class="text-xs font-semibold text-green-600 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center">
                                  <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                  Completado
                                </span>
                              </div>
                             }
                          </div>
                          <div class="relative">
                             <button (click)="startSurvey('dev')" [disabled]="!completedSurveys().has('general') || completedSurveys().has('dev')" class="w-full p-6 text-left border rounded-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-siroe-maroon">
                              <h4 class="font-bold text-lg text-siroe-maroon">Perfil Developer</h4>
                              <p class="text-sm text-gray-500 dark:text-gray-400">Algoritmos, frameworks y MLOps.</p>
                             </button>
                              @if (completedSurveys().has('dev')) {
                                <div class="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                  <span class="text-xs font-semibold text-green-600 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center">
                                    <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    Completado
                                  </span>
                                </div>
                              } @else if (!completedSurveys().has('general')) {
                                <div class="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                  <span class="text-xs font-semibold text-red-600 dark:text-red-400 px-3 py-1 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Completa la General
                                  </span>
                                </div>
                               }
                          </div>
                        </div>
                    }
                  </div>
                }
                @case ('survey') {
                   @if(currentUser(); as user) {
                    <app-survey 
                      [profile]="selectedSurveyType()!" 
                      [participantName]="user.name"
                      (surveyCompleted)="onSurveyFinished()">
                    </app-survey>
                   }
                }
                @case ('dashboard') {
                  <app-dashboard></app-dashboard>
                }
              }
            </div>
          </div>
        </main>
      </div>
    }
  `,
})
export class AppComponent {
  private supabaseService: SupabaseService = inject(SupabaseService);

  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  view = signal<'welcome' | 'survey' | 'dashboard'>('welcome');
  loginIdentifier = signal('');
  selectedSurveyType = signal<Profile | null>(null);
  completedSurveys = signal<Set<'general' | 'dev'>>(new Set());

  // --- COMPUTED SIGNALS ---
  pageTitle = computed(() => {
    switch (this.view()) {
      case 'dashboard': return 'Panel de Control';
      case 'welcome': return 'Nueva Evaluación';
      case 'survey': return `Evaluación de ${this.selectedSurveyType() === 'dev' ? 'Developer' : 'General'}`;
      default: return 'Siroe AI Assessment';
    }
  });

  // --- METHODS ---
  async handleLogin(event: Event) {
    event.preventDefault();
    const identifier = this.loginIdentifier().trim();
    if (!identifier) {
      alert('Por favor, ingresa tu nombre.');
      return;
    }

    if (identifier.toLowerCase() === ADMIN_EMAIL) {
      this.currentUser.set({ name: 'Admin', role: 'admin' });
      this.view.set('dashboard');
    } else {
      this.currentUser.set({ name: identifier, role: 'respondent' });
      const completed = await this.supabaseService.getUserCompletionStatus(identifier);
      this.completedSurveys.set(completed);
      this.view.set('welcome');
    }
  }
  
  logout() {
    this.currentUser.set(null);
    this.loginIdentifier.set('');
    this.completedSurveys.set(new Set());
    this.selectedSurveyType.set(null);
    this.view.set('welcome');
  }

  navigateTo(view: 'welcome' | 'dashboard') {
    this.view.set(view);
    this.selectedSurveyType.set(null);
  }

  startSurvey(type: Profile) {
    this.selectedSurveyType.set(type);
    this.view.set('survey');
  }
  
  async onSurveyFinished() {
    const user = this.currentUser();
    if(user) {
      const completed = await this.supabaseService.getUserCompletionStatus(user.name);
      this.completedSurveys.set(completed);
    }
    this.view.set('welcome');
  }
}
