import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { SurveyResult } from '../../core/models/survey.interface';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div>
        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex items-center">
            <div class="bg-blue-500/20 text-blue-600 dark:text-blue-300 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Evaluaciones</p>
                <p class="text-2xl font-bold">{{ allResults().length }}</p>
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
            <div class="px-6 py-4 border-b dark:border-gray-700">
                <h4 class="font-bold text-lg">Resultados Recientes</h4>
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
                    @if (allResults().length === 0) {
                        <tr><td colspan="5" class="text-center py-8 text-gray-500">No hay resultados aún.</td></tr>
                    }
                    @for (result of allResults(); track result.id) {
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
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  // FIX: Explicitly type injected service to resolve type inference issues.
  private supabaseService: SupabaseService = inject(SupabaseService);
  
  allResults = signal<SurveyResult[]>([]);

  averageScore = computed(() => {
    const results = this.allResults();
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.score, 0);
    return total / results.length;
  });
  maxScore = computed(() => Math.max(0, ...this.allResults().map(r => r.score)));
  minScore = computed(() => this.allResults().length > 0 ? Math.min(...this.allResults().map(r => r.score)) : 0);
  categoryDistribution = computed(() => {
    const counts = { 'Básico': 0, 'Intermedio': 0, 'Avanzado': 0 };
    for (const result of this.allResults()) {
        if (result.category in counts) {
            counts[result.category as keyof typeof counts]++;
        }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  });

  constructor() {
    effect(() => {
      // Redraw chart when data changes
      this.drawCategoryChart();
    });
  }

  async ngOnInit(): Promise<void> {
    const results = await this.supabaseService.getResults();
    this.allResults.set(results);
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

    // FIX: Provide a type to d3.pie to help with type inference.
    const pie = d3.pie<{ name: string; value: number }>().value(d => d.value).sort(null);
    const data_ready = pie(data);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    svg.selectAll('path')
       .data(data_ready)
       .join('path')
         .attr('d', arc as any)
         // FIX: Explicitly type `d` to resolve property access error.
         .attr('fill', (d: { data: { name: string } }) => color(d.data.name))
         .attr('stroke', 'white')
         .style('stroke-width', '2px');

    const legend = chartContainer.append('div')
        .attr('class', 'flex flex-col justify-center ml-6 text-gray-700 dark:text-gray-300');

    // FIX: Explicitly type `d` to resolve property access error.
    const total = d3.sum(data, (d: { value: number }) => d.value);

    const legendItems = legend.selectAll('div')
        .data(data)
        .join('div')
        .attr('class', 'flex items-center mb-2 text-sm');
        
    legendItems.append('div')
        .attr('class', 'w-3 h-3 rounded-full mr-2')
        // FIX: Explicitly type `d` to resolve property access error.
        .style('background-color', (d: { name: string }) => color(d.name));
            
    legendItems.append('span')
        // FIX: Explicitly type `d` to resolve property access errors.
        .text((d: { name: string; value: number }) => {
          const percentage = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
          return `${d.name}: ${d.value} (${percentage}%)`;
        });
  }
}
