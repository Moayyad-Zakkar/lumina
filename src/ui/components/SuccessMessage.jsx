export default function SuccessMessage({ successMessage }) {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            {successMessage}
          </h3>
        </div>
      </div>
    </div>
  );
}
