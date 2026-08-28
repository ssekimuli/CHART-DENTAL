"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";
import { PaginationControl } from "@/components/ui/pagination-control";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

// Import new components
import { LabSectionSwitcher } from "./components/lab-section-switcher";
import { LabServicesTable } from "./components/lab-services-table";
import { LabPricesTable } from "./components/lab-prices-table";
import { LabServiceForm } from "./components/lab-service-form";
import { LabServicePriceForm } from "./components/lab-service-price-form";
import { LabPricesFilter } from "./components/lab-prices-filter";
import { LabTable } from "./components/lab-table";
import { LabOrderEditForm } from "./components/lab-order-edit-form";

// Import API functions
import {
  getLabServices,
  getLabServicePrices,
  createLabService,
  updateLabService,
  deleteLabService,
  createLabServicePrice,
  updateLabServicePrice,
  deleteLabServicePrice,
} from "@/lib/api-lab-prices";
import { getLabOrders, getClients, getEmployees } from "@/lib/api";

import type { LabService, LabServicePrice, LaboratoryOrder, PaginatedArray } from "@/lib/types";
import type { LabServiceFormData } from "./schemas/lab-service.schema";
import type { LabServicePriceFormData } from "./schemas/lab-service-price.schema";

export default function LaboratoryPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  // Section state
  const [activeSection, setActiveSection] = useState<"orders" | "services" | "prices">("orders");

  // Lab Orders state
  const [labOrders, setLabOrders] = useState<PaginatedArray<LaboratoryOrder>>([] as unknown as PaginatedArray<LaboratoryOrder>);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<LaboratoryOrder | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Lab Services state
  const [services, setServices] = useState<LabService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesMeta, setServicesMeta] = useState<any>(null);
  const [servicesSearch, setServicesSearch] = useState("");
  const [servicesCategory, setServicesCategory] = useState("");
  const [selectedService, setSelectedService] = useState<LabService | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);

  // Lab Prices state
  const [prices, setPrices] = useState<LabServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesPage, setPricesPage] = useState(1);
  const [pricesMeta, setPricesMeta] = useState<any>(null);
  const [pricesSearch, setPricesSearch] = useState("");
  const [pricesLab, setPricesLab] = useState("");
  const [pricesMinPrice, setPricesMinPrice] = useState<number | null>(null);
  const [pricesMaxPrice, setPricesMaxPrice] = useState<number | null>(null);
  const [pricesActive, setPricesActive] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<LabServicePrice | null>(null);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);

  // Utilities
  const servicesMap = new Map(services.map((s) => [s.id, s]));

  useEffect(() => {
    if (!hasPermission("laboratory:read")) {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  // Fetch Lab Orders and related data
  useEffect(() => {
    if (activeSection !== "orders") return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const data = await getLabOrders(selectedBranch, ordersPage, 10, {
          search: ordersSearch || undefined,
        });
        setLabOrders(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch lab orders",
          variant: "destructive",
        });
      } finally {
        setOrdersLoading(false);
      }
    };

    const fetchClientsAndDoctors = async () => {
      setClientsLoading(true);
      try {
        const [clientsData, doctorsData] = await Promise.all([
          getClients(selectedBranch),
          getEmployees(selectedBranch),
        ]);
        setClients(clientsData);
        setDoctors(doctorsData);
      } catch (error) {
        console.error("Failed to fetch clients/doctors:", error);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchOrders();
    fetchClientsAndDoctors();
  }, [selectedBranch, activeSection, ordersPage, ordersSearch, toast]);

  // Fetch Lab Services
  useEffect(() => {
    if (activeSection !== "services") return;

    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const data = await getLabServices(selectedBranch, servicesPage, 10, {
          search: servicesSearch || undefined,
          category: servicesCategory || undefined,
        });
        setServices(data);
        setServicesMeta(data.meta);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch lab services",
          variant: "destructive",
        });
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [selectedBranch, activeSection, servicesPage, servicesSearch, servicesCategory, toast]);

  // Fetch Lab Prices
  useEffect(() => {
    if (activeSection !== "prices") return;

    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        const data = await getLabServicePrices(pricesPage, 10, {
          search: pricesSearch || undefined,
          lab: pricesLab || undefined,
          min_price: pricesMinPrice || undefined,
          max_price: pricesMaxPrice || undefined,
          active: pricesActive || undefined,
        });
        setPrices(data);
        setPricesMeta(data.meta);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch lab prices",
          variant: "destructive",
        });
      } finally {
        setPricesLoading(false);
      }
    };

    fetchPrices();
  }, [selectedBranch, activeSection, pricesPage, pricesSearch, pricesLab, pricesMinPrice, pricesMaxPrice, pricesActive, toast]);

  // Service handlers
  const handleCreateService = async (data: LabServiceFormData) => {
    try {
      await createLabService(data);
      setServicesPage(1);
      setServices([]);
      const newData = await getLabServices(selectedBranch, 1, 10);
      setServices(newData);
      setServicesMeta(newData.meta);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateService = async (data: LabServiceFormData) => {
    if (!selectedService) return;
    try {
      await updateLabService(selectedService.id, data);
      const newData = await getLabServices(selectedBranch, servicesPage, 10);
      setServices(newData);
      setServicesMeta(newData.meta);
      setSelectedService(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteService = async (id: number) => {
    try {
      await deleteLabService(id);
      const newData = await getLabServices(selectedBranch, servicesPage, 10);
      setServices(newData);
      setServicesMeta(newData.meta);
      toast({
        title: "Success",
        description: "Lab service deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lab service",
        variant: "destructive",
      });
    }
  };

  // Price handlers
  const handleCreatePrice = async (data: LabServicePriceFormData) => {
    try {
      await createLabServicePrice(data);
      setPricesPage(1);
      setPrices([]);
      const newData = await getLabServicePrices(1, 10);
      setPrices(newData);
      setPricesMeta(newData.meta);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdatePrice = async (data: LabServicePriceFormData) => {
    if (!selectedPrice) return;
    try {
      await updateLabServicePrice(selectedPrice.id, data);
      const newData = await getLabServicePrices(pricesPage, 10);
      setPrices(newData);
      setPricesMeta(newData.meta);
      setSelectedPrice(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePrice = async (id: number) => {
    try {
      await deleteLabServicePrice(id);
      const newData = await getLabServicePrices(pricesPage, 10);
      setPrices(newData);
      setPricesMeta(newData.meta);
      toast({
        title: "Success",
        description: "Lab price deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lab price",
        variant: "destructive",
      });
    }
  };

  // Order handlers
  const handleEditOrder = (order: LaboratoryOrder) => {
    setSelectedOrder(order);
    setIsEditFormOpen(true);
  };

  const handleOrderUpdate = (updatedOrder: LaboratoryOrder) => {
    const updatedOrders = labOrders.map((o) =>
      o.id === updatedOrder.id ? updatedOrder : o
    );
    setLabOrders(updatedOrders as any);
    setIsEditFormOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const data = await getLabOrders(selectedBranch, ordersPage, 10, {
        search: ordersSearch || undefined,
      });
      setLabOrders(data);
      toast({
        title: "Success",
        description: "Lab order deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh orders after delete",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Laboratory Management</CardTitle>
            <CardDescription>
              Manage lab orders, services, and pricing
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <LabSectionSwitcher activeSection={activeSection} onSectionChange={setActiveSection} />

          {/* LAB ORDERS SECTION */}
          {activeSection === "orders" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lab orders..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {ordersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <LabTable data={labOrders} onEdit={handleEditOrder} onDelete={handleDeleteOrder} />
                  <PaginationControl
                    currentPage={ordersPage}
                    lastPage={labOrders.meta?.last_page || 1}
                    onPageChange={setOrdersPage}
                  />
                </>
              )}
            </div>
          )}

          {/* LAB SERVICES SECTION */}
          {activeSection === "services" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {hasPermission("lab_services:create") && (
                  <Button
                    onClick={() => {
                      setSelectedService(null);
                      setIsServiceFormOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 w-4 h-4" />
                    Add Service
                  </Button>
                )}
              </div>

              {servicesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <LabServicesTable
                    services={services}
                    onEdit={(service) => {
                      setSelectedService(service);
                      setIsServiceFormOpen(true);
                    }}
                    onDelete={handleDeleteService}
                    isLoading={servicesLoading}
                  />
                  <PaginationControl
                    currentPage={servicesPage}
                    lastPage={servicesMeta?.last_page || 1}
                    onPageChange={setServicesPage}
                  />
                </>
              )}
            </div>
          )}

          {/* LAB PRICES SECTION */}
          {activeSection === "prices" && (
            <div className="space-y-4">
              <LabPricesFilter
                search={pricesSearch}
                lab={pricesLab}
                minPrice={pricesMinPrice}
                maxPrice={pricesMaxPrice}
                activeOnly={pricesActive}
                onSearchChange={setPricesSearch}
                onLabChange={setPricesLab}
                onPriceRangeChange={(min, max) => {
                  setPricesMinPrice(min);
                  setPricesMaxPrice(max);
                }}
                onActiveChange={setPricesActive}
                onClear={() => {
                  setPricesSearch("");
                  setPricesLab("");
                  setPricesMinPrice(null);
                  setPricesMaxPrice(null);
                  setPricesActive(false);
                  setPricesPage(1);
                }}
                hasActiveFilters={
                  Boolean(pricesSearch || pricesLab || pricesMinPrice || pricesMaxPrice || pricesActive)
                }
              />

              <div className="flex justify-end">
                {hasPermission("lab_services:create") && (
                  <Button
                    onClick={() => {
                      setSelectedPrice(null);
                      setIsPriceFormOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 w-4 h-4" />
                    Add Price
                  </Button>
                )}
              </div>

              {pricesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <LabPricesTable
                    prices={prices}
                    services={servicesMap}
                    onEdit={(price) => {
                      setSelectedPrice(price);
                      setIsPriceFormOpen(true);
                    }}
                    onDelete={handleDeletePrice}
                    isLoading={pricesLoading}
                  />
                  <PaginationControl
                    currentPage={pricesPage}
                    lastPage={pricesMeta?.last_page || 1}
                    onPageChange={setPricesPage}
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Service Form Modal */}
      <LabServiceForm
        service={selectedService || undefined}
        isOpen={isServiceFormOpen}
        onClose={() => {
          setIsServiceFormOpen(false);
          setSelectedService(null);
        }}
        onSubmit={selectedService ? handleUpdateService : handleCreateService}
        isLoading={servicesLoading}
      />

      {/* Lab Service Price Form Modal */}
      <LabServicePriceForm
        price={selectedPrice || undefined}
        services={services}
        isOpen={isPriceFormOpen}
        onClose={() => {
          setIsPriceFormOpen(false);
          setSelectedPrice(null);
        }}
        onSubmit={selectedPrice ? handleUpdatePrice : handleCreatePrice}
        isLoading={pricesLoading}
      />

      {/* Lab Order Edit Form Modal */}
      {selectedOrder && (
        <LabOrderEditForm
          order={selectedOrder}
          clients={clients}
          doctors={doctors}
          isOpen={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setSelectedOrder(null);
          }}
          onUpdate={handleOrderUpdate}
        />
      )}
    </>
  );
}
