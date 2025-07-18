import { useState, useEffect } from 'react';
import supabase from '../../helper/supabaseClient';

const CasesList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        let query = supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        setCases(data);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">My Cases</h2>

      {cases.length === 0 ? (
        <div className="text-center text-gray-500">
          No cases submitted yet.
          <a
            href="/submit-case"
            className="text-indigo-600 hover:text-indigo-800 ml-2"
          >
            Submit a new case
          </a>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {caseItem.first_name} {caseItem.last_name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold 
                    ${
                      caseItem.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : caseItem.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : caseItem.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                >
                  {caseItem.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Material:</strong> {caseItem.aligner_material}
                </p>
                <p>
                  <strong>Submitted:</strong>{' '}
                  {new Date(caseItem.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4 flex space-x-2">
                {caseItem.upper_jaw_scan_url && (
                  <a
                    href={caseItem.upper_jaw_scan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Upper Jaw Scan
                  </a>
                )}
                {caseItem.lower_jaw_scan_url && (
                  <a
                    href={caseItem.lower_jaw_scan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Lower Jaw Scan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CasesList;
