import supabase from '../../helper/supabaseClient';

export async function patientInstructionsLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // patientLayoutLoader (the parent route's loader) already guarantees a
  // signed-in patient before this ever runs, so `user` is expected here.
  const { data: link } = await supabase
    .from('case_patients')
    .select('case_id')
    .eq('patient_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!link) {
    return { caseId: null, instructions: null, progress: null };
  }

  const [{ data: instructions }, { data: progress }] = await Promise.all([
    supabase
      .from('treatment_instructions')
      .select('*')
      .eq('case_id', link.case_id)
      .maybeSingle(),
    supabase
      .from('patient_progress')
      .select('*')
      .eq('case_id', link.case_id)
      .maybeSingle(),
  ]);

  return {
    caseId: link.case_id,
    instructions: instructions || null,
    progress: progress || null,
  };
}
