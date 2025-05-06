import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/shared/ErrorComponents";
import { useFormValidation } from "@/utils/errorHandling";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useSocket } from "@/contexts/SocketContext";
import { AlertCircle, AlertTriangle, AlertOctagon, CheckCircle, XCircle, Eye, Wifi, WifiOff, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const EmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [filteredEmergencies, setFilteredEmergencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { isConnected, subscribeToEvent } = useSocket();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    client_id: "",
    level: "medium",
    description: "",
    lat: "",
    lng: "",
    address: "",
  });

  // Extract client_id from query params if present
  const queryParams = new URLSearchParams(location.search);
  const clientIdFilter = queryParams.get("client");

  const columns = [
    { 
      accessorKey: "id", 
      header: "ID",
      cell: ({ row }) => {
        return <span>#{row.getValue("id")}</span>;
      }
    },
    { 
      accessorKey: "level", 
      header: "Level",
      cell: ({ row }) => {
        const level = row.getValue("level");
        return getLevelBadge(level);
      }
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return getStatusBadge(status);
      }
    },
    { 
      accessorKey: "Client.name", 
      header: "Reported By",
      cell: ({ row }) => {
        const client = row.original.Client;
        return client ? client.name : "Unknown";
      }
    },
    { 
      accessorKey: "Assignments", 
      header: "Assigned Staff",
      cell: ({ row }) => {
        const assignments = row.original.Assignments;
        if (assignments && assignments.length > 0 && assignments[0]?.User) {
          return assignments[0].User.name;
        }
        return <span className="text-muted-foreground text-sm">Not assigned</span>;
      }
    },
    { 
      accessorKey: "address", 
      header: "Location",
      cell: ({ row }) => {
        const address = row.getValue("address");
        return address ? (
          <div className="max-w-[250px] truncate" title={address}>
            {address}
          </div>
        ) : (
          <span className="text-muted-foreground">No address</span>
        );
      }
    },
    {
      accessorKey: "created_at",
      header: "Reported On",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return format(date, "MMM d, yyyy h:mm a");
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const emergency = row.original;
        const isAssigned = emergency.status === "assigned";
        const isCompleted = emergency.status === "completed";
        
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleViewDetails(emergency)}>
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEditClick(emergency)} disabled={isCompleted}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleDeleteClick(emergency)} 
              disabled={isAssigned || isCompleted}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchEmergencies();
    fetchClients();
    
    // Socket events for real-time updates
    const createUnsubscribe = subscribeToEvent('emergency:created', (newEmergency) => {
      console.log('New emergency received:', newEmergency);
      setEmergencies(prev => [newEmergency, ...prev]);
    });
    
    const updateUnsubscribe = subscribeToEvent('emergency:updated', (updatedEmergency) => {
      console.log('Emergency updated:', updatedEmergency);
      setEmergencies(prev => 
        prev.map(emergency => 
          emergency.id === updatedEmergency.id ? updatedEmergency : emergency
        )
      );
    });
    
    const deleteUnsubscribe = subscribeToEvent('emergency:deleted', (emergencyId) => {
      console.log('Emergency deleted:', emergencyId);
      setEmergencies(prev => 
        prev.filter(emergency => emergency.id !== parseInt(emergencyId))
      );
    });
    
    return () => {
      createUnsubscribe();
      updateUnsubscribe();
      deleteUnsubscribe();
    };
  }, [clientIdFilter]);

  useEffect(() => {
    filterEmergencies();
  }, [searchTerm, statusFilter, levelFilter, emergencies]);
  
  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/admin');
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmergencies = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (clientIdFilter) params.append("client_id", clientIdFilter);
      
      const queryString = params.toString();
      const url = queryString ? `/emergencies?${queryString}` : "/emergencies";
      
      const data = await request({
        method: 'GET',
        url: url
      });
      
      setEmergencies(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterEmergencies = useCallback(() => {
    let filtered = [...emergencies];
    
    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(emergency => emergency.status === statusFilter);
    }
    
    // Apply level filter
    if (levelFilter && levelFilter !== "all") {
      filtered = filtered.filter(emergency => emergency.level === levelFilter);
    }
    
    // Apply search filter (on address or client name)
    if (searchTerm) {
      filtered = filtered.filter(emergency => 
        (emergency.address && emergency.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emergency.Client && emergency.Client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emergency.description && emergency.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredEmergencies(filtered);
  }, [emergencies, statusFilter, levelFilter, searchTerm]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If client is selected, fetch and populate their address and coordinates
    if (name === 'client_id' && value) {
      const selectedClient = clients.find(client => client.id.toString() === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          lat: selectedClient.lat ? selectedClient.lat.toString() : '',
          lng: selectedClient.lng ? selectedClient.lng.toString() : '',
          address: selectedClient.address || ''
        }));
      }
    }
  };

  const handleViewDetails = (emergency) => {
    navigate(`/admin/emergencies/${emergency.id}`);
  };
  
  const handleCreateClick = () => {
    clearErrors();
    setFormData({
      client_id: "",
      level: "medium",
      description: "",
      lat: "",
      lng: "",
      address: "",
    });
    setIsCreateDialogOpen(true);
  };
  
  const handleEditClick = (emergency) => {
    clearErrors();
    setSelectedEmergency(emergency);
    setFormData({
      client_id: emergency.client_id.toString(),
      level: emergency.level,
      status: emergency.status,
      description: emergency.description || "",
      lat: emergency.lat || "",
      lng: emergency.lng || "",
      address: emergency.address || "",
    });
    setIsUpdateDialogOpen(true);
  };
  
  const handleDeleteClick = (emergency) => {
    setSelectedEmergency(emergency);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateEmergency = async () => {
    try {
      // Format data: convert string values to numbers where needed
      const formattedData = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id, 10) : undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined
      };

      await request(
        {
          method: 'POST',
          url: '/emergencies',
          data: formattedData
        },
        {
          successMessage: 'Emergency report created successfully',
          onSuccess: () => {
            setIsCreateDialogOpen(false);
            fetchEmergencies();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };
  
  const handleUpdateEmergency = async () => {
    if (!selectedEmergency) return;
    
    try {
      // For update, we only allow changing the level, status and description
      const updateData = {
        level: formData.level,
        status: formData.status,
        description: formData.description
      };
      
      await request(
        {
          method: 'PUT',
          url: `/emergencies/${selectedEmergency.id}`,
          data: updateData
        },
        {
          successMessage: 'Emergency updated successfully',
          onSuccess: () => {
            setIsUpdateDialogOpen(false);
            fetchEmergencies();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };
  
  const handleDeleteEmergency = async () => {
    if (!selectedEmergency) return;
    
    try {
      await request(
        {
          method: 'DELETE',
          url: `/emergencies/${selectedEmergency.id}`
        },
        {
          successMessage: 'Emergency deleted successfully',
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            fetchEmergencies();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLevelFilter("all");
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Assigned
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to get level badge
  const getLevelBadge = (level) => {
    switch (level) {
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200">
            High
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            Critical
          </Badge>
        );
      default:
        return <Badge>{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Emergencies</h2>
          {clientIdFilter && (
            <p className="text-sm text-muted-foreground mt-1">
              Filtered by client ID: {clientIdFilter}
              <Button 
                variant="link" 
                className="px-1 h-auto" 
                onClick={() => navigate('/admin/emergencies')}
              >
                (Clear)
              </Button>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <Wifi className="h-3 w-3 mr-1" />
              Real-time Updates
            </div>
          )}
          
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-1" />
            New Emergency
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="Search by location or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredEmergencies} 
        isLoading={isLoading} 
        noResultsMessage="No emergencies found"
      />
      
      {/* Create Emergency Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Emergency Report</DialogTitle>
          </DialogHeader>
          
          <FormError error={validationErrors.general} />
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client_id">Client</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => handleSelectChange('client_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} ({client.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={validationErrors.client_id} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="level">Emergency Level</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => handleSelectChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <FormError error={validationErrors.level} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the emergency situation"
                value={formData.description}
                onChange={handleInputChange}
              />
              <FormError error={validationErrors.description} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  name="lat"
                  placeholder="e.g. 40.7128"
                  value={formData.lat}
                  onChange={handleInputChange}
                />
                <FormError error={validationErrors.lat} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  name="lng"
                  placeholder="e.g. -74.0060"
                  value={formData.lng}
                  onChange={handleInputChange}
                />
                <FormError error={validationErrors.lng} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Full address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <FormError error={validationErrors.address} />
              <p className="text-xs text-muted-foreground">
                Location information will be automatically populated from the selected client if not provided
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmergency} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Emergency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Emergency Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
        setIsUpdateDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Emergency #{selectedEmergency?.id}</DialogTitle>
          </DialogHeader>
          
          <FormError error={validationErrors.general} />
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="level">Emergency Level</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => handleSelectChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <FormError error={validationErrors.level} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormError error={validationErrors.status} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the emergency situation"
                value={formData.description}
                onChange={handleInputChange}
              />
              <FormError error={validationErrors.description} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmergency} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Emergency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Emergency Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Emergency</DialogTitle>
          </DialogHeader>
          
          <p>Are you sure you want to delete this emergency report?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. Note that emergencies with assignments or in completed status cannot be deleted.
          </p>
          
          <FormError error={validationErrors.general} />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEmergency}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Emergency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 