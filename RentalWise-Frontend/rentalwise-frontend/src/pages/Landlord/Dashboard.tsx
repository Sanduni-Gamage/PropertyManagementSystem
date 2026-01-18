export default function DashboardHome() {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to your Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold">Total Properties</h2>
            <p className="text-2xl mt-2 text-blue-600 font-bold">3</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold">Active Tenants</h2>
            <p className="text-2xl mt-2 text-blue-600 font-bold">5</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold">Rent Due</h2>
            <p className="text-2xl mt-2 text-red-500 font-bold">$2,300</p>
          </div>
        </div>
      </div>
    );
  }
  