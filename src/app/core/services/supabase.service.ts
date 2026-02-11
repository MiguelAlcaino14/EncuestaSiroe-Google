import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyResult } from '../models/survey.interface';

// In a real app, these would be in environment.ts
const environment = {
  supabaseUrl: 'https://qzradcsnjpuoyfdzvlgb.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cmFkY3NuanB1b3lmZHp2bGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzg1OTAsImV4cCI6MjA4NTg1NDU5MH0.xT7HjOgGoZCSbYSHKBOEX9PzvUZV3cMPCK8i-VDUR2c',
};

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async saveResult(data: SurveyResult): Promise<null> {
    const { error } = await this.supabase.from('results').insert([data]);
    if (error) {
      console.error('Error saving result to Supabase:', error);
    }
    return null;
  }

  async getResults(): Promise<SurveyResult[]> {
    const { data, error } = await this.supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching results from Supabase:', error);
      return [];
    }
    
    return data as SurveyResult[];
  }

  async getUserCompletionStatus(participantName: string): Promise<Set<'general' | 'dev'>> {
    const { data, error } = await this.supabase
      .from('results')
      .select('surveyTitle')
      .eq('participantName', participantName);

    const completed = new Set<'general' | 'dev'>();
    if (error) {
      console.error('Error fetching user completion status:', error);
      return completed;
    }

    if (data) {
      for (const result of data) {
        if (result.surveyTitle === 'General') {
          completed.add('general');
        } else if (result.surveyTitle === 'Developer') {
          completed.add('dev');
        }
      }
    }
    return completed;
  }
}
