import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/utils/errorHandling";
import { FormError } from "@/components/shared/ErrorComponents";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  AlertCircle, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle, 
  XCircle,
  Phone, 
  MapPin, 
  UserCog, 
  Clock, 
  Calendar,
  ArrowLeft,
  Check,
  Map
} from "lucide-react";
import { format } from "date-fns";
import { MapSection } from "@/components/MapSection";
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;


// Set your MapBox access token here
mapboxgl.accessToken = mapboxToken; // Replace with your actual MapBox access token

export const EmergencyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const { validationErrors, setErrors, clearErrors } = useFormValidation();
  const [emergency, setEmergency] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateAssignmentDialogOpen, setIsUpdateAssignmentDialogOpen] = useState(false);
  const [isChangeStaffDialogOpen, setIsChangeStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState("");
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    fetchEmergencyDetails();
    fetchAvailableStaff();
  }, [id]);



  // Initialize assignment status when emergency data is loaded
  useEffect(() => {
    if (emergency && emergency.Assignments && emergency.Assignments.length > 0) {
      const currentAssignment = emergency.Assignments[0];
      if (currentAssignment && currentAssignment.status) {
        setSelectedAssignmentStatus(currentAssignment.status);
      }
    }
  }, [emergency]);

  const fetchEmergencyDetails = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: `/emergencies/${id}`
      });
      console.log("Fetched emergency details:", data.data);
      console.log("Assignments data:", data.data?.Assignments);
      setEmergency(data.data);
      if (data.data.status) {
        setSelectedStatus(data.data.status);
      }
    } catch (error) {
      // Error handled by useApiRequest
      navigate('/admin/emergencies');
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users'
      });
      
      // Filter for staff members that are available (not assigned to other emergencies)
      const availableStaff = data.data.filter(
        user => user.role === 'staff' && user.active_status !== 'in_work'
      );
      
      setStaffMembers(availableStaff);
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      setErrors({ general: "Please select a staff member to assign" });
      return;
    }

    try {
      await request(
        {
          method: 'POST',
          url: '/assignments',
          data: {
            staff_id: parseInt(selectedStaff, 10),
            emergency_id: parseInt(id, 10)
          }
        },
        {
          successMessage: 'Staff member assigned successfully',
          onSuccess: () => {
            setIsAssignDialogOpen(false);
            fetchEmergencyDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await request(
        {
          method: 'PUT',
          url: `/emergencies/${id}`,
          data: {
            status: selectedStatus
          }
        },
        {
          successMessage: 'Emergency status updated successfully',
          onSuccess: () => {
            setIsStatusDialogOpen(false);
            fetchEmergencyDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleDeleteEmergency = async () => {
    try {
      await request(
        {
          method: 'DELETE',
          url: `/emergencies/${id}`
        },
        {
          successMessage: 'Emergency deleted successfully',
          onSuccess: () => {
            navigate('/admin/emergencies');
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleUpdateAssignment = async () => {
    const hasAssignment = emergency.Assignments && emergency.Assignments.length > 0;
    if (!hasAssignment) return;
    
    const assignmentId = emergency.Assignments[0].id;

    try {
      await request(
        {
          method: 'PUT',
          url: `/assignments/${assignmentId}`,
          data: {
            status: selectedAssignmentStatus
          }
        },
        {
          successMessage: 'Assignment updated successfully',
          onSuccess: () => {
            setIsUpdateAssignmentDialogOpen(false);
            fetchEmergencyDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleChangeStaff = async () => {
    if (!selectedStaff) {
      setErrors({ general: "Please select a staff member to assign" });
      return;
    }
    
    const hasAssignment = emergency.Assignments && emergency.Assignments.length > 0;
    if (!hasAssignment) return;
    
    const assignmentId = emergency.Assignments[0].id;

    try {
      await request(
        {
          method: 'PUT',
          url: `/assignments/${assignmentId}`,
          data: {
            staff_id: parseInt(selectedStaff, 10)
          }
        },
        {
          successMessage: 'Staff member reassigned successfully',
          onSuccess: () => {
            setIsChangeStaffDialogOpen(false);
            fetchEmergencyDetails();
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  // Helper functions for badges
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

  if (isLoading && !emergency) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4 mx-auto animate-pulse" />
          <h3 className="text-lg font-medium">Loading emergency details...</h3>
        </div>
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 mx-auto" />
          <h3 className="text-lg font-medium">Emergency not found</h3>
          <p className="text-muted-foreground mt-1">
            The emergency you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/admin/emergencies')}
          >
            Back to Emergencies
          </Button>
        </div>
      </div>
    );
  }

  const hasAssignment = emergency?.Assignments && emergency.Assignments.length > 0;
  const currentAssignment = hasAssignment ? emergency.Assignments[0] : null;
  const assignedStaff = currentAssignment?.User || null;

  // Debug output
  console.log("Assignment data:", { 
    hasAssignment, 
    assignmentsArray: emergency?.Assignments,
    currentAssignment,
    assignedStaff 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/admin/emergencies')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Emergency #{id}</h2>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsStatusDialogOpen(true)}
            disabled={emergency.status === "completed" || emergency.status === "cancelled"}
          >
            Update Status
          </Button>
          {!hasAssignment && emergency.status === "pending" && (
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              Assign Staff
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Emergency
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Emergency Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Emergency Details</span>
              <div className="flex gap-2">
                {getLevelBadge(emergency.level)}
                {getStatusBadge(emergency.status)}
              </div>
            </CardTitle>
            <CardDescription>
              Reported on {format(new Date(emergency.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Description</Label>
              <div className="mt-1 text-sm rounded-md bg-muted p-3">
                {emergency.description || "No description provided"}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Location</Label>
              <div className="mt-1 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="text-sm">
                  {emergency.address || "No address provided"}
                  {emergency.lat && emergency.lng && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {emergency.lat}, {emergency.lng}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {emergency.lat && emergency.lng && <MapSection emergency={emergency} />}


          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Person who reported the emergency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergency.Client ? (
              <>
                <div>
                  <Label>Name</Label>
                  <div className="mt-1 text-sm font-medium">
                    {emergency.Client.name}
                  </div>
                </div>
                
                <div>
                  <Label>Contact</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{emergency.Client.phone}</span>
                  </div>
                </div>
                
                {emergency.Client.address && (
                  <div>
                    <Label>Default Address</Label>
                    <div className="mt-1 flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="text-sm">{emergency.Client.address}</div>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/admin/clients?search=${emergency.Client.phone}`)}
                >
                  View Client Profile
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Client information not available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Assignment</CardTitle>
          <CardDescription>
            {hasAssignment 
              ? `Current assignment details` 
              : `No staff member has been assigned to this emergency yet`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAssignment ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label>Assigned Staff</Label>
                <div className="mt-1 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{assignedStaff?.name || "Unknown"}</div>
                </div>
                {assignedStaff?.phone && (
                  <div className="mt-1 flex items-center gap-2 ml-6">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">{assignedStaff.phone}</div>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Assignment Status</Label>
                <div className="mt-1 text-sm">
                  {currentAssignment.status === "assigned" ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      In Progress
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <Label>Assigned On</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    {format(new Date(currentAssignment.assigned_at), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 ml-6">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    {format(new Date(currentAssignment.assigned_at), "h:mm a")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <UserCog className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No staff member assigned</p>
              {emergency.status === "pending" && (
                <Button 
                  className="mt-4" 
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  Assign Staff Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {hasAssignment && emergency.status !== "completed" && emergency.status !== "cancelled" && (
          <CardFooter className="flex flex-wrap gap-2">
            {currentAssignment.status === "assigned" && (
              <Button 
                variant="outline"
                onClick={() => setIsUpdateAssignmentDialogOpen(true)}
              >
                Update Assignment Status
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedStaff("");  // Reset selection
                setIsChangeStaffDialogOpen(true);
              }}
            >
              Change Staff Member
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Assign Staff Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
        setIsAssignDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="space-y-4">
            <Label htmlFor="staff">Available Staff Members</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.length > 0 ? (
                  staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.name} ({staff.phone})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="">
                    No available staff members
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {staffMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All staff members are currently assigned to emergencies.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignStaff} disabled={isLoading || staffMembers.length === 0}>
              {isLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={(open) => {
        setIsStatusDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Emergency Status</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="space-y-4">
            <Label htmlFor="status">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {emergency.status === "pending" && (
                  <SelectItem value="pending">Pending</SelectItem>
                )}
                {(emergency.status === "pending" || emergency.status === "assigned") && (
                  <SelectItem value="assigned">Assigned</SelectItem>
                )}
                <SelectItem value="completed">Completed</SelectItem>
                {emergency.status !== "completed" && (
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Status"}
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
          {hasAssignment && (
            <p className="text-sm text-destructive">
              Warning: This will also delete the associated staff assignment.
            </p>
          )}
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmergency} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Emergency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Assignment Dialog */}
      <Dialog open={isUpdateAssignmentDialogOpen} onOpenChange={(open) => {
        setIsUpdateAssignmentDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Assignment</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="space-y-4">
            <Label htmlFor="assignment-status">Assignment Status</Label>
            <Select value={selectedAssignmentStatus} onValueChange={setSelectedAssignmentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Note: Marking an assignment as completed will also mark the emergency as completed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Staff Dialog */}
      <Dialog open={isChangeStaffDialogOpen} onOpenChange={(open) => {
        setIsChangeStaffDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Assigned Staff</DialogTitle>
          </DialogHeader>
          <FormError error={validationErrors.general} />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Currently Assigned</Label>
              <div className="text-sm font-medium">
                {assignedStaff?.name || "Unknown"} 
                {assignedStaff?.phone && ` (${assignedStaff.phone})`}
              </div>
            </div>
            
            <Label htmlFor="staff">Available Staff Members</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.length > 0 ? (
                  staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.name} ({staff.phone})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="">
                    No available staff members
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {staffMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All staff members are currently assigned to emergencies.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeStaffDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeStaff} disabled={isLoading || staffMembers.length === 0}>
              {isLoading ? "Updating..." : "Change Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 