import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, Profile, SurveyResult } from '../../core/models/survey.interface';
import { SupabaseService } from '../../core/services/supabase.service';

const DEV_QUESTIONS: Question[] = [
    // Básico
    { text: "¿Qué es una red neuronal en el contexto de la IA?", options: ["Una red de computadoras físicas.", "Un modelo computacional inspirado en el cerebro.", "Un tipo de base de datos.", "Un algoritmo de ordenamiento."], correctAnswerIndex: 1, explanation: "Las redes neuronales artificiales son modelos de computación que imitan la estructura y función de las redes neuronales biológicas del cerebro para aprender de los datos." },
    { text: "¿Cuál es la librería de Python más común para Deep Learning?", options: ["NumPy", "Pandas", "TensorFlow/PyTorch", "Matplotlib"], correctAnswerIndex: 2, explanation: "TensorFlow y PyTorch son los dos frameworks dominantes y más utilizados para construir y entrenar modelos de Deep Learning." },
    { text: "¿Qué significa 'overfitting' en Machine Learning?", options: ["El modelo es demasiado simple.", "El modelo se ajusta demasiado a los datos de entrenamiento.", "El modelo no converge.", "Los datos de entrada son insuficientes."], correctAnswerIndex: 1, explanation: "El overfitting ocurre cuando un modelo aprende tan bien los datos de entrenamiento, incluyendo el ruido, que pierde su capacidad de generalizar a datos nuevos no vistos." },
    { text: "¿Qué es el 'aprendizaje por refuerzo'?", options: ["Aprender de datos etiquetados.", "Aprender sin datos etiquetados.", "Aprender mediante prueba y error con recompensas.", "Aprender de un experto humano."], correctAnswerIndex: 2, explanation: "Es un área del Machine Learning donde un agente aprende a tomar decisiones secuenciales en un entorno para maximizar una recompensa acumulada." },
    { text: "En un modelo de clasificación, ¿qué métrica mide la proporción de positivos verdaderos?", options: ["Accuracy", "Precision", "Recall", "F1-Score"], correctAnswerIndex: 2, explanation: "Recall (o Sensibilidad) mide cuántos de los positivos reales fueron identificados correctamente por el modelo. Es crucial cuando no se quiere pasar por alto ningún positivo." },
    { text: "¿Qué es un 'hiperparámetro' en un modelo de IA?", options: ["Un peso de la red neuronal.", "Una variable de salida del modelo.", "Una configuración externa del modelo.", "Un dato de entrada."], correctAnswerIndex: 2, explanation: "Los hiperparámetros son configuraciones que no se aprenden de los datos, sino que se establecen antes del entrenamiento, como la tasa de aprendizaje o el número de capas." },
    { text: "¿Para qué se utiliza principalmente el algoritmo 'K-Means'?", options: ["Clasificación", "Regresión", "Clustering", "Reducción de dimensionalidad"], correctAnswerIndex: 2, explanation: "K-Means es un algoritmo de aprendizaje no supervisado que agrupa datos en 'K' clústeres distintos basados en su similitud." },
    { text: "Git es una herramienta para:", options: ["Bases de datos", "Control de versiones", "Diseño de UI", "Despliegue de servidores"], correctAnswerIndex: 1, explanation: "Git es el sistema de control de versiones distribuido más popular, esencial para el desarrollo de software colaborativo y el seguimiento de cambios en el código." },
    // Medio
    { text: "¿Cuál es la principal diferencia entre 'Deep Learning' y 'Machine Learning'?", options: ["No hay diferencia.", "DL usa redes neuronales con múltiples capas.", "ML es solo para regresión.", "DL no necesita datos."], correctAnswerIndex: 1, explanation: "Deep Learning es un subcampo del Machine Learning que utiliza redes neuronales profundas (con muchas capas) para aprender representaciones complejas de los datos." },
    { text: "¿Qué es la 'propagación hacia atrás' (backpropagation)?", options: ["Un método para entrenar redes neuronales.", "Una técnica de preprocesamiento de datos.", "Un tipo de red neuronal.", "Un método para visualizar datos."], correctAnswerIndex: 0, explanation: "Backpropagation es el algoritmo clave que permite entrenar redes neuronales, calculando el gradiente de la función de pérdida y ajustando los pesos de la red." },
    { text: "¿Qué son los 'transformadores' (Transformers) en PNL?", options: ["Un tipo de base de datos de texto.", "Una arquitectura de red neuronal para secuencias.", "Algoritmos de compresión de texto.", "Un software de traducción."], correctAnswerIndex: 1, explanation: "La arquitectura Transformer, basada en mecanismos de atención, revolucionó el Procesamiento del Lenguaje Natural y es la base de modelos como GPT." },
    { text: "En el contexto de LLMs, ¿qué significa 'prompt engineering'?", options: ["Diseñar la arquitectura del modelo.", "Escribir código para el LLM.", "Diseñar entradas de texto para guiar al modelo.", "Optimizar el hardware para el LLM."], correctAnswerIndex: 2, explanation: "Es el arte y la ciencia de crear entradas (prompts) efectivas para que un modelo de lenguaje generativo produzca la salida deseada." },
    { text: "¿Qué es una 'Función de Activación' como ReLU?", options: ["Define la salida de un nodo dado un conjunto de entradas.", "Inicia el proceso de entrenamiento.", "Calcula la pérdida del modelo.", "Selecciona las mejores características."], correctAnswerIndex: 0, explanation: "Las funciones de activación introducen no linealidades en la red, permitiendo que aprenda patrones complejos. ReLU (Rectified Linear Unit) es una de las más populares." },
    { text: "Docker se utiliza para:", options: ["Escribir código más rápido.", "Contenerizar aplicaciones y sus dependencias.", "Monitorear el rendimiento de la red.", "Diseñar interfaces de usuario."], correctAnswerIndex: 1, explanation: "Docker permite empaquetar una aplicación con todas sus dependencias en un 'contenedor', asegurando que se ejecute de manera consistente en cualquier entorno." },
    { text: "¿Qué es MLOps?", options: ["Una nueva librería de Machine Learning.", "Un conjunto de prácticas para desplegar y mantener modelos de ML.", "Un algoritmo de optimización.", "El hardware para Machine Learning."], correctAnswerIndex: 1, explanation: "MLOps (Machine Learning Operations) combina ML, DevOps y Data Engineering para automatizar y estandarizar el ciclo de vida de los modelos de ML." },
    { text: "¿Qué hace la regularización (ej. L1/L2) en un modelo?", options: ["Aumenta la complejidad del modelo.", "Previene el overfitting penalizando los pesos grandes.", "Acelera el tiempo de entrenamiento.", "Normaliza los datos de entrada."], correctAnswerIndex: 1, explanation: "La regularización añade una penalización a la función de pérdida para evitar que los pesos del modelo crezcan demasiado, lo que ayuda a prevenir el sobreajuste." },
    // Avanzado
    { text: "Describe la arquitectura de una Red Generativa Antagónica (GAN).", options: ["Un solo modelo que genera datos.", "Un codificador y un decodificador.", "Un generador y un discriminador que compiten.", "Una red recurrente con memoria a largo plazo."], correctAnswerIndex: 2, explanation: "Una GAN consta de dos redes: un Generador que crea datos falsos y un Discriminador que intenta distinguir los datos falsos de los reales, compitiendo entre sí para mejorar." },
    { text: "En PNL, ¿qué problema resuelve el mecanismo de 'atención'?", options: ["Traducir texto a diferentes idiomas.", "Manejar dependencias de largo alcance en secuencias.", "Corregir errores gramaticales.", "Clasificar el sentimiento del texto."], correctAnswerIndex: 1, explanation: "El mecanismo de atención permite a un modelo ponderar la importancia de diferentes palabras en la secuencia de entrada, mejorando el manejo de relaciones a larga distancia." },
    { text: "¿Qué es el 'aprendizaje federado'?", options: ["Entrenar un modelo en la nube.", "Entrenar un modelo en múltiples dispositivos descentralizados.", "Un tipo de aprendizaje por refuerzo.", "Un framework de código abierto."], correctAnswerIndex: 1, explanation: "Es una técnica de entrenamiento que preserva la privacidad, donde el modelo se entrena localmente en los datos del usuario sin que estos salgan del dispositivo." },
    { text: "¿Cuál es el propósito del 'fine-tuning' en un modelo pre-entrenado?", options: ["Re-entrenar el modelo desde cero.", "Adaptar el modelo a una tarea específica.", "Reducir el tamaño del modelo.", "Aumentar su velocidad de inferencia."], correctAnswerIndex: 1, explanation: "El fine-tuning toma un modelo grande pre-entrenado en datos masivos y lo ajusta con un conjunto de datos más pequeño y específico para una tarea particular." },
    { text: "¿Qué es 'Quantization' en la optimización de modelos?", options: ["Aumentar la precisión del modelo.", "Reducir la precisión de los números para reducir el tamaño.", "Dividir el modelo en partes más pequeñas.", "Entrenar el modelo con más datos."], correctAnswerIndex: 1, explanation: "La cuantización reduce la precisión numérica de los pesos del modelo (ej. de 32 bits a 8 bits), lo que disminuye su tamaño y acelera la inferencia con una mínima pérdida de precisión." },
    { text: "Compara el 'gradient boosting' con los 'random forests'.", options: ["Son idénticos.", "Boosting construye árboles secuencialmente, RF en paralelo.", "RF es para regresión, Boosting para clasificación.", "Boosting no usa árboles de decisión."], correctAnswerIndex: 1, explanation: "Random Forest construye muchos árboles de decisión independientes. Gradient Boosting los construye de forma secuencial, donde cada nuevo árbol corrige los errores del anterior." },
    { text: "¿Qué es un 'Vector Database' y para qué se usa en IA?", options: ["Base de datos para imágenes.", "Almacena y busca datos como vectores de alta dimensión.", "Una base de datos SQL optimizada.", "Una base de datos para texto plano."], correctAnswerIndex: 1, explanation: "Estas bases de datos están optimizadas para buscar y recuperar 'embeddings' (vectores numéricos) por similitud, lo cual es clave para la búsqueda semántica y los LLMs." },
    { text: "¿Cuál es el papel de la entropía cruzada como función de pérdida?", options: ["Mide la distancia entre dos puntos.", "Mide el error en problemas de regresión.", "Mide el rendimiento de un modelo de clasificación.", "Mide la complejidad de los datos."], correctAnswerIndex: 2, explanation: "La entropía cruzada es la función de pérdida estándar para tareas de clasificación, ya que mide la diferencia entre la distribución de probabilidad predicha y la real." },
    { text: "¿Qué son los 'modelos de difusión' (diffusion models)?", options: ["Modelos para predecir el clima.", "Modelos generativos que aprenden a revertir un proceso de ruido.", "Modelos para detectar anomalías en redes.", "Un tipo de modelo de regresión lineal."], correctAnswerIndex: 1, explanation: "Son modelos generativos de última generación (usados en DALL-E 2, Midjourney) que crean imágenes de alta calidad añadiendo y luego eliminando ruido de una imagen." },
];

const GENERAL_QUESTIONS: Question[] = [
    { text: "¿Utilizas actualmente alguna herramienta de IA en tu flujo diario?", options: ["Nunca", "Ocasionalmente", "Diariamente"], correctAnswerIndex: -1, explanation: "Sugerencia: Independientemente de tu respuesta, el objetivo es moverte hacia el uso diario. La IA no reemplaza humanos, pero los humanos que usan IA sí reemplazarán a los que no." },
    { text: "¿Qué es un 'Prompt' en IA?", options: ["Un virus", "La instrucción de texto que le das a la IA", "Un cable"], correctAnswerIndex: 1, explanation: "El prompt es el puente de comunicación; saber redactarlos bien es la habilidad más demandada hoy." },
    { text: "¿Cuál es el fin de la IA generativa en el trabajo?", options: ["Reemplazar al humano", "Aumentar productividad y creatividad", "Borrar archivos"], correctAnswerIndex: 1, explanation: "La IA actúa como un copiloto que potencia las capacidades humanas, permitiéndote enfocarte en tareas de alto valor." },
    { text: "¿Qué es una 'Alucinación' en IA?", options: ["Información falsa con apariencia real", "Cuando la pantalla parpadea", "Un error de conexión"], correctAnswerIndex: 0, explanation: "Ocurre cuando el modelo predice palabras lógicas pero no reales. Siempre verifica los datos críticos." },
    { text: "¿Cómo debe ser un prompt efectivo?", options: ["Muy corto", "Específico y con contexto", "En mayúsculas"], correctAnswerIndex: 1, explanation: "A mayor contexto, menor es la probabilidad de alucinaciones o respuestas genéricas." },
    { text: "¿Qué herramienta es un chat conversacional generalista?", options: ["Midjourney", "ChatGPT", "Firefly"], correctAnswerIndex: 1, explanation: "ChatGPT es un LLM diseñado para mantener diálogos y realizar múltiples tareas de texto." },
    { text: "¿Es seguro subir datos confidenciales a IAs públicas?", options: ["Sí", "No, los datos entrenan futuros modelos", "Solo de noche"], correctAnswerIndex: 1, explanation: "Las versiones gratuitas usan tus inputs para entrenarse. Usa versiones Enterprise para datos sensibles." },
    { text: "¿Qué significa que sea 'Multimodal'?", options: ["Que procesa texto, imagen y audio", "Que funciona en muchos países", "Que tiene varios nombres"], correctAnswerIndex: 0, explanation: "Significa que puedes 'hablarle', enviarle fotos o pedirle que analice audios en una sola sesión." },
    { text: "¿Qué tarea es común para una IA de texto?", options: ["Arreglar el hardware", "Resumir documentos largos", "Cocinar"], correctAnswerIndex: 1, explanation: "La síntesis y extracción de información ahorra horas de lectura manual." },
    { text: "¿Qué es la Ventana de Contexto (Context Window)?", options: ["Brillo del monitor", "Cantidad de info que la IA recuerda en una sesión", "Tamaño de pantalla"], correctAnswerIndex: 1, explanation: "Es la 'memoria a corto plazo'. Si el chat es muy largo, la IA empezará a olvidar las primeras instrucciones." },
    { text: "¿Qué herramienta destaca en generación de imágenes pro?", options: ["Midjourney", "Copilot", "Google Sheets"], correctAnswerIndex: 0, explanation: "Midjourney es el estándar para generar visuales realistas y creativos para marketing o diseño." },
    { text: "¿Estándar para asistencia en escritura de código?", options: ["Jasper", "GitHub Copilot", "Canva"], correctAnswerIndex: 1, explanation: "Copilot ayuda a programadores sugiriendo bloques de código, acelerando el desarrollo hasta en un 50%." },
    { text: "¿Qué es un 'Token' en IA?", options: ["Moneda", "Unidad básica de procesamiento de texto", "Cable"], correctAnswerIndex: 1, explanation: "La IA no lee letras, sino trozos de palabras. Es la forma en que calculan el costo y límite de uso." },
    { text: "Diferencia entre ChatGPT y Google:", options: ["Google es más rápido", "ChatGPT genera contenido nuevo; Google indexa lo existente", "No hay"], correctAnswerIndex: 1, explanation: "Google te da una lista de links; ChatGPT te da una respuesta sintetizada y original." },
    { text: "¿Qué es 'Zero-shot prompting'?", options: ["Pedir sin dar ejemplos", "Apagar la IA", "Dar 100 ejemplos"], correctAnswerIndex: 0, explanation: "Es cuando la IA resuelve una tarea nueva sin que le hayas dado ejemplos previos de cómo hacerlo." },
    { text: "Mejor técnica para un informe técnico:", options: ["'Hazlo bien'", "'Actúa como experto y mejora este texto...'", "'Escribe algo'"], correctAnswerIndex: 1, explanation: "Asignar un rol ('Persona Prompting') mejora el tono y la precisión técnica del resultado." },
    { text: "¿Qué es el 'Deepfake'?", options: ["Base de datos", "Multimedia manipulado para suplantar identidades", "Buscador"], correctAnswerIndex: 1, explanation: "Es una técnica de suplantación de identidad que usa IA; es vital conocerlo para evitar fraudes corporativos." },
    { text: "¿Qué es RAG (Retrieval-Augmented Generation)?", options: ["Generar música", "Consultar documentos externos antes de responder", "Protocolo wifi"], correctAnswerIndex: 1, explanation: "Es la forma en que conectas una IA a los archivos privados de tu empresa sin que la IA se entrene con ellos." },
    { text: "¿Qué es un 'Agente de IA'?", options: ["Humano de soporte", "Sistema que ejecuta pasos de forma autónoma", "Un bot simple"], correctAnswerIndex: 1, explanation: "Un agente no solo charla; puede buscar en internet, usar la calculadora y enviar correos para cumplir un objetivo." },
    { text: "¿Qué es 'Fine-tuning'?", options: ["Comprar RAM", "Entrenar un modelo existente con datos específicos", "Cambiar colores"], correctAnswerIndex: 1, explanation: "Es como enviar a la IA a la universidad para que se especialice en un tema muy específico de tu empresa." },
    { text: "¿Qué significa LLM?", options: ["Low Level Machine", "Large Language Model", "Logic Method"], correctAnswerIndex: 1, explanation: "Modelos de Lenguaje Extensos; la base tecnológica detrás de herramientas como Claude, GPT o Gemini." },
    { text: "¿Diferencia del procesamiento 'Transformer'?", options: ["Procesa toda la secuencia a la vez usando 'atención'", "Es más lento", "Solo traduce"], correctAnswerIndex: 0, explanation: "Es la arquitectura que revolucionó la IA, permitiendo entender el contexto global de una frase al mismo tiempo." },
    { text: "¿Qué es el 'Bias' (Sesgo) en IA?", options: ["Error de red", "Prejuicios de los datos de entrenamiento", "Velocidad"], correctAnswerIndex: 1, explanation: "La IA puede replicar prejuicios humanos si sus datos de entrenamiento no son diversos." },
    { text: "¿Qué es 'Chain of Thought'?", options: ["Red social", "Pedir a la IA que explique su razonamiento paso a paso", "Monitor"], correctAnswerIndex: 1, explanation: "Hacer que la IA 'piense' antes de responder reduce errores en tareas matemáticas y lógicas." },
    { text: "¿Qué es la 'Singularidad'?", options: ["Fin de internet", "Punto donde la IA supera la inteligencia humana", "IA lenta"], correctAnswerIndex: 1, explanation: "Un concepto teórico sobre el momento en que la IA podría mejorar su propia inteligencia de forma autónoma." }
];


@Component({
  selector: 'app-survey',
  imports: [CommonModule],
  template: `
    @if (!isFinished()) {
      <div class="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
        @if (currentQuestion(); as question) {
          <div class="mb-6">
            <div class="flex justify-between items-baseline">
              <p class="text-sm font-semibold text-siroe-maroon">Pregunta {{ currentQuestionIndex() + 1 }} de 25</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Progreso: {{ progress() }}%</p>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div class="bg-siroe-maroon h-2.5 rounded-full" [style.width.%]="progress()"></div>
            </div>
          </div>
          <h3 class="text-2xl font-semibold mb-6">{{ question.text }}</h3>
          <div class="space-y-4">
            @for (option of question.options; track option; let i = $index) {
              <button (click)="selectAnswer(i)" 
                [disabled]="questionFeedback() !== null"
                class="w-full text-left p-4 border dark:border-gray-700 rounded-lg transition-colors disabled:cursor-default"
                [class.hover:bg-gray-100]="questionFeedback() === null"
                [class.dark:hover:bg-gray-800]="questionFeedback() === null"
                [class.bg-siroe-maroon/10]="selectedAnswer() === i && questionFeedback() === null"
                [class.border-siroe-maroon]="selectedAnswer() === i && questionFeedback() === null"
                [class.border-green-500]="questionFeedback()?.correctAnswerIndex === i"
                [class.bg-green-500/10]="questionFeedback()?.correctAnswerIndex === i"
                [class.dark:border-green-500]="questionFeedback()?.correctAnswerIndex === i"
                [class.dark:bg-green-900/30]="questionFeedback()?.correctAnswerIndex === i"
                [class.border-red-500]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.bg-red-500/10]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.dark:border-red-500]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                [class.dark:bg-red-900/30]="questionFeedback() && !questionFeedback()?.correct && selectedAnswer() === i"
                >
                <span class="font-mono text-siroe-maroon mr-3">{{ 'ABCD'[i] }}.</span> {{ option }}
              </button>
            }
          </div>

          @if(questionFeedback(); as feedback) {
            <div class="mt-6 p-4 rounded-lg fade-in" 
                  [class.bg-green-50]="feedback.correct" 
                  [class.dark:bg-green-900/30]="feedback.correct"
                  [class.border-green-200]="feedback.correct" 
                  [class.dark:border-green-700]="feedback.correct"
                  [class.bg-red-50]="!feedback.correct && !feedback.isDiagnostic" 
                  [class.dark:bg-red-900/30]="!feedback.correct && !feedback.isDiagnostic"
                  [class.border-red-200]="!feedback.correct && !feedback.isDiagnostic"
                  [class.dark:border-red-700]="!feedback.correct && !feedback.isDiagnostic"
                  >
              <h4 class="font-bold text-lg" 
                  [class.text-green-800]="feedback.correct" 
                  [class.dark:text-green-300]="feedback.correct"
                  [class.text-red-800]="!feedback.correct && !feedback.isDiagnostic"
                  [class.dark:text-red-300]="!feedback.correct && !feedback.isDiagnostic"
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
              @if(!questionFeedback()) {
                <button (click)="submitAnswer()" [disabled]="selectedAnswer() === null" 
                class="px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                  Revisar Respuesta
                </button>
              } @else {
                <button (click)="proceedToNextQuestion()"
                class="px-8 py-3 bg-siroe-maroon text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all">
                  {{ currentQuestionIndex() < 24 ? 'Siguiente Pregunta' : 'Finalizar Evaluación' }}
                </button>
              }
          </div>
        }
      </div>
    } @else {
      <div class="max-w-3xl mx-auto text-center">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg mb-8">
              <h3 class="text-4xl font-bold text-siroe-maroon mb-2">¡Evaluación Completada!</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Estos son tus resultados.</p>
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
                @for(course of feedback.courses; track course) {
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
  profile = input.required<Profile>();
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

  currentQuestions = computed(() => {
    return this.profile() === 'dev' ? DEV_QUESTIONS : GENERAL_QUESTIONS;
  });

  currentQuestion = computed(() => this.currentQuestions()[this.currentQuestionIndex()]);

  progress = computed(() => ((this.currentQuestionIndex() + 1) / this.currentQuestions().length) * 100);
  
  maxPossibleScore = computed(() => {
    if (this.profile() === 'dev') {
      return 102; // 8*2 + 8*4 + 9*6
    } else {
      return 96; // 8*2 + 8*4 + 8*6 (diagnostic question doesn't count)
    }
  });

  feedbackData = computed(() => {
    const category = this.finalCategory();
    const type = this.profile();

    if (!category || !type) return null;

    if (type === 'dev') {
        if (category === 'Básico') return { description: 'Este resultado indica una comprensión inicial de los conceptos clave de la IA y el desarrollo. Es un excelente punto de partida para construir una base técnica sólida.', courses: ['Fundamentos de Python', 'Curso de Git y GitHub'] };
        if (category === 'Intermedio') return { description: 'Demuestras un sólido conocimiento de los fundamentos y has comenzado a explorar temas más complejos. Ahora es el momento ideal para profundizar en la aplicación práctica y las herramientas especializadas.', courses: ['Introducción a Machine Learning', 'Curso de Docker'] };
        return { description: '¡Felicidades! Tienes un dominio avanzado de los conceptos técnicos de IA. Tu siguiente paso es explorar la vanguardia de la especialización, la optimización y el despliegue de modelos a gran escala.', courses: ['Deep Learning con Pytorch', 'Curso de MLOps: Despliegue de Modelos'] };
    } else { // General
        if (category === 'Básico') return { description: 'Posees una conciencia general de qué es la IA y cómo se manifiesta en la vida cotidiana. Este es el primer paso crucial para entender el impacto de esta tecnología.', courses: ['IA para la Productividad', 'Fundamentos de la Inteligencia Artificial'] };
        if (category === 'Intermedio') return { description: 'Comprendes bien los conceptos, las aplicaciones y las implicaciones de la IA. Estás listo para analizar críticamente su rol en la sociedad y en los negocios.', courses: ['Ética y Regulación de la IA', 'Introducción a la Ciencia de Datos'] };
        return { description: 'Excelente. Tienes una comprensión profunda y matizada de la IA, incluyendo sus capacidades generativas y desafíos estratégicos. Ahora puedes liderar conversaciones sobre la implementación y el futuro de la IA.', courses: ['Estrategias de Negocio con IA', 'Curso de IA Generativa para Líderes'] };
    }
  });

  selectAnswer(index: number) {
    if (this.questionFeedback() === null) {
      this.selectedAnswer.set(index);
    }
  }

  submitAnswer() {
    if (this.selectedAnswer() === null) return;
    
    const currentQ = this.currentQuestion()!;
    
    if (currentQ.correctAnswerIndex === -1) {
        this.questionFeedback.set({
            isDiagnostic: true,
            correct: true, // Use true for positive styling
            correctAnswerIndex: -1,
            explanation: currentQ.explanation
        });
    } else {
        const isCorrect = this.selectedAnswer() === currentQ.correctAnswerIndex;
        this.questionFeedback.set({
            correct: isCorrect,
            correctAnswerIndex: currentQ.correctAnswerIndex,
            explanation: currentQ.explanation
        });
    }
    
    this.answers.update(a => [...a, this.selectedAnswer()!]);
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
    await this.saveResult();
    this.isFinished.set(true);
  }

  onFinish() {
    this.surveyCompleted.emit();
  }

  calculateScore() {
    const userAnswers = this.answers();
    let totalScore = 0;
    const questions = this.currentQuestions();
    const profile = this.profile();

    if (profile === 'dev') {
      userAnswers.forEach((answerIndex, questionIndex) => {
        if (answerIndex === questions[questionIndex].correctAnswerIndex) {
          if (questionIndex < 8) totalScore += 2;      // Basic
          else if (questionIndex < 16) totalScore += 4; // Intermediate
          else totalScore += 6;                         // Advanced
        }
      });
    } else { // 'general' profile
      userAnswers.forEach((answerIndex, questionIndex) => {
        // Skip diagnostic question at index 0
        if (questionIndex > 0 && answerIndex === questions[questionIndex].correctAnswerIndex) {
          if (questionIndex <= 8) totalScore += 2;        // Basic (indices 1-8)
          else if (questionIndex <= 16) totalScore += 4;  // Intermediate (indices 9-16)
          else totalScore += 6;                           // Advanced (indices 17-24)
        }
      });
    }

    this.finalScore.set(totalScore);

    if (totalScore > 75) this.finalCategory.set('Avanzado');
    else if (totalScore > 40) this.finalCategory.set('Intermedio');
    else this.finalCategory.set('Básico');
  }

  async saveResult() {
    if (this.finalScore() === null || this.finalCategory() === null) return;

    const result: SurveyResult = {
      participantName: this.participantName(),
      surveyTitle: this.profile() === 'dev' ? 'Developer' : 'General',
      score: this.finalScore()!,
      category: this.finalCategory()!,
    };
    await this.supabaseService.saveResult(result);
  }
}
