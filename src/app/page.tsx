import { Metadata } from 'next';

// Metadata for the admin dashboard
export const metadata: Metadata = {
  title: 'Admin Dashboard | Street Support',
  description: 'Administration dashboard for Street Support platform',
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back to your admin dashboard</p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
            { title: 'Active Services', value: '568', change: '+5%', trend: 'up' },
            { title: 'Pending Approvals', value: '23', change: '-2%', trend: 'down' },
            { title: 'Total Visits', value: '8,543', change: '+28%', trend: 'up' },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <span className={`ml-2 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      New service provider registered
                    </p>
                    <p className="text-sm text-gray-500">
                      {item} hour{item !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      className="font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
