import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyResult, Survey } from '../models/survey.interface';
import { generalSurvey, devSurvey, aiToolsSurvey } from '../data/surveys.data';

// For Netlify deployment, set these variables in your site's "Build & deploy" settings:
// - SUPABASE_URL: Your Supabase project URL.
// - SUPABASE_KEY: Your Supabase project anon key.
const supabaseUrl = 'https://qzradcsnjpuoyfdzvlgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cmFkY3NuanB1b3lmZHp2bGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzg1OTAsImV4cCI6MjA4NTg1NDU5MH0.xT7HjOgGoZCSbYSHKBOEX9PzvUZV3cMPCK8i-VDUR2c';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL and Key must be provided as environment variables. Please set SUPABASE_URL and SUPABASE_KEY in your Netlify deployment settings.");
    }
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
