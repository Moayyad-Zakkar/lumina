import supabase from '../../helper/supabaseClient';
import { capitalizeFirst } from '../../helper/formatText';

export async function userCaseLoader({ params }) {
  const { caseId } = params;

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (error) {
    console.error('Error loading case:', error);
    return { error: error.message, caseData: null };
  }

  const caseData = {
    ...data,
    first_name: capitalizeFirst(data.first_name),
    last_name: capitalizeFirst(data.last_name),
  };

  return { caseData };
}
