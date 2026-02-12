import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Survey, SurveyResult, AnswerSummaryItem } from '../../core/models/survey.interface';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-survey',
  imports: [CommonModule],
  template: `
    @if (!isFinished()) {
      <div class="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
        @if (currentQuestion(); as question) {
          <div class="mb-6">
            <div class="flex justify-between items-baseline">
              <p class="text-sm font-semibold text-siroe-maroon">Pregunta {{ currentQuestionIndex() + 1 }} de {{ currentQuestions().length }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Progreso: {{ progress() | number:'1.0-0' }}%</p>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div class="bg-siroe-maroon h-2.5 rounded-full" [style.width.%]="progress()"></div>
            </div>
          </div>
          <h3 class="text-2xl font-semibold mb-6">{{ question.text }}</h3>
          <div class="space-y-4">
            @for (option of question.options; track $index; let i = $index) {
              <button (click)="selectAnswer(i)" 
                [disabled]="questionFeedback() !== null"
                class="w-full text-left p-4 border dark:border-gray-700 rounded-lg transition-colors disabled:cursor-default"
                [class.hover:bg-gray-100]="questionFeedback() === null"
                [class.dark:hover:bg-gray-800]="questionFeedback() === null"
                [class.border-green-500]="questionFeedback()?.correctAnswerIndex === i"
                [class.bg-green-500/10]="questionFeedback()?.correctAnswerIndex === i"
                [class.dark:border-green-500]="questionFeedback()?.correctAnswerIndex === i"
                [class.dark:bg-green-900/30]="questionFeedback()?.correctAnswerIndex === i"
                [class.border-red-500]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.bg-red-500/10]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.dark:border-red-500]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.dark:bg-red-900/30]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                >
                <span class="font-mono text-siroe-maroon mr-3">{{ 'ABCDE'[$index] }}.</span> {{ option }}
              </button>
            }
          </div>

          @if(questionFeedback(); as feedback) {
            <div class="mt-6 p-4 rounded-lg fade-in border-l-4" 
                  [class.bg-green-50]="feedback.correct && !feedback.isDiagnostic" 
                  [class.dark:bg-green-900/30]="feedback.correct && !feedback.isDiagnostic"
                  [class.border-green-500]="feedback.correct && !feedback.isDiagnostic" 
                  [class.bg-red-50]="!feedback.correct" 
                  [class.dark:bg-red-900/30]="!feedback.correct"
                  [class.border-red-500]="!feedback.correct"
                  [class.bg-blue-50]="feedback.isDiagnostic"
                  [class.dark:bg-blue-900/30]="feedback.isDiagnostic"
                  [class.border-blue-500]="feedback.isDiagnostic"
                  >
              <h4 class="font-bold text-lg" 
                  [class.text-green-800]="feedback.correct && !feedback.isDiagnostic" 
                  [class.dark:text-green-300]="feedback.correct && !feedback.isDiagnostic"
                  [class.text-red-800]="!feedback.correct"
                  [class.dark:text-red-300]="!feedback.correct"
                  [class.text-blue-800]="feedback.isDiagnostic"
                  [class.dark:text-blue-300]="feedback.isDiagnostic"
                  >
                @if (feedback.isDiagnostic) {
                    Sugerencia Profesional
                } @else {
                    {{ feedback.correct ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta' }}
                }
              </h4>
              <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">{{ feedback.explanation }}</p>
            </div>
          }

          <div class="mt-8 text-right">
              @if(questionFeedback()) {
                <button (click)="proceedToNextQuestion()"
                class="px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all">
                  {{ currentQuestionIndex() < currentQuestions().length - 1 ? 'Siguiente Pregunta' : 'Finalizar Evaluación' }}
                </button>
              } @else {
                <button class="px-8 py-3 bg-gray-400 text-white font-bold rounded-lg cursor-not-allowed" disabled>
                  Selecciona una opción
                </button>
              }
          </div>
        }
      </div>
    } @else {
      <div class="max-w-3xl mx-auto text-center">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg mb-8">
              <h3 class="text-4xl font-bold text-siroe-maroon mb-2">¡Evaluación Completada!</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Estos son tus resultados para la evaluación de <span class="font-semibold">{{ survey().title }}</span>.</p>
              <div class="flex justify-center items-center space-x-8">
                  <div>
                      <p class="text-lg text-gray-500 dark:text-gray-400">Tu Puntuación</p>
                      <p class="text-6xl font-bold text-gray-800 dark:text-white">{{ finalScore() }} <span class="text-2xl font-normal text-gray-500">/ {{ maxPossibleScore() }}</span></p>
                  </div>
                  <div class="w-px h-16 bg-gray-200 dark:bg-gray-700"></div>
                  <div>
                      <p class="text-lg text-gray-500 dark:text-gray-400">Nivel Obtenido</p>
                      <p class="text-4xl font-bold" [class.text-green-500]="finalCategory() === 'Avanzado'" [class.text-yellow-500]="finalCategory() === 'Intermedio'" [class.text-red-500]="finalCategory() === 'Básico'">{{ finalCategory() }}</p>
                  </div>
              </div>
          </div>
          
          @if(feedbackData(); as feedback) {
          <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-left">
              <h4 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Análisis de tu Resultado</h4>
              <p class="text-gray-600 dark:text-gray-400 mb-6">{{ feedback.description }}</p>
              
              <h5 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tus Siguientes Pasos en Platzi</h5>
              <p class="text-gray-600 dark:text-gray-400 mb-4">Basado en tu nivel, te recomendamos los siguientes cursos para seguir creciendo:</p>
              <ul class="space-y-2">
                @for(course of feedback.courses; track $index) {
                  <li class="flex items-center">
                    <svg class="h-6 w-6 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span class="font-semibold text-gray-700 dark:text-gray-300">{{ course }}</span>
                  </li>
                }
              </ul>
          </div>
          }

          <button (click)="onFinish()" class="mt-8 px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all">
            Volver al Inicio
          </button>
      </div>
    }
  `,
  styles: [`
    .fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurveyComponent {
  survey = input.required<Survey>();
  participantName = input.required<string>();

  surveyCompleted = output<void>();

  private supabaseService: SupabaseService = inject(SupabaseService);

  isFinished = signal(false);
  currentQuestionIndex = signal(0);
  answers = signal<number[]>([]);
  selectedAnswer = signal<number | null>(null);
  questionFeedback = signal<{ correct: boolean; correctAnswerIndex: number; explanation: string; isDiagnostic?: boolean; } | null>(null);

  finalScore = signal<number | null>(null);
  finalCategory = signal<string | null>(null);

  currentQuestions = computed(() => this.survey().questions);
  currentQuestion = computed(() => this.currentQuestions()[this.currentQuestionIndex()]);
  progress = computed(() => ((this.currentQuestionIndex() + 1) / this.currentQuestions().length) * 100);
  
  maxPossibleScore = computed(() => {
    return this.survey().questions.reduce((acc, q) => {
        if (q.answer === -1) return acc;
        switch(q.difficulty) {
            case 'Básico': return acc + 2;
            case 'Intermedio': return acc + 4;
            case 'Avanzado': return acc + 6;
            default: return acc;
        }
    }, 0);
  });

  feedbackData = computed(() => {
    const category = this.finalCategory();
    const type = this.survey().type;

    if (!category || !type) return null;

    if (type === 'dev') {
        if (category === 'Básico') return { description: 'Este resultado indica una comprensión inicial de los conceptos clave de la IA y el desarrollo. Es un excelente punto de partida para construir una base técnica sólida.', courses: ['Fundamentos de Python', 'Curso de Git y GitHub'] };
        if (category === 'Intermedio') return { description: 'Demuestras un sólido conocimiento de los fundamentos y has comenzado a explorar temas más complejos. Ahora es el momento ideal para profundizar en la aplicación práctica y las herramientas especializadas.', courses: ['Introducción a Machine Learning', 'Curso de Docker'] };
        return { description: '¡Felicidades! Tienes un dominio avanzado de los conceptos técnicos de IA. Tu siguiente paso es explorar la vanguardia de la especialización, la optimización y el despliegue de modelos a gran escala.', courses: ['Deep Learning con Pytorch', 'Curso de MLOps: Despliegue de Modelos'] };
    } else { // General or Tools or Custom
        if (category === 'Básico') return { description: 'Posees una conciencia general de qué es la IA y cómo se manifiesta en la vida cotidiana. Este es el primer paso crucial para entender el impacto de esta tecnología.', courses: ['IA para la Productividad', 'Fundamentos de la Inteligencia Artificial'] };
        if (category === 'Intermedio') return { description: 'Comprendes bien los conceptos, las aplicaciones y las implicaciones de la IA. Estás listo para analizar críticamente su rol en la sociedad y en los negocios.', courses: ['Ética y Regulación de la IA', 'Introducción a la Ciencia de Datos'] };
        return { description: 'Excelente. Tienes una comprensión profunda y matizada de la IA, incluyendo sus capacidades generativas y desafíos estratégicos. Ahora puedes liderar conversaciones sobre la implementación y el futuro de la IA.', courses: ['Estrategias de Negocio con IA', 'Curso de IA Generativa para Líderes'] };
    }
  });

  selectAnswer(index: number) {
    if (this.questionFeedback() !== null) return;

    this.selectedAnswer.set(index);
    const currentQ = this.currentQuestion()!;
    
    this.answers.update(a => [...a, this.selectedAnswer()!]);
    
    if (currentQ.answer === -1) {
        this.questionFeedback.set({
            isDiagnostic: true,
            correct: true, // Use true for positive styling
            correctAnswerIndex: -1,
            explanation: currentQ.explanation
        });
    } else {
        const isCorrect = this.selectedAnswer() === currentQ.answer;
        this.questionFeedback.set({
            correct: isCorrect,
            correctAnswerIndex: currentQ.answer,
            explanation: currentQ.explanation
        });
    }
  }

  proceedToNextQuestion() {
    this.questionFeedback.set(null);
    this.selectedAnswer.set(null);
  
    if (this.currentQuestionIndex() < this.currentQuestions().length - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    } else {
      this.finishSurvey();
    }
  }

  async finishSurvey() {
    this.calculateScore();
    const summary = this.generateAnswersSummary();
    await this.saveResult(summary);
    this.isFinished.set(true);
  }

  onFinish() {
    this.surveyCompleted.emit();
  }

  generateAnswersSummary(): AnswerSummaryItem[] {
    const summary: AnswerSummaryItem[] = [];
    const questions = this.currentQuestions();
    const userAnswers = this.answers();

    userAnswers.forEach((answerIndex, questionIndex) => {
        const question = questions[questionIndex];
        const selectedOption = question.options[answerIndex];
        const correctOption = question.answer !== -1 ? question.options[question.answer] : null;
        const isCorrect = question.answer !== -1 ? answerIndex === question.answer : true;

        summary.push({
            question: question.text,
            selectedOption: selectedOption,
            correctOption: correctOption,
            isCorrect: isCorrect
        });
    });
    return summary;
  }

  calculateScore() {
    const userAnswers = this.answers();
    let totalScore = 0;
    const questions = this.currentQuestions();

    userAnswers.forEach((answerIndex, questionIndex) => {
      const question = questions[questionIndex];
      if (question.answer !== -1 && answerIndex === question.answer) {
          switch(question.difficulty) {
            case 'Básico': totalScore += 2; break;
            case 'Intermedio': totalScore += 4; break;
            case 'Avanzado': totalScore += 6; break;
          }
      }
    });

    this.finalScore.set(totalScore);

    const maxScore = this.maxPossibleScore();
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    if (percentage > 75) this.finalCategory.set('Avanzado');
    else if (percentage > 40) this.finalCategory.set('Intermedio');
    else this.finalCategory.set('Básico');
  }

  async saveResult(summary: AnswerSummaryItem[]) {
    if (this.finalScore() === null || this.finalCategory() === null) return;

    const result: SurveyResult = {
      participantName: this.participantName(),
      surveyTitle: this.survey().title,
      score: this.finalScore()!,
      category: this.finalCategory()!,
      answers_summary: summary
    };
    await this.supabaseService.saveResult(result);
  }
}