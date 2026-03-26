import { supabase } from '@/lib/supabase';

export interface IcaMunicipality {
  id: string;
  nombre: string;
  avisos_tableros_rate: number;
  bomberil_rate: number;
}

export interface IcaTarifa {
  codigo_ciiu: string;
  descripcion: string;
  tarifa_mil: number;
}

export const icaService = {
  async getMunicipios(): Promise<IcaMunicipality[]> {
    const { data, error } = await supabase
      .from('ica_municipios')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  async getTarifasByMunicipio(municipioId: string): Promise<IcaTarifa[]> {
    const { data, error } = await supabase
      .from('ica_tarifas')
      .select('codigo_ciiu, descripcion, tarifa_mil')
      .eq('municipio_id', municipioId);
    
    if (error) throw error;
    return data || [];
  }
};
