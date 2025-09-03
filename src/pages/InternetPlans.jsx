import { useState, useEffect } from "react";
import { FaPlusCircle, FaTimes, FaSearch, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaWifi } from "react-icons/fa";

export default function InternetPlans() {
  const samplePlans = [
    { id: 1, name: "Basic Internet", price: 300, speed: "1 Mbps", duration: "1 month", data_limit: "500 GB", description: "Basic plan for light use", is_active: true },
    { id: 2, name: "Standard Internet", price: 500, speed: "2 Mbps", duration: "1 month", data_limit: "1 TB", description: "Good for small households", is_active: true },
    { id: 3, name: "Premium Internet", price: 1000, speed: "10 Mbps", duration: "1 month", data_limit: "Unlimited", description: "Heavy usage & streaming", is_active: true }
  ];

  const [plans, setPlans] = useState(() => JSON.parse(localStorage.getItem("internetPlans")) || samplePlans);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    speed: "",
    duration: "",
    data_limit: "",
    description: "",
  });

  useEffect(() => {
    localStorage.setItem("internetPlans", JSON.stringify(plans));
  }, [plans]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPlan = {
      id: editingPlanId || Date.now(),
      ...formData,
      price: parseFloat(formData.price),
      is_active: true,
    };
    if (editingPlanId) {
      setPlans(plans.map((p) => (p.id === editingPlanId ? newPlan : p)));
      setEditingPlanId(null);
    } else {
      setPlans([...plans, newPlan]);
    }
    setFormData({ name: "", price: "", speed: "", duration: "", data_limit: "", description: "" });
  };

  const handleEdit = (plan) => {
    setFormData(plan);
    setEditingPlanId(plan.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      setPlans(plans.filter((p) => p.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)));
  };

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Internet Plans Management</h1>
      <p className="text-gray-600 mb-6">Create and manage internet plans for your customers</p>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">{editingPlanId ? "Edit Plan" : "Create New Plan"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Plan Name" required className="border rounded p-2" />
          <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="Price (KES)" required className="border rounded p-2" />
          <input name="speed" value={formData.speed} onChange={handleChange} placeholder="Speed (e.g., 10Mbps)" required className="border rounded p-2" />
          <select name="duration" value={formData.duration} onChange={handleChange} required className="border rounded p-2">
            <option value="">Select duration</option>
            <option>1 hour</option>
            <option>1 day</option>
            <option>1 week</option>
            <option>1 month</option>
            <option>3 months</option>
            <option>6 months</option>
            <option>1 year</option>
          </select>
          <input name="data_limit" value={formData.data_limit} onChange={handleChange} placeholder="Data Limit (e.g., Unlimited)" required className="border rounded p-2" />
          <input name="description" value={formData.description} onChange={handleChange} placeholder="Short Description" className="border rounded p-2" />
          <div className="col-span-2 flex gap-3 mt-3">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <FaPlusCircle /> {editingPlanId ? "Update Plan" : "Create Plan"}
            </button>
            <button type="button" onClick={() => { setFormData({ name: "", price: "", speed: "", duration: "", data_limit: "", description: "" }); setEditingPlanId(null); }} className="bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2">
              <FaTimes /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* Search + Table */}
      <div className="bg-white shadow rounded-lg p-5">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h2 className="text-xl font-semibold">Existing Plans</h2>
          <div className="flex items-center border rounded px-3 py-2 bg-gray-50">
            <FaSearch className="text-gray-500" />
            <input type="text" placeholder="Search plans..." value={search} onChange={(e) => setSearch(e.target.value)} className="ml-2 bg-transparent outline-none" />
          </div>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FaWifi className="text-4xl mx-auto mb-2" />
            <p>No internet plans created yet</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Plan Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Speed</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Data Limit</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-gray-500">{plan.description}</div>
                  </td>
                  <td className="p-3">KES {plan.price.toFixed(2)}</td>
                  <td className="p-3">{plan.speed}</td>
                  <td className="p-3">{plan.duration}</td>
                  <td className="p-3">{plan.data_limit}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${plan.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(plan)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded"><FaEdit /></button>
                    <button onClick={() => handleDelete(plan.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded"><FaTrash /></button>
                    <button onClick={() => toggleStatus(plan.id)} className="bg-green-100 text-green-700 px-2 py-1 rounded">
                      {plan.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
