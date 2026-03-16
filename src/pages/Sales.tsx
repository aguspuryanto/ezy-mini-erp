import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react';

export default function Sales() {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  const initialFormState = {
    soNumber: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    items: [],
    totalAmount: 0
  };

  const [formData, setFormData] = useState<any>(initialFormState);

  useEffect(() => {
    // Fetch Sales Orders
    const unsubscribeSO = onSnapshot(collection(db, 'sales_orders'), (snapshot) => {
      const soData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending
      soData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSalesOrders(soData);
    });

    // Fetch Inventory Items for the dropdown
    const unsubscribeItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventoryItems(itemsData);
    });

    return () => {
      unsubscribeSO();
      unsubscribeItems();
    };
  }, []);

  const handleOpenModal = (order: any = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        soNumber: order.soNumber,
        customerName: order.customerName,
        date: order.date,
        status: order.status,
        items: order.items || [],
        totalAmount: order.totalAmount
      });
    } else {
      setEditingOrder(null);
      // Generate a simple SO number
      const newSoNumber = `SO-${new Date().getTime().toString().slice(-6)}`;
      setFormData({ ...initialFormState, soNumber: newSoNumber });
    }
    setIsModalOpen(true);
  };

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', itemName: '', quantity: 1, price: 0, total: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems,
      totalAmount: calculateTotal(newItems)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (field === 'itemId') {
      const selectedInvItem = inventoryItems.find(i => i.id === value);
      if (selectedInvItem) {
        item.itemId = selectedInvItem.id;
        item.itemName = selectedInvItem.name;
        item.price = selectedInvItem.price;
      }
    } else {
      item[field] = value;
    }

    // Recalculate total for this line item
    if (field === 'quantity' || field === 'price' || field === 'itemId') {
      item.total = item.quantity * item.price;
    }

    newItems[index] = item;
    setFormData({
      ...formData,
      items: newItems,
      totalAmount: calculateTotal(newItems)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert("Please add at least one item to the sales order.");
      return;
    }

    try {
      if (editingOrder) {
        await updateDoc(doc(db, 'sales_orders', editingOrder.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'sales_orders'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving sales order:", error);
      alert("Error saving sales order");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await deleteDoc(doc(db, 'sales_orders', id));
      } catch (error) {
        console.error("Error deleting sales order:", error);
        alert("Error deleting sales order");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Orders</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create SO
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.soNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${order.totalAmount?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(order)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {salesOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No sales orders found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingOrder ? 'Edit Sales Order' : 'Create Sales Order'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SO Number</label>
                  <input
                    type="text"
                    required
                    value={formData.soNumber}
                    onChange={e => setFormData({...formData, soNumber: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <select
                              required
                              value={item.itemId}
                              onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                            >
                              <option value="" disabled>Select an item</option>
                              {inventoryItems.map(invItem => (
                                <option key={invItem.id} value={invItem.id}>
                                  {invItem.sku} - {invItem.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="block w-full sm:text-sm p-2 text-gray-900 bg-gray-50 rounded-md border border-transparent">
                              ${item.total.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <MinusCircle className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                            No items added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-left text-lg font-bold text-indigo-600">
                          ${formData.totalAmount.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
