import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyResult, Survey } from '../models/survey.interface';
import { generalSurvey, devSurvey, aiToolsSurvey } from '../data/surveys.data';

// FIX: Hardcoded Supabase credentials to resolve runtime error.
// The execution environment does not support `process.env` for these variables.
// Forzamos a TS a aceptar la propiedad 'env'
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_KEY;


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveResult(data: SurveyResult): Promise<null> {
    const { error } = await this.supabase.from('results').insert([data]);
    if (error) console.error('Error saving result:', error);
    return null;
  }

  async getResults(): Promise<SurveyResult[]> {
    const { data, error } = await this.supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    return error ? [] : (data as SurveyResult[]);
  }

  async getSurveys(): Promise<Survey[]> {
    const staticSurveys: Survey[] = [generalSurvey, devSurvey, aiToolsSurvey];
    
    // Solo seleccionamos encuestas donde is_active sea true
    const { data, error } = await this.supabase
      .from('surveys')
      .select('id, title, description, questions')
      .eq('is_active', true); // <--- Filtro crucial

    if (error) {
      console.error('Error fetching surveys:', error);
      return staticSurveys;
    }

    const customSurveys: Survey[] = (data || []).map((s: any) => ({
      ...s,
      type: 'custom' as const,
      questions: Array.isArray(s.questions) ? s.questions : JSON.parse(s.questions || '[]')
    }));

    return [...staticSurveys, ...customSurveys];
  }

  async saveSurvey(survey: Omit<Survey, 'id' | 'type'> & { type: 'custom' }): Promise<{ error: any }> {
    // Al crearla, nos aseguramos que nazca activa
    const { error } = await this.supabase.from('surveys').insert([{ ...survey, is_active: true }]);
    return { error };
  }

  async updateSurvey(surveyId: number, survey: any): Promise<{ error: any }> {
    const { error } = await this.supabase.from('surveys').update(survey).eq('id', surveyId);
    return { error };
  }

  async deactivateSurvey(surveyId: number): Promise<{ error: any }> {
    const { data, error } = await this.supabase
      .from('surveys')
      .update({ is_active: false })
      .eq('id', surveyId)
      .select();

    if (error) {
      return { error };
    }

    if (!data || data.length === 0) {
      return { error: { message: 'La operación no actualizó ninguna fila. Verifique los permisos RLS para UPDATE.' } };
    }

    return { error: null };
  }

  async getUserCompletionStatus(participantName: string): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from('results')
      .select('surveyTitle')
      .eq('participantName', participantName);

    const completed = new Set<string>();
    if (!error && data) {
      data.forEach(result => completed.add(result.surveyTitle));
    }
    return completed;
  }
}
