import React, { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { Search, Pencil, PlusCircle, X, ChevronDown } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

type Customer = {
  id: number;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
};

type CustomerDropdownProps = {
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomer: Customer | null;
  onCreateCustomer?: (customer: Omit<Customer, 'id'>) => Promise<void>;
  onEditCustomer?: (customer: Customer) => void;
};

export default function CustomerDropdown({
  onSelectCustomer,
  selectedCustomer,
  onCreateCustomer,
  onEditCustomer,
}: CustomerDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    name: "",
    address: "",
    contact_person: "",
    phone: "",
    email: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/customers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch customers");

        const data = await res.json();
        setCustomers(data);
      } catch (err) {
        setError("Error loading customers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.address &&
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.contact_person &&
        customer.contact_person
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (customer.phone &&
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.email &&
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setError("Customer name is required");
      return;
    }

    setIsCreating(true);
    try {
      if (onCreateCustomer) {
        await onCreateCustomer(newCustomer);
        // Refresh customers after creation
        const token = localStorage.getItem("token");
        const res = await fetch("/api/customers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setCustomers(data);
      }
      setShowAddForm(false);
      setNewCustomer({
        name: "",
        address: "",
        contact_person: "",
        phone: "",
        email: "",
      });
    } catch (err) {
      setError("Failed to create customer");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Input
          value={selectedCustomer ? selectedCustomer.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onClick={() => setIsOpen(true)}
          placeholder="Search for a customer..."
          className="pr-10"
        />
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
      </div>

      {loading && (
        <p className="text-sm mt-2 text-muted-foreground">Loading customers...</p>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {isOpen && !loading && !error && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border max-h-[500px] overflow-auto">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {!showAddForm && filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <li
                    key={customer.id}
                    className="flex justify-between items-start p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectCustomer(customer);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      {customer.contact_person && (
                        <div className="text-sm text-muted-foreground">
                          {customer.contact_person}
                        </div>
                      )}
                      {customer.address && (
                        <div className="text-sm text-muted-foreground truncate">
                          {customer.address}
                        </div>
                      )}
                    </div>
                    {onEditCustomer && (
                      <button
                        className="ml-2 p-1 rounded hover:bg-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomer(customer);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </button>
                    )}
                  </li>
                ))
              ) : !showAddForm ? (
                <li className="p-4 text-center text-muted-foreground">
                  No customers found
                </li>
              ) : null}

              {showAddForm ? (
                <li className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Add New Customer</h3>
                    <button 
                      onClick={() => setShowAddForm(false)}
                      className="p-1 rounded-full hover:bg-secondary"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newCustomer.name}
                        onChange={(e) =>
                          setNewCustomer({ ...newCustomer, name: e.target.value })
                        }
                        placeholder="Customer name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={newCustomer.contact_person || ""}
                        onChange={(e) =>
                          setNewCustomer({ ...newCustomer, contact_person: e.target.value })
                        }
                        placeholder="Contact person name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newCustomer.address || ""}
                        onChange={(e) =>
                          setNewCustomer({ ...newCustomer, address: e.target.value })
                        }
                        placeholder="Full address"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newCustomer.phone || ""}
                        onChange={(e) =>
                          setNewCustomer({ ...newCustomer, phone: e.target.value })
                        }
                        placeholder="Phone number"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email || ""}
                        onChange={(e) =>
                          setNewCustomer({ ...newCustomer, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCustomer} disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Customer"}
                    </Button>
                  </div>
                </li>
              ) : (
                <li className="border-t border-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddForm(true);
                    }}
                    className="w-full flex items-center gap-2 p-3 text-primary hover:bg-accent transition-colors text-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add new customer</span>
                  </button>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setIsOpen(false);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}