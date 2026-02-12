import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyResult, Survey } from '../models/survey.interface';

// FIX: Hardcoded Supabase credentials to resolve runtime error.
// The execution environment does not support `process.env` for these variables.
const supabaseUrl = 'https://qzradcsnjpuoyfdzvlgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cmFkY3NuanB1b3lmZHp2bGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzg1OTAsImV4cCI6MjA4NTg1NDU5MH0.xT7HjOgGoZCSbYSHKBOEX9PzvUZV3cMPCK8i-VDUR2c';


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
    const { data, error } = await this.supabase
      .from('surveys')
      .select('id, title, description, questions, type')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching all surveys from database:', error);
      return [];
    }

    const surveys: Survey[] = (data || []).map((s: any) => ({
      ...s,
      questions: Array.isArray(s.questions) ? s.questions : JSON.parse(s.questions || '[]')
    }));

    return surveys;
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