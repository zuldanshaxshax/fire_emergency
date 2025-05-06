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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Eye, UserCog, ShieldAlert } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/shared/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("staff");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    role: "staff",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "role", header: "Role" },
    { 
      accessorKey: "active_status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.active_status;
        if (row.original.role === "staff") {
          return (
            <div className={`px-2 py-1 rounded text-xs font-medium inline-block
                ${status === "in_work" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" : 
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}>
              {status === "in_work" ? "Assigned" : "Available"}
            </div>
          );
        }
        return null;
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
          {row.original.role === "staff" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Eye className="h-4 w-4 mr-1" /> View </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleView("assignments", row.original)}>
                  Assignments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, activeTab]);

  const fetchUsers = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users'
      });
      setUsers(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterUsers = () => {
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      user.role === activeTab
    );
    setFilteredUsers(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      role: activeTab,
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      ...user,
      password: "" // Always reset password field when editing
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    clearFieldError(name);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleAdd = async () => {
    try {
      await request(
        {
          method: 'POST',
          url: '/users',
          data: formData
        },
        {
          successMessage: `${formData.role === 'admin' ? 'Admin' : 'Staff'} added successfully`,
          onSuccess: () => {
            fetchUsers();
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
      const updatedData = { ...formData };
      if (!updatedData.password) {
        delete updatedData.password; // Remove password if it's blank
      }

      await request(
        {
          method: 'PUT',
          url: `/users/${selectedUser.id}`,
          data: updatedData
        },
        {
          successMessage: `${updatedData.role === 'admin' ? 'Admin' : 'Staff'} updated successfully`,
          onSuccess: () => {
            fetchUsers();
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
          url: `/users/${selectedUser.id}`
        },
        {
          successMessage: `${selectedUser.role === 'admin' ? 'Admin' : 'Staff'} deleted successfully`,
          onSuccess: () => {
            fetchUsers();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleView = (type, user) => {
    switch (type) {
      case "assignments":
        navigate(`/assignments?staff=${user.id}`);
        break;
      default:
        break;
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchTerm(""); // Reset search when changing tabs
  };

  // Create a reusable function for form field rendering
  const renderFormField = (label, name, type = "text", options = null) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        {options ? (
          <Select
            value={formData[name]}
            onValueChange={(value) => handleSelectChange(name, value)}
          >
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className={errorClass}
            placeholder={type === "password" && name === "password" && isEditDialogOpen 
              ? "Enter new password or leave blank" 
              : ""}
          />
        )}
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <Button onClick={handleAddClick}>
          Add {activeTab === "admin" ? "Admin" : "Staff"}
        </Button>
      </div>

      <Tabs defaultValue="staff" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="staff" className="flex gap-2 items-center">
            <UserCog className="h-4 w-4" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex gap-2 items-center">
            <ShieldAlert className="h-4 w-4" />
            Administrators
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder={`Search ${activeTab === 'admin' ? 'admins' : 'staff'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <TabsContent value="staff">
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            isLoading={isLoading} 
            noResultsMessage="No staff members found"
          />
        </TabsContent>
        
        <TabsContent value="admin">
          <DataTable 
            columns={columns.filter(col => col.accessorKey !== "active_status")} 
            data={filteredUsers} 
            isLoading={isLoading} 
            noResultsMessage="No administrators found"
          />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors(); // Clear errors when dialog closes
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {formData.role === 'admin' ? 'Administrator' : 'Staff Member'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name")}
            {renderFormField("Phone", "phone", "tel")}
            {renderFormField("Role", "role", null, [
              { value: "staff", label: "Staff" },
              { value: "admin", label: "Administrator" }
            ])}
            {renderFormField("Password", "password", "password")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add"}
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
            <DialogTitle>Edit {formData.role === 'admin' ? 'Administrator' : 'Staff Member'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name")}
            {renderFormField("Phone", "phone", "tel")}
            {renderFormField("Role", "role", null, [
              { value: "staff", label: "Staff" },
              { value: "admin", label: "Administrator" }
            ])}
            {renderFormField("New Password (leave blank to keep current)", "password", "password")}
          </form>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedUser?.role === 'admin' ? 'Administrator' : 'Staff Member'}</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedUser?.name}?</p>
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