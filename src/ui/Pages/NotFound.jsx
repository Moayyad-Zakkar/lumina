import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, the page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}
