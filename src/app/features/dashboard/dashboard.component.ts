import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { ModalService } from '../../core/services/modal.service';
import { SurveyResult, Survey } from '../../core/models/survey.interface';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold">
                {{ view() === 'results' ? 'Resultados de Evaluaciones' : (editingSurveyId() ? 'Editar Evaluación' : 'Crear Nueva Evaluación') }}
            </h3>
            <button (click)="toggleView()" class="px-4 py-2 bg-siroe-maroon text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-all">
                {{ view() === 'results' ? 'Crear Evaluación' : 'Ver Resultados' }}
            </button>
        </div>

        @if(view() === 'results') {
            <!-- KPIs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center">
                <div class="bg-blue-500/20 text-blue-600 dark:text-blue-300 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Total Evaluaciones</p>
                    <p class="text-2xl font-bold">{{ filteredResults().length }}</p>
                </div>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center">
                <div class="bg-green-500/20 text-green-600 dark:text-green-300 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Puntaje Promedio</p>
                    <p class="text-2xl font-bold">{{ averageScore() | number:'1.0-1' }}</p>
                </div>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center">
                <div class="bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Puntaje Máximo</p>
                    <p class="text-2xl font-bold">{{ maxScore() }}</p>
                </div>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center">
                <div class="bg-red-500/20 text-red-600 dark:text-red-300 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Puntaje Mínimo</p>
                    <p class="text-2xl font-bold">{{ minScore() }}</p>
                </div>
                </div>
            </div>

            <!-- New Row for Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
                    <h4 class="font-bold text-lg mb-4">Distribución por Categoría</h4>
                    <div id="category-chart" class="w-full h-64 flex items-center justify-center">
                        <!-- D3 Donut Chart will be rendered here -->
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center justify-center text-gray-400">
                    <p>Más analíticas próximamente...</p>
                </div>
            </div>

            <!-- Results Table -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                <div class="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h4 class="font-bold text-lg">Resultados Recientes</h4>
                    <div class="flex items-center gap-2">
                        <label for="surveyFilter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar:</label>
                        <select id="surveyFilter" (change)="handleFilterChange($event)" class="w-full px-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon py-1 max-w-xs">
                            @for(title of uniqueSurveyTitles(); track title) {
                                <option [value]="title">{{ title === 'all' ? 'Todas las Evaluaciones' : title }}</option>
                            }
                        </select>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participante</th>
                            <th class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Evaluación</th>
                            <th class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Puntaje</th>
                            <th class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                            <th class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        @if (filteredResults().length === 0) {
                            <tr><td colspan="5" class="text-center py-8 text-gray-500">No hay resultados para el filtro seleccionado.</td></tr>
                        }
                        @for (result of filteredResults(); track result.id) {
                            <tr>
                            <td class="px-6 py-4 whitespace-nowrap font-medium">{{ result.participantName }}</td>
                            <td class="px-6 py-4 whitespace-nowrap">{{ result.surveyTitle }}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-bold">{{ result.score }}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                [class.bg-green-100]="result.category === 'Avanzado'"
                                [class.text-green-800]="result.category === 'Avanzado'"
                                [class.dark:bg-green-900]="result.category === 'Avanzado'"
                                [class.dark:text-green-300]="result.category === 'Avanzado'"
                                [class.bg-yellow-100]="result.category === 'Intermedio'"
                                [class.text-yellow-800]="result.category === 'Intermedio'"
                                [class.dark:bg-yellow-900]="result.category === 'Intermedio'"
                                [class.dark:text-yellow-300]="result.category === 'Intermedio'"
                                [class.bg-red-100]="result.category === 'Básico'"
                                [class.text-red-800]="result.category === 'Básico'"
                                [class.dark:bg-red-900]="result.category === 'Básico'"
                                [class.dark:text-red-300]="result.category === 'Básico'"
                                >{{ result.category }}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ result.created_at | date:'short' }}</td>
                            </tr>
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        } @else {
            <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
                <form [formGroup]="surveyForm" (ngSubmit)="onSubmit()">
                    <!-- Survey Details -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Título de la Encuesta</label>
                            <input type="text" id="title" formControlName="title" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                        </div>
                        <div>
                            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                            <input type="text" id="description" formControlName="description" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                        </div>
                    </div>

                    <!-- Dynamic Questions -->
                    <div formArrayName="questions">
                        @for (question of questions.controls; track $index; let i = $index) {
                            <div [formGroupName]="i" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6 border dark:border-gray-700 relative">
                                <h5 class="font-bold mb-4">Pregunta {{ i + 1 }}</h5>
                                
                                <button type="button" (click)="removeQuestion(i)" class="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>

                                <div class="mb-4">
                                    <label [for]="'text'+i" class="block text-sm font-medium">Texto de la Pregunta</label>
                                    <input type="text" [id]="'text'+i" formControlName="text" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                                </div>
                                
                                <h6 class="text-sm font-semibold mb-2">Opciones de Respuesta</h6>
                                <div formArrayName="options" class="space-y-2 mb-4">
                                    @for(option of getOptions(i).controls; track $index; let j = $index) {
                                       <div class="flex items-center gap-2">
                                           <label [for]="'option'+i+j" class="text-sm font-medium text-gray-500 dark:text-gray-400">#{{ j + 1 }}</label>
                                           <input type="text" [id]="'option'+i+j" [formControlName]="j" class="flex-grow w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                                           <button type="button" (click)="removeOption(i, j)" [class.invisible]="getOptions(i).length <= 2" class="text-gray-400 hover:text-red-500 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                                           </button>
                                       </div>
                                    }
                               </div>
                               <button type="button" (click)="addOption(i)" class="text-sm px-3 py-1 border border-dashed border-siroe-maroon text-siroe-maroon font-semibold rounded hover:bg-siroe-maroon/10 transition-colors">
                                   Agregar Opción
                               </button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                                    <div>
                                        <label [for]="'answer'+i" class="block text-sm font-medium">Respuesta Correcta</label>
                                        <select [id]="'answer'+i" formControlName="answer" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                                            <option [ngValue]="null" disabled>Selecciona una respuesta</option>
                                            @for(opt of getOptions(i).controls; track $index; let j = $index) {
                                                <option [value]="j">Opción {{ j + 1 }}</option>
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label [for]="'difficulty'+i" class="block text-sm font-medium">Dificultad</label>
                                        <select [id]="'difficulty'+i" formControlName="difficulty" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon">
                                            <option>Básico</option>
                                            <option>Intermedio</option>
                                            <option>Avanzado</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label [for]="'explanation'+i" class="block text-sm font-medium">Explicación</label>
                                    <textarea [id]="'explanation'+i" formControlName="explanation" class="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-siroe-maroon focus:border-siroe-maroon" rows="2"></textarea>
                                </div>
                            </div>
                        }
                    </div>

                    <div class="flex justify-between mt-6">
                        <button type="button" (click)="addQuestion()" class="px-5 py-2 border border-siroe-maroon text-siroe-maroon font-semibold rounded-lg hover:bg-siroe-maroon/10 transition-colors">
                            Agregar Pregunta
                        </button>
                        <button type="submit" [disabled]="surveyForm.invalid" class="px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all disabled:bg-gray-400">
                            {{ editingSurveyId() ? 'Actualizar Encuesta' : 'Guardar Encuesta' }}
                        </button>
                    </div>
                </form>
            </div>
        }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private supabaseService: SupabaseService = inject(SupabaseService);
  private modalService: ModalService = inject(ModalService);
  private fb = inject(FormBuilder);

  surveyToEdit = input<Survey | null>(null);
  formClosed = output<void>();
  
  allResults = signal<SurveyResult[]>([]);
  allSurveys = signal<Survey[]>([]);
  view = signal<'results' | 'form'>('results');
  surveyFilter = signal<string>('all');
  editingSurveyId = signal<number | null>(null);
  surveyForm: FormGroup;

  uniqueSurveyTitles = computed(() => {
    return ['all', ...this.allSurveys().map(s => s.title)];
  });

  filteredResults = computed(() => {
    const results = this.allResults();
    const filter = this.surveyFilter();
    if (filter === 'all') {
      return results;
    }
    return results.filter(r => r.surveyTitle === filter);
  });

  averageScore = computed(() => {
    const results = this.filteredResults();
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.score, 0);
    return total / results.length;
  });
  maxScore = computed(() => Math.max(0, ...this.filteredResults().map(r => r.score)));
  minScore = computed(() => this.filteredResults().length > 0 ? Math.min(...this.filteredResults().map(r => r.score)) : 0);
  
  categoryDistribution = computed(() => {
    const counts = { 'Básico': 0, 'Intermedio': 0, 'Avanzado': 0 };
    for (const result of this.filteredResults()) {
        if (result.category in counts) {
            counts[result.category as keyof typeof counts]++;
        }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  });

  constructor() {
     this.surveyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      questions: this.fb.array([], Validators.minLength(1))
    });

    effect(() => {
      const survey = this.surveyToEdit();
      if (survey) {
        this.view.set('form');
        this.editingSurveyId.set(survey.id!);
        this.populateForm(survey);
      }
    });

    effect(() => {
      if (this.view() === 'results') {
        this.drawCategoryChart();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    const [results, surveys] = await Promise.all([
        this.supabaseService.getResults(),
        this.supabaseService.getSurveys()
    ]);
    this.allResults.set(results);
    this.allSurveys.set(surveys);
  }

  async toggleView() {
    if (this.view() === 'form') {
        this.view.set('results');
        this.editingSurveyId.set(null);
        this.formClosed.emit();
        await this.loadDashboardData();
    } else {
        this.view.set('form');
        this.editingSurveyId.set(null);
        this.formClosed.emit();
        this.surveyForm.reset();
        this.questions.clear();
        this.addQuestion();
    }
  }

  handleFilterChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.surveyFilter.set(selectElement.value);
  }

  populateForm(survey: Survey) {
    this.surveyForm.reset();
    this.questions.clear();
    this.surveyForm.patchValue({
      title: survey.title,
      description: survey.description,
    });

    survey.questions.forEach(q => {
      const questionFormGroup = this.fb.group({
        text: [q.text, Validators.required],
        options: this.fb.array(
          q.options.map(opt => this.fb.control(opt, Validators.required)),
          Validators.minLength(2)
        ),
        answer: [q.answer, [Validators.required, Validators.min(0), Validators.max(q.options.length - 1)]],
        difficulty: [q.difficulty, Validators.required],
        explanation: [q.explanation, Validators.required]
      });
      this.questions.push(questionFormGroup);
    });
  }

  // --- FormArray Methods ---
  get questions() {
    return this.surveyForm.get('questions') as FormArray;
  }

  newQuestion(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
      options: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required)
      ], Validators.minLength(2)),
      answer: [null, [Validators.required, Validators.min(0), Validators.max(2)]],
      difficulty: ['Básico', Validators.required],
      explanation: ['', Validators.required]
    });
  }

  addQuestion() {
    this.questions.push(this.newQuestion());
  }

  removeQuestion(i: number) {
    this.questions.removeAt(i);
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.push(this.fb.control('', Validators.required));
    this.updateAnswerValidators(questionIndex);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
      this.updateAnswerValidators(questionIndex);
    }
  }

  private updateAnswerValidators(questionIndex: number): void {
    const optionsCount = this.getOptions(questionIndex).length;
    const answerControl = this.questions.at(questionIndex).get('answer');
    
    if (answerControl?.value !== null && answerControl?.value >= optionsCount) {
        answerControl.setValue(null);
    }

    answerControl?.setValidators([
        Validators.required, 
        Validators.min(0), 
        Validators.max(optionsCount - 1)
    ]);
    answerControl?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      this.modalService.alert({
        title: 'Formulario Incompleto',
        message: 'Por favor completa todos los campos requeridos.'
      });
      return;
    }
    const formValue = this.surveyForm.getRawValue();
    const surveyData: Omit<Survey, 'id' | 'type'> & { type: 'custom' } = {
      ...formValue,
      questions: formValue.questions.map((q: any) => ({
          ...q,
          answer: parseInt(q.answer, 10),
      })),
      type: 'custom',
    };
    
    const editingId = this.editingSurveyId();
    let error;
    let operation: 'actualizar' | 'guardar' = 'guardar';

    if (editingId !== null) {
      operation = 'actualizar';
      const result = await this.supabaseService.updateSurvey(editingId, surveyData);
      error = result.error;
    } else {
      const result = await this.supabaseService.saveSurvey(surveyData);
      error = result.error;
    }

    if (error) {
      let errorMessage = `Error al ${operation} la encuesta: ${error.message}`;
      if (error.message.includes('security policy')) {
          const requiredOperation = operation === 'guardar' ? 'INSERT' : 'UPDATE';
          errorMessage += `\n\nSugerencia: Este error usualmente significa que faltan permisos en la base de datos. Asegúrate de que la tabla "surveys" tenga una política de seguridad (RLS) que permita la operación de ${requiredOperation} para usuarios anónimos.`;
      }
      this.modalService.alert({ title: `Error al ${operation}`, message: errorMessage });
    } else {
      this.modalService.alert({
        title: 'Operación Exitosa',
        message: editingId !== null ? 'Encuesta actualizada con éxito.' : 'Encuesta guardada con éxito.'
      });
      this.view.set('results');
      this.editingSurveyId.set(null);
      this.formClosed.emit();
      this.surveyForm.reset();
      this.questions.clear();
      await this.loadDashboardData();
    }
  }

  private drawCategoryChart(): void {
    const data = this.categoryDistribution().filter(d => d.value > 0);
    const chartContainer = d3.select('#category-chart');
    chartContainer.selectAll('*').remove();

    if (data.length === 0) {
        chartContainer.append('p')
            .attr('class', 'text-gray-500 dark:text-gray-400')
            .text('No hay datos para mostrar.');
        return;
    }

    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 10;

    const svg = chartContainer.append('svg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal<string>()
        .domain(['Básico', 'Intermedio', 'Avanzado'])
        .range(['#ef4444', '#f59e0b', '#22c55e']);

    const pie = d3.pie<{ name: string; value: number }>().value(d => d.value).sort(null);
    const data_ready = pie(data);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    svg.selectAll('path')
       .data(data_ready)
       .join('path')
         .attr('d', arc as any)
         .attr('fill', (d: { data: { name: string } }) => color(d.data.name))
         .attr('stroke', 'white')
         .style('stroke-width', '2px');

    const legend = chartContainer.append('div')
        .attr('class', 'flex flex-col justify-center ml-6 text-gray-700 dark:text-gray-300');

    const total = d3.sum(data, (d: { value: number }) => d.value);

    const legendItems = legend.selectAll('div')
        .data(data)
        .join('div')
        .attr('class', 'flex items-center mb-2 text-sm');
        
    legendItems.append('div')
        .attr('class', 'w-3 h-3 rounded-full mr-2')
        .style('background-color', (d: { name: string }) => color(d.name));
            
    legendItems.append('span')
        .text((d: { name: string; value: number }) => {
          const percentage = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
          return `${d.name}: ${d.value} (${percentage}%)`;
        });
  }
}