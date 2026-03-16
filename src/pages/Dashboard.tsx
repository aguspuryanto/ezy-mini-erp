import { useEffect, useState } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, ShoppingCart, Truck, Wallet } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    items: 0,
    purchases: 0,
    sales: 0,
    finance: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const itemsSnap = await getDocs(query(collection(db, 'items'), limit(100)));
        const poSnap = await getDocs(query(collection(db, 'purchase_orders'), limit(100)));
        const soSnap = await getDocs(query(collection(db, 'sales_orders'), limit(100)));
        const financeSnap = await getDocs(query(collection(db, 'finance_transactions'), limit(100)));

        setStats({
          items: itemsSnap.size,
          purchases: poSnap.size,
          sales: soSnap.size,
          finance: financeSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Items', value: stats.items, icon: Package, color: 'bg-blue-500' },
    { name: 'Purchase Orders', value: stats.purchases, icon: ShoppingCart, color: 'bg-green-500' },
    { name: 'Sales Orders', value: stats.sales, icon: Truck, color: 'bg-purple-500' },
    { name: 'Finance Transactions', value: stats.finance, icon: Wallet, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
