import { useNavigate } from 'react-router';
import CaseStatusBadge from './CaseStatusBadge';
import { CaseCardBase } from './CaseCardBase';

const MobileDoctorCasesList = ({ cases }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 w-full">
      {cases.map((c) => (
        <button key={c.id} onClick={() => navigate(`/app/cases/${c.id}`)}>
          <CaseCardBase
            title={`${c.first_name} ${c.last_name}`}
            meta={new Date(c.created_at).toLocaleDateString()}
            right={<CaseStatusBadge status={c.status} />}
          />
        </button>
      ))}
    </div>
  );
};

export default MobileDoctorCasesList;
