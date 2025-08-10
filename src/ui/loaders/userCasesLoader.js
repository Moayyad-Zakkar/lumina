// loaders/casesLoader.js
import supabase from '../../helper/supabaseClient';
import { capitalizeFirst } from '../../helper/formatText';
import { redirect } from 'react-router';

const CASES_PER_PAGE = 10;

export async function userCasesLoader({ request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search')?.trim() || '';

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect('/login');

  let baseQuery = supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (search.length >= 3) {
    baseQuery = baseQuery.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { count: totalCases, error: countError } = await baseQuery;
  if (countError) {
    return new Response(JSON.stringify({ error: countError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const from = (page - 1) * CASES_PER_PAGE;
  const to = from + CASES_PER_PAGE - 1;

  const { data: cases, error } = await baseQuery
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalized = (cases || []).map((c) => ({
    ...c,
    first_name: capitalizeFirst(c.first_name),
    last_name: capitalizeFirst(c.last_name),
  }));

  return new Response(
    JSON.stringify({
      cases: normalized,
      totalCases,
      page,
      search,
      CASES_PER_PAGE,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
