import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Eye, Phone, MapPin, History } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/shared/ErrorComponents";
import { useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    address: "",
    lat: "",
    lng: "",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    { 
      accessorKey: "address", 
      header: "Address",
      cell: ({ row }) => {
        const address = row.getValue("address");
        return address ? (
          <div className="max-w-[300px] truncate" title={address}>
            {address}
          </div>
        ) : (
          <span className="text-muted-foreground">No address</span>
        );
      }
    },
    {
      accessorKey: "created_at",
      header: "Registered On",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString();
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEditClick(row.original)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row.original)}>
            Delete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm"><Eye className="h-4 w-4 mr-1" /> View </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleView("emergencies", row.original)}>
                <History className="h-4 w-4 mr-2" /> Emergencies
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/clients/admin'
      });
      setClients(data.data || []);
      setFilteredClients(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterClients = () => {
    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
    setFilteredClients(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      address: "",
      lat: "",
      lng: "",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setFormData({
      ...client,
      password: "" // Always reset password field when editing
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    clearFieldError(name);
  };
const parseLatLng = (data) => ({
  ...data,
  lat: data.lat ? parseFloat(data.lat) : undefined,
  lng: data.lng ? parseFloat(data.lng) : undefined,
});

  const handleAdd = async () => {
    try {
          const dataToSend = parseLatLng(formData);

      await request(
        {
          method: 'POST',
          url: '/clients/admin',
          data: dataToSend
        },
        {
          successMessage: 'Client added successfully',
          onSuccess: () => {
            fetchClients();
            setIsAddDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleEdit = async () => {
    try {
    const updatedData = parseLatLng({ ...formData });
    if (!updatedData.password) delete updatedData.password;

      await request(
        {
          method: 'PUT',
          url: `/clients/admin/${selectedClient.id}`,
          data: updatedData
        },
        {
          successMessage: 'Client updated successfully',
          onSuccess: () => {
            fetchClients();
            setIsEditDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleDelete = async () => {
    try {
      await request(
        {
          method: 'DELETE',
          url: `/clients/admin/${selectedClient.id}`
        },
        {
          successMessage: 'Client deleted successfully',
          onSuccess: () => {
            fetchClients();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleView = (type, client) => {
    switch (type) {
      case "emergencies":
        navigate(`/admin/emergencies?client=${client.id}`);
        break;
      default:
        break;
    }
  };

  // Create a reusable function for form field rendering
  const renderFormField = (label, name, type = "text", placeholder = "") => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          type={type}
          value={formData[name] || ""}
          onChange={handleInputChange}
          className={errorClass}
          placeholder={placeholder}
        />
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <Button onClick={handleAddClick}>Add Client</Button>
      </div>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search clients by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable 
        columns={columns} 
        data={filteredClients} 
        isLoading={isLoading} 
        noResultsMessage="No clients found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors(); // Clear errors when dialog closes
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name")}
            {renderFormField("Phone", "phone", "tel", "10-digit phone number")}
            {renderFormField("Password", "password", "password")}
            {renderFormField("Address", "address", "text", "Client's address")}
            <div className="grid grid-cols-2 gap-4">
              {renderFormField("Latitude", "lat", "text", "Optional")}
              {renderFormField("Longitude", "lng", "text", "Optional")}
            </div>
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) clearErrors(); // Clear errors when dialog closes
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name")}
            {renderFormField("Phone", "phone", "tel", "10-digit phone number")}
            {renderFormField("New Password (leave blank to keep current)", "password", "password")}
            {renderFormField("Address", "address", "text", "Client's address")}
            <div className="grid grid-cols-2 gap-4">
              {renderFormField("Latitude", "lat", "text", "Optional")}
              {renderFormField("Longitude", "lng", "text", "Optional")}
            </div>
          </form>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedClient?.name}?</p>
          <p className="text-sm text-muted-foreground">
            This will also delete all emergency records associated with this client.
          </p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 