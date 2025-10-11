export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🚧 Maintenance in Progress</h1>
          <p className="text-gray-600">
            The banner management system is currently undergoing scheduled maintenance.
            We apologize for the inconvenience and appreciate your patience.
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            If you need immediate assistance, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
