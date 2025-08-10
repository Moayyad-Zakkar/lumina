import { Link } from 'react-router';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-4xl font-semibold text-red-600 mb-4">
        Access Denied
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        You don’t have permission to view this page.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}
